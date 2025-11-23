"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

type Food = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type MealFood = {
  servings: number
  foods: Food
}

type Meal = {
  id: string
  name: string
  consumed_at: string
  meal_foods: MealFood[]
}

export function NutritionOverview({ meals }: { meals: Meal[] }) {
  // Calculate totals
  const totals = meals.reduce(
    (acc, meal) => {
      meal.meal_foods.forEach((mf) => {
        acc.calories += Number(mf.foods.calories) * Number(mf.servings)
        acc.protein += Number(mf.foods.protein) * Number(mf.servings)
        acc.carbs += Number(mf.foods.carbs) * Number(mf.servings)
        acc.fat += Number(mf.foods.fat) * Number(mf.servings)
      })
      return acc
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )

  // Targets (hardcoded for now, could be user settings)
  const targets = {
    calories: 2500,
    protein: 180,
    carbs: 300,
    fat: 80,
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Calories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(totals.calories)} / {targets.calories}
          </div>
          <Progress value={(totals.calories / targets.calories) * 100} className="mt-2 h-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Protein</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(totals.protein)}g / {targets.protein}g
          </div>
          <Progress
            value={(totals.protein / targets.protein) * 100}
            className="mt-2 h-2 bg-secondary"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Carbs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(totals.carbs)}g / {targets.carbs}g
          </div>
          <Progress
            value={(totals.carbs / targets.carbs) * 100}
            className="mt-2 h-2 bg-secondary"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(totals.fat)}g / {targets.fat}g
          </div>
          <Progress
            value={(totals.fat / targets.fat) * 100}
            className="mt-2 h-2 bg-secondary"
          />
        </CardContent>
      </Card>
    </div>
  )
}
