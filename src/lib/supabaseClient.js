import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Copy mediscript-frontend/.env.example to .env before connecting live data.',
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
