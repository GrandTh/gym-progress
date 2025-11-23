import { Button } from "@/components/ui/button"
import { Dumbbell, TrendingUp, Apple, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/20">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">GymTracker</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="container px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight lg:text-6xl">
              Track Your Fitness Journey with Precision
            </h1>
            <p className="mb-8 text-pretty text-lg text-muted-foreground lg:text-xl">
              Log workouts, track nutrition, monitor progress, and achieve your fitness goals with our comprehensive
              tracking platform.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/sign-up">Start Free Today</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container px-4 py-16">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Workout Logging</h3>
              <p className="text-sm text-muted-foreground">
                Track sets, reps, weight, and rest times for every exercise
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Apple className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Nutrition Tracking</h3>
              <p className="text-sm text-muted-foreground">Log meals and monitor calories, protein, carbs, and fats</p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Progress Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Track body weight, strength gains, and workout consistency
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Analytics Dashboard</h3>
              <p className="text-sm text-muted-foreground">Visualize your progress with detailed charts and insights</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>GymTracker - Your Personal Fitness Companion</p>
        </div>
      </footer>
    </div>
  )
}
