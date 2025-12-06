"use client"

import { useState, useEffect, use } from "react"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Users, UserPlus, ClipboardList, Trash2, Dumbbell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface GroupMember {
  id: string
  student_id: string
  profile: {
    first_name: string | null
    last_name: string | null
    email: string | null
  }
}

interface AssignedRoutine {
  id: string
  notes: string | null
  created_at: string
  routine: {
    id: string
    name: string
    category: string | null
    description: string | null
  }
}

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  coach_id: string
}

interface Routine {
  id: string
  name: string
  category: string | null
}

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useUser()
  const { t } = useLanguage()
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createBrowserClient()

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [assignedRoutines, setAssignedRoutines] = useState<AssignedRoutine[]>([])
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [assignRoutineDialogOpen, setAssignRoutineDialogOpen] = useState(false)

  // Form states
  const [memberEmail, setMemberEmail] = useState("")
  const [selectedRoutineId, setSelectedRoutineId] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    if (!profile) return
    setLoading(true)

    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from("coach_groups")
        .select("*")
        .eq("id", id)
        .single()

      if (groupError || !groupData) {
        toast({ title: "Groupe non trouvé", variant: "destructive" })
        router.push("/dashboard/coach/groups")
        return
      }

      setGroup(groupData)

      // Fetch group members with profiles
      const { data: membersData } = await supabase
        .from("group_members")
        .select(`
          id,
          student_id,
          profile:profiles!group_members_student_profile_fk(first_name, last_name, email)
        `)
        .eq("group_id", id)

      setMembers(membersData || [])

      // Fetch routines assigned to this group
      const { data: assignmentsData } = await supabase
        .from("routine_assignments")
        .select(`
          id,
          notes,
          created_at,
          routine:routines(id, name, category, description)
        `)
        .eq("group_id", id)
        .order("created_at", { ascending: false })

      setAssignedRoutines(assignmentsData || [])

      // Fetch coach's available routines
      const { data: routinesData } = await supabase
        .from("routines")
        .select("id, name, category")
        .eq("user_id", profile.id)

      setAvailableRoutines(routinesData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile, id])

  const handleAddMemberByEmail = async () => {
    if (!memberEmail.trim()) {
      toast({ title: "Veuillez entrer un email", variant: "destructive" })
      return
    }
    setSaving(true)

    try {
      // Find the user by email
      const { data: userProfile, error: findError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("email", memberEmail.trim().toLowerCase())
        .single()

      if (findError || !userProfile) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun compte n'existe avec cet email.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Check if already a member
      const existingMember = members.find((m) => m.student_id === userProfile.id)
      if (existingMember) {
        toast({
          title: "Déjà membre",
          description: "Cet utilisateur est déjà dans ce groupe.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Check if already a student of this coach, if not add them
      const { data: existingRelation } = await supabase
        .from("coach_students")
        .select("id")
        .eq("coach_id", profile!.id)
        .eq("student_id", userProfile.id)
        .single()

      if (!existingRelation) {
        await supabase.from("coach_students").insert({
          coach_id: profile!.id,
          student_id: userProfile.id,
        })

        // Update role to student if needed
        const { data: targetProfile } = await supabase.from("profiles").select("role").eq("id", userProfile.id).single()
        if (targetProfile && !targetProfile.role) {
          await supabase.from("profiles").update({ role: "student" }).eq("id", userProfile.id)
        }
      }

      // Add to group
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: id,
        student_id: userProfile.id,
      })

      if (memberError) {
        toast({ title: "Erreur", description: memberError.message, variant: "destructive" })
        setSaving(false)
        return
      }

      toast({ title: "Membre ajouté au groupe" })
      setMemberEmail("")
      setAddMemberDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error adding member:", error)
      toast({ title: "Erreur lors de l'ajout du membre", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (studentId: string) => {
    try {
      const { error } = await supabase.from("group_members").delete().eq("group_id", id).eq("student_id", studentId)

      if (error) throw error

      toast({ title: "Membre retiré du groupe" })
      fetchData()
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleAssignRoutine = async () => {
    if (!profile || !selectedRoutineId) return
    setSaving(true)

    try {
      // Check if already assigned
      const alreadyAssigned = assignedRoutines.some((ar) => ar.routine.id === selectedRoutineId)
      if (alreadyAssigned) {
        toast({ title: "Cette routine est déjà assignée à ce groupe", variant: "destructive" })
        setSaving(false)
        return
      }

      const { error } = await supabase.from("routine_assignments").insert({
        routine_id: selectedRoutineId,
        assigned_by: profile.id,
        group_id: id,
      })

      if (error) throw error

      toast({ title: "Routine assignée au groupe" })
      setSelectedRoutineId("")
      setAssignRoutineDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error assigning routine:", error)
      toast({ title: "Erreur lors de l'assignation", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveRoutineAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase.from("routine_assignments").delete().eq("id", assignmentId)

      if (error) throw error

      toast({ title: "Routine retirée du groupe" })
      fetchData()
    } catch (error) {
      console.error("Error removing routine:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!group) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/coach/groups">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
          {group.description && <p className="text-muted-foreground">{group.description}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Members Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Membres</CardTitle>
                <Badge variant="secondary">{members.length}</Badge>
              </div>
              <Button size="sm" onClick={() => setAddMemberDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
            <CardDescription>Liste des élèves dans ce groupe</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucun membre dans ce groupe</p>
                <Button variant="link" onClick={() => setAddMemberDialogOpen(true)}>
                  Ajouter un membre
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">
                        {member.profile?.first_name || member.profile?.last_name
                          ? `${member.profile?.first_name || ""} ${member.profile?.last_name || ""}`.trim()
                          : "Nom non défini"}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.profile?.email || "Email inconnu"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveMember(member.student_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Routines Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                <CardTitle>Routines assignées</CardTitle>
                <Badge variant="secondary">{assignedRoutines.length}</Badge>
              </div>
              <Button size="sm" onClick={() => setAssignRoutineDialogOpen(true)}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Assigner
              </Button>
            </div>
            <CardDescription>Routines accessibles à tous les membres du groupe</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedRoutines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Dumbbell className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucune routine assignée</p>
                <Button variant="link" onClick={() => setAssignRoutineDialogOpen(true)}>
                  Assigner une routine
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedRoutines.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{assignment.routine.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {assignment.routine.category && (
                          <Badge variant="outline" className="text-xs">
                            {assignment.routine.category}
                          </Badge>
                        )}
                        {assignment.routine.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{assignment.routine.description}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemoveRoutineAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Entrez l'email de l'utilisateur à ajouter. Il doit avoir un compte existant.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="memberEmail">Email de l'utilisateur</Label>
              <Input
                id="memberEmail"
                type="email"
                placeholder="exemple@email.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAddMemberByEmail} disabled={saving || !memberEmail.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Routine Dialog */}
      <Dialog open={assignRoutineDialogOpen} onOpenChange={setAssignRoutineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assigner une routine</DialogTitle>
            <DialogDescription>Sélectionnez une routine à assigner à tous les membres de ce groupe.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une routine" />
              </SelectTrigger>
              <SelectContent>
                {availableRoutines.map((routine) => (
                  <SelectItem key={routine.id} value={routine.id}>
                    {routine.name} {routine.category && `(${routine.category})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignRoutineDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={handleAssignRoutine} disabled={saving || !selectedRoutineId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
