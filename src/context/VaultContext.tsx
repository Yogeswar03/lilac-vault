import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Vault, User, Memory, MemoryNote, ChatMessage, BucketItem, BucketCategory } from '../types';
import {
  getVault,
  getVaultByCode,
  saveVault,
  getAllMemories,
  saveMemory,
  deleteMemory as dbDeleteMemory,
  getAllChatMessages,
  saveChatMessage as dbSaveChatMessage,
  deleteChatMessage as dbDeleteChatMessage,
  getActiveUserId,
  setActiveUserId as dbSetActiveUserId,
  compressImage,
  readVideoFile,
  seedDemoData,
  clearAllVaultData,
  syncLocalToCloud,
  getLocalVault,
  getLocalMemories,
  getLocalChatMessages,
} from '../services/storage';
import { isSupabaseConfigured, supabaseSubscribeToChanges } from '../services/supabase';
import { extractCodeFromUrlOrInput } from '../services/shareInvite';
import { playMessageChime } from '../services/sound';

export const DEFAULT_FOLDERS: string[] = [];

interface VaultContextType {
  vault: Vault | null;
  currentUser: User | null;
  partnerUser: User | null;
  memories: Memory[];
  chatMessages: ChatMessage[];
  folders: string[];
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  addFolder: (folderName: string) => Promise<void>;
  deleteFolder: (folderName: string) => Promise<void>;
  moveMemoryToFolder: (memoryId: string, folderName: string) => Promise<void>;
  bucketList: BucketItem[];
  addBucketItem: (item: {
    title: string;
    location?: string;
    category?: BucketCategory;
    notes?: string;
    targetDate?: string;
  }) => Promise<void>;
  toggleBucketItem: (id: string) => Promise<void>;
  deleteBucketItem: (id: string) => Promise<void>;
  isLoading: boolean;
  isDemoMode: boolean;
  createVault: (vaultName: string, hostName: string, avatar: string, customPasscode?: string) => Promise<void>;
  joinVault: (accessCode: string, memberName: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  startDemoMode: () => Promise<void>;
  switchActiveUser: (userId: string) => void;
  uploadMemory: (data: { file: File; caption: string; tags: string[]; date: string; aiMood?: string; folder?: string }) => Promise<void>;
  toggleHeart: (memoryId: string) => Promise<void>;
  addNote: (memoryId: string, text: string) => Promise<void>;
  deleteNote: (memoryId: string, noteId: string) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
  sendChatMessage: (text: string, type?: 'text' | 'sparkle_burst') => Promise<void>;
  deleteChatMessage: (msgId: string) => Promise<void>;
  updateUserProfile: (userId: string, newName: string, newAvatar: string) => Promise<void>;
  loginUser: (userId: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCode: (accessCode: string) => Promise<{ success: boolean; error?: string; users?: User[]; vault?: Vault }>;
  verifyVaultPasscode: (pin: string) => boolean;
  updateVaultPasscode: (newPin: string) => Promise<{ success: boolean; error?: string }>;
  logoutUser: () => void;
  unreadChatCount: number;
  markChatAsRead: () => Promise<void>;
  triggerSparkleExplosion: () => void;
  resetAllData: () => Promise<void>;
  syncCloud: () => Promise<{ success: boolean; error?: string }>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vault, setVault] = useState<Vault | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string>('All');
  const [lastReadTimestamp, setLastReadTimestamp] = useState<string>(() => {
    return typeof window !== 'undefined'
      ? (localStorage.getItem('lilac_last_read_chat') || new Date().toISOString())
      : new Date().toISOString();
  });

  const syncCurrentUserFromVault = (v: Vault) => {
    const activeId = getActiveUserId();
    if (activeId && v.users && v.users.length > 0) {
      const foundUser = v.users.find((u) => u.id === activeId);
      if (foundUser) {
        setCurrentUser((prev) => {
          if (!prev || prev.name !== foundUser.name || prev.avatar !== foundUser.avatar || prev.role !== foundUser.role) {
            return foundUser;
          }
          return prev;
        });
      }
    }
  };

  // Initialize from storage on mount with Cache-First Instant Hydration (<20ms)
  useEffect(() => {
    async function loadData() {
      // Check if URL contains an invite code (?join=CODE or ?code=CODE)
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const rawUrlCode = urlParams ? (urlParams.get('join') || urlParams.get('code')) : null;
      const inviteCodeFromUrl = rawUrlCode ? extractCodeFromUrlOrInput(rawUrlCode) : null;

      const localVaultCode = typeof window !== 'undefined' ? localStorage.getItem('lilac_vault_code') : null;
      const localVaultId = typeof window !== 'undefined' ? localStorage.getItem('lilac_vault_id') : null;

      // 0. ABSOLUTE PRIVACY GUARD: If this is an unauthenticated visitor with no invite code and no local vault,
      // never fetch remote cloud data. Show clean onboarding immediately!
      if (!inviteCodeFromUrl && !localVaultCode && !localVaultId) {
        setVault(null);
        setCurrentUser(null);
        setMemories([]);
        setChatMessages([]);
        setIsLoading(false);
        return;
      }

      // 1. FAST PATH: Instantly hydrate from local IndexedDB cache (<15ms)
      try {
        const localVault = await getLocalVault(inviteCodeFromUrl || undefined);

        if (localVault) {
          setVault(localVault);
          const activeId = getActiveUserId();
          const foundUser = localVault.users.find((u) => u.id === activeId);

          if (foundUser) {
            setCurrentUser(foundUser);
            const [localMems, localMsgs] = await Promise.all([
              getLocalMemories(localVault.id),
              getLocalChatMessages(localVault.id),
            ]);
            setMemories(localMems);
            setChatMessages(localMsgs);
          } else {
            // Unauthenticated on this device: do NOT auto-login as user 0!
            setCurrentUser(null);
            setMemories([]);
            setChatMessages([]);
          }

          const isDemo = localStorage.getItem('lilac_is_demo') === 'true' && localVault.id === 'vault_demo_lavender';
          setIsDemoMode(isDemo);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Local cache read error:', err);
      }

      // 2. REMOTE SYNC: Fetch latest cloud data in parallel in the background
      try {
        if (inviteCodeFromUrl) {
          const invitedVault = await getVaultByCode(inviteCodeFromUrl);
          if (invitedVault) {
            setVault(invitedVault);
            setIsDemoMode(false);
            localStorage.removeItem('lilac_is_demo');

            const activeId = getActiveUserId();
            const foundUser = invitedVault.users.find((u) => u.id === activeId);

            if (foundUser) {
              setCurrentUser(foundUser);
              const [allMems, allMsgs] = await Promise.all([
                getAllMemories(invitedVault.id),
                getAllChatMessages(invitedVault.id),
              ]);
              setMemories(allMems);
              setChatMessages(allMsgs);
            } else {
              // Third party or partner joining: NEVER populate private memories into state!
              setCurrentUser(null);
              setMemories([]);
              setChatMessages([]);
            }
          }
        } else if (localVaultCode || localVaultId) {
          const remoteVault = await getVault();
          if (remoteVault) {
            setVault(remoteVault);
            const activeId = getActiveUserId();
            const foundUser = remoteVault.users.find((u) => u.id === activeId);

            if (foundUser) {
              setCurrentUser(foundUser);
              syncCurrentUserFromVault(remoteVault);
              const [remoteMems, remoteMsgs] = await Promise.all([
                getAllMemories(remoteVault.id),
                getAllChatMessages(remoteVault.id),
              ]);
              setMemories(remoteMems);
              setChatMessages(remoteMsgs);
            } else {
              setCurrentUser(null);
              setMemories([]);
              setChatMessages([]);
            }

            const isDemo = localStorage.getItem('lilac_is_demo') === 'true' && remoteVault.id === 'vault_demo_lavender';
            setIsDemoMode(isDemo);
          }
        }
      } catch (err) {
        console.error('Error fetching latest vault data from cloud:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Background sync polling fallback across mobile & desktop
    const interval = setInterval(async () => {
      try {
        const activeId = getActiveUserId();
        if (!activeId) return; // Strict privacy: do NOT poll or load memories if unauthenticated!

        const remoteVault = await getVault();
        if (remoteVault && remoteVault.users.some((u) => u.id === activeId)) {
          setVault((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(remoteVault)) {
              return remoteVault;
            }
            return prev;
          });
          syncCurrentUserFromVault(remoteVault);

          const remoteMems = await getAllMemories(remoteVault.id);
          setMemories((prev) => {
            if (prev.length !== remoteMems.length || JSON.stringify(prev) !== JSON.stringify(remoteMems)) {
              return remoteMems;
            }
            return prev;
          });

          const remoteMsgs = await getAllChatMessages(remoteVault.id);
          setChatMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const newArrivals = remoteMsgs.filter((m) => !prevIds.has(m.id));
            if (newArrivals.length > 0) {
              const fromPartner = newArrivals.filter((m) => m.senderId !== activeId);
              if (fromPartner.length > 0) {
                playMessageChime();
              }
              if (newArrivals.some((m) => m.type === 'sparkle_burst')) {
                triggerSparkleExplosion();
              }
            }
            if (
              remoteMsgs.length !== prev.length ||
              newArrivals.length > 0 ||
              prev.some((m, idx) => m.id !== remoteMsgs[idx]?.id)
            ) {
              return remoteMsgs;
            }
            return prev;
          });
        }
      } catch {
        // quiet fallback
      }
    }, 2500);

    // Subscribe to instant Supabase realtime WebSocket events if configured
    let unsubscribeRealtime = () => {};
    if (isSupabaseConfigured()) {
      unsubscribeRealtime = supabaseSubscribeToChanges({
        onVaultChange: async () => {
          const activeId = getActiveUserId();
          if (!activeId) return;
          const v = await getVault();
          if (v && v.users.some((u) => u.id === activeId)) {
            setVault(v);
            syncCurrentUserFromVault(v);
          }
        },
        onMemoryChange: async () => {
          const activeId = getActiveUserId();
          const activeVaultId = localStorage.getItem('lilac_vault_id');
          if (!activeId || !activeVaultId) return;
          const m = await getAllMemories(activeVaultId);
          setMemories(m);
        },
        onChatChange: async () => {
          const activeId = getActiveUserId();
          const activeVaultId = localStorage.getItem('lilac_vault_id');
          if (!activeId || !activeVaultId) return;

          const c = await getAllChatMessages(activeVaultId);
          setChatMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const newArrivals = c.filter((m) => !prevIds.has(m.id));
            if (newArrivals.length > 0) {
              const fromPartner = newArrivals.filter((m) => m.senderId !== activeId);
              if (fromPartner.length > 0) {
                playMessageChime();
              }
              if (newArrivals.some((m) => m.type === 'sparkle_burst')) {
                triggerSparkleExplosion();
              }
            }
            if (
              c.length !== prev.length ||
              newArrivals.length > 0 ||
              prev.some((m, idx) => m.id !== c[idx]?.id)
            ) {
              return c;
            }
            return prev;
          });
        },
      });
    }

    return () => {
      clearInterval(interval);
      unsubscribeRealtime();
    };
  }, []);

