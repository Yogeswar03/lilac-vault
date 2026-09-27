import { Vault, User, Memory, ChatMessage } from '../types';

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

// Save Vault
export async function saveVault(vault: Vault): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readwrite');
    const store = tx.objectStore(STORE_VAULT);
    store.put(vault);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get Vault
export async function getVault(): Promise<Vault | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VAULT, 'readonly');
    const store = tx.objectStore(STORE_VAULT);
    const req = store.getAll();
    req.onsuccess = () => {
      if (req.result && req.result.length > 0) {
        resolve(req.result[0]);
      } else {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

// Save Memory
export async function saveMemory(memory: Memory): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    store.put(memory);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Get All Memories
export async function getAllMemories(): Promise<Memory[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readonly');
    const store = tx.objectStore(STORE_MEMORIES);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as Memory[]) || [];
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

// Delete Memory
export async function deleteMemory(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MEMORIES, 'readwrite');
    const store = tx.objectStore(STORE_MEMORIES);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Chat Messages Methods
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MESSAGES, 'readwrite');
    const store = tx.objectStore(STORE_MESSAGES);
    store.put(message);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllChatMessages(): Promise<ChatMessage[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MESSAGES, 'readonly');
    const store = tx.objectStore(STORE_MESSAGES);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result as ChatMessage[]) || [];
      items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_VAULT, STORE_MEMORIES, STORE_SETTINGS, STORE_MESSAGES], 'readwrite');
    tx.objectStore(STORE_VAULT).clear();
    tx.objectStore(STORE_MEMORIES).clear();
    tx.objectStore(STORE_SETTINGS).clear();
    tx.objectStore(STORE_MESSAGES).clear();
    localStorage.removeItem('lilac_active_user');
    localStorage.removeItem('lilac_is_demo');
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
