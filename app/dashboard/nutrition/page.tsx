import { createClient } from "@/lib/server"
import { NutritionOverview } from "@/components/nutrition-overview"
import { MealLogger } from "@/components/meal-logger"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function NutritionPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Fetch today's meals
  const { data: meals } = await supabase
    .from("meals")
    .select(`
      *,
      meal_foods (
        *,
        foods (
          name,
          calories,
          protein,
          carbs,
          fat
        )
      )
    `)
    .gte("consumed_at", `${today}T00:00:00`)
    .lte("consumed_at", `${today}T23:59:59`)
    .order("consumed_at", { ascending: true })

  // Fetch food database
  const { data: foods } = await supabase.from("foods").select("*").order("name")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nutrition</h1>
        <p className="text-muted-foreground">Track your macros and calories</p>
      </div>

      <NutritionOverview meals={meals || []} />

      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log">Log Meal</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="log" className="mt-4">
          <MealLogger foods={foods || []} />
        </TabsContent>
        <TabsContent value="history">
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            History view coming soon!
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
