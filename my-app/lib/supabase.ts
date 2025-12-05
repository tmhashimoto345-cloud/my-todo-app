import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 型定義
export type User = {
  id: number;
  name: string;
  email: string;
  created_at?: string;
};

export type Task = {
  id: number;
  user_id: number;
  text: string;
  completed: boolean;
  created_at?: string;
};

export type Comment = {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  content: string;
  created_at?: string;
};
