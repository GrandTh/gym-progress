import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, MoreHorizontal, Play, UserCheck } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteRoutineDialog } from "@/components/delete-routine-dialog"
import { Badge } from "@/components/ui/badge"

export default async function WorkoutsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single()
    profile = data
  }

  console.log("[v0] User ID:", user?.id)
  console.log("[v0] Profile role:", profile?.role)

  // Fetch user's own routines
  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(count)")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false })

  let assignedRoutines: any[] = []

  if (user && profile?.role === "student") {
    const { data: groupMemberships, error: gmError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("student_id", user.id)

    console.log("[v0] Group memberships:", groupMemberships)
    console.log("[v0] Group memberships error:", gmError)

    // Get directly assigned routines
    const { data: directAssignments, error: directError } = await supabase
      .from("routine_assignments")
      .select(`
        id,
        notes,
        routine:routines(*, routine_exercises(count)),
        assigned_by_profile:profiles!routine_assignments_assigned_by_fkey(first_name, last_name, email)
      `)
      .eq("student_id", user.id)

    console.log("[v0] Direct assignments:", directAssignments)
    console.log("[v0] Direct assignments error:", directError)

    if (groupMemberships && groupMemberships.length > 0) {
      const groupIds = groupMemberships.map((gm) => gm.group_id)
      console.log("[v0] Group IDs:", groupIds)

      const { data: groupAssignments, error: groupError } = await supabase
        .from("routine_assignments")
        .select(`
          id,
          notes,
          routine:routines(*, routine_exercises(count)),
          assigned_by_profile:profiles!routine_assignments_assigned_by_fkey(first_name, last_name, email)
        `)
        .in("group_id", groupIds)

      console.log("[v0] Group assignments:", groupAssignments)
      console.log("[v0] Group assignments error:", groupError)

      assignedRoutines = [...(directAssignments || []), ...(groupAssignments || [])]
    } else {
      assignedRoutines = directAssignments || []
    }

    console.log("[v0] Total assigned routines before filter:", assignedRoutines.length)

    // Filter out any null routines and deduplicate by routine id
    const seenRoutineIds = new Set<string>()
    assignedRoutines = assignedRoutines.filter((assignment) => {
      console.log("[v0] Assignment routine:", assignment.routine)
      if (!assignment.routine || seenRoutineIds.has(assignment.routine.id)) {
        return false
      }
      seenRoutineIds.add(assignment.routine.id)
      return true
    })

    console.log("[v0] Final assigned routines:", assignedRoutines.length)
  }

  const hasAssignedRoutines = assignedRoutines.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workouts</h1>
          <p className="text-muted-foreground">Manage your routines and start training</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/workouts/new">
            <Plus className="h-4 w-4" />
            Create Routine
          </Link>
        </Button>
      </div>

      {hasAssignedRoutines && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Assigned by Coach</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assignedRoutines.map((assignment) => (
              <Card key={assignment.id} className="flex flex-col border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="grid gap-1">
                      <CardTitle className="flex items-center gap-2">
                        {assignment.routine.name}
                        <Badge variant="secondary" className="text-xs">
                          Assigned
                        </Badge>
                      </CardTitle>
                      <CardDescription className="line-clamp-1">
                        {assignment.routine.description || "No description"}
                      </CardDescription>
                    </div>
                  </div>
                  {assignment.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">Coach note: {assignment.notes}</p>
                  )}
                </CardHeader>
                <CardContent className="mt-auto pt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="capitalize">{assignment.routine.category || "Uncategorized"}</span>
                    <span>{assignment.routine.routine_exercises[0]?.count || 0} exercises</span>
                  </div>
                  <Button className="w-full gap-2" asChild>
                    <Link href={`/dashboard/workouts/${assignment.routine.id}/start`}>
                      <Play className="h-4 w-4" />
                      Start Workout
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Personal Routines Section */}
      <div className="space-y-4">
        {hasAssignedRoutines && <h2 className="text-xl font-semibold">My Personal Routines</h2>}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* New Routine Card */}
          <Link href="/dashboard/workouts/new" className="group">
            <Card className="flex h-full flex-col items-center justify-center border-dashed bg-muted/50 transition-colors hover:bg-muted">
              <CardContent className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                <div className="rounded-full bg-background p-3 shadow-sm group-hover:shadow-md">
                  <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <h3 className="font-semibold">Create New Routine</h3>
              </CardContent>
            </Card>
          </Link>

          {routines?.map((routine) => (
            <Card key={routine.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="grid gap-1">
                  <CardTitle>{routine.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{routine.description || "No description"}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/workouts/${routine.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DeleteRoutineDialog routineId={routine.id} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span className="capitalize">{routine.category || "Uncategorized"}</span>
                  <span>{routine.routine_exercises[0]?.count || 0} exercises</span>
                </div>
                <Button className="w-full gap-2" asChild>
                  <Link href={`/dashboard/workouts/${routine.id}/start`}>
                    <Play className="h-4 w-4" />
                    Start Workout
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
