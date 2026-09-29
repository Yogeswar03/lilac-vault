import { Vault, User, Memory, ChatMessage } from '../types';
import {
  isSupabaseConfigured,
  supabaseSaveVault,
  supabaseGetVault,
  supabaseGetVaultByCode,
  supabaseSaveMemory,
  supabaseGetAllMemories,
  supabaseDeleteMemory,
  supabaseSaveChatMessage,
  supabaseGetAllChatMessages,
  supabaseDeleteChatMessage,
  supabaseResetAll,
} from './supabase';

const DB_NAME = 'LilacVault_App_DB';
const DB_VERSION = 1;
const STORE_VAULT = 'vault_meta';
const STORE_MEMORIES = 'vault_memories';
const STORE_SETTINGS = 'vault_settings';
const STORE_MESSAGES = 'vault_messages';

// Open / initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_VAULT)) {
        db.createObjectStore(STORE_VAULT, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MEMORIES)) {
        db.createObjectStore(STORE_MEMORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        db.createObjectStore(STORE_MESSAGES, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Client-Side Image Compression for Mobile Camera Roll
export async function compressImage(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = (err) => reject(err);
  });
}

// Read Video File as Data URL
export function readVideoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Save Vault (Supabase Cloud + Local API + IndexedDB)
export async function saveVault(vault: Vault): Promise<void> {
  if (typeof window !== 'undefined') {
    if (vault.id) localStorage.setItem('lilac_vault_id', vault.id);
    if (vault.accessCode) localStorage.setItem('lilac_vault_code', vault.accessCode.trim().toUpperCase());
    if (vault.folders) localStorage.setItem('lilac_folders', JSON.stringify(vault.folders));
    if (vault.bucketList) localStorage.setItem('lilac_bucket_list', JSON.stringify(vault.bucketList));
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseSaveVault(vault);
    } catch (e) {
      console.error('Supabase save vault error, falling back to local:', e);
    }
  } else {
    try {
      await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault }),
      });
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readwrite');
    const store = tx.objectStore(STORE_VAULT);
    store.put(vault);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get Vault (Supabase Cloud first, then Local API, then IndexedDB)
export async function getVault(targetIdOrCode?: string): Promise<Vault | null> {
  const activeLookup = targetIdOrCode || (typeof window !== 'undefined' ? (localStorage.getItem('lilac_vault_code') || localStorage.getItem('lilac_vault_id') || undefined) : undefined);
  if (!activeLookup || !activeLookup.trim()) return null;

  if (isSupabaseConfigured()) {
    try {
      const cloudVault = await supabaseGetVault(activeLookup);
      if (cloudVault) {
        const db = await openDB();
        const tx = db.transaction(STORE_VAULT, 'readwrite');
        tx.objectStore(STORE_VAULT).put(cloudVault);
        return cloudVault;
      }
    } catch (e) {
      console.error('Supabase fetch vault error, falling back:', e);
    }
  } else {
    try {
      const res = await fetch('/api/vault');
      if (res.ok) {
        const data = await res.json();
        if (data.vault) {
          const db = await openDB();
          const tx = db.transaction(STORE_VAULT, 'readwrite');
          tx.objectStore(STORE_VAULT).put(data.vault);
          return data.vault;
        }
      }
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readonly');
    const store = tx.objectStore(STORE_VAULT);
    const req = store.getAll();
    req.onsuccess = () => {
      const vaults: Vault[] = req.result || [];
      const clean = activeLookup.trim().toUpperCase();
      const match = vaults.find((v) => v.id === activeLookup || v.accessCode?.trim().toUpperCase() === clean);
      resolve(match || null);
    };
    req.onerror = () => reject(req.error);
  });
}

