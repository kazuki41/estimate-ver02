import { createClient } from "../node_modules/@supabase/supabase-js";

// .env.localに書いたURLと鍵を自動で読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Next.js全体で使えるSupabaseの窓口（クライアント）を作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey);