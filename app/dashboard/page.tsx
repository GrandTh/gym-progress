/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Play, Apple, Dumbbell, Scale } from "lucide-react"
import { createClient } from "@/lib/server"
import { StrengthProgressionChart } from "@/components/strength-progression-chart"
import { WorkoutFrequencyChart } from "@/components/workout-frequency-chart"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user?.id).single()

  // Get this week's workout count
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const { data: thisWeekWorkouts } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user?.id)
    .gte("started_at", startOfWeek.toISOString())

  const { data: lastWeekWorkouts } = await supabase
    .from("workout_logs")
    .select("id")
    .eq("user_id", user?.id)
    .gte("started_at", new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .lt("started_at", startOfWeek.toISOString())

  const thisWeekCount = thisWeekWorkouts?.length || 0
  const lastWeekCount = lastWeekWorkouts?.length || 0
  const weekChange = lastWeekCount === 0 ? 0 : Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)

  // Get today's nutrition
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data: todayMeals } = await supabase
    .from("meals")
    .select(
      `
      id,
      meal_foods (
        servings,
        food:foods (
          calories,
          protein,
          carbs,
          fat
        )
      )
    `,
    )
    .eq("user_id", user?.id)
    .gte("consumed_at", startOfDay.toISOString())

  let totalCalories = 0
  let totalProtein = 0
  let totalCarbs = 0
  let totalFat = 0

  todayMeals?.forEach((meal: any) => {
    meal.meal_foods?.forEach((mf: any) => {
      const food = mf.food
      if (food) {
        totalCalories += Number(food.calories) * Number(mf.servings)
        totalProtein += Number(food.protein) * Number(mf.servings)
        totalCarbs += Number(food.carbs) * Number(mf.servings)
        totalFat += Number(food.fat) * Number(mf.servings)
      }
    })
  })

  // Get latest body weight
  const { data: latestWeight } = await supabase
    .from("body_metrics")
    .select("weight_kg")
    .eq("user_id", user?.id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-balance text-3xl font-bold tracking-tight">
            Hello, {profile?.display_name || "Athlete"}
          </h1>
        </div>
        <p className="text-muted-foreground">Ready to crush your goals today?</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Quick Start Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-pretty opacity-90">Start an empty workout or choose from your templates.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="w-full gap-2" asChild>
                <Link href="/dashboard/workouts/new">
                  <Play className="h-4 w-4" />
                  Start Workout
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Workout Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts this Week</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekCount}</div>
            <p className="text-xs text-muted-foreground">
              {weekChange > 0 ? "+" : ""}
              {weekChange}% from last week
            </p>
          </CardContent>
        </Card>

        {/* Nutrition Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories Today</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
            <p className="text-xs text-muted-foreground">{Math.round(totalProtein)}g Protein</p>
          </CardContent>
        </Card>

        {/* Body Weight Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestWeight?.weight_kg ? `${latestWeight.weight_kg} kg` : "—"}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/analytics" className="underline">
                Track progress
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Analytics Overview</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/analytics">View All</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <StrengthProgressionChart userId={user?.id!} preview />
          <WorkoutFrequencyChart userId={user?.id!} preview />
        </div>
      </div>
    </div>
  )
}
