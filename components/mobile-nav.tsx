"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, LayoutDashboard, Utensils, User, Users, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { SettingsDialog } from "@/components/settings-dialog"
import { useUser } from "@/lib/user-context"

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { profile } = useUser()

  const baseRoutes = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard",
    },
    {
      label: t("workouts"),
      icon: Dumbbell,
      href: "/dashboard/workouts",
      active: pathname.startsWith("/dashboard/workouts"),
    },
    {
      label: t("nutrition"),
      icon: Utensils,
      href: "/dashboard/nutrition",
      active: pathname.startsWith("/dashboard/nutrition"),
    },
    {
      label: t("profile"),
      icon: User,
      href: "/dashboard/profile",
      active: pathname.startsWith("/dashboard/profile"),
    },
  ]

  const roleRoutes: typeof baseRoutes = []

  if (profile?.role === "admin") {
    roleRoutes.push({
      label: t("members"),
      icon: Users,
      href: "/dashboard/coach/members",
      active: pathname.startsWith("/dashboard/coach"),
    })
    roleRoutes.push({
      label: "Admin",
      icon: ShieldCheck,
      href: "/dashboard/admin",
      active: pathname.startsWith("/dashboard/admin"),
    })
  } else if (profile?.role === "coach") {
    roleRoutes.push({
      label: t("members"),
      icon: Users,
      href: "/dashboard/coach/members",
      active: pathname.startsWith("/dashboard/coach"),
    })
  }

  // Limiter à 5 éléments pour le mobile
  const routes = [...baseRoutes.slice(0, 3), ...roleRoutes.slice(0, 1)]

  return (
    <div className="flex h-16 items-center justify-around px-4">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex flex-col items-center gap-1 text-xs",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <route.icon className="h-5 w-5" />
          <span className="sr-only">{route.label}</span>
        </Link>
      ))}
      <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <SettingsDialog />
      </div>
    </div>
  )
}
