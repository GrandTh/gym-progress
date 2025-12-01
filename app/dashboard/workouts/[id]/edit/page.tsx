import { createClient } from "@/lib/supabase/server"
import { RoutineForm } from "@/components/routine-form"
import { notFound } from "next/navigation"

export default async function EditRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch routine with its exercises
  const { data: routine, error: routineError } = await supabase.from("routines").select("*").eq("id", id).single()

  if (routineError || !routine) {
    notFound()
  }

  // Fetch routine exercises with exercise details
  const { data: routineExercises } = await supabase
    .from("routine_exercises")
    .select("*, exercises(id, name, category, muscle_group, equipment)")
    .eq("routine_id", id)
    .order("order_index")

  // Fetch all exercises for the selection list
  const { data: exercises } = await supabase.from("exercises").select("*").order("name")

  // Transform routine exercises for the form
  const existingExercises =
    routineExercises?.map((re) => ({
      exercise_id: re.exercise_id,
      name: re.exercises?.name || "Unknown",
      target_sets: re.target_sets || 3,
      target_reps: re.target_reps || 10,
      target_weight: re.target_weight || 0,
      rest_seconds: re.rest_seconds || 60,
      notes: re.notes || "",
      superset_id: re.superset_id,
    })) || []

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modifier la Routine</h1>
        <p className="text-muted-foreground">Modifiez votre routine d'entraînement</p>
      </div>

      <RoutineForm
        exercises={exercises || []}
        editMode={true}
        routineId={routine.id}
        initialData={{
          name: routine.name,
          description: routine.description || "",
          category: routine.category || "other",
        }}
        initialExercises={existingExercises}
      />
    </div>
  )
}