  const partnerUser = vault?.users.find((u) => u.id !== currentUser?.id) || null;

  // Dynamically compute user-created folders only (no hardcoded presets!)
  const folders = React.useMemo(() => {
    const list = new Set<string>();
    if (vault?.folders && Array.isArray(vault.folders)) {
      vault.folders.forEach((f) => {
        if (f && f.trim()) list.add(f.trim());
      });
    }
    // Also include any user-created folder attached to memories
    memories.forEach((m) => {
      if (m.folder && m.folder.trim()) {
        // filter out old legacy presets if not in vault.folders
        if (!['General ✨', 'Trips & Travel 🌴', 'Cafe & Dates ☕', 'Cute Selfies 📸'].includes(m.folder.trim()) || (vault?.folders && vault.folders.includes(m.folder.trim()))) {
          list.add(m.folder.trim());
        }
      }
    });
    return Array.from(list);
  }, [vault?.folders, memories]);

  // Create a new folder
  const addFolder = async (folderName: string) => {
    const clean = folderName.trim();
    if (!clean || !vault) return;
    const currentFolders = vault.folders || [];
    if (currentFolders.includes(clean)) return;

    const updatedFolders = [...currentFolders, clean];
    const updatedVault: Vault = {
      ...vault,
      folders: updatedFolders,
    };
    await saveVault(updatedVault);
    setVault(updatedVault);
  };

