"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { RoutineForm } from "@/components/routine-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Exercise {
  id: string
  name: string
  muscle_group: string | null
  equipment: string | null
  description: string | null
  is_custom: boolean
}

interface RoutineExercise {
  id: string
  exercise_id: string
  target_sets: number
  target_reps: number
  rest_seconds: number
  notes: string | null
  order_index: number
  superset_id: number | null
  exercise: Exercise
}

interface Routine {
  id: string
  name: string
  description: string | null
  category: string | null
  user_id: string
  routine_exercises: RoutineExercise[]
}

export default function EditRoutinePage() {
  const params = useParams()
  const router = useRouter()
  const { profile, loading: profileLoading } = useUser()
  const { t } = useLanguage()
  const supabase = createBrowserClient()

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const routineId = params?.id as string

  useEffect(() => {
    const fetchData = async () => {
      if (!profile || !routineId) return
      setLoading(true)
      setError(null)

      try {
        const { data: routineData, error: routineError } = await supabase
          .from("routines")
          .select(`
            *,
            routine_exercises (
              id,
              exercise_id,
              target_sets,
              target_reps,
              rest_seconds,
              notes,
              order_index,
              superset_id,
              exercise:exercises (
                id,
                name,
                muscle_group,
                equipment,
                description,
                is_custom
              )
            )
          `)
          .eq("id", routineId)
          .single()

        if (routineError) {
          setError("Routine non trouvée")
          setLoading(false)
          return
        }

        // Check if user owns this routine or is admin
        if (routineData.user_id !== profile.id && profile.role !== "admin") {
          setError("Vous n'avez pas accès à cette routine")
          setLoading(false)
          return
        }

        // Sort exercises by order_index
        routineData.routine_exercises.sort((a: RoutineExercise, b: RoutineExercise) => a.order_index - b.order_index)
        setRoutine(routineData)

        // Fetch all available exercises
        const { data: exercisesData } = await supabase
          .from("exercises")
          .select("id, name, muscle_group, equipment, description, is_custom")
          .or(`is_custom.eq.false,user_id.eq.${profile.id}`)
          .order("name")

        setExercises(exercisesData || [])
      } catch (err) {
        console.error("Error fetching routine:", err)
        setError("Erreur lors du chargement de la routine")
      } finally {
        setLoading(false)
      }
    }

    if (profile && routineId) {
      fetchData()
    }
  }, [profile, routineId])

  if (profileLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error}</p>
        <Link href="/dashboard/workouts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux entraînements
          </Button>
        </Link>
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Routine non trouvée</p>
        <Link href="/dashboard/workouts">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux entraînements
          </Button>
        </Link>
      </div>
    )
  }

  const initialData = {
    id: routine.id,
    name: routine.name,
    description: routine.description || "",
    category: routine.category || "",
    exercises: routine.routine_exercises.map((re) => ({
      id: re.id,
      exercise_id: re.exercise_id,
      sets: re.target_sets,
      reps: String(re.target_reps),
      rest_seconds: re.rest_seconds,
      notes: re.notes || "",
      superset_group: re.superset_id,
      exercise: re.exercise,
    })),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/workouts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("editRoutine")}</h1>
          <p className="text-muted-foreground">Modifier "{routine.name}"</p>
        </div>
      </div>

      <RoutineForm exercises={exercises} initialData={initialData} isEditing={true} />
    </div>
  )
}
