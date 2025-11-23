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
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

type Exercise = {
  id: string
  name: string
  category: string | null
  muscle_group: string | null
  equipment: string | null
}

type RoutineExercise = {
  exercise_id: string
  name: string // helper for UI
  target_sets: number
  target_reps: number
  target_weight: number
  rest_seconds: number
  notes: string
  superset_id?: number
  is_superset_start?: boolean
}

export function RoutineForm({ exercises }: { exercises: Exercise[] }) {
  const [loading, setLoading] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [nextSupersetId, setNextSupersetId] = useState(1)

  const router = useRouter()
  const supabase = createClient()

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
    if (index === 0) return // Can't link the first exercise to "previous"

    const newExercises = [...selectedExercises]
    const current = newExercises[index]
    const previous = newExercises[index - 1]

    if (current.superset_id) {
      // Ungroup
      current.superset_id = undefined
      // Also ungroup any that were linked to this one if it was a chain
      for (let i = index + 1; i < newExercises.length; i++) {
        if (newExercises[i].superset_id === current.superset_id) {
          newExercises[i].superset_id = undefined
        } else {
          break
        }
      }
    } else {
      // Group with previous
      let targetId = previous.superset_id
      if (!targetId) {
        // Create new group for previous if it didn't have one
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

      // 1. Create Routine
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

      // 2. Add Exercises
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

      router.push("/dashboard/workouts")
      router.refresh()
    } catch (error) {
      console.error("Error creating routine:", error)
      // Ideally show toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-10">
      <Card>
        <CardHeader>
          <CardTitle>Routine Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Routine Name</Label>
            <Input id="name" name="name" placeholder="e.g. Push Day A" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" required defaultValue="push">
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull">Pull</SelectItem>
                <SelectItem value="legs">Legs</SelectItem>
                <SelectItem value="fullbody">Full Body</SelectItem>
                <SelectItem value="split">Split</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" name="description" placeholder="Notes about this routine..." />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Exercises</h2>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Select Exercise</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search exercises..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="h-[300px] overflow-y-auto border rounded-md">
                  {filteredExercises.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No exercises found</div>
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
              <p>No exercises added yet.</p>
              <p className="text-sm">Add exercises to build your routine.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {selectedExercises.map((ex, index) => (
              <div key={index} className="relative">
                {ex.superset_id && index > 0 && selectedExercises[index - 1].superset_id === ex.superset_id && (
                  <div className="absolute -top-6 left-8 w-0.5 h-6 bg-primary z-10" />
                )}

                <Card key={index} className={ex.superset_id ? "border-l-4 border-l-primary" : ""}>
                  <CardHeader className="flex flex-row items-center gap-4 py-3">
                    <div className="cursor-move text-muted-foreground">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base flex-1">{ex.name}</CardTitle>

                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={ex.superset_id ? "text-primary" : "text-muted-foreground"}
                        onClick={() => toggleSuperset(index)}
                        title={ex.superset_id ? "Ungroup" : "Combine with previous"}
                      >
                        {ex.superset_id ? <Unlink className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeExercise(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-4 pb-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Sets</Label>
                      <Input
                        type="number"
                        value={ex.target_sets}
                        onChange={(e) => updateExercise(index, "target_sets", Number.parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Reps</Label>
                      <Input
                        type="number"
                        value={ex.target_reps}
                        onChange={(e) => updateExercise(index, "target_reps", Number.parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={ex.target_weight}
                        onChange={(e) => updateExercise(index, "target_weight", Number.parseFloat(e.target.value))}
                        min={0}
                        step={0.5}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Rest (sec)</Label>
                      <Input
                        type="number"
                        value={ex.rest_seconds}
                        onChange={(e) => updateExercise(index, "rest_seconds", Number.parseInt(e.target.value))}
                        step={15}
                        min={0}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Routine"}
        </Button>
      </div>
    </form>
  )
}
