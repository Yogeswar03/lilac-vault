-- ========================================================
-- LilacVault Database Schema for Supabase
-- Copy and paste this into the Supabase SQL Editor and click RUN
-- ========================================================

-- 1. Vaults Table (Capsule details, members, locked status)
create table if not exists vaults (
  id text primary key,
  name text not null,
  access_code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  users jsonb not null default '[]'::jsonb,
  is_locked boolean not null default false
);

-- 2. Memories Table (Uploaded photos, videos, captions, hearts, notes)
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

-- 3. Chat Messages Table (Private capsule messages & sparkle bursts)
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

-- 4. Enable Row Level Security (RLS)
alter table vaults enable row level security;
alter table memories enable row level security;
alter table chat_messages enable row level security;

-- 5. Access Policies (Anon access for paired members)
create policy "Allow all operations on vaults" on vaults for all using (true) with check (true);
create policy "Allow all operations on memories" on memories for all using (true) with check (true);
create policy "Allow all operations on chat_messages" on chat_messages for all using (true) with check (true);

-- 6. Enable Realtime Replication
-- Allows both friends to see photos and messages instantly as they arrive
alter publication supabase_realtime add table vaults;
alter publication supabase_realtime add table memories;
alter publication supabase_realtime add table chat_messages;
