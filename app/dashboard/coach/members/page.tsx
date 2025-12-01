"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus, Users, Mail, Calendar, Dumbbell, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Student {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  display_name: string | null
  created_at: string
  workouts_count?: number
  last_workout?: string | null
}

export default function CoachMembersPage() {
  const { profile, loading: profileLoading } = useUser()
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [adding, setAdding] = useState(false)

  const fetchStudents = async () => {
    if (!profile) return
    setLoading(true)

    try {
      // Get coach-student relationships
      const { data: relationships, error: relError } = await supabase
        .from("coach_students")
        .select("student_id")
        .eq("coach_id", profile.id)

      if (relError) throw relError

      if (!relationships || relationships.length === 0) {
        setStudents([])
        setLoading(false)
        return
      }

      const studentIds = relationships.map((r) => r.student_id)

      // Get student profiles
      const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").in("id", studentIds)

      if (profilesError) throw profilesError

      // Get workout counts for each student
      const studentsWithStats = await Promise.all(
        (profiles || []).map(async (student) => {
          const { count } = await supabase
            .from("workout_logs")
            .select("*", { count: "exact", head: true })
            .eq("user_id", student.id)

          const { data: lastWorkout } = await supabase
            .from("workout_logs")
            .select("completed_at")
            .eq("user_id", student.id)
            .order("completed_at", { ascending: false })
            .limit(1)
            .single()

          return {
            ...student,
            workouts_count: count || 0,
            last_workout: lastWorkout?.completed_at || null,
          }
        }),
      )

      setStudents(studentsWithStats)
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchStudents()
    }
  }, [profile])

  const handleAddStudent = async () => {
    if (!profile || !email.trim()) return
    setAdding(true)

    try {
      // Find user by email in profiles
      const { data: targetProfile, error: findError } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("email", email.trim().toLowerCase())
        .single()

      if (findError || !targetProfile) {
        toast({
          title: t("userNotFound"),
          description: "No user found with this email. They need to create an account first.",
          variant: "destructive",
        })
        setAdding(false)
        return
      }

      // Check if already a student
      const { data: existing } = await supabase
        .from("coach_students")
        .select("id")
        .eq("coach_id", profile.id)
        .eq("student_id", targetProfile.id)
        .single()

      if (existing) {
        toast({
          title: "Already added",
          description: "This user is already in your members list.",
          variant: "destructive",
        })
        setAdding(false)
        return
      }

      // Add the relationship
      const { error: insertError } = await supabase.from("coach_students").insert({
        coach_id: profile.id,
        student_id: targetProfile.id,
      })

      if (insertError) throw insertError

      // Update the student's role to "student" if they don't have one
      await supabase.from("profiles").update({ role: "student" }).eq("id", targetProfile.id).is("role", null)

      toast({
        title: t("userAdded"),
        description: "The member has been added to your list.",
      })

      setEmail("")
      setAddDialogOpen(false)
      fetchStudents()
    } catch (error) {
      console.error("Error adding student:", error)
      toast({
        title: "Error",
        description: "Failed to add member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!profile) return

    try {
      const { error } = await supabase
        .from("coach_students")
        .delete()
        .eq("coach_id", profile.id)
        .eq("student_id", studentId)

      if (error) throw error

      toast({
        title: "Member removed",
        description: "The member has been removed from your list.",
      })

      fetchStudents()
    } catch (error) {
      console.error("Error removing student:", error)
    }
  }

  if (profileLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (profile?.role !== "coach" && profile?.role !== "admin") {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">You need to be a coach to access this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("members")}</h1>
          <p className="text-muted-foreground">{t("myStudents")}</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("addMember")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addMember")}</DialogTitle>
              <DialogDescription>
                Enter the email address of the person you want to add. They must have an existing account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("enterEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleAddStudent} disabled={adding || !email.trim()}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("addMember")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noMembers")}</p>
            <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t("addMember")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <Card key={student.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {student.first_name || student.last_name
                        ? `${student.first_name || ""} ${student.last_name || ""}`.trim()
                        : student.display_name || "Unnamed User"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      {student.email || "No email"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleRemoveStudent(student.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    {t("workoutsCompleted")}
                  </span>
                  <Badge variant="secondary">{student.workouts_count}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("lastActive")}
                  </span>
                  <span className="text-xs">
                    {student.last_workout ? new Date(student.last_workout).toLocaleDateString() : "Never"}
                  </span>
                </div>
                <Link href={`/dashboard/coach/members/${student.id}`}>
                  <Button variant="outline" className="w-full mt-2 bg-transparent">
                    {t("viewProgress")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
