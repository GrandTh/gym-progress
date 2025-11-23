/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

interface WorkoutFrequencyChartProps {
  userId: string
  preview?: boolean
}

export function WorkoutFrequencyChart({ userId, preview = false }: WorkoutFrequencyChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Get last 8 weeks of workouts
      const weeksAgo = new Date()
      weeksAgo.setDate(weeksAgo.getDate() - (preview ? 4 * 7 : 8 * 7))

      const { data: workouts } = await supabase
        .from("workout_logs")
        .select("started_at")
        .eq("user_id", userId)
        .gte("started_at", weeksAgo.toISOString())
        .order("started_at", { ascending: true })

      if (!workouts) {
        setLoading(false)
        return
      }

      // Group by week
      const weekCounts: Record<string, number> = {}

      workouts.forEach((workout) => {
        const date = new Date(workout.started_at)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekLabel = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })

        weekCounts[weekLabel] = (weekCounts[weekLabel] || 0) + 1
      })

      const chartData = Object.entries(weekCounts).map(([week, count]) => ({
        week,
        workouts: count,
      }))

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [userId, preview])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Frequency</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Frequency</CardTitle>
          <CardDescription>Track how often you work out</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          No workout data yet. Start training to see your frequency!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workout Frequency</CardTitle>
        <CardDescription>Number of workouts per week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            workouts: {
              label: "Workouts",
              color: "var(--chart-2)",
            },
          }}
          className={preview ? "h-64" : "h-80"}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" fontSize={12} />
              <YAxis fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="workouts" fill="var(--color-workouts)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
