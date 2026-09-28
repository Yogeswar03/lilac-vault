export interface User {
  id: string;
  name: string;
  avatar: string; // Emoji or image URL
  color: string;
  role: 'host' | 'member';
  joinedAt: string;
  lastReadAt?: string; // Timestamp when user last read the chat
}

export interface Vault {
  id: string;
  name: string;
  accessCode: string;
  createdAt: string;
  users: User[];
  isLocked: boolean; // Once 2 users join, locked = true (strictly 2 users)
  folders?: string[];
}

export interface MemoryNote {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  vaultId: string;
  uploaderId: string;
  uploaderName: string;
  uploaderAvatar: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  date: string;
  hearts: string[]; // user IDs who liked it
  tags: string[];
  notes: MemoryNote[];
  aiMood?: string;
  folder?: string;
}

export interface ChatMessage {
  id: string;
  vaultId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
  type?: 'text' | 'sparkle_burst';
}

export type ReelTheme = 'lavender-dream' | 'golden-hour' | 'lofi-nostalgia' | 'pastel-retro';

export interface ReelSettings {
  theme: ReelTheme;
  title: string;
  durationPerSlide: number;
  includeMusic: boolean;
  selectedMemoryIds: string[];
}