  // Delete a custom folder
  const deleteFolder = async (folderName: string) => {
    if (!vault) return;
    const currentFolders = vault.folders || [];
    const updatedFolders = currentFolders.filter((f) => f !== folderName);
    const updatedVault: Vault = {
      ...vault,
      folders: updatedFolders,
    };
    await saveVault(updatedVault);
    setVault(updatedVault);

    // Reassign memories in this folder
    const fallbackFolder = updatedFolders.length > 0 ? updatedFolders[0] : '';
    const affectedMems = memories.filter((m) => m.folder === folderName);
    for (const mem of affectedMems) {
      const updatedMem = { ...mem, folder: fallbackFolder || undefined };
      await saveMemory(updatedMem);
    }
    setMemories((prev) =>
      prev.map((m) => (m.folder === folderName ? { ...m, folder: fallbackFolder || undefined } : m))
    );
    if (activeFolder === folderName) {
      setActiveFolder(fallbackFolder || 'All');
    }
  };

  // Move memory to another folder
  const moveMemoryToFolder = async (memoryId: string, folderName: string) => {
    const cleanFolder = folderName.trim();
    setMemories((prev) =>
      prev.map((m) => {
        if (m.id !== memoryId) return m;
        const updated = { ...m, folder: cleanFolder || undefined };
        saveMemory(updated);
        return updated;
      })
    );
    if (cleanFolder && vault && (!vault.folders || !vault.folders.includes(cleanFolder))) {
      await addFolder(cleanFolder);
    }
  };

