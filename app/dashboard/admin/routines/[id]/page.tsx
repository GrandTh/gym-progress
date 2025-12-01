"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, ClipboardList, User, Calendar, Dumbbell, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Routine {
  id: string
  name: string
  description: string | null
  category: string | null
  user_id: string
  is_template: boolean
  created_at: string
}

interface RoutineExercise {
  id: string
  order_index: number
  sets: number
  reps: string | null
  rest_seconds: number | null
  notes: string | null
  exercise: {
    id: string
    name: string
    muscle_group: string | null
  }
}

interface Creator {
  first_name: string | null
  last_name: string | null
  email: string | null
}

export default function AdminRoutineDetailPage() {
  const params = useParams()
  const routineId = params.id as string
  const router = useRouter()
  const { profile, loading: profileLoading } = useUser()
  const supabase = createBrowserClient()

  const [routine, setRoutine] = useState<Routine | null>(null)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [exercises, setExercises] = useState<RoutineExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== "admin") return

    const fetchRoutine = async () => {
      try {
        const { data: routineData, error: routineError } = await supabase
          .from("routines")
          .select("*")
          .eq("id", routineId)
          .single()

        if (routineError) throw routineError
        setRoutine(routineData)

        if (routineData.user_id) {
          const { data: creatorData } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", routineData.user_id)
            .single()
          setCreator(creatorData)
        }

        const { data: exercisesData } = await supabase
          .from("routine_exercises")
          .select("id, order_index, sets, reps, rest_seconds, notes, exercise_id")
          .eq("routine_id", routineId)
          .order("order_index")

        if (exercisesData && exercisesData.length > 0) {
          const exerciseIds = exercisesData.map((e) => e.exercise_id)
          const { data: exerciseDetails } = await supabase
            .from("exercises")
            .select("id, name, muscle_group")
            .in("id", exerciseIds)

          const exerciseMap = new Map(exerciseDetails?.map((e) => [e.id, e]))
          setExercises(
            exercisesData.map((re) => ({
              ...re,
              exercise: exerciseMap.get(re.exercise_id) || { id: re.exercise_id, name: "Inconnu", muscle_group: null },
            })),
          )
        }
      } catch (error) {
        console.error("Error fetching routine:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoutine()
  }, [routineId, supabase, profileLoading, profile])

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette routine ?")) return

    setDeleting(true)
    try {
      const { error } = await supabase.from("routines").delete().eq("id", routineId)
      if (error) throw error
      toast.success("Routine supprimée")
      router.push("/dashboard/admin")
    } catch (error) {
      console.error("Error deleting routine:", error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getCreatorName = () => {
    if (!creator) return "Système"
    if (creator.first_name || creator.last_name) {
      return `${creator.first_name || ""} ${creator.last_name || ""}`.trim()
    }
    return creator.email || "Inconnu"
  }

  if (profileLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile || profile.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <ClipboardList className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Routine non trouvée</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{routine.name}</h1>
            <p className="text-muted-foreground">Détails de la routine</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Supprimer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Créé par</p>
                <p className="font-medium">{getCreatorName()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date de création</p>
                <p className="font-medium">{formatDate(routine.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Catégorie</p>
                <p className="font-medium">{routine.category || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                {routine.is_template ? (
                  <Badge variant="secondary">Template</Badge>
                ) : (
                  <Badge variant="outline">Personnel</Badge>
                )}
              </div>
            </div>
          </div>
          {routine.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p>{routine.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exercices ({exercises.length})</CardTitle>
          <CardDescription>Liste des exercices dans cette routine</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Exercice</TableHead>
                <TableHead>Groupe musculaire</TableHead>
                <TableHead>Séries</TableHead>
                <TableHead>Répétitions</TableHead>
                <TableHead>Repos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exercises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucun exercice dans cette routine
                  </TableCell>
                </TableRow>
              ) : (
                exercises.map((re, index) => (
                  <TableRow key={re.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{re.exercise.name}</TableCell>
                    <TableCell>{re.exercise.muscle_group || "—"}</TableCell>
                    <TableCell>{re.sets}</TableCell>
                    <TableCell>{re.reps || "—"}</TableCell>
                    <TableCell>{re.rest_seconds ? `${re.rest_seconds}s` : "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
