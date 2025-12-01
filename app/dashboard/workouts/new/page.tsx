import { createClient } from "@/lib/supabase/server"
import { RoutineForm } from "@/components/routine-form"

export default async function NewRoutinePage() {
  const supabase = await createClient()

  // Fetch all exercises for the selection list
  const { data: exercises } = await supabase.from("exercises").select("*").order("name")

  return (
    <div className="mx-auto max-w-3xl flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Routine</h1>
        <p className="text-muted-foreground">Design your perfect workout template</p>
      </div>

      <RoutineForm exercises={exercises || []} />
    </div>
  )
}