  // Bucket List items from current vault
  const bucketList = React.useMemo(() => {
    return vault?.bucketList || [];
  }, [vault?.bucketList]);

  // Add Bucket List item
  const addBucketItem = async (item: {
    title: string;
    location?: string;
    category?: BucketCategory;
    notes?: string;
    targetDate?: string;
  }) => {
    if (!vault) return;
    const newItem: BucketItem = {
      id: `bucket_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      vaultId: vault.id,
      title: item.title.trim(),
      location: item.location?.trim() || undefined,
      category: item.category || 'general',
      isCompleted: false,
      createdBy: currentUser?.name || 'Us',
      createdAt: new Date().toISOString(),
      notes: item.notes?.trim() || undefined,
      targetDate: item.targetDate || undefined,
    };

    const updatedList = [newItem, ...(vault.bucketList || [])];
    const updatedVault: Vault = {
      ...vault,
      bucketList: updatedList,
    };
    setVault(updatedVault);
    await saveVault(updatedVault);
  };

  // Toggle Bucket List item completed/pending with celebration confetti & sound
  const toggleBucketItem = async (id: string) => {
    if (!vault) return;
    const currentList = vault.bucketList || [];
    let isNowCompleted = false;

    const updatedList = currentList.map((item) => {
      if (item.id === id) {
        const nextCompleted = !item.isCompleted;
        isNowCompleted = nextCompleted;
        return {
          ...item,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
          completedBy: nextCompleted ? (currentUser?.name || 'Us') : undefined,
        };
      }
      return item;
    });

    if (isNowCompleted) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#ec4899', '#3b82f6', '#eab308', '#10b981'],
        });
      } catch {}
      playMessageChime();
    }

    const updatedVault: Vault = {
      ...vault,
      bucketList: updatedList,
    };
    setVault(updatedVault);
    await saveVault(updatedVault);
  };

  // Delete Bucket List item
  const deleteBucketItem = async (id: string) => {
    if (!vault) return;
    const updatedList = (vault.bucketList || []).filter((item) => item.id !== id);
    const updatedVault: Vault = {
      ...vault,
      bucketList: updatedList,
    };
    setVault(updatedVault);
    await saveVault(updatedVault);
  };

  // Calculate unread chat messages from partner since lastReadTimestamp or currentUser.lastReadAt
  const unreadChatCount = React.useMemo(() => {
    if (!currentUser) return 0;
    const userReadTime = currentUser.lastReadAt ? new Date(currentUser.lastReadAt).getTime() : 0;
    const localReadTime = new Date(lastReadTimestamp).getTime() || 0;
    const effectiveReadTime = Math.max(userReadTime, localReadTime);

    return chatMessages.filter(
      (m) => m.senderId !== currentUser.id && new Date(m.createdAt).getTime() > effectiveReadTime
    ).length;
  }, [chatMessages, currentUser, lastReadTimestamp]);

  // Mark all chat messages as read and sync with partner
  const markChatAsRead = React.useCallback(async () => {
    if (!vault || !currentUser) return;

    // Check if there are any messages from partner
    const partnerMessages = chatMessages.filter((m) => m.senderId !== currentUser.id);
    if (partnerMessages.length === 0) {
      return;
    }

    const latestPartnerMsgTime = Math.max(...partnerMessages.map((m) => new Date(m.createdAt).getTime()));
    const currentReadTime = currentUser.lastReadAt ? new Date(currentUser.lastReadAt).getTime() : 0;
    const localReadTime = new Date(lastReadTimestamp).getTime() || 0;
    const effectiveReadTime = Math.max(currentReadTime, localReadTime);

    // If we have already read all partner messages, skip to prevent continuous re-saving
    if (effectiveReadTime >= latestPartnerMsgTime) {
      return;
    }

    // Use max of now and latest message time to handle any phone clock skew
    const readTimeNum = Math.max(Date.now(), latestPartnerMsgTime);
    const nowIso = new Date(readTimeNum).toISOString();

    setLastReadTimestamp(nowIso);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lilac_last_read_chat', nowIso);
    }

    const updatedUsers = vault.users.map((u) =>
      u.id === currentUser.id ? { ...u, lastReadAt: nowIso } : u
    );
    const updatedVault: Vault = {
      ...vault,
      users: updatedUsers,
    };
    setVault(updatedVault);
    try {
      await saveVault(updatedVault);
    } catch {
      // quiet fallback
    }
  }, [vault, currentUser, chatMessages, lastReadTimestamp]);

  // Lavender, gold & rose sparkle explosion helper
  const triggerSparkleExplosion = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#A78BFA', '#C084FC', '#F472B6', '#FDE047', '#E9D5FF', '#38BDF8'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 35,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#C084FC', '#FDE047', '#F472B6'],
        });
        confetti({
          particleCount: 35,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#A78BFA', '#FDE047', '#F472B6'],
        });
      }, 250);
    } catch {
      // quiet fallback
    }
  };

  // Create a new vault as Host
  const createVault = async (
    vaultName: string,
    hostName: string,
    avatar: string,
    customPasscode?: string
  ) => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    const accessCode = `LILAC-${codeNum}`;
    const defaultPin = codeNum.toString().padStart(4, '0');
    const passcode = (customPasscode && customPasscode.trim().length >= 4) ? customPasscode.trim() : defaultPin;

    const hostUser: User = {
      id: `user_${Date.now()}`,
      name: hostName.trim() || 'Elena',
      avatar: avatar || '🪻',
      color: '#8B5CF6',
      role: 'host',
      joinedAt: new Date().toISOString(),
    };

    const newVault: Vault = {
      id: `vault_${Date.now()}`,
      name: vaultName.trim() || 'Our Lavender Capsule ✨',
      accessCode,
      createdAt: new Date().toISOString(),
      users: [hostUser],
      isLocked: false,
      passcode,
      folders: [],
      bucketList: [],
    };

    await saveVault(newVault);
    setVault(newVault);
    setCurrentUser(hostUser);
    dbSetActiveUserId(hostUser.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lilac_vault_id', newVault.id);
      localStorage.setItem('lilac_vault_code', newVault.accessCode);
      localStorage.setItem('lilac_active_user', hostUser.id);
      localStorage.removeItem('lilac_is_demo');
    }
    setIsDemoMode(false);

    triggerSparkleExplosion();
  };

  // Join existing vault with Access Code
  const joinVault = async (
    accessCode: string,
    memberName: string,
    avatar: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanCode = accessCode.trim().toUpperCase();
    const storedVault = await getVaultByCode(cleanCode);
    if (!storedVault) {
      return {
        success: false,
        error: isSupabaseConfigured()
          ? `Could not find capsule "${cleanCode}". Please verify the code with your friend!`
          : `Capsule "${cleanCode}" not found. For two devices to sync across the internet, please configure Supabase in Cloud Settings!`,
      };
    }

    if (storedVault.users.length >= 2) {
      return {
        success: false,
        error: 'This capsule is strictly locked for 2 members and is already full! 🔒',
      };
    }

    const memberUser: User = {
      id: `user_${Date.now()}`,
      name: memberName.trim() || 'Liam',
      avatar: avatar || '☕',
      color: '#7C3AED',
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    const updatedVault: Vault = {
      ...storedVault,
      users: [...storedVault.users, memberUser],
      isLocked: true, // STRICTLY 2 USERS: locked!
    };

    await saveVault(updatedVault);
    setVault(updatedVault);
    setCurrentUser(memberUser);
    dbSetActiveUserId(memberUser.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lilac_vault_id', updatedVault.id);
      localStorage.setItem('lilac_vault_code', updatedVault.accessCode);
      localStorage.setItem('lilac_active_user', memberUser.id);
      localStorage.removeItem('lilac_is_demo');
    }

    const [mems, msgs] = await Promise.all([
      getAllMemories(updatedVault.id),
      getAllChatMessages(updatedVault.id),
    ]);
    setMemories(mems);
    setChatMessages(msgs);

    triggerSparkleExplosion();

    return { success: true };
  };

  // Start 1-Click Showcase Demo Mode
  const startDemoMode = async () => {
    setIsLoading(true);
    await seedDemoData();
    const demoVault = await getVault();
    if (demoVault) {
      setVault(demoVault);
      const demoMemories = await getAllMemories(demoVault.id);
      const demoMsgs = await getAllChatMessages(demoVault.id);
      setMemories(demoMemories);
      setChatMessages(demoMsgs);
      setCurrentUser(demoVault.users[0] || null);
      if (demoVault.users[0]) {
        dbSetActiveUserId(demoVault.users[0].id);
      }
    }
    setIsDemoMode(true);
    setIsLoading(false);

    triggerSparkleExplosion();
  };

  // Switch Active User (for testing & demo purposes)
  const switchActiveUser = (userId: string) => {
    const user = vault?.users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      dbSetActiveUserId(user.id);
    }
  };

  // Upload a photo or video
  const uploadMemory = async (data: {
    file: File;
    caption: string;
    tags: string[];
    date: string;
    aiMood?: string;
    folder?: string;
  }) => {
    if (!vault || !currentUser) return;

    const isVideo = data.file.type.startsWith('video');
    let mediaUrl = '';

    if (isVideo) {
      mediaUrl = await readVideoFile(data.file);
    } else {
      mediaUrl = await compressImage(data.file);
    }

    const fallbackFolder = vault.folders && vault.folders.length > 0 ? vault.folders[0] : '';
    const assignedFolder = data.folder?.trim() || (activeFolder !== 'All' ? activeFolder : fallbackFolder);

    const newMemory: Memory = {
      id: `mem_${Date.now()}`,
      vaultId: vault.id,
      uploaderId: currentUser.id,
      uploaderName: currentUser.name,
      uploaderAvatar: currentUser.avatar,
      type: isVideo ? 'video' : 'image',
      mediaUrl,
      caption: data.caption,
      date: data.date || new Date().toISOString().split('T')[0],
      hearts: [currentUser.id],
      tags: data.tags,
      notes: [],
      aiMood: data.aiMood || 'Lavender Vibes',
      folder: assignedFolder || undefined,
    };

    await saveMemory(newMemory);
    setMemories((prev) => [newMemory, ...prev]);

    if (assignedFolder && (!vault.folders || !vault.folders.includes(assignedFolder))) {
      await addFolder(assignedFolder);
    }

    triggerSparkleExplosion();
  };

  // Send a Chat message
  const sendChatMessage = async (text: string, type: 'text' | 'sparkle_burst' = 'text') => {
    if (!vault || !currentUser || (!text.trim() && type === 'text')) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      vaultId: vault.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      type,
    };

    // 1. Instant optimistic update in local state (<1ms)
    setChatMessages((prev) => [...prev, newMsg]);

    if (type === 'sparkle_burst') {
      triggerSparkleExplosion();
    }

    // 2. Persist to storage & cloud in background
    try {
      await dbSaveChatMessage(newMsg);
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  };

  // Toggle Heart / Star Reaction
  const toggleHeart = async (memoryId: string) => {
    if (!currentUser) return;

    setMemories((prev) =>
      prev.map((mem) => {
        if (mem.id !== memoryId) return mem;
        const hasLiked = mem.hearts.includes(currentUser.id);
        const newHearts = hasLiked
          ? mem.hearts.filter((id) => id !== currentUser.id)
          : [...mem.hearts, currentUser.id];

        const updated = { ...mem, hearts: newHearts };
        saveMemory(updated);
        return updated;
      })
    );
  };

  // Add Comment Note
  const addNote = async (memoryId: string, text: string) => {
    if (!currentUser || !text.trim()) return;

    const newNote: MemoryNote = {
      id: `note_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMemories((prev) =>
      prev.map((mem) => {
        if (mem.id !== memoryId) return mem;
        const updated = { ...mem, notes: [...mem.notes, newNote] };
        saveMemory(updated);
        return updated;
      })
    );
  };

  // Delete Memory
  const deleteMemory = async (memoryId: string) => {
    await dbDeleteMemory(memoryId);
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
  };

  // Delete Note / Comment on a memory
  const deleteNote = async (memoryId: string, noteId: string) => {
    setMemories((prev) =>
      prev.map((mem) => {
        if (mem.id !== memoryId) return mem;
        const updated = { ...mem, notes: mem.notes.filter((n) => n.id !== noteId) };
        saveMemory(updated);
        return updated;
      })
    );
  };

  // Sync Cloud Data
  const syncCloud = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await syncLocalToCloud();
    if (res.success && vault) {
      const allMems = await getAllMemories(vault.id);
      setMemories(allMems);
      const allMsgs = await getAllChatMessages(vault.id);
      setChatMessages(allMsgs);
    }
    return res;
  };

