"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Dumbbell, User, Calendar, Info, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Exercise {
  id: string
  name: string
  description: string | null
  category: string | null
  muscle_group: string | null
  equipment: string | null
  tips: string | null
  is_custom: boolean
  user_id: string | null
  created_at: string
}

interface Creator {
  first_name: string | null
  last_name: string | null
  email: string | null
}

export default function AdminExerciseDetailPage() {
  const params = useParams()
  const exerciseId = params.id as string
  const router = useRouter()
  const { profile, loading: profileLoading } = useUser()
  const supabase = createBrowserClient()

  const [exercise, setExercise] = useState<Exercise | null>(null)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== "admin") return

    const fetchExercise = async () => {
      try {
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("exercises")
          .select("*")
          .eq("id", exerciseId)
          .single()

        if (exerciseError) throw exerciseError
        setExercise(exerciseData)

        if (exerciseData.user_id) {
          const { data: creatorData } = await supabase
            .from("profiles")
            .select("first_name, last_name, email")
            .eq("id", exerciseData.user_id)
            .single()
          setCreator(creatorData)
        }
      } catch (error) {
        console.error("Error fetching exercise:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExercise()
  }, [exerciseId, supabase, profileLoading, profile])

  const handleDelete = async () => {
    if (!exercise?.is_custom) {
      toast.error("Impossible de supprimer un exercice système")
      return
    }
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet exercice ?")) return

    setDeleting(true)
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", exerciseId)
      if (error) throw error
      toast.success("Exercice supprimé")
      router.push("/dashboard/admin")
    } catch (error) {
      console.error("Error deleting exercise:", error)
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

  if (!exercise) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Dumbbell className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Exercice non trouvé</p>
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
            <h1 className="text-3xl font-bold tracking-tight">{exercise.name}</h1>
            <p className="text-muted-foreground">Détails de l'exercice</p>
          </div>
        </div>
        {exercise.is_custom && (
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Supprimer
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
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
                <p className="font-medium">{formatDate(exercise.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Groupe musculaire</p>
                <p className="font-medium">{exercise.muscle_group || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                {exercise.is_custom ? <Badge>Personnalisé</Badge> : <Badge variant="secondary">Système</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Catégorie</p>
              <p className="font-medium">{exercise.category || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Équipement</p>
              <p className="font-medium">{exercise.equipment || "—"}</p>
            </div>
            {exercise.description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{exercise.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {exercise.tips && (
          <Card>
            <CardHeader>
              <CardTitle>Conseils</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{exercise.tips}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
