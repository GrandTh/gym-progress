"use client"

import type React from "react"

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
import { Loader2, Plus, Users, Trash2, MoreVertical, ChevronRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

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
  routine_count: number
}

export default function CoachGroupsPage() {
  const { profile } = useUser()
  const { t } = useLanguage()
  const { toast } = useToast()
  const supabase = createBrowserClient()

  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Form states
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
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

      // Fetch routine counts for each group
      if (groupsData) {
        const groupsWithRoutineCounts = await Promise.all(
          groupsData.map(async (group) => {
            const { count } = await supabase
              .from("routine_assignments")
              .select("*", { count: "exact", head: true })
              .eq("group_id", group.id)

            return { ...group, routine_count: count || 0 }
          }),
        )
        setGroups(groupsWithRoutineCounts)
      } else {
        setGroups([])
      }
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

  const handleDeleteGroup = async (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const { error } = await supabase.from("coach_groups").delete().eq("id", groupId)

      if (error) throw error

      toast({ title: "Groupe supprimé avec succès" })
      fetchData()
    } catch (error) {
      console.error("Error deleting group:", error)
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/dashboard/coach/groups/${group.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">{group.name}</CardTitle>
                      {group.description && (
                        <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-destructive" onClick={(e) => handleDeleteGroup(e, group.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer le groupe
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        <Users className="mr-1 h-3 w-3" />
                        {group.members.length} membre{group.members.length !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline">
                        {group.routine_count} routine{group.routine_count !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
