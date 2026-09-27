import { createClient } from '@supabase/supabase-js';
import { Vault, Memory, ChatMessage } from '../types';

// Load Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Returns true if valid Supabase credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Supabase client instance (or null if offline/unconfigured)
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// VAULT METHODS
// ==========================================

export async function supabaseSaveVault(vault: Vault): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('vaults').upsert({
    id: vault.id,
    name: vault.name,
    access_code: vault.accessCode,
    created_at: vault.createdAt,
    users: vault.users,
    is_locked: vault.isLocked,
  });

  if (error) {
    console.error('Supabase error saving vault:', error);
    throw error;
  }
}

export async function supabaseGetVault(): Promise<Vault | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('vaults')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Supabase error fetching vault:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    accessCode: data.access_code,
    createdAt: data.created_at,
    users: data.users || [],
    isLocked: data.is_locked,
  };
}

// ==========================================
// MEMORIES METHODS
// ==========================================

export async function supabaseSaveMemory(memory: Memory): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('memories').upsert({
    id: memory.id,
    vault_id: memory.vaultId,
    uploader_id: memory.uploaderId,
    uploader_name: memory.uploaderName,
    uploader_avatar: memory.uploaderAvatar,
    type: memory.type,
    media_url: memory.mediaUrl,
    caption: memory.caption,
    date: memory.date,
    hearts: memory.hearts,
    tags: memory.tags,
    notes: memory.notes,
    ai_mood: memory.aiMood,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Supabase error saving memory:', error);
    throw error;
  }
}

export async function supabaseGetAllMemories(): Promise<Memory[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase error fetching memories:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    vaultId: row.vault_id,
    uploaderId: row.uploader_id,
    uploaderName: row.uploader_name,
    uploaderAvatar: row.uploader_avatar,
    type: row.type,
    mediaUrl: row.media_url,
    caption: row.caption || '',
    date: row.date,
    hearts: row.hearts || [],
    tags: row.tags || [],
    notes: row.notes || [],
    aiMood: row.ai_mood,
  }));
}

export async function supabaseDeleteMemory(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('memories').delete().eq('id', id);
  if (error) {
    console.error('Supabase error deleting memory:', error);
    throw error;
  }
}

// ==========================================
// CHAT MESSAGES METHODS
// ==========================================

export async function supabaseSaveChatMessage(msg: ChatMessage): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from('chat_messages').upsert({
    id: msg.id,
    vault_id: msg.vaultId,
    sender_id: msg.senderId,
    sender_name: msg.senderName,
    sender_avatar: msg.senderAvatar,
    text: msg.text,
    type: msg.type || 'text',
    created_at: msg.createdAt,
  });

  if (error) {
    console.error('Supabase error saving chat message:', error);
    throw error;
  }
}

export async function supabaseGetAllChatMessages(): Promise<ChatMessage[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase error fetching chat messages:', error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    vaultId: row.vault_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderAvatar: row.sender_avatar,
    text: row.text,
    type: row.type || 'text',
    createdAt: row.created_at,
  }));
}

// ==========================================
// REALTIME SUBSCRIPTION
// ==========================================

export function supabaseSubscribeToChanges(callbacks: {
  onVaultChange?: () => void;
  onMemoryChange?: () => void;
  onChatChange?: () => void;
}) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('lilac-realtime-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'vaults' },
      () => callbacks.onVaultChange?.()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'memories' },
      () => callbacks.onMemoryChange?.()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_messages' },
      () => callbacks.onChatChange?.()
    )
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}

// ==========================================
// RESET ALL
// ==========================================

export async function supabaseResetAll(): Promise<void> {
  if (!supabase) return;
  await supabase.from('chat_messages').delete().neq('id', '___');
  await supabase.from('memories').delete().neq('id', '___');
  await supabase.from('vaults').delete().neq('id', '___');
}
