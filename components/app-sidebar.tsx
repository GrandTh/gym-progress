"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, LayoutDashboard, Utensils, BarChart3, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { SettingsDialog } from "@/components/settings-dialog"
import { useLanguage } from "@/lib/language-context"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient()
  const { t } = useLanguage()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

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
    <div className="hidden border-r bg-muted/40 md:block w-64 fixed h-full">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Dumbbell className="h-6 w-6" />
            <span className="">Gym Tracker</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  route.active ? "bg-muted text-primary" : "text-muted-foreground",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <SettingsDialog />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            <span>{t("signOut")}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
