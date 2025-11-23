"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"

export function BodyMetricsForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    weight_kg: "",
    body_fat_percentage: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("body_metrics").insert({
        user_id: user?.id,
        weight_kg: Number.parseFloat(formData.weight_kg),
        body_fat_percentage: formData.body_fat_percentage ? Number.parseFloat(formData.body_fat_percentage) : null,
        notes: formData.notes || null,
        measured_at: new Date().toISOString(),
      })

      if (error) throw error

      setFormData({ weight_kg: "", body_fat_percentage: "", notes: "" })
      router.refresh()
    } catch (error) {
      console.error("Error logging body metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg) *</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          value={formData.weight_kg}
          onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
          required
          placeholder="75.5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body_fat">Body Fat Percentage (optional)</Label>
        <Input
          id="body_fat"
          type="number"
          step="0.1"
          value={formData.body_fat_percentage}
          onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
          placeholder="15.5"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Feeling strong today..."
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Logging..." : "Log Measurement"}
      </Button>
    </form>
  )
}
