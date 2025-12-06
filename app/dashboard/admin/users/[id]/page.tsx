"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ArrowLeft, User, Dumbbell, ClipboardList, Users, Calendar, Mail } from "lucide-react"

interface UserProfile {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  display_name: string | null
  role: string | null
  created_at: string
}

interface UserRoutine {
  id: string
  name: string
  category: string | null
  created_at: string
}

interface UserExercise {
  id: string
  name: string
  category: string | null
  muscle_group: string | null
  created_at: string
}

interface UserWorkout {
  id: string
  started_at: string
  ended_at: string | null
  routine_name: string | null
}

interface UserGroup {
  id: string
  name: string
  coach_name: string | null
}

export default function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params)
  const router = useRouter()
  const { profile, loading: profileLoading } = useUser()
  const { t } = useLanguage()
  const supabase = createBrowserClient()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [routines, setRoutines] = useState<UserRoutine[]>([])
  const [exercises, setExercises] = useState<UserExercise[]>([])
  const [workouts, setWorkouts] = useState<UserWorkout[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [coachOf, setCoachOf] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserData = useCallback(async () => {
    try {
      setError(null)

      const { data: userData, error: userError } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (userError) {
        setError(`Erreur profil: ${userError.message}`)
        setLoading(false)
        return
      }

      if (!userData) {
        setError("Utilisateur non trouvé")
        setLoading(false)
        return
      }

      setUserProfile(userData)

      const [routinesRes, exercisesRes, workoutsRes, membershipRes] = await Promise.all([
        supabase
          .from("routines")
          .select("id, name, category, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("exercises")
          .select("id, name, category, muscle_group, created_at")
          .eq("user_id", userId)
          .eq("is_custom", true)
          .order("created_at", { ascending: false }),
        supabase
          .from("workout_logs")
          .select("id, started_at, ended_at, routine_id")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(20),
        supabase.from("group_members").select("group_id").eq("student_id", userId),
      ])

      setRoutines(routinesRes.data || [])
      setExercises(exercisesRes.data || [])

      if (workoutsRes.data && workoutsRes.data.length > 0) {
        const routineIds = [...new Set(workoutsRes.data.map((w) => w.routine_id).filter(Boolean))]
        if (routineIds.length > 0) {
          const { data: routineNames } = await supabase.from("routines").select("id, name").in("id", routineIds)
          const routineMap = new Map(routineNames?.map((r) => [r.id, r.name]))
          setWorkouts(
            workoutsRes.data.map((w) => ({
              ...w,
              routine_name: w.routine_id ? routineMap.get(w.routine_id) || null : null,
            })),
          )
        } else {
          setWorkouts(workoutsRes.data.map((w) => ({ ...w, routine_name: null })))
        }
      } else {
        setWorkouts([])
      }

      if (membershipRes.data && membershipRes.data.length > 0) {
        const groupIds = membershipRes.data.map((m) => m.group_id)
        const { data: groupsData } = await supabase.from("coach_groups").select("id, name, coach_id").in("id", groupIds)

        if (groupsData && groupsData.length > 0) {
          const coachIds = [...new Set(groupsData.map((g) => g.coach_id))]
          const { data: coachProfiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", coachIds)

          const coachMap = new Map(
            coachProfiles?.map((c) => [
              c.id,
              c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : c.email || "Inconnu",
            ]),
          )

          setGroups(
            groupsData.map((g) => ({
              id: g.id,
              name: g.name,
              coach_name: coachMap.get(g.coach_id) || null,
            })),
          )
        }
      } else {
        setGroups([])
      }

      if (userData?.role === "coach") {
        const { data: studentsData } = await supabase.from("coach_students").select("student_id").eq("coach_id", userId)

        if (studentsData && studentsData.length > 0) {
          const studentIds = studentsData.map((s) => s.student_id)
          const { data: studentProfiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email")
            .in("id", studentIds)

          setCoachOf(
            studentProfiles?.map((s) => ({
              id: s.id,
              name:
                s.first_name || s.last_name
                  ? `${s.first_name || ""} ${s.last_name || ""}`.trim()
                  : s.email || "Inconnu",
            })) || [],
          )
        }
      }
    } catch (err) {
      setError(`Erreur: ${err instanceof Error ? err.message : "Erreur inconnue"}`)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (!profileLoading && profile?.role === "admin") {
      setLoading(true)
      fetchUserData().finally(() => setLoading(false))
    }
  }, [fetchUserData, profileLoading, profile?.role])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getRoleBadge = (role: string | null) => {
    if (!role) return <Badge variant="secondary">Personnel</Badge>
    const labels: Record<string, string> = {
      admin: "Admin",
      coach: "Coach",
      student: "Élève",
    }
    const colors: Record<string, string> = {
      admin: "bg-red-500 hover:bg-red-600",
      coach: "bg-blue-500 hover:bg-blue-600",
      student: "bg-green-500 hover:bg-green-600",
    }
    return <Badge className={colors[role]}>{labels[role] || role}</Badge>
  }

  if (profileLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profileLoading && profile && profile.role !== "admin") {
    router.push("/dashboard")
    return null
  }

  if (!profileLoading && !profile) {
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

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <User className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <User className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Utilisateur non trouvé</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const userName =
    userProfile.first_name || userProfile.last_name
      ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
      : userProfile.display_name || userProfile.email || "Utilisateur"

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/admin")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{userName}</h1>
          <p className="text-muted-foreground">Profil utilisateur</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{userProfile.email || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Rôle</p>
                <div className="mt-1">{getRoleBadge(userProfile.role)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Inscrit le</p>
                <p className="font-medium">{formatDate(userProfile.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Entraînements</p>
                <p className="font-medium">{workouts.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routines créées</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routines.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercices créés</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
          </CardContent>
        </Card>
        {userProfile.role === "coach" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Élèves coachés</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coachOf.length}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="routines">
        <TabsList>
          <TabsTrigger value="routines">Routines ({routines.length})</TabsTrigger>
          <TabsTrigger value="exercises">Exercices ({exercises.length})</TabsTrigger>
          <TabsTrigger value="workouts">Entraînements ({workouts.length})</TabsTrigger>
          <TabsTrigger value="groups">Groupes ({groups.length})</TabsTrigger>
          {userProfile.role === "coach" && <TabsTrigger value="students">Élèves ({coachOf.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="routines" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Date de création</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Aucune routine créée
                    </TableCell>
                  </TableRow>
                ) : (
                  routines.map((routine) => (
                    <TableRow
                      key={routine.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/workouts/routines/${routine.id}/edit`)}
                    >
                      <TableCell className="font-medium">{routine.name}</TableCell>
                      <TableCell>{routine.category || "—"}</TableCell>
                      <TableCell>{formatDate(routine.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Groupe musculaire</TableHead>
                  <TableHead>Date de création</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exercises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Aucun exercice personnalisé créé
                    </TableCell>
                  </TableRow>
                ) : (
                  exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell>{exercise.category || "—"}</TableCell>
                      <TableCell>{exercise.muscle_group || "—"}</TableCell>
                      <TableCell>{formatDate(exercise.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Routine</TableHead>
                  <TableHead>Durée</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Aucun entraînement enregistré
                    </TableCell>
                  </TableRow>
                ) : (
                  workouts.map((workout) => {
                    const duration = workout.ended_at
                      ? Math.round(
                          (new Date(workout.ended_at).getTime() - new Date(workout.started_at).getTime()) / 60000,
                        )
                      : null
                    return (
                      <TableRow key={workout.id}>
                        <TableCell>{formatDateTime(workout.started_at)}</TableCell>
                        <TableCell>{workout.routine_name || "Entraînement libre"}</TableCell>
                        <TableCell>
                          {duration ? `${duration} min` : <Badge variant="outline">En cours</Badge>}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardDescription>Groupes auxquels cet utilisateur appartient en tant que membre</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du groupe</TableHead>
                  <TableHead>Coach</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      N'appartient à aucun groupe
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow
                      key={group.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/coach/groups?highlight=${group.id}`)}
                    >
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.coach_name || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {userProfile.role === "coach" && (
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardDescription>Élèves coachés par cet utilisateur</CardDescription>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coachOf.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center text-muted-foreground py-8">Aucun élève</TableCell>
                    </TableRow>
                  ) : (
                    coachOf.map((student) => (
                      <TableRow
                        key={student.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/dashboard/admin/users/${student.id}`)}
                      >
                        <TableCell className="font-medium">{student.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
