"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function AddExerciseDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const category = formData.get("category") as string
    const muscleGroup = formData.get("muscleGroup") as string
    const equipment = formData.get("equipment") as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("exercises").insert({
        user_id: user.id,
        name,
        category,
        muscle_group: muscleGroup,
        equipment,
        is_custom: true,
      })

      if (error) throw error

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding exercise:", error)
      // Ideally show a toast here
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Exercise
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Exercise</DialogTitle>
            <DialogDescription>Create a custom exercise to add to your library.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Bulgarian Split Squat" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="pull">Pull</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="muscleGroup">Muscle Group</Label>
              <Select name="muscleGroup" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select muscle group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chest">Chest</SelectItem>
                  <SelectItem value="back">Back</SelectItem>
                  <SelectItem value="shoulders">Shoulders</SelectItem>
                  <SelectItem value="legs">Legs</SelectItem>
                  <SelectItem value="arms">Arms</SelectItem>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="full body">Full Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Select name="equipment" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbell">Barbell</SelectItem>
                  <SelectItem value="dumbbell">Dumbbell</SelectItem>
                  <SelectItem value="machine">Machine</SelectItem>
                  <SelectItem value="cable">Cable</SelectItem>
                  <SelectItem value="bodyweight">Bodyweight</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
