-- Enable Row Level Security on all tables
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.meal_foods enable row level security;
alter table public.body_metrics enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Exercises policies
create policy "Users can view their own exercises and non-custom exercises"
  on public.exercises for select
  using (auth.uid() = user_id or is_custom = false);

create policy "Users can insert their own exercises"
  on public.exercises for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exercises"
  on public.exercises for update
  using (auth.uid() = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  using (auth.uid() = user_id);

-- Routines policies
create policy "Users can view their own routines"
  on public.routines for select
  using (auth.uid() = user_id);

create policy "Users can insert their own routines"
  on public.routines for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own routines"
  on public.routines for update
  using (auth.uid() = user_id);

create policy "Users can delete their own routines"
  on public.routines for delete
  using (auth.uid() = user_id);

-- Routine exercises policies
create policy "Users can view routine exercises for their routines"
  on public.routine_exercises for select
  using (exists (
    select 1 from public.routines
    where routines.id = routine_exercises.routine_id
    and routines.user_id = auth.uid()
  ));

create policy "Users can insert routine exercises for their routines"
  on public.routine_exercises for insert
  with check (exists (
    select 1 from public.routines
    where routines.id = routine_exercises.routine_id
    and routines.user_id = auth.uid()
  ));

create policy "Users can update routine exercises for their routines"
  on public.routine_exercises for update
  using (exists (
    select 1 from public.routines
    where routines.id = routine_exercises.routine_id
    and routines.user_id = auth.uid()
  ));

create policy "Users can delete routine exercises for their routines"
  on public.routine_exercises for delete
  using (exists (
    select 1 from public.routines
    where routines.id = routine_exercises.routine_id
    and routines.user_id = auth.uid()
  ));

-- Workout logs policies
create policy "Users can view their own workout logs"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout logs"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout logs"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout logs"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

-- Workout exercises policies
create policy "Users can view workout exercises for their workouts"
  on public.workout_exercises for select
  using (exists (
    select 1 from public.workout_logs
    where workout_logs.id = workout_exercises.workout_log_id
    and workout_logs.user_id = auth.uid()
  ));

create policy "Users can insert workout exercises for their workouts"
  on public.workout_exercises for insert
  with check (exists (
    select 1 from public.workout_logs
    where workout_logs.id = workout_exercises.workout_log_id
    and workout_logs.user_id = auth.uid()
  ));

create policy "Users can update workout exercises for their workouts"
  on public.workout_exercises for update
  using (exists (
    select 1 from public.workout_logs
    where workout_logs.id = workout_exercises.workout_log_id
    and workout_logs.user_id = auth.uid()
  ));

create policy "Users can delete workout exercises for their workouts"
  on public.workout_exercises for delete
  using (exists (
    select 1 from public.workout_logs
    where workout_logs.id = workout_exercises.workout_log_id
    and workout_logs.user_id = auth.uid()
  ));

-- Workout sets policies
create policy "Users can view workout sets for their workouts"
  on public.workout_sets for select
  using (exists (
    select 1 from public.workout_exercises
    join public.workout_logs on workout_logs.id = workout_exercises.workout_log_id
    where workout_exercises.id = workout_sets.workout_exercise_id
    and workout_logs.user_id = auth.uid()
  ));

create policy "Users can insert workout sets for their workouts"
  on public.workout_sets for insert
  with check (exists (
    select 1 from public.workout_exercises
    join public.workout_logs on workout_logs.id = workout_exercises.workout_log_id
    where workout_exercises.id = workout_sets.workout_exercise_id
    and workout_logs.user_id = auth.uid()
  ));

create policy "Users can update workout sets for their workouts"
  on public.workout_sets for update
  using (exists (
    select 1 from public.workout_exercises
    join public.workout_logs on workout_logs.id = workout_exercises.workout_log_id
    where workout_exercises.id = workout_sets.workout_exercise_id
    and workout_logs.user_id = auth.uid()
  ));

create policy "Users can delete workout sets for their workouts"
  on public.workout_sets for delete
  using (exists (
    select 1 from public.workout_exercises
    join public.workout_logs on workout_logs.id = workout_exercises.workout_log_id
    where workout_exercises.id = workout_sets.workout_exercise_id
    and workout_logs.user_id = auth.uid()
  ));

-- Foods policies
create policy "Users can view their own foods and non-custom foods"
  on public.foods for select
  using (auth.uid() = user_id or is_custom = false);

create policy "Users can insert their own foods"
  on public.foods for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own foods"
  on public.foods for update
  using (auth.uid() = user_id);

create policy "Users can delete their own foods"
  on public.foods for delete
  using (auth.uid() = user_id);

-- Meals policies
create policy "Users can view their own meals"
  on public.meals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meals"
  on public.meals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meals"
  on public.meals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meals"
  on public.meals for delete
  using (auth.uid() = user_id);

-- Meal foods policies
create policy "Users can view meal foods for their meals"
  on public.meal_foods for select
  using (exists (
    select 1 from public.meals
    where meals.id = meal_foods.meal_id
    and meals.user_id = auth.uid()
  ));

create policy "Users can insert meal foods for their meals"
  on public.meal_foods for insert
  with check (exists (
    select 1 from public.meals
    where meals.id = meal_foods.meal_id
    and meals.user_id = auth.uid()
  ));

create policy "Users can update meal foods for their meals"
  on public.meal_foods for update
  using (exists (
    select 1 from public.meals
    where meals.id = meal_foods.meal_id
    and meals.user_id = auth.uid()
  ));

create policy "Users can delete meal foods for their meals"
  on public.meal_foods for delete
  using (exists (
    select 1 from public.meals
    where meals.id = meal_foods.meal_id
    and meals.user_id = auth.uid()
  ));

-- Body metrics policies
create policy "Users can view their own body metrics"
  on public.body_metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own body metrics"
  on public.body_metrics for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own body metrics"
  on public.body_metrics for update
  using (auth.uid() = user_id);

create policy "Users can delete their own body metrics"
  on public.body_metrics for delete
  using (auth.uid() = user_id);
