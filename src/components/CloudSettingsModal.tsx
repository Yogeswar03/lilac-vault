import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, CloudOff, Check, Copy, ExternalLink, RefreshCw, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import {
  getSupabaseCredentials,
  setSupabaseCredentials,
  clearSupabaseCredentials,
  isSupabaseConfigured,
  testSupabaseConnection,
} from '../services/supabase';
import { useVault } from '../context/VaultContext';

interface CloudSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_SCHEMA_CONTENT = `-- 1. Vaults Table
create table if not exists vaults (
  id text primary key,
  name text not null,
  access_code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  users jsonb not null default '[]'::jsonb,
  is_locked boolean not null default false
);

-- 2. Memories Table
create table if not exists memories (
  id text primary key,
  vault_id text not null,
  uploader_id text not null,
  uploader_name text not null,
  uploader_avatar text not null,
  type text not null default 'image',
  media_url text not null,
  caption text,
  date text not null,
  hearts jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  ai_mood text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Chat Messages Table
create table if not exists chat_messages (
  id text primary key,
  vault_id text not null,
  sender_id text not null,
  sender_name text not null,
  sender_avatar text not null,
  text text not null,
  type text not null default 'text',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security & Policies
alter table vaults enable row level security;
alter table memories enable row level security;
alter table chat_messages enable row level security;

drop policy if exists "Allow all on vaults" on vaults;
create policy "Allow all on vaults" on vaults for all using (true) with check (true);

drop policy if exists "Allow all on memories" on memories;
create policy "Allow all on memories" on memories for all using (true) with check (true);

drop policy if exists "Allow all on chat_messages" on chat_messages;
create policy "Allow all on chat_messages" on chat_messages for all using (true) with check (true);

-- 5. Realtime Sync safely
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'vaults'
  ) then
    alter publication supabase_realtime add table vaults;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'memories'
  ) then
    alter publication supabase_realtime add table memories;
  end if;
  
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table chat_messages;
  end if;
end $$;`;

