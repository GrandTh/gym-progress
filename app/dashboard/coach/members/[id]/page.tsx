"use client"

import { useState, useEffect, use } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Dumbbell, Calendar, ClipboardList } from "lucide-react"
import Link from "next/link"

interface StudentProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  display_name: string | null
}

interface WorkoutLog {
  id: string
  name: string
  started_at: string
  completed_at: string | null
  duration_minutes: number | null
}

interface AssignedRoutine {
  id: string
  routine: {
    id: string
    name: string
    description: string | null
    category: string | null
  }
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = use(params)
  const { profile } = useUser()
  const { t } = useLanguage()
  const supabase = createBrowserClient()

  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [assignedRoutines, setAssignedRoutines] = useState<AssignedRoutine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!profile) return

      try {
        // Get student profile
        const { data: studentProfile } = await supabase.from("profiles").select("*").eq("id", studentId).single()

        setStudent(studentProfile)

        // Get workout history
        const { data: workoutLogs } = await supabase
          .from("workout_logs")
          .select("id, name, started_at, completed_at, duration_minutes")
          .eq("user_id", studentId)
          .order("started_at", { ascending: false })
          .limit(20)

        setWorkouts(workoutLogs || [])

        // Get assigned routines
        const { data: assignments } = await supabase
          .from("routine_assignments")
          .select(`
            id,
            routine:routines(id, name, description, category)
          `)
          .eq("student_id", studentId)
          .eq("assigned_by", profile.id)

        setAssignedRoutines(assignments || [])
      } catch (error) {
        console.error("Error fetching student data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [profile, studentId])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Student not found</p>
        <Link href="/dashboard/coach/members">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Members
          </Button>
        </Link>
      </div>
    )
  }

  const studentName =
    student.first_name || student.last_name
      ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
      : student.display_name || "Unnamed User"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coach/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{studentName}</h1>
          <p className="text-muted-foreground">{student.email}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workouts</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Routines</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedRoutines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Workout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workouts[0] ? new Date(workouts[0].started_at).toLocaleDateString() : "Never"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Workout History</TabsTrigger>
          <TabsTrigger value="routines">Assigned Routines</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          {workouts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No workouts recorded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workout.started_at).toLocaleDateString()} at{" "}
                        {new Date(workout.started_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {workout.duration_minutes && <Badge variant="secondary">{workout.duration_minutes} min</Badge>}
                      {workout.completed_at && <Badge className="bg-green-500">Completed</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="routines" className="space-y-4">
          {assignedRoutines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No routines assigned yet</p>
                <Link href="/dashboard/coach/groups">
                  <Button className="mt-4">Assign a Routine</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignedRoutines.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.routine.name}</CardTitle>
                      {assignment.routine.category && <Badge variant="outline">{assignment.routine.category}</Badge>}
                    </div>
                    {assignment.routine.description && (
                      <CardDescription>{assignment.routine.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
