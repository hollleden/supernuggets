import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY supabase client using the secret/service-role key.
// Bypasses RLS — only import this from server components, route handlers,
// or 'use server' action files. NEVER import from a 'use client' file.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

if (!supabaseSecretKey) {
  // Don't crash the build; just warn loudly. Reads from anon key still work.
  console.warn('[supabaseAdmin] SUPABASE_SECRET_KEY is not set — write operations will fail silently due to RLS. Add it to .env.local and restart the dev server.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
