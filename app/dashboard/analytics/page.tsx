/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { createClient } from "@/lib/server"
import { StrengthProgressionChart } from "@/components/strength-progression-chart"
import { BodyWeightChart } from "@/components/body-weight-chart"
import { WorkoutFrequencyChart } from "@/components/workout-frequency-chart"
import { NutritionConsistencyChart } from "@/components/nutrition-consistency-chart"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track your progress over time</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/analytics/body-metrics">
            <Plus className="mr-2 h-4 w-4" />
            Log Weight
          </Link>
        </Button>
      </div>

      <div className="grid gap-6">
        <StrengthProgressionChart userId={user?.id!} />
        <BodyWeightChart userId={user?.id!} />
        <WorkoutFrequencyChart userId={user?.id!} />
        <NutritionConsistencyChart userId={user?.id!} />
      </div>
    </div>
  )
}