export const CloudSettingsModal: React.FC<CloudSettingsModalProps> = ({ isOpen, onClose }) => {
  const { syncCloud } = useVault();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.key);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ text: 'Please enter both the Supabase URL and Anon Key.', type: 'error' });
      return;
    }
    setIsTesting(true);
    setStatusMessage({ text: 'Testing connection to Supabase...', type: 'info' });

    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setIsTesting(false);

    if (res.success) {
      setStatusMessage({ text: 'Connected successfully to Supabase database! 🟢', type: 'success' });
    } else {
      setStatusMessage({ text: res.error || 'Connection failed. Please check your credentials.', type: 'error' });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({ text: 'Please enter both the Project URL and Anon Public Key.', type: 'error' });
      return;
    }

    setIsSyncing(true);
    setSupabaseCredentials(url.trim(), anonKey.trim());

    // Test connection first
    const testResult = await testSupabaseConnection(url.trim(), anonKey.trim());
    if (!testResult.success) {
      setIsSyncing(false);
      setStatusMessage({
        text: `Credentials saved, but connection warning: ${testResult.error}`,
        type: 'error',
      });
      return;
    }

    // Sync any local vault/memories/messages to the cloud
    const syncResult = await syncCloud();
    setIsSyncing(false);

    if (syncResult.success) {
      setStatusMessage({
        text: 'Cloud sync activated! Your capsule is now live across all phones and devices! ✨',
        type: 'success',
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setStatusMessage({
        text: 'Credentials saved, but sync had an issue: ' + syncResult.error,
        type: 'error',
      });
    }
  };

  const handleClear = () => {
    if (window.confirm('Disconnect from Cloud Database and switch back to local device storage?')) {
      clearSupabaseCredentials();
      setUrl('');
      setAnonKey('');
      setStatusMessage({ text: 'Switched to Local Device storage.', type: 'info' });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_CONTENT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-lavender-950/70 backdrop-blur-md overflow-y-auto min-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass-card rounded-3xl p-5 sm:p-7 shadow-2xl relative border border-lavender-200 my-auto max-h-[92dvh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-lavender-100 text-purple-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-lavender-100 text-purple-700 mx-auto flex items-center justify-center text-xl mb-2 shadow-xs">
            <Cloud className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-cute text-purple-950">
            Multi-Device Cloud Sync ☁️
          </h3>
          <p className="text-xs text-purple-700/90 mt-1 max-w-sm mx-auto">
            Connect a free Supabase database so you and your friend can share photos and chat from different phones anywhere in the world.
          </p>
        </div>

        {/* Live Status Card */}
        <div
          className={`p-3.5 rounded-2xl border mb-4 flex items-start gap-3 transition-colors ${
            isConfigured
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}
        >
          {isConfigured ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CloudOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
              <span>{isConfigured ? '🟢 Connected to Cloud Database' : '⚪ Local Device Storage Only'}</span>
            </div>
            <p className="text-[11px] opacity-85 mt-0.5 leading-snug">
              {isConfigured
                ? 'Your capsule is syncing live in real-time across mobile cellular data, Wi-Fi, and desktop.'
                : 'Capsules created now stay only on this phone. Enter your free Supabase URL & Key below so your friend can join via code!'}
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-lavender-50 border-lavender-200 text-purple-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-4 h-4 text-purple-600 animate-spin flex-shrink-0" />
            )}
            <span className="leading-snug">{statusMessage.text}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-3.5 text-left">
          <div>
            <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzabcdefghijklm.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 font-mono text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider mb-1">
              Supabase Anon Public API Key
            </label>
            <textarea
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              rows={2}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2 rounded-xl border border-lavender-300 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white text-purple-950 font-mono text-[11px] sm:text-xs resize-none"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !url.trim() || !anonKey.trim()}
              className="flex-1 py-2.5 rounded-xl bg-white hover:bg-lavender-50 border border-lavender-300 text-purple-900 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSyncing}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-lavender-600 to-indigo-700 text-white font-bold text-xs shadow-cute hover:shadow-glow transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing Capsule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Save & Connect 🪻</span>
                </>
              )}
            </button>
          </div>

          {isConfigured && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-rose-500 hover:text-rose-700 underline font-medium"
              >
                Disconnect Cloud Database (Switch to Local Only)
              </button>
            </div>
          )}
        </form>

        {/* Collapsible Supabase Setup Quick Guide */}
        <div className="mt-5 pt-4 border-t border-lavender-200 text-left">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="flex items-center justify-between w-full text-xs font-bold text-purple-900 hover:text-purple-950 transition-colors"
          >
            <span className="flex items-center gap-1">
              <span>📖</span>
              <span>Need help? Free 2-minute Supabase setup guide</span>
            </span>
            <span className="text-purple-600 text-[10px] font-mono">{showSqlGuide ? '▲ Hide' : '▼ Show'}</span>
          </button>

          <AnimatePresence>
            {showSqlGuide && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 text-xs text-purple-800/90 leading-relaxed overflow-hidden"
              >
                <div className="p-3 rounded-2xl bg-lavender-50 border border-lavender-200 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Create a Free Project</span>
                  </div>
                  <p className="text-[11px] text-purple-700 ml-6">
                    Sign up for free at{' '}
                    <a
                      href="https://supabase.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-900 underline font-bold inline-flex items-center gap-0.5"
                    >
                      supabase.com <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and create a new project.
                  </p>

                  <div className="flex items-center gap-1.5 font-bold text-purple-950 pt-1">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Run Database Schema</span>
                  </div>
                  <p className="text-[11px] text-purple-700 ml-6">
                    In your Supabase dashboard, click <strong>SQL Editor</strong>, paste this schema, and click <strong>Run</strong>:
                  </p>
                  <div className="ml-6">
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] shadow-xs flex items-center gap-1 transition-all"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? 'Copied SQL Schema! ✨' : 'Copy SQL Schema Script'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 font-bold text-purple-950 pt-1">
                    <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Copy API Credentials</span>
                  </div>
                  <p className="text-[11px] text-purple-700 ml-6">
                    Go to <strong>Project Settings → API</strong>. Copy the <strong>Project URL</strong> and <strong>anon public key</strong> and paste them above. You're all set!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
