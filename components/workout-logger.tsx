"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Timer, Save, Plus, Trash2, ChevronDown, ChevronUp, LinkIcon } from "lucide-react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"

type WorkoutSet = {
  id?: string
  set_number: number
  reps: number
  weight: number
  completed: boolean
}

type WorkoutExercise = {
  exercise_id: string
  name: string
  sets: WorkoutSet[]
  notes: string
  superset_id?: number
}

export function WorkoutLogger({ routine }: { routine: any }) {
  const [duration, setDuration] = useState(0)
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [timerActive, setTimerActive] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState<number | null>(0) // Index of expanded exercise
  const { t } = useLanguage()

  const router = useRouter()
  const supabase = createClient()

  // Initialize workout state from routine
  useEffect(() => {
    if (routine && routine.routine_exercises) {
      const initialExercises = routine.routine_exercises.map((re: any) => ({
        exercise_id: re.exercise_id,
        name: re.exercises.name,
        sets: Array.from({ length: re.target_sets || 3 }).map((_, i) => ({
          set_number: i + 1,
          reps: re.target_reps || 0,
          weight: re.target_weight || 0,
          completed: false,
        })),
        notes: re.notes || "",
        superset_id: re.superset_id,
      }))
      setExercises(initialExercises)
    }
  }, [routine])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerActive) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerActive])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets[setIndex].completed = !newExercises[exerciseIndex].sets[setIndex].completed
    setExercises(newExercises)
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: "reps" | "weight", value: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets[setIndex] = {
      ...newExercises[exerciseIndex].sets[setIndex],
      [field]: value,
    }
    setExercises(newExercises)
  }

  const updateNotes = (exerciseIndex: number, value: string) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].notes = value
    setExercises(newExercises)
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises]
    const currentSets = newExercises[exerciseIndex].sets
    const lastSet = currentSets[currentSets.length - 1]

    newExercises[exerciseIndex].sets.push({
      set_number: currentSets.length + 1,
      reps: lastSet ? lastSet.reps : 0,
      weight: lastSet ? lastSet.weight : 0,
      completed: false,
    })
    setExercises(newExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets.splice(setIndex, 1)
    // Renumber sets
    newExercises[exerciseIndex].sets.forEach((set, i) => {
      set.set_number = i + 1
    })
    setExercises(newExercises)
  }

  const finishWorkout = async () => {
    setLoading(true)
    setTimerActive(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Create Workout Log
      const { data: workoutLog, error: logError } = await supabase
        .from("workout_logs")
        .insert({
          user_id: user.id,
          routine_id: routine.id,
          name: routine.name,
          started_at: new Date(Date.now() - duration * 1000).toISOString(),
          completed_at: new Date().toISOString(),
          duration_minutes: Math.ceil(duration / 60),
        })
        .select()
        .single()

      if (logError) throw logError

      // 2. Insert Exercises and Sets
      for (const [index, exercise] of exercises.entries()) {
        // Create Workout Exercise
        const { data: workoutExercise, error: exerciseError } = await supabase
          .from("workout_exercises")
          .insert({
            workout_log_id: workoutLog.id,
            exercise_id: exercise.exercise_id,
            order_index: index,
            notes: exercise.notes,
            superset_id: exercise.superset_id,
          })
          .select()
          .single()

        if (exerciseError) throw exerciseError

        // Create Sets
        const setsToInsert = exercise.sets
          .filter((set) => set.completed) // Only save completed sets
          .map((set) => ({
            workout_exercise_id: workoutExercise.id,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
            completed: true,
          }))

        if (setsToInsert.length > 0) {
          const { error: setsError } = await supabase.from("workout_sets").insert(setsToInsert)

          if (setsError) throw setsError
        }
      }

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error saving workout:", error)
      setTimerActive(true) // Resume timer if error
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Timer Header */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 mb-6 flex items-center justify-between bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <span className="font-mono text-xl font-bold">{formatTime(duration)}</span>
        </div>
        <Button onClick={finishWorkout} disabled={loading} className="gap-2">
          <Save className="h-4 w-4" />
          {t("save")}
        </Button>
      </div>

      <div className="space-y-4">
        {exercises.map((exercise, exerciseIndex) => (
          <div key={exerciseIndex} className="relative">
            {/* Superset Connector */}
            {exercise.superset_id &&
              exerciseIndex > 0 &&
              exercises[exerciseIndex - 1].superset_id === exercise.superset_id && (
                <div className="absolute -top-4 left-6 w-0.5 h-4 bg-primary z-10" />
              )}

            <Card
              className={cn(
                "transition-all",
                expandedExercise === exerciseIndex ? "ring-2 ring-primary/20" : "",
                exercise.superset_id ? "border-l-4 border-l-primary" : "",
              )}
            >
              <CardHeader
                className="cursor-pointer flex flex-row items-center justify-between space-y-0 py-4"
                onClick={() => setExpandedExercise(expandedExercise === exerciseIndex ? null : exerciseIndex)}
              >
                <div className="flex items-center gap-2">
                  {exercise.superset_id && <LinkIcon className="h-4 w-4 text-primary" />}
                  <CardTitle className="text-lg">{exercise.name}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {expandedExercise === exerciseIndex ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CardHeader>

              {expandedExercise === exerciseIndex && (
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor={`notes-${exerciseIndex}`} className="text-xs text-muted-foreground">
                        {t("notes")}
                      </Label>
                      <Textarea
                        id={`notes-${exerciseIndex}`}
                        placeholder="Add notes about this exercise..."
                        value={exercise.notes}
                        onChange={(e) => updateNotes(exerciseIndex, e.target.value)}
                        className="h-20 resize-none text-sm"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[30px_1fr_1fr_40px] gap-4 text-xs font-medium text-muted-foreground uppercase text-center mb-2">
                        <span>{t("sets")}</span>
                        <span>{t("weight")}</span>
                        <span>{t("reps")}</span>
                        <span>Done</span>
                      </div>

                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className={cn(
                            "grid grid-cols-[30px_1fr_1fr_40px] gap-4 items-center",
                            set.completed ? "opacity-50" : "",
                          )}
                        >
                          <div className="flex items-center justify-center font-bold text-muted-foreground">
                            {set.set_number}
                          </div>
                          <Input
                            type="number"
                            value={set.weight}
                            onChange={(e) =>
                              updateSet(exerciseIndex, setIndex, "weight", Number.parseFloat(e.target.value))
                            }
                            className="text-center h-9"
                          />
                          <Input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              updateSet(exerciseIndex, setIndex, "reps", Number.parseFloat(e.target.value))
                            }
                            className="text-center h-9"
                          />
                          <div className="flex justify-center">
                            <Checkbox
                              checked={set.completed}
                              onCheckedChange={() => toggleSetComplete(exerciseIndex, setIndex)}
                              className="h-6 w-6"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 bg-transparent"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          <Plus className="h-4 w-4" />
                          Add Set
                        </Button>
                        {exercise.sets.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-10 px-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeSet(exerciseIndex, exercise.sets.length - 1)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
