import { createClient } from "@/lib/supabase/server"
import { WorkoutLogger } from "@/components/workout-logger"
import { notFound } from "next/navigation"

export default async function StartWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch routine details including exercises
  const { data: routine } = await supabase
    .from("routines")
    .select(`
      *,
      routine_exercises (
        *,
        exercises (
          id,
          name,
          category,
          muscle_group
        )
      )
    `)
    .eq("id", id)
    .single()

  if (!routine) {
    notFound()
  }

  // Sort exercises by order_index
  routine.routine_exercises.sort((a: any, b: any) => a.order_index - b.order_index)

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{routine.name}</h1>
        <p className="text-muted-foreground">{routine.description || "Let's crush this workout!"}</p>
      </div>

      <WorkoutLogger routine={routine} />
    </div>
  )
}