  // Update user profile/nickname after pairing
  const updateUserProfile = async (userId: string, newName: string, newAvatar: string) => {
    if (!vault) return;

    const updatedUsers = vault.users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          name: newName.trim() || u.name,
          avatar: newAvatar || u.avatar,
        };
      }
      return u;
    });

    const updatedVault: Vault = {
      ...vault,
      users: updatedUsers,
    };

    await saveVault(updatedVault);
    setVault(updatedVault);

    if (currentUser?.id === userId) {
      setCurrentUser(updatedUsers.find((u) => u.id === userId) || null);
    }

    triggerSparkleExplosion();
  };

  // Verify Vault Passcode / PIN
  const verifyVaultPasscode = (pin: string): boolean => {
    if (!vault) return false;
    const cleanPin = pin.trim();
    const expectedPin = vault.passcode || vault.accessCode.replace(/\D/g, '').slice(-4).padStart(4, '0');
    return cleanPin === expectedPin || cleanPin === vault.accessCode.replace(/\D/g, '');
  };

  // Update / Set Vault Passcode (PIN) for existing vault
  const updateVaultPasscode = async (newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!vault) return { success: false, error: 'No active capsule found.' };
    const cleanPin = newPin.trim();
    if (cleanPin.length < 4) {
      return { success: false, error: 'Security PIN must be at least 4 digits.' };
    }

    const updatedVault: Vault = {
      ...vault,
      passcode: cleanPin,
    };

    setVault(updatedVault);
    try {
      await saveVault(updatedVault);
      triggerSparkleExplosion();
      return { success: true };
    } catch (err: any) {
      console.error('Error saving updated PIN:', err);
      return { success: false, error: err?.message || 'Failed to update PIN.' };
    }
  };

  // Direct login for existing user
  const loginUser = async (userId: string, pin?: string): Promise<{ success: boolean; error?: string }> => {
    if (!vault) return { success: false, error: 'No active capsule found.' };
    const user = vault.users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User profile not found in capsule.' };

    const activeId = getActiveUserId();
    // If device is unverified as this user and capsule is full (2/2)
    if (vault.users.length >= 2 && activeId !== userId) {
      if (pin !== undefined && !verifyVaultPasscode(pin)) {
        return { success: false, error: 'Incorrect 4-digit security PIN! Access denied.' };
      }
    }

    setCurrentUser(user);
    dbSetActiveUserId(user.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('lilac_vault_id', vault.id);
      localStorage.setItem('lilac_vault_code', vault.accessCode);
      localStorage.setItem('lilac_active_user', user.id);
    }

    // Load memories and chat only after successful authentication!
    try {
      const [mems, msgs] = await Promise.all([
        getAllMemories(vault.id),
        getAllChatMessages(vault.id),
      ]);
      setMemories(mems);
      setChatMessages(msgs);
    } catch (e) {
      console.error('Error loading vault data after login:', e);
    }

    triggerSparkleExplosion();
    return { success: true };
  };

  // Delete Chat Message
  const deleteChatMessage = async (msgId: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== msgId));
    try {
      await dbDeleteChatMessage(msgId);
    } catch (err) {
      console.error('Error deleting chat message:', err);
    }
  };

  // Login using Access Code (capsule lookup without leaking memories prematurely)
  const loginWithCode = async (
    accessCode: string
  ): Promise<{ success: boolean; error?: string; users?: User[]; vault?: Vault }> => {
    const cleanCode = accessCode.trim().toUpperCase();
    const remoteVault = await getVaultByCode(cleanCode);
    if (!remoteVault) {
      return {
        success: false,
        error: isSupabaseConfigured()
          ? `Capsule "${cleanCode}" not found. Please double-check the code with your friend!`
          : `Capsule "${cleanCode}" not found on server. To link across different phones, connect Supabase in Cloud Settings!`,
      };
    }

    setVault(remoteVault);
    setIsDemoMode(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lilac_is_demo');
    }
    // DO NOT load memories or chat messages here! Keep them empty until user is authenticated!
    setMemories([]);
    setChatMessages([]);

    return { success: true, users: remoteVault.users, vault: remoteVault };
  };

  // Logout active user session (preserves all data in cloud/cache, locks view)
  const logoutUser = () => {
    setCurrentUser(null);
    dbSetActiveUserId('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lilac_active_user');
    }
    setMemories([]);
    setChatMessages([]);
  };

  // Reset Everything
  const resetAllData = async () => {
    await clearAllVaultData();
    setVault(null);
    setCurrentUser(null);
    setMemories([]);
    setChatMessages([]);
    setIsDemoMode(false);
  };

  return (
    <VaultContext.Provider
      value={{
        vault,
        currentUser,
        partnerUser,
        memories,
        chatMessages,
        folders,
        activeFolder,
        setActiveFolder,
        addFolder,
        deleteFolder,
        moveMemoryToFolder,
        bucketList,
        addBucketItem,
        toggleBucketItem,
        deleteBucketItem,
        unreadChatCount,
        markChatAsRead,
        isLoading,
        isDemoMode,
        createVault,
        joinVault,
        startDemoMode,
        switchActiveUser,
        uploadMemory,
        toggleHeart,
        addNote,
        deleteNote,
        deleteMemory,
        sendChatMessage,
        deleteChatMessage,
        updateUserProfile,
        loginUser,
        loginWithCode,
        verifyVaultPasscode,
        updateVaultPasscode,
        logoutUser,
        triggerSparkleExplosion,
        resetAllData,
        syncCloud,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
