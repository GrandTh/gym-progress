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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Users, Trash2, UserPlus, ClipboardList, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  members: {
    id: string
    student_id: string
    profile: { first_name: string | null; last_name: string | null; email: string | null }
  }[]
}

interface Routine {
  id: string
  name: string
  category: string | null
}

export default function CoachGroupsPage() {
  const { profile } = useUser()
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [groups, setGroups] = useState<Group[]>([])
  const [routines, setRoutines] = useState<Routine[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [assignRoutineDialogOpen, setAssignRoutineDialogOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // Form states
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [memberEmail, setMemberEmail] = useState("")
  const [selectedRoutineId, setSelectedRoutineId] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    if (!profile) return
    setLoading(true)

    try {
      // Fetch groups with members
      const { data: groupsData } = await supabase
        .from("coach_groups")
        .select(`
          *,
          members:group_members(
            id,
            student_id,
            profile:profiles!group_members_student_profile_fk(first_name, last_name, email)
          )
        `)
        .eq("coach_id", profile.id)
        .order("created_at", { ascending: false })

      setGroups(groupsData || [])

      // Fetch coach's routines
      const { data: routinesData } = await supabase
        .from("routines")
        .select("id, name, category")
        .eq("user_id", profile.id)

      setRoutines(routinesData || [])
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
  }, [profile])

  const handleCreateGroup = async () => {
    if (!profile) {
      toast({ title: "Erreur: Profil non trouvé", variant: "destructive" })
      return
    }
    if (!groupName.trim()) {
      toast({ title: "Veuillez entrer un nom de groupe", variant: "destructive" })
      return
    }

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from("coach_groups")
        .insert({
          coach_id: profile.id,
          name: groupName.trim(),
          description: groupDescription.trim() || null,
        })
        .select()

      if (error) {
        toast({
          title: "Erreur lors de la création du groupe",
          description: error.message,
          variant: "destructive",
        })
        return
      }

      toast({ title: "Groupe créé avec succès" })
      setGroupName("")
      setGroupDescription("")
      setCreateDialogOpen(false)
      fetchData()
    } catch (error) {
      console.error("Error creating group:", error)
      toast({ title: "Erreur lors de la création du groupe", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const { error } = await supabase.from("coach_groups").delete().eq("id", groupId)

      if (error) throw error

      toast({ title: "Groupe supprimé avec succès" })
      fetchData()
    } catch (error) {
      console.error("Error deleting group:", error)
    }
  }

  const handleAddMemberByEmail = async () => {
    if (!selectedGroup || !memberEmail.trim()) {
      toast({ title: "Veuillez entrer un email", variant: "destructive" })
      return
    }
    setSaving(true)

    try {
      // First, find the user by email
      const { data: userProfile, error: findError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("email", memberEmail.trim().toLowerCase())
        .single()

      if (findError || !userProfile) {
        toast({
          title: "Utilisateur non trouvé",
          description: "Aucun compte n'existe avec cet email. L'utilisateur doit d'abord créer un compte.",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Check if already a member
      const existingMember = selectedGroup.members.find((m) => m.student_id === userProfile.id)
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
        // Add as student first
        const { error: studentError } = await supabase.from("coach_students").insert({
          coach_id: profile!.id,
          student_id: userProfile.id,
        })

        if (studentError) {
          toast({
            title: "Erreur",
            description: "Impossible d'ajouter cet utilisateur comme élève.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        // Update the user's role to student if they don't have one
        const { data: targetProfile } = await supabase.from("profiles").select("role").eq("id", userProfile.id).single()

        if (targetProfile && !targetProfile.role) {
          await supabase.from("profiles").update({ role: "student" }).eq("id", userProfile.id)
        }
      }

      // Add to group
      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: selectedGroup.id,
        student_id: userProfile.id,
      })

      if (memberError) {
        toast({
          title: "Erreur",
          description: memberError.message,
          variant: "destructive",
        })
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

  const handleRemoveMemberFromGroup = async (groupId: string, studentId: string) => {
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("student_id", studentId)

      if (error) throw error

      toast({ title: "Membre retiré du groupe" })
      fetchData()
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const handleAssignRoutineToGroup = async () => {
    if (!profile || !selectedGroup || !selectedRoutineId) return
    setSaving(true)

    try {
      const { error } = await supabase.from("routine_assignments").insert({
        routine_id: selectedRoutineId,
        assigned_by: profile.id,
        group_id: selectedGroup.id,
      })

      if (error) throw error

      toast({ title: "Routine assignée au groupe" })
      setSelectedRoutineId("")
      setAssignRoutineDialogOpen(false)
    } catch (error) {
      console.error("Error assigning routine:", error)
      toast({ title: "Erreur lors de l'assignation", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
        <p className="text-muted-foreground">Vous devez être coach pour accéder à cette page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("groups")}</h1>
          <p className="text-muted-foreground">Organisez vos élèves en groupes</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("createGroup")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("createGroup")}</DialogTitle>
              <DialogDescription>Créez un nouveau groupe pour organiser vos élèves.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">{t("groupName")}</Label>
                <Input
                  id="groupName"
                  placeholder="ex: Groupe du matin"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupDescription">{t("groupDescription")}</Label>
                <Textarea
                  id="groupDescription"
                  placeholder="Description optionnelle..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={handleCreateGroup} disabled={saving || !groupName.trim()}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("createGroup")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("noGroups")}</p>
            <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createGroup")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {group.name}
                      <Badge variant="secondary">{group.members.length} membres</Badge>
                    </CardTitle>
                    {group.description && <CardDescription className="mt-1">{group.description}</CardDescription>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedGroup(group)
                          setAddMemberDialogOpen(true)
                        }}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Ajouter un membre
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedGroup(group)
                          setAssignRoutineDialogOpen(true)
                        }}
                      >
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Assigner une routine
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGroup(group.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer le groupe
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {group.members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun membre dans ce groupe pour l'instant.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.members.map((member) => (
                      <Badge key={member.id} variant="outline" className="flex items-center gap-1 py-1 px-2">
                        {member.profile?.first_name || member.profile?.last_name
                          ? `${member.profile?.first_name || ""} ${member.profile?.last_name || ""}`.trim()
                          : member.profile?.email || "Inconnu"}
                        <button
                          onClick={() => handleRemoveMemberFromGroup(group.id, member.student_id)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre à {selectedGroup?.name}</DialogTitle>
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
            <DialogTitle>Assigner une routine à {selectedGroup?.name}</DialogTitle>
            <DialogDescription>Sélectionnez une routine à assigner à tous les membres de ce groupe.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une routine" />
              </SelectTrigger>
              <SelectContent>
                {routines.map((routine) => (
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
            <Button onClick={handleAssignRoutineToGroup} disabled={saving || !selectedRoutineId}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("assign")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
