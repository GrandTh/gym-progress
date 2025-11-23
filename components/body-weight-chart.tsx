"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"

interface BodyWeightChartProps {
  userId: string
}

export function BodyWeightChart({ userId }: BodyWeightChartProps) {
  const [data, setData] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()

      const { data: metrics } = await supabase
        .from("body_metrics")
        .select("weight_kg, measured_at")
        .eq("user_id", userId)
        .order("measured_at", { ascending: true })

      if (!metrics) {
        setLoading(false)
        return
      }

      const chartData = metrics.map((m) => ({
        date: new Date(m.measured_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weight: Number(m.weight_kg),
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
          <CardTitle>Body Weight</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Body Weight</CardTitle>
          <CardDescription>Track your body weight over time</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
          No weight data yet. Log your weight to see progress!
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Body Weight</CardTitle>
        <CardDescription>Your weight trend over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            weight: {
              label: "Weight (kg)",
              color: "var(--chart-1)",
            },
          }}
          className="h-80"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="weight" stroke="var(--color-weight)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
