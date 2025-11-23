"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"

type Exercise = {
  id: string
  name: string
  category: string | null
  muscle_group: string | null
  equipment: string | null
  is_custom: boolean | null
}

export function ExerciseList({ exercises }: { exercises: Exercise[] }) {
  if (exercises.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed text-center">
        <p className="text-muted-foreground">No exercises found</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {exercises.map((exercise) => (
        <Card key={exercise.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-semibold">{exercise.name}</CardTitle>
            {exercise.is_custom && (
              <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                <User className="h-3 w-3" />
                <span className="sr-only">Custom</span>
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {exercise.muscle_group && (
                <Badge variant="outline" className="capitalize">
                  {exercise.muscle_group}
                </Badge>
              )}
              {exercise.category && (
                <Badge variant="outline" className="capitalize">
                  {exercise.category}
                </Badge>
              )}
              {exercise.equipment && (
                <Badge variant="outline" className="capitalize">
                  {exercise.equipment}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
