/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

interface NutritionConsistencyChartProps {
  userId: string
}

export function NutritionConsistencyChart({ userId }: NutritionConsistencyChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      // Get last 14 days of meals
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      const { data: meals } = await supabase
        .from("meals")
        .select(
          `
          consumed_at,
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
        .eq("user_id", userId)
        .gte("consumed_at", twoWeeksAgo.toISOString())
        .order("consumed_at", { ascending: true })

      if (!meals) {
        setLoading(false)
        return
      }

      // Group by day and calculate totals
      const dailyTotals: Record<string, any> = {}

      meals.forEach((meal: any) => {
        const date = new Date(meal.consumed_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })

        if (!dailyTotals[date]) {
          dailyTotals[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0 }
        }

        meal.meal_foods?.forEach((mf: any) => {
          const food = mf.food
          if (food) {
            dailyTotals[date].calories += Number(food.calories) * Number(mf.servings)
            dailyTotals[date].protein += Number(food.protein) * Number(mf.servings)
            dailyTotals[date].carbs += Number(food.carbs) * Number(mf.servings)
            dailyTotals[date].fat += Number(food.fat) * Number(mf.servings)
          }
        })
      })

      const chartData = Object.values(dailyTotals).map((day: any) => ({
        date: day.date,
        calories: Math.round(day.calories),
        protein: Math.round(day.protein),
        carbs: Math.round(day.carbs),
        fat: Math.round(day.fat),
      }))

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Consistency</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nutrition Consistency</CardTitle>
          <CardDescription>Track your daily macros over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          No nutrition data yet. Log meals to see consistency!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition Consistency</CardTitle>
        <CardDescription>Daily calorie and macro intake over the last 14 days</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            calories: { label: "Calories", color: "var(--chart-1)" },
            protein: { label: "Protein (g)", color: "var(--chart-2)" },
            carbs: { label: "Carbs (g)", color: "var(--chart-3)" },
            fat: { label: "Fat (g)", color: "var(--chart-4)" },
          }}
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line type="monotone" dataKey="calories" stroke="var(--color-calories)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="protein" stroke="var(--color-protein)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="carbs" stroke="var(--color-carbs)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="fat" stroke="var(--color-fat)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
