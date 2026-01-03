import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Prozatím bez typů, dokud je nevygenerujeme ze schématu
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
