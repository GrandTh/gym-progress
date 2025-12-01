import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables are missing. Skipping middleware session update.")
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated and not on auth pages
  if (!user && !request.nextUrl.pathname.startsWith("/auth") && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    const response = NextResponse.redirect(url)

    // Copy cookies from the supabaseResponse (which might contain refreshed tokens) to the redirect response
    const cookiesToSet = supabaseResponse.cookies.getAll()
    cookiesToSet.forEach((cookie) => {
      response.cookies.set(cookie)
    })

    return response
  }

  // This prevents infinite redirect loops where the middleware redirects to dashboard,
  // but the dashboard (due to cookie issues or race conditions) redirects back to login.
  // Users who are logged in will just see the login page, which is a safe fallback.

  return supabaseResponse
}
