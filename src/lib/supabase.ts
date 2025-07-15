import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://illwscrdeyncckltjrmr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbHdzY3JkZXluY2NrbHRqcm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5ODMxMTAsImV4cCI6MjA2NzU1OTExMH0.lBBWAA09Dro-2ckbUs1pQR9HzfeTsOZM4sFcK3J5RoQ';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables, using defaults');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
