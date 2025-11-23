/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

interface StrengthProgressionChartProps {
  userId: string
  preview?: boolean
}

export function StrengthProgressionChart({ userId, preview = false }: StrengthProgressionChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartConfig, setChartConfig] = useState<any>({})

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Get workout logs with exercises and sets
      const { data: workouts } = await supabase
        .from("workout_logs")
        .select(
          `
          id,
          started_at,
          workout_exercises (
            exercise:exercises (
              id,
              name
            ),
            workout_sets (
              weight,
              reps
            )
          )
        `,
        )
        .eq("user_id", userId)
        .order("started_at", { ascending: true })
        .limit(preview ? 10 : 30)

      if (!workouts) {
        setLoading(false)
        return
      }

      // Calculate max weight per exercise per workout
      const exerciseProgress: Record<string, any[]> = {}

      workouts.forEach((workout: any) => {
        const date = new Date(workout.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })

        workout.workout_exercises?.forEach((we: any) => {
          const exerciseName = we.exercise?.name
          if (!exerciseName) return

          const maxWeight = Math.max(...(we.workout_sets?.map((s: any) => Number(s.weight) || 0) || [0]))

          if (maxWeight > 0) {
            if (!exerciseProgress[exerciseName]) {
              exerciseProgress[exerciseName] = []
            }
            exerciseProgress[exerciseName].push({ date, weight: maxWeight })
          }
        })
      })

      // Format for chart (combine all exercises by date)
      const chartData: Record<string, any> = {}
      const exercises = Object.keys(exerciseProgress)

      // Generate config and sanitize keys
      const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]
      const newConfig: any = {}

      exercises.forEach((exercise, idx) => {
        // Create a safe key for CSS variables (remove spaces and special chars)
        const safeKey = exercise.replace(/[^a-zA-Z0-9]/g, "_")
        newConfig[safeKey] = {
          label: exercise,
          color: colors[idx % colors.length],
        }
      })

      Object.entries(exerciseProgress).forEach(([exercise, progress]) => {
        const safeKey = exercise.replace(/[^a-zA-Z0-9]/g, "_")
        progress.forEach(({ date, weight }) => {
          if (!chartData[date]) {
            chartData[date] = { date }
          }
          chartData[date][safeKey] = weight
        })
      })

      setChartConfig(newConfig)
      setData(Object.values(chartData))
      setLoading(false)
    }

    fetchData()
  }, [userId, preview])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strength Progression</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strength Progression</CardTitle>
          <CardDescription>Track your weight increases over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          No workout data yet. Complete workouts to see your progress!
        </CardContent>
      </Card>
    )
  }

  const safeKeys = Object.keys(chartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strength Progression</CardTitle>
        <CardDescription>Max weight lifted per exercise over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className={preview ? "h-64" : "h-80"}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} label={{ value: "Weight (kg)", angle: -90, position: "insideLeft" }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {safeKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
