import { createBrowserClient } from "@supabase/ssr"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase env vars não configuradas")
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_KEY)
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY)
}
