-- ==========================================
-- Supabase Database Schema for Kanban Board
-- ==========================================
-- このSQLをSupabaseダッシュボードのSQL Editorで実行してください
-- https://app.supabase.com/project/YOUR_PROJECT/sql

-- 1. Users テーブル
create table if not exists users (
  id bigint primary key generated always as identity,
  name text not null,
  email text not null unique,
  created_at timestamp with time zone default now()
);

-- 2. Tasks テーブル
create table if not exists tasks (
  id bigint primary key generated always as identity,
  user_id bigint references users(id) on delete cascade,
  text text not null,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Comments テーブル
create table if not exists comments (
  id bigint primary key generated always as identity,
  task_id bigint references tasks(id) on delete cascade,
  user_id bigint references users(id) on delete cascade,
  user_name text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- インデックスの作成（パフォーマンス向上のため）
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists comments_task_id_idx on comments(task_id);

-- Row Level Security (RLS) を有効化
alter table users enable row level security;
alter table tasks enable row level security;
alter table comments enable row level security;

-- Users テーブルのポリシー
create policy "Allow public read access to users"
  on users for select
  using (true);

create policy "Allow public insert access to users"
  on users for insert
  with check (true);

-- Tasks テーブルのポリシー
create policy "Allow public read access to tasks"
  on tasks for select
  using (true);

create policy "Allow public insert access to tasks"
  on tasks for insert
  with check (true);

create policy "Allow public update access to tasks"
  on tasks for update
  using (true);

create policy "Allow public delete access to tasks"
  on tasks for delete
  using (true);

-- Comments テーブルのポリシー
create policy "Allow public read access to comments"
  on comments for select
  using (true);

create policy "Allow public insert access to comments"
  on comments for insert
  with check (true);

create policy "Allow public delete access to comments"
  on comments for delete
  using (true);

-- 初期ユーザーデータの挿入（オプション）
insert into users (name, email) values
  ('田中太郎', 'tanaka@example.com'),
  ('佐藤花子', 'sato@example.com'),
  ('山田次郎', 'yamada@example.com')
on conflict (email) do nothing;
