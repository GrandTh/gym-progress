"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, Users, Dumbbell, ClipboardList, Search, RefreshCw, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  display_name: string | null
  role: string | null
  created_at: string
}

interface Exercise {
  id: string
  name: string
  category: string | null
  muscle_group: string | null
  is_custom: boolean
  user_id: string | null
  created_at: string
  creator_email?: string | null
  creator_first_name?: string | null
  creator_last_name?: string | null
}

interface Routine {
  id: string
  name: string
  category: string | null
  user_id: string
  created_at: string
  creator_email?: string | null
  creator_first_name?: string | null
  creator_last_name?: string | null
}

interface Group {
  id: string
  name: string
  coach_id: string
  created_at: string
  coach_email?: string | null
  coach_first_name?: string | null
  coach_last_name?: string | null
  member_count: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useUser()
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [users, setUsers] = useState<User[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [exerciseFilter, setExerciseFilter] = useState<"all" | "custom" | "system">("all")

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "exercise" | "routine" | null
    id: string | null
    name: string
  }>({ open: false, type: null, id: null, name: "" })

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoaches: 0,
    totalStudents: 0,
    totalExercises: 0,
    customExercises: 0,
    totalRoutines: 0,
    totalGroups: 0,
  })

  const fetchData = useCallback(async () => {
    if (!profile || profile.role !== "admin") return

    try {
      const [usersRes, exercisesRes, routinesRes, groupsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("exercises").select("*").order("created_at", { ascending: false }),
        supabase.from("routines").select("*").order("created_at", { ascending: false }),
        supabase.from("coach_groups").select("*").order("created_at", { ascending: false }),
      ])

      const usersData = usersRes.data || []
      setUsers(usersData)

      const coaches = usersData.filter((u) => u.role === "coach").length
      const students = usersData.filter((u) => u.role === "student").length

      const exercisesWithCreators = (exercisesRes.data || []).map((exercise) => {
        const creator = exercise.user_id ? usersData.find((u) => u.id === exercise.user_id) : null
        return {
          ...exercise,
          creator_email: creator?.email,
          creator_first_name: creator?.first_name,
          creator_last_name: creator?.last_name,
        }
      })
      setExercises(exercisesWithCreators)

      const routinesWithCreators = (routinesRes.data || []).map((routine) => {
        const creator = routine.user_id ? usersData.find((u) => u.id === routine.user_id) : null
        return {
          ...routine,
          creator_email: creator?.email,
          creator_first_name: creator?.first_name,
          creator_last_name: creator?.last_name,
        }
      })
      setRoutines(routinesWithCreators)

      const groupsData = groupsRes.data || []
      if (groupsData.length > 0) {
        const groupIds = groupsData.map((g) => g.id)
        const { data: membersData } = await supabase.from("group_members").select("group_id").in("group_id", groupIds)

        const memberCounts = new Map<string, number>()
        membersData?.forEach((m) => {
          memberCounts.set(m.group_id, (memberCounts.get(m.group_id) || 0) + 1)
        })

        const groupsWithInfo = groupsData.map((group) => {
          const coach = usersData.find((u) => u.id === group.coach_id)
          return {
            ...group,
            coach_email: coach?.email,
            coach_first_name: coach?.first_name,
            coach_last_name: coach?.last_name,
            member_count: memberCounts.get(group.id) || 0,
          }
        })
        setGroups(groupsWithInfo)
      } else {
        setGroups([])
      }

      setStats({
        totalUsers: usersData.length,
        totalCoaches: coaches,
        totalStudents: students,
        totalExercises: exercisesRes.data?.length || 0,
        customExercises: (exercisesRes.data || []).filter((e) => e.is_custom).length,
        totalRoutines: routinesRes.data?.length || 0,
        totalGroups: groupsData.length,
      })
    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    }
  }, [profile, supabase, toast])

  useEffect(() => {
    if (profileLoading) return
    if (!profile || profile.role !== "admin") return

    setLoading(true)
    fetchData().finally(() => setLoading(false))
  }, [fetchData, profileLoading, profile])

  const handleRoleChange = async (userId: string, newRole: string | null) => {
    setUpdatingRole(userId)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole === "none" ? null : newRole })
        .eq("id", userId)

      if (error) throw error

      toast({ title: "Rôle mis à jour avec succès" })
      fetchData()
    } catch (error) {
      console.error("Error updating role:", error)
      toast({ title: "Erreur lors de la mise à jour du rôle", variant: "destructive" })
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleDeleteExercise = async () => {
    if (!deleteDialog.id) return

    try {
      const { error } = await supabase.from("exercises").delete().eq("id", deleteDialog.id)

      if (error) throw error

      toast({ title: "Exercice supprimé avec succès" })
      setDeleteDialog({ open: false, type: null, id: null, name: "" })
      fetchData()
    } catch (error) {
      console.error("Error deleting exercise:", error)
      toast({ title: "Erreur lors de la suppression", variant: "destructive" })
    }
  }

  const handleDeleteRoutine = async () => {
    if (!deleteDialog.id) return

    try {
      const { error } = await supabase.from("routines").delete().eq("id", deleteDialog.id)

      if (error) throw error

      toast({ title: "Routine supprimée avec succès" })
      setDeleteDialog({ open: false, type: null, id: null, name: "" })
      fetchData()
    } catch (error) {
      console.error("Error deleting routine:", error)
      toast({ title: "Erreur lors de la suppression", variant: "destructive" })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast({ title: "Données mises à jour" })
  }

  const filteredUsers = users.filter((user) => {
    const search = searchQuery.toLowerCase()
    return (
      user.email?.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search) ||
      user.display_name?.toLowerCase().includes(search)
    )
  })

  const filteredExercises = exercises.filter((exercise) => {
    if (exerciseFilter === "custom") return exercise.is_custom
    if (exerciseFilter === "system") return !exercise.is_custom
    return true
  })

  const formatCreator = (exercise: Exercise) => {
    if (!exercise.is_custom) return "Système"
    if (exercise.creator_first_name || exercise.creator_last_name) {
      return `${exercise.creator_first_name || ""} ${exercise.creator_last_name || ""}`.trim()
    }
    return exercise.creator_email || "Inconnu"
  }

  const formatRoutineCreator = (routine: Routine) => {
    if (routine.creator_first_name || routine.creator_last_name) {
      return `${routine.creator_first_name || ""} ${routine.creator_last_name || ""}`.trim()
    }
    return routine.creator_email || "Inconnu"
  }

  const formatGroupCoach = (group: Group) => {
    if (group.coach_first_name || group.coach_last_name) {
      return `${group.coach_first_name || ""} ${group.coach_last_name || ""}`.trim()
    }
    return group.coach_email || "Inconnu"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("adminDashboard")}</h1>
          <p className="text-muted-foreground">Gérez tous les utilisateurs, exercices, routines et groupes</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Rafraîchir
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coaches</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCoaches}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Élèves</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercices</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExercises}</div>
            <p className="text-xs text-muted-foreground">{stats.customExercises} personnalisés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Routines</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoutines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groupes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroups}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">{t("allUsers")}</TabsTrigger>
          <TabsTrigger value="exercises">{t("allExercises")}</TabsTrigger>
          <TabsTrigger value="routines">{t("allRoutines")}</TabsTrigger>
          <TabsTrigger value="groups">{t("groups")}</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>{t("manageRoles")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                  >
                    <TableCell>
                      {user.first_name || user.last_name
                        ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                        : user.display_name || "—"}
                    </TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={user.role || "none"}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                        disabled={updatingRole === user.id || user.id === profile.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Personnel</SelectItem>
                          <SelectItem value="student">Élève</SelectItem>
                          <SelectItem value="coach">Coach</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={exerciseFilter} onValueChange={(v) => setExerciseFilter(v as typeof exerciseFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les exercices</SelectItem>
                <SelectItem value="custom">Personnalisés uniquement</SelectItem>
                <SelectItem value="system">Système uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Groupe musculaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Aucun exercice trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExercises.map((exercise) => (
                    <TableRow
                      key={exercise.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/admin/exercises/${exercise.id}`)}
                    >
                      <TableCell className="font-medium">{exercise.name}</TableCell>
                      <TableCell>{exercise.category || "—"}</TableCell>
                      <TableCell>{exercise.muscle_group || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={exercise.is_custom ? "default" : "secondary"}>
                          {exercise.is_custom ? "Personnalisé" : "Système"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exercise.is_custom
                          ? `Créé par ${formatCreator(exercise)} le ${formatDate(exercise.created_at)}`
                          : "Système"}
                      </TableCell>
                      <TableCell>{formatDate(exercise.created_at)}</TableCell>
                      <TableCell>
                        {exercise.is_custom && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog({
                                open: true,
                                type: "exercise",
                                id: exercise.id,
                                name: exercise.name,
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="routines" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Aucune routine trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  routines.map((routine) => (
                    <TableRow
                      key={routine.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/dashboard/admin/routines/${routine.id}`)}
                    >
                      <TableCell className="font-medium">{routine.name}</TableCell>
                      <TableCell>{routine.category || "—"}</TableCell>
                      <TableCell>
                        Créé par {formatRoutineCreator(routine)} le {formatDate(routine.created_at)}
                      </TableCell>
                      <TableCell>{formatDate(routine.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteDialog({
                              open: true,
                              type: "routine",
                              id: routine.id,
                              name: routine.name,
                            })
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du groupe</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Membres</TableHead>
                  <TableHead>Date de création</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Aucun groupe trouvé
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
                      <TableCell>{formatGroupCoach(group)}</TableCell>
                      <TableCell>{group.member_count} membre(s)</TableCell>
                      <TableCell>{formatDate(group.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, type: null, id: null, name: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer "{deleteDialog.name}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteDialog.type === "exercise" ? handleDeleteExercise : handleDeleteRoutine}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
