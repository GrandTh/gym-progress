import { createClient } from "@/lib/supabase/server"
import { ExerciseList } from "@/components/exercise-list"
import { AddExerciseDialog } from "@/components/add-exercise-dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  // Await searchParams before using its properties
  const params = await searchParams
  const query = params.q || ""

  const supabase = await createClient()

  // Fetch exercises (both default and custom user exercises)
  let dbQuery = supabase.from("exercises").select("*").order("name")

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`)
  }

  const { data: exercises, error } = await dbQuery

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exercises</h1>
          <p className="text-muted-foreground">Manage your exercise library</p>
        </div>
        <AddExerciseDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <form>
          <Input
            name="q"
            type="search"
            placeholder="Search exercises..."
            className="w-full pl-9 md:w-[300px]"
            defaultValue={query}
          />
        </form>
      </div>

      <ExerciseList exercises={exercises || []} />
    </div>
  )
}
