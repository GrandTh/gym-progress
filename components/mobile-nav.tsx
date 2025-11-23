"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, LayoutDashboard, Utensils, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"
import { SettingsDialog } from "@/components/settings-dialog"

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const routes = [
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
      label: t("exercises"),
      icon: Dumbbell,
      href: "/dashboard/exercises",
      active: pathname.startsWith("/dashboard/exercises"),
    },
    {
      label: t("nutrition"),
      icon: Utensils,
      href: "/dashboard/nutrition",
      active: pathname.startsWith("/dashboard/nutrition"),
    },
    {
      label: t("analytics"),
      icon: BarChart3,
      href: "/dashboard/analytics",
      active: pathname.startsWith("/dashboard/analytics"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
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
        {/* Simple way to access settings on mobile without disrupting the grid */}
        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <SettingsDialog />
        </div>
      </div>
    </div>
  )
}
