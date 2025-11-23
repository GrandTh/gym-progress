"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Trash2 } from "lucide-react"
import { createClient } from "@/lib/client"
import { useRouter } from "next/navigation"

type Food = {
  id: string
  name: string
  brand?: string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  serving_size?: number | null
  serving_unit?: string | null
}

type SelectedFood = {
  food: Food
  servings: number
}

export function MealLogger({ foods }: { foods: Food[] }) {
  const [mealName, setMealName] = useState("Breakfast")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFoods, setSelectedFoods] = useState<SelectedFood[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const filteredFoods = foods.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const addFood = (food: Food) => {
    setSelectedFoods([...selectedFoods, { food, servings: 1 }])
    setSearchQuery("")
  }

  const removeFood = (index: number) => {
    const newFoods = [...selectedFoods]
    newFoods.splice(index, 1)
    setSelectedFoods(newFoods)
  }

  const updateServings = (index: number, servings: number) => {
    const newFoods = [...selectedFoods]
    newFoods[index].servings = servings
    setSelectedFoods(newFoods)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFoods.length === 0) return

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // 1. Create Meal
      const { data: meal, error: mealError } = await supabase
        .from("meals")
        .insert({
          user_id: user.id,
          name: mealName,
          consumed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (mealError) throw mealError

      // 2. Add Foods to Meal
      const mealFoods = selectedFoods.map((sf) => ({
        meal_id: meal.id,
        food_id: sf.food.id,
        servings: sf.servings,
      }))

      const { error: foodsError } = await supabase.from("meal_foods").insert(mealFoods)

      if (foodsError) throw foodsError

      setSelectedFoods([])
      router.refresh()
    } catch (error) {
      console.error("Error logging meal:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Add Food</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search foods..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="h-[300px] overflow-y-auto border rounded-md">
            {filteredFoods.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No foods found</div>
            ) : (
              <div className="divide-y">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    className="w-full p-3 text-left hover:bg-muted flex items-center justify-between"
                    onClick={() => addFood(food)}
                  >
                    <div>
                      <div className="font-medium">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.calories} kcal • {food.protein}p • {food.carbs}c • {food.fat}f
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Current Meal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Meal Type</Label>
            <Select value={mealName} onValueChange={setMealName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
                <SelectItem value="Snack">Snack</SelectItem>
                <SelectItem value="Pre-workout">Pre-workout</SelectItem>
                <SelectItem value="Post-workout">Post-workout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {selectedFoods.map((sf, index) => (
              <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                <div className="flex-1">
                  <div className="text-sm font-medium">{sf.food.name}</div>
                  <div className="text-xs text-muted-foreground">{Math.round(sf.food.calories * sf.servings)} kcal</div>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={sf.servings}
                    onChange={(e) => updateServings(index, Number.parseFloat(e.target.value))}
                    className="h-8 w-20"
                    step={0.5}
                    min={0.1}
                  />
                  <span className="text-xs text-muted-foreground">srv</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFood(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {selectedFoods.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground border border-dashed rounded-md">
                Add foods to your meal
              </div>
            )}
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading || selectedFoods.length === 0}>
            {loading ? "Logging Meal..." : "Log Meal"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
