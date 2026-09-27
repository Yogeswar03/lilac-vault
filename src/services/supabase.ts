import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Vault, Memory, ChatMessage } from '../types';

// Retrieve credentials from environment variables or in-app localStorage settings
export function getSupabaseCredentials(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('lilac_supabase_url') || '';
  const localKey = localStorage.getItem('lilac_supabase_anon_key') || '';

  const url = (envUrl || localUrl).trim();
  const key = (envKey || localKey).trim();

  return { url, key };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
    key &&
    url !== 'https://your-project.supabase.co' &&
    url !== 'https://your-project-ref.supabase.co' &&
    !url.includes('placeholder')
  );
}

// Save in-app Supabase credentials
export function setSupabaseCredentials(url: string, key: string) {
  localStorage.setItem('lilac_supabase_url', url.trim());
  localStorage.setItem('lilac_supabase_anon_key', key.trim());
  cachedClient = null;
}

// Clear in-app Supabase credentials
export function clearSupabaseCredentials() {
  localStorage.removeItem('lilac_supabase_url');
  localStorage.removeItem('lilac_supabase_anon_key');
  cachedClient = null;
}

// Test connection to Supabase with provided or saved credentials
export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const creds = getSupabaseCredentials();
    const url = (testUrl || creds.url).trim();
    const key = (testKey || creds.key).trim();

    if (!url || !key) {
      return { success: false, error: 'Project URL and Anon Key are required.' };
    }

    const testClient = createClient(url, key);
    const { error } = await testClient.from('vaults').select('id').limit(1);
    if (error) {
      if (error.message?.includes('relation "public.vaults" does not exist') || error.code === '42P01') {
        return {
          success: false,
          error: 'Connected to Supabase, but "vaults" table does not exist. Please run the SQL schema in Supabase SQL Editor!',
        };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to connect to Supabase.' };
  }
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const { url, key } = getSupabaseCredentials();
  if (isSupabaseConfigured()) {
    try {
      cachedClient = createClient(url, key);
      return cachedClient;
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }
  return null;
}

export const supabase = getSupabaseClient();

// ==========================================
// VAULT METHODS
// ==========================================

export async function supabaseSaveVault(vault: Vault): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('vaults').upsert({
    id: vault.id,
    name: vault.name,
    access_code: vault.accessCode.trim().toUpperCase(),
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
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
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

// Query Supabase explicitly for the vault matching the provided access code
export async function supabaseGetVaultByCode(accessCode: string): Promise<Vault | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  const cleanCode = accessCode.trim().toUpperCase();

  const { data, error } = await client
    .from('vaults')
    .select('*')
    .eq('access_code', cleanCode)
    .maybeSingle();

  if (error) {
    console.error('Supabase error fetching vault by code:', error);
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
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('memories').upsert({
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

export async function supabaseGetAllMemories(vaultId?: string): Promise<Memory[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client.from('memories').select('*').order('date', { ascending: false });
  if (vaultId) {
    query = query.eq('vault_id', vaultId);
  }

  const { data, error } = await query;

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
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('memories').delete().eq('id', id);
  if (error) {
    console.error('Supabase error deleting memory:', error);
    throw error;
  }
}

// ==========================================
// CHAT MESSAGES METHODS
// ==========================================

export async function supabaseSaveChatMessage(msg: ChatMessage): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('chat_messages').upsert({
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

export async function supabaseGetAllChatMessages(vaultId?: string): Promise<ChatMessage[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  let query = client.from('chat_messages').select('*').order('created_at', { ascending: true });
  if (vaultId) {
    query = query.eq('vault_id', vaultId);
  }

  const { data, error } = await query;

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

export async function supabaseDeleteChatMessage(id: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;

  const { error } = await client.from('chat_messages').delete().eq('id', id);
  if (error) {
    console.error('Supabase error deleting chat message:', error);
    throw error;
  }
}

// ==========================================
// REALTIME SUBSCRIPTION
// ==========================================

export function supabaseSubscribeToChanges(callbacks: {
  onVaultChange?: () => void;
  onMemoryChange?: () => void;
  onChatChange?: () => void;
}) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const channel = client
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
    client?.removeChannel(channel);
  };
}

// ==========================================
// RESET ALL
// ==========================================

export async function supabaseResetAll(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.from('chat_messages').delete().neq('id', '___');
  await client.from('memories').delete().neq('id', '___');
  await client.from('vaults').delete().neq('id', '___');
}
