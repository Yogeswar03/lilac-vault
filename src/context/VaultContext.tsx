import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Vault, User, Memory, MemoryNote, ChatMessage } from '../types';
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
} from '../services/storage';
import { isSupabaseConfigured, supabaseSubscribeToChanges } from '../services/supabase';

interface VaultContextType {
  vault: Vault | null;
  currentUser: User | null;
  partnerUser: User | null;
  memories: Memory[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  isDemoMode: boolean;
  createVault: (vaultName: string, hostName: string, avatar: string) => Promise<void>;
  joinVault: (accessCode: string, memberName: string, avatar: string) => Promise<{ success: boolean; error?: string }>;
  startDemoMode: () => Promise<void>;
  switchActiveUser: (userId: string) => void;
  uploadMemory: (data: { file: File; caption: string; tags: string[]; date: string; aiMood?: string }) => Promise<void>;
  toggleHeart: (memoryId: string) => Promise<void>;
  addNote: (memoryId: string, text: string) => Promise<void>;
  deleteNote: (memoryId: string, noteId: string) => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<void>;
  sendChatMessage: (text: string, type?: 'text' | 'sparkle_burst') => Promise<void>;
  deleteChatMessage: (msgId: string) => Promise<void>;
  updateUserProfile: (userId: string, newName: string, newAvatar: string) => Promise<void>;
  loginUser: (userId: string) => void;
  loginWithCode: (accessCode: string) => Promise<{ success: boolean; error?: string; users?: User[] }>;
  logoutUser: () => void;
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

  // Initialize from storage on mount
  useEffect(() => {
    async function loadData() {
      try {
        const storedVault = await getVault();
        if (storedVault) {
          setVault(storedVault);
          const allMems = await getAllMemories();
          setMemories(allMems);

          const allMsgs = await getAllChatMessages();
          setChatMessages(allMsgs);

          const activeId = getActiveUserId();
          const isDemo = localStorage.getItem('lilac_is_demo') === 'true';
          setIsDemoMode(isDemo);

          const foundUser = storedVault.users.find((u) => u.id === activeId);
          if (foundUser) {
            setCurrentUser(foundUser);
          } else if (isDemo && storedVault.users.length > 0) {
            setCurrentUser(storedVault.users[0]);
            dbSetActiveUserId(storedVault.users[0].id);
          } else {
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error('Error loading vault data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Background sync polling fallback across mobile & desktop
    const interval = setInterval(async () => {
      try {
        const remoteVault = await getVault();
        if (remoteVault) {
          setVault((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(remoteVault)) {
              return remoteVault;
            }
            return prev;
          });
          const remoteMems = await getAllMemories();
          setMemories((prev) => {
            if (prev.length !== remoteMems.length || JSON.stringify(prev) !== JSON.stringify(remoteMems)) {
              return remoteMems;
            }
            return prev;
          });
          const remoteMsgs = await getAllChatMessages();
          setChatMessages((prev) => {
            if (prev.length !== remoteMsgs.length) {
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
          const v = await getVault();
          if (v) setVault(v);
        },
        onMemoryChange: async () => {
          const m = await getAllMemories();
          setMemories(m);
        },
        onChatChange: async () => {
          const c = await getAllChatMessages();
          setChatMessages(c);
        },
      });
    }

    return () => {
      clearInterval(interval);
      unsubscribeRealtime();
    };
  }, []);

  const partnerUser = vault?.users.find((u) => u.id !== currentUser?.id) || null;

  // Lavender & gold sparkle explosion helper
  const triggerSparkleExplosion = () => {
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#AB7FED', '#C4B5FD', '#DDD6FE', '#9057E5', '#FDE047', '#FFFFFF'],
    });
  };

  // Create a new vault as Host
  const createVault = async (vaultName: string, hostName: string, avatar: string) => {
    const codeNum = Math.floor(100 + Math.random() * 900);
    const accessCode = `LILAC-${codeNum}`;

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
    };

    await saveVault(newVault);
    setVault(newVault);
    setCurrentUser(hostUser);
    dbSetActiveUserId(hostUser.id);
    setIsDemoMode(false);
    localStorage.removeItem('lilac_is_demo');

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

    triggerSparkleExplosion();

    return { success: true };
  };

  // Start 1-Click Showcase Demo Mode
  const startDemoMode = async () => {
    setIsLoading(true);
    await seedDemoData();
    const demoVault = await getVault();
    const demoMemories = await getAllMemories();
    const demoMsgs = await getAllChatMessages();

    setVault(demoVault);
    setMemories(demoMemories);
    setChatMessages(demoMsgs);
    setCurrentUser(demoVault?.users[0] || null);
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
  }) => {
    if (!vault || !currentUser) return;

    const isVideo = data.file.type.startsWith('video');
    let mediaUrl = '';

    if (isVideo) {
      mediaUrl = await readVideoFile(data.file);
    } else {
      mediaUrl = await compressImage(data.file);
    }

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
    };

    await saveMemory(newMemory);
    setMemories((prev) => [newMemory, ...prev]);

    triggerSparkleExplosion();
  };

  // Send a Chat message
  const sendChatMessage = async (text: string, type: 'text' | 'sparkle_burst' = 'text') => {
    if (!vault || !currentUser || (!text.trim() && type === 'text')) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      vaultId: vault.id,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      type,
    };

    await dbSaveChatMessage(newMsg);
    setChatMessages((prev) => [...prev, newMsg]);

    if (type === 'sparkle_burst') {
      triggerSparkleExplosion();
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
    if (res.success) {
      const allMems = await getAllMemories();
      setMemories(allMems);
      const allMsgs = await getAllChatMessages();
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

  // Direct login for existing user
  const loginUser = (userId: string) => {
    if (!vault) return;
    const user = vault.users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      dbSetActiveUserId(user.id);
      triggerSparkleExplosion();
    }
  };

  // Delete Chat Message
  const deleteChatMessage = async (msgId: string) => {
    await dbDeleteChatMessage(msgId);
    setChatMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  // Login using Access Code
  const loginWithCode = async (accessCode: string): Promise<{ success: boolean; error?: string; users?: User[] }> => {
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
    const allMems = await getAllMemories();
    setMemories(allMems);
    const allMsgs = await getAllChatMessages();
    setChatMessages(allMsgs);

    return { success: true, users: remoteVault.users };
  };

  // Logout active user session (preserves all data, locks view)
  const logoutUser = () => {
    setCurrentUser(null);
    dbSetActiveUserId('');
    localStorage.removeItem('lilac_active_user');
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
