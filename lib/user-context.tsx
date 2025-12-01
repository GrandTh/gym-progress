"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

type UserRole = "admin" | "coach" | "student" | null

interface UserProfile {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  role: UserRole
  displayName: string | null
  heightCm: number | null
  age: number | null
}

interface UserContextType {
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
})

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createBrowserClient()

  const fetchProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error)
      }

      setProfile(
        data
          ? {
              id: data.id,
              firstName: data.first_name,
              lastName: data.last_name,
              email: data.email || user.email,
              role: data.role,
              displayName: data.display_name,
              heightCm: data.height_cm,
              age: data.age,
            }
          : {
              id: user.id,
              firstName: null,
              lastName: null,
              email: user.email || null,
              role: null,
              displayName: null,
              heightCm: null,
              age: null,
            },
      )
    } catch (error) {
      console.error("Error in fetchProfile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchProfile()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>{children}</UserContext.Provider>
  )
}

export const useUser = () => useContext(UserContext)
