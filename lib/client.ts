import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // This allows the app to load without crashing, even if Supabase isn't connected yet.
    // The user will see an error when they try to actually use the database.
    console.error("Supabase environment variables are missing!")
    return createSupabaseBrowserClient("https://placeholder.supabase.co", "placeholder")
  }
  return createSupabaseBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export const createBrowserClient = createClient
