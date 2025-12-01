"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, GripVertical, Search, LinkIcon, Unlink } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useToast } from "@/hooks/use-toast"

type Exercise = {
  id: string
  name: string
  category: string | null
  muscle_group: string | null
  equipment: string | null
}

type RoutineExercise = {
  exercise_id: string
  name: string
  target_sets: number
  target_reps: number
  target_weight: number
  rest_seconds: number
  notes: string
  superset_id?: number
  is_superset_start?: boolean
}

type RoutineFormProps = {
  exercises: Exercise[]
  editMode?: boolean
  routineId?: string
  initialData?: {
    name: string
    description: string
    category: string
  }
  initialExercises?: RoutineExercise[]
}

function SortableExerciseCard({
  ex,
  index,
  previousExercise,
  onRemove,
  onUpdate,
  onToggleSuperset,
}: {
  ex: RoutineExercise
  index: number
  previousExercise?: RoutineExercise
  onRemove: () => void
  onUpdate: (field: keyof RoutineExercise, value: string | number) => void
  onToggleSuperset: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ex.exercise_id + "-" + index,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {ex.superset_id && index > 0 && previousExercise?.superset_id === ex.superset_id && (
        <div className="absolute -top-6 left-8 w-0.5 h-6 bg-primary z-10" />
      )}

      <Card className={`${ex.superset_id ? "border-l-4 border-l-primary" : ""} ${isDragging ? "shadow-lg" : ""}`}>
        <CardHeader className="flex flex-row items-center gap-4 py-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <CardTitle className="text-base flex-1">{ex.name}</CardTitle>

          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={ex.superset_id ? "text-primary" : "text-muted-foreground"}
              onClick={onToggleSuperset}
              title={ex.superset_id ? "Dissocier" : "Combiner avec le précédent"}
            >
              {ex.superset_id ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4 pb-4">
          <div className="grid gap-2">
            <Label className="text-xs">Séries</Label>
            <Input
              type="number"
              value={ex.target_sets}
              onChange={(e) => onUpdate("target_sets", Number.parseInt(e.target.value))}
              min={1}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Répétitions</Label>
            <Input
              type="number"
              value={ex.target_reps}
              onChange={(e) => onUpdate("target_reps", Number.parseInt(e.target.value))}
              min={1}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Poids (kg)</Label>
            <Input
              type="number"
              value={ex.target_weight}
              onChange={(e) => onUpdate("target_weight", Number.parseFloat(e.target.value))}
              min={0}
              step={0.5}
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs">Repos (sec)</Label>
            <Input
              type="number"
              value={ex.rest_seconds}
              onChange={(e) => onUpdate("rest_seconds", Number.parseInt(e.target.value))}
              step={15}
              min={0}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function RoutineForm({
  exercises,
  editMode = false,
  routineId,
  initialData,
  initialExercises = [],
}: RoutineFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>(initialExercises)
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [nextSupersetId, setNextSupersetId] = useState(1)

  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex((item, idx) => item.exercise_id + "-" + idx === active.id)
        const newIndex = items.findIndex((item, idx) => item.exercise_id + "-" + idx === over.id)

        // Reset superset IDs when reordering to avoid broken links
        const newItems = arrayMove(items, oldIndex, newIndex).map((item) => ({
          ...item,
          superset_id: undefined,
        }))

        return newItems
      })
    }
  }

  const filteredExercises = exercises.filter((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([
      ...selectedExercises,
      {
        exercise_id: exercise.id,
        name: exercise.name,
        target_sets: 3,
        target_reps: 10,
        target_weight: 0,
        rest_seconds: 60,
        notes: "",
      },
    ])
    setIsDialogOpen(false)
    setSearchQuery("")
  }

  const removeExercise = (index: number) => {
    const newExercises = [...selectedExercises]
    newExercises.splice(index, 1)
    setSelectedExercises(newExercises)
  }

  const updateExercise = (index: number, field: keyof RoutineExercise, value: string | number) => {
    const newExercises = [...selectedExercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setSelectedExercises(newExercises)
  }

  const toggleSuperset = (index: number) => {
    if (index === 0) return

    const newExercises = [...selectedExercises]
    const current = newExercises[index]
    const previous = newExercises[index - 1]

    if (current.superset_id) {
      current.superset_id = undefined
      for (let i = index + 1; i < newExercises.length; i++) {
        if (newExercises[i].superset_id === current.superset_id) {
          newExercises[i].superset_id = undefined
        } else {
          break
        }
      }
    } else {
      let targetId = previous.superset_id
      if (!targetId) {
        targetId = nextSupersetId
        previous.superset_id = targetId
        setNextSupersetId((prev) => prev + 1)
      }
      current.superset_id = targetId
    }

    setSelectedExercises(newExercises)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (editMode && routineId) {
        // Update existing routine
        const { error: routineError } = await supabase
          .from("routines")
          .update({
            name,
            description,
            category,
          })
          .eq("id", routineId)

        if (routineError) throw routineError

        // Delete old exercises and re-insert
        await supabase.from("routine_exercises").delete().eq("routine_id", routineId)

        if (selectedExercises.length > 0) {
          const exercisesToInsert = selectedExercises.map((ex, index) => ({
            routine_id: routineId,
            exercise_id: ex.exercise_id,
            order_index: index,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            target_weight: ex.target_weight,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
            superset_id: ex.superset_id,
          }))

          const { error: exercisesError } = await supabase.from("routine_exercises").insert(exercisesToInsert)
          if (exercisesError) throw exercisesError
        }

        toast({ title: "Routine mise à jour avec succès" })
      } else {
        // Create new routine
        const { data: routine, error: routineError } = await supabase
          .from("routines")
          .insert({
            user_id: user.id,
            name,
            description,
            category,
          })
          .select()
          .single()

        if (routineError) throw routineError

        if (selectedExercises.length > 0) {
          const exercisesToInsert = selectedExercises.map((ex, index) => ({
            routine_id: routine.id,
            exercise_id: ex.exercise_id,
            order_index: index,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            target_weight: ex.target_weight,
            rest_seconds: ex.rest_seconds,
            notes: ex.notes,
            superset_id: ex.superset_id,
          }))

          const { error: exercisesError } = await supabase.from("routine_exercises").insert(exercisesToInsert)
          if (exercisesError) throw exercisesError
        }

        toast({ title: "Routine créée avec succès" })
      }

      window.location.href = "/dashboard/workouts"
    } catch (error) {
      console.error("Error saving routine:", error)
      toast({ title: "Erreur lors de la sauvegarde", variant: "destructive" })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Détails de la Routine</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom de la Routine</Label>
            <Input id="name" name="name" placeholder="ex: Push Day A" required defaultValue={initialData?.name || ""} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Catégorie</Label>
            <Select name="category" required defaultValue={initialData?.category || "push"}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull">Pull</SelectItem>
                <SelectItem value="legs">Legs</SelectItem>
                <SelectItem value="fullbody">Full Body</SelectItem>
                <SelectItem value="split">Split</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optionnel)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Notes sur cette routine..."
              defaultValue={initialData?.description || ""}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Exercices</h2>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Ajouter un Exercice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Sélectionner un Exercice</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher des exercices..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="h-[300px] overflow-y-auto border rounded-md">
                  {filteredExercises.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">Aucun exercice trouvé</div>
                  ) : (
                    <div className="divide-y">
                      {filteredExercises.map((exercise) => (
                        <button
                          key={exercise.id}
                          type="button"
                          className="w-full p-3 text-left hover:bg-muted flex items-center justify-between"
                          onClick={() => addExercise(exercise)}
                        >
                          <div>
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {exercise.muscle_group} • {exercise.equipment}
                            </div>
                          </div>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedExercises.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <p>Aucun exercice ajouté.</p>
              <p className="text-sm">Ajoutez des exercices pour créer votre routine.</p>
            </CardContent>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={selectedExercises.map((ex, idx) => ex.exercise_id + "-" + idx)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {selectedExercises.map((ex, index) => (
                  <SortableExerciseCard
                    key={ex.exercise_id + "-" + index}
                    ex={ex}
                    index={index}
                    previousExercise={selectedExercises[index - 1]}
                    onRemove={() => removeExercise(index)}
                    onUpdate={(field, value) => updateExercise(index, field, value)}
                    onToggleSuperset={() => toggleSuperset(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (editMode ? "Mise à jour..." : "Création...") : editMode ? "Enregistrer" : "Créer la Routine"}
        </Button>
      </div>
    </form>
  )
}