// Fast Local Vault Retrieval (IndexedDB only, <10ms for instant app launch)
export async function getLocalVault(targetIdOrCode?: string): Promise<Vault | null> {
  const activeLookup = targetIdOrCode || (typeof window !== 'undefined' ? (localStorage.getItem('lilac_vault_code') || localStorage.getItem('lilac_vault_id') || undefined) : undefined);
  if (!activeLookup || !activeLookup.trim()) return null;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_VAULT, 'readonly');
      const store = tx.objectStore(STORE_VAULT);
      const req = store.getAll();
      req.onsuccess = () => {
        const vaults: Vault[] = req.result || [];
        const clean = activeLookup.trim().toUpperCase();
        const match = vaults.find((v) => v.id === activeLookup || v.accessCode?.trim().toUpperCase() === clean);
        resolve(match || null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Get Vault explicitly by Access Code (Supabase Cloud first, then Local API, then IndexedDB)
export async function getVaultByCode(accessCode: string): Promise<Vault | null> {
  const cleanCode = accessCode.trim().toUpperCase();

  if (isSupabaseConfigured()) {
    try {
      const cloudVault = await supabaseGetVaultByCode(cleanCode);
      if (cloudVault) {
        const db = await openDB();
        const tx = db.transaction(STORE_VAULT, 'readwrite');
        tx.objectStore(STORE_VAULT).put(cloudVault);
        return cloudVault;
      }
    } catch (e) {
      console.error('Supabase fetch vault by code error:', e);
    }
  } else {
    try {
      const res = await fetch(`/api/vault?code=${cleanCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.vault && data.vault.accessCode?.trim().toUpperCase() === cleanCode) {
          const db = await openDB();
          const tx = db.transaction(STORE_VAULT, 'readwrite');
          tx.objectStore(STORE_VAULT).put(data.vault);
          return data.vault;
        }
      }
    } catch {
      // offline fallback
    }
  }

  // Local IndexedDB fallback
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_VAULT, 'readonly');
    const store = tx.objectStore(STORE_VAULT);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as Vault[]) || [];
      const match = all.find((v) => v.accessCode?.trim().toUpperCase() === cleanCode);
      resolve(match || null);
    };
    req.onerror = () => resolve(null);
  });
}

// Sync Local IndexedDB data to Supabase Cloud
export async function syncLocalToCloud(): Promise<{
  success: boolean;
  error?: string;
  count?: { vault: boolean; memories: number; chat: number };
}> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase credentials are not configured.' };
  }

  try {
    const db = await openDB();

    // 1. Sync Vault
    const localVaults = await new Promise<Vault[]>((resolve) => {
      const tx = db.transaction(STORE_VAULT, 'readonly');
      const store = tx.objectStore(STORE_VAULT);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    let vaultSynced = false;
    if (localVaults.length > 0) {
      await supabaseSaveVault(localVaults[0]);
      vaultSynced = true;
    }

    // 2. Sync Memories
    const localMems = await new Promise<Memory[]>((resolve) => {
      const tx = db.transaction(STORE_MEMORIES, 'readonly');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    for (const mem of localMems) {
      await supabaseSaveMemory(mem);
    }

    // 3. Sync Chat Messages
    const localMsgs = await new Promise<ChatMessage[]>((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    for (const msg of localMsgs) {
      await supabaseSaveChatMessage(msg);
    }

    return {
      success: true,
      count: {
        vault: vaultSynced,
        memories: localMems.length,
        chat: localMsgs.length,
      },
    };
  } catch (err: any) {
    console.error('Error syncing local data to cloud:', err);
    return { success: false, error: err?.message || 'Failed to sync to Supabase.' };
  }
}

// Save Memory (Supabase Cloud + Local API + IndexedDB)
export async function saveMemory(memory: Memory): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseSaveMemory(memory);
    } catch (e) {
      console.error('Supabase save memory error, falling back:', e);
    }
  } else {
    try {
      await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory }),
      });
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    store.put(memory);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get All Memories (Supabase Cloud first, then Local API, then IndexedDB)
export async function getAllMemories(vaultId?: string): Promise<Memory[]> {
  const activeVaultId = vaultId || (typeof window !== 'undefined' ? localStorage.getItem('lilac_vault_id') || undefined : undefined);
  if (!activeVaultId) return [];

  if (isSupabaseConfigured()) {
    try {
      const cloudMems = await supabaseGetAllMemories(activeVaultId);
      if (cloudMems && cloudMems.length > 0) {
        const db = await openDB();
        const tx = db.transaction(STORE_MEMORIES, 'readwrite');
        cloudMems.forEach((m) => tx.objectStore(STORE_MEMORIES).put(m));
        return cloudMems;
      }
    } catch (e) {
      console.error('Supabase fetch memories error, falling back:', e);
    }
  } else {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        if (data.memories) {
          const all = data.memories as Memory[];
          const items = all.filter((m) => m.vaultId === activeVaultId);
          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const db = await openDB();
          const tx = db.transaction(STORE_MEMORIES, 'readwrite');
          items.forEach((m) => tx.objectStore(STORE_MEMORIES).put(m));
          return items;
        }
      }
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readonly');
    const store = tx.objectStore(STORE_MEMORIES);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as Memory[]) || [];
      const items = all.filter((m) => m.vaultId === activeVaultId);
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

// Fast Local Memories Retrieval (IndexedDB only, <10ms for instant app launch)
export async function getLocalMemories(vaultId?: string): Promise<Memory[]> {
  const activeVaultId = vaultId || (typeof window !== 'undefined' ? localStorage.getItem('lilac_vault_id') || undefined : undefined);
  if (!activeVaultId) return [];

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MEMORIES, 'readonly');
      const store = tx.objectStore(STORE_MEMORIES);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result as Memory[]) || [];
        const items = all.filter((m) => m.vaultId === activeVaultId);
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Delete Memory
export async function deleteMemory(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseDeleteMemory(id);
    } catch (e) {
      console.error('Supabase delete memory error, falling back:', e);
    }
  } else {
    try {
      await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Chat Messages Methods (Supabase Cloud + Local API + IndexedDB)
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  // 1. Immediately persist to local IndexedDB for instant UI responsiveness
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      store.put(message);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Local indexedDB save error:', err);
  }

  // 2. Persist to Supabase cloud
  if (isSupabaseConfigured()) {
    try {
      await supabaseSaveChatMessage(message);
    } catch (e) {
      console.error('Supabase save chat message error, falling back:', e);
    }
  } else {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
    } catch {
      // offline fallback
    }
  }
}

export async function getAllChatMessages(vaultId?: string): Promise<ChatMessage[]> {
  const activeVaultId = vaultId || (typeof window !== 'undefined' ? localStorage.getItem('lilac_vault_id') || undefined : undefined);
  if (!activeVaultId) return [];

  if (isSupabaseConfigured()) {
    try {
      const cloudMsgs = await supabaseGetAllChatMessages(activeVaultId);
      if (Array.isArray(cloudMsgs)) {
        try {
          const db = await openDB();
          const tx = db.transaction(STORE_MESSAGES, 'readwrite');
          const store = tx.objectStore(STORE_MESSAGES);
          cloudMsgs.forEach((m) => store.put(m));
        } catch {
          // quiet local cache fallback
        }
        return cloudMsgs;
      }
    } catch (e) {
      console.error('Supabase fetch chat messages error, falling back:', e);
    }
  } else {
    try {
      const res = await fetch('/api/chat');
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          const all = data.messages as ChatMessage[];
          const items = all.filter((m) => m.vaultId === activeVaultId);
          items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          try {
            const db = await openDB();
            const tx = db.transaction(STORE_MESSAGES, 'readwrite');
            items.forEach((m) => tx.objectStore(STORE_MESSAGES).put(m));
          } catch {}
          return items;
        }
      }
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MESSAGES, 'readonly');
    const store = tx.objectStore(STORE_MESSAGES);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as ChatMessage[]) || [];
      const items = all.filter((m) => m.vaultId === activeVaultId);
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

// Fast Local Chat Messages Retrieval (IndexedDB only, <10ms for instant app launch)
export async function getLocalChatMessages(vaultId?: string): Promise<ChatMessage[]> {
  const activeVaultId = vaultId || (typeof window !== 'undefined' ? localStorage.getItem('lilac_vault_id') || undefined : undefined);
  if (!activeVaultId) return [];

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MESSAGES, 'readonly');
      const store = tx.objectStore(STORE_MESSAGES);
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result as ChatMessage[]) || [];
        const items = all.filter((m) => m.vaultId === activeVaultId);
        items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// Delete Chat Message
export async function deleteChatMessage(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MESSAGES, 'readwrite');
      const store = tx.objectStore(STORE_MESSAGES);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Local indexedDB delete error:', err);
  }

  if (isSupabaseConfigured()) {
    try {
      await supabaseDeleteChatMessage(id);
    } catch (e) {
      console.error('Supabase delete chat error:', e);
    }
  } else {
    try {
      await fetch(`/api/chat/${id}`, { method: 'DELETE' });
    } catch {
      // offline fallback
    }
  }
}

// Save Current Active User ID
export function setActiveUserId(userId: string) {
  localStorage.setItem('lilac_active_user', userId);
}

export function getActiveUserId(): string | null {
  return localStorage.getItem('lilac_active_user');
}

// Clear all data (for reset)
export async function clearAllVaultData(): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabaseResetAll();
    } catch (e) {
      console.error('Supabase reset all error, falling back:', e);
    }
  } else {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // offline fallback
    }
  }

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VAULT, STORE_MEMORIES, STORE_SETTINGS, STORE_MESSAGES], 'readwrite');
    tx.objectStore(STORE_VAULT).clear();
    tx.objectStore(STORE_MEMORIES).clear();
    tx.objectStore(STORE_SETTINGS).clear();
    tx.objectStore(STORE_MESSAGES).clear();
    localStorage.removeItem('lilac_active_user');
    localStorage.removeItem('lilac_is_demo');
    localStorage.removeItem('lilac_vault_id');
    localStorage.removeItem('lilac_vault_code');
    localStorage.removeItem('lilac_folders');
    localStorage.removeItem('lilac_bucket_list');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Sample Data for Showcase (Clean, Aesthetic Lavender Theme)
export const SAMPLE_USERS: User[] = [
  {
    id: 'user_elena',
    name: 'Elena 🪻',
    avatar: '🪻',
    color: '#8B5CF6',
    role: 'host',
    joinedAt: '2025-06-10T10:00:00.000Z',
  },
  {
    id: 'user_liam',
    name: 'Liam ☕',
    avatar: '☕',
    color: '#7C3AED',
    role: 'member',
    joinedAt: '2025-06-10T10:05:00.000Z',
  },
];

export const SAMPLE_VAULT: Vault = {
  id: 'vault_demo_lavender',
  name: 'Our Lavender Capsule ✨',
  accessCode: 'LILAC-777',
  createdAt: '2025-06-10T10:00:00.000Z',
  users: SAMPLE_USERS,
  isLocked: true, // Strictly 2 users
  folders: ['Weekend Dates ☕', 'Road Trips 🚗'],
  bucketList: [
    {
      id: 'b_1',
      vaultId: 'vault_demo_lavender',
      title: 'Watch sunset from Oia cliffside',
      location: 'Santorini, Greece 🇬🇷',
      category: 'places',
      isCompleted: false,
      createdBy: 'Elena 🪻',
      createdAt: '2026-08-01T10:00:00Z',
      notes: 'Book a cliffside dinner table at sunset!',
    },
    {
      id: 'b_2',
      vaultId: 'vault_demo_lavender',
      title: 'Try viral strawberry souffle pancakes',
      location: 'Tokyo, Japan 🇯🇵',
      category: 'cafe',
      isCompleted: false,
      createdBy: 'Liam ☕',
      createdAt: '2026-08-05T12:00:00Z',
      notes: 'Go early in the morning to beat the line.',
    },
    {
      id: 'b_3',
      vaultId: 'vault_demo_lavender',
      title: 'Stargazing picnic with hot chocolate',
      location: 'Blue Ridge Mountains 🌲',
      category: 'adventure',
      isCompleted: true,
      completedAt: '2026-07-22T22:00:00Z',
      completedBy: 'Elena 🪻',
      createdBy: 'Elena 🪻',
      createdAt: '2026-06-15T09:00:00Z',
      notes: 'Brought the cozy wool blanket!',
    },
  ],
};

export const SAMPLE_MEMORIES: Memory[] = [
  {
    id: 'mem_1',
    vaultId: 'vault_demo_lavender',
    uploaderId: 'user_elena',
    uploaderName: 'Elena 🪻',
    uploaderAvatar: '🪻',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=1200&q=80',
    caption: 'Iced lavender matcha & pastries at our favorite corner cafe ☕🥐',
    date: '2026-08-14',
    hearts: ['user_elena', 'user_liam'],
    tags: ['cafe', 'matcha', 'weekend'],
    aiMood: 'Lofi Lavender Afternoon',
    folder: 'Weekend Dates ☕',
    notes: [
      {
        id: 'n_1',
        userId: 'user_liam',
        userName: 'Liam ☕',
        userAvatar: '☕',
        text: 'That cafe playlist was unmatched. Need to find that track! 🎶',
        createdAt: '2026-08-14T17:30:00Z',
      },
    ],
  },
  {
    id: 'mem_2',
    vaultId: 'vault_demo_lavender',
    uploaderId: 'user_liam',
    uploaderName: 'Liam ☕',
    uploaderAvatar: '☕',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
    caption: 'Scenic hilltop picnic just as the sky turned soft violet and gold 🌄✨',
    date: '2026-07-22',
    hearts: ['user_elena', 'user_liam'],
    tags: ['picnic', 'sunset', 'nature'],
    aiMood: 'Golden Lavender Sunset',
    folder: 'Weekend Dates ☕',
    notes: [
      {
        id: 'n_2',
        userId: 'user_elena',
        userName: 'Elena 🪻',
        userAvatar: '🪻',
        text: 'One of the best views of the whole summer!',
        createdAt: '2026-07-22T21:10:00Z',
      },
    ],
  },
  {
    id: 'mem_3',
    vaultId: 'vault_demo_lavender',
    uploaderId: 'user_elena',
    uploaderName: 'Elena 🪻',
    uploaderAvatar: '🪻',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    caption: 'Vintage photobooth film strip we found from our downtown day out 📸🎞️',
    date: '2026-06-18',
    hearts: ['user_liam'],
    tags: ['photobooth', 'vintage', 'polaroid'],
    aiMood: 'Retro Nostalgia',
    folder: 'Weekend Dates ☕',
    notes: [
      {
        id: 'n_3',
        userId: 'user_liam',
        userName: 'Liam ☕',
        userAvatar: '☕',
        text: 'Still have the physical print on my desk 🪻',
        createdAt: '2026-06-18T16:00:00Z',
      },
    ],
  },
  {
    id: 'mem_4',
    vaultId: 'vault_demo_lavender',
    uploaderId: 'user_liam',
    uploaderName: 'Liam ☕',
    uploaderAvatar: '☕',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    caption: 'Summer road trip through the countryside with the windows all the way down 🚗💨',
    date: '2026-05-30',
    hearts: ['user_elena', 'user_liam'],
    tags: ['roadtrip', 'summer', 'music'],
    aiMood: 'Clear Skies & Breeze',
    folder: 'Road Trips 🚗',
    notes: [],
  },
];

export const SAMPLE_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    vaultId: 'vault_demo_lavender',
    senderId: 'user_elena',
    senderName: 'Elena 🪻',
    senderAvatar: '🪻',
    text: 'Hey! Did you upload the photos from Saturday’s cafe run? ☕',
    createdAt: '2026-08-14T15:10:00Z',
    type: 'text',
  },
  {
    id: 'msg_2',
    vaultId: 'vault_demo_lavender',
    senderId: 'user_liam',
    senderName: 'Liam ☕',
    senderAvatar: '☕',
    text: 'Just uploaded them! The lighting by the window was so clean ✨',
    createdAt: '2026-08-14T15:14:00Z',
    type: 'text',
  },
  {
    id: 'msg_3',
    vaultId: 'vault_demo_lavender',
    senderId: 'user_elena',
    senderName: 'Elena 🪻',
    senderAvatar: '🪻',
    text: 'Love the second shot! Sent you some sparkles 🪻',
    createdAt: '2026-08-14T15:20:00Z',
    type: 'sparkle_burst',
  },
];

// Seed demo data into IndexedDB
export async function seedDemoData(): Promise<void> {
  await clearAllVaultData();
  await saveVault(SAMPLE_VAULT);
  for (const memory of SAMPLE_MEMORIES) {
    await saveMemory(memory);
  }
  for (const msg of SAMPLE_CHAT_MESSAGES) {
    await saveChatMessage(msg);
  }
  setActiveUserId('user_elena');
  localStorage.setItem('lilac_is_demo', 'true');
}
