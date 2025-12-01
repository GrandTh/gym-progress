import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createSupabaseBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    // Return a dummy client to prevent crashes during build
    return createSupabaseBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
  return client
}

export const createBrowserClient = createClient
