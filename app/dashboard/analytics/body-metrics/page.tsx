import { createClient } from "@/lib/server"
import { BodyMetricsForm } from "@/components/body-metrics-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function BodyMetricsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: metrics } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("user_id", user?.id)
    .order("measured_at", { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/analytics">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Body Metrics</h1>
          <p className="text-muted-foreground">Track your weight and body composition</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log New Measurement</CardTitle>
            <CardDescription>Record your current weight and body fat percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <BodyMetricsForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Measurements</CardTitle>
            <CardDescription>Your latest body metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics && metrics.length > 0 ? (
              <div className="space-y-4">
                {metrics.slice(0, 5).map((metric) => (
                  <div key={metric.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{metric.weight_kg} kg</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(metric.measured_at).toLocaleDateString()}
                      </p>
                    </div>
                    {metric.body_fat_percentage && (
                      <div className="text-right">
                        <p className="text-sm">{metric.body_fat_percentage}% BF</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No measurements yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
