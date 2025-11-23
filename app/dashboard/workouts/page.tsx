import { createClient } from "@/lib/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, MoreHorizontal, Play } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteRoutineDialog } from "@/components/delete-routine-dialog"

export default async function WorkoutsPage() {
  const supabase = await createClient()

  // Fetch routines
  const { data: routines } = await supabase
    .from("routines")
    .select("*, routine_exercises(count)")
    .order("created_at", { ascending: false })

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
  )
}
