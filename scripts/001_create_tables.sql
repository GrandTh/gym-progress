-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table (references auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age integer,
  height_cm integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create exercises table (predefined and user-created)
create table if not exists public.exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  category text, -- push, pull, legs, cardio, etc.
  muscle_group text, -- chest, back, legs, shoulders, etc.
  equipment text, -- barbell, dumbbell, machine, bodyweight, etc.
  is_custom boolean default true,
  created_at timestamp with time zone default now()
);

-- Create routines table (workout templates)
create table if not exists public.routines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  category text, -- push, pull, legs, fullbody, etc.
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create routine_exercises (exercises in a routine template)
create table if not exists public.routine_exercises (
  id uuid primary key default uuid_generate_v4(),
  routine_id uuid references public.routines(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  order_index integer not null,
  target_sets integer,
  target_reps integer,
  target_weight numeric,
  rest_seconds integer,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create workout_logs (individual workout sessions)
create table if not exists public.workout_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  routine_id uuid references public.routines(id) on delete set null,
  name text not null,
  notes text,
  started_at timestamp with time zone not null,
  completed_at timestamp with time zone,
  duration_minutes integer,
  created_at timestamp with time zone default now()
);

-- Create workout_exercises (exercises performed in a workout)
create table if not exists public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) on delete cascade not null,
  order_index integer not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create workout_sets (individual sets logged)
create table if not exists public.workout_sets (
  id uuid primary key default uuid_generate_v4(),
  workout_exercise_id uuid references public.workout_exercises(id) on delete cascade not null,
  set_number integer not null,
  reps integer,
  weight numeric,
  rest_seconds integer,
  completed boolean default false,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create foods table (food database)
create table if not exists public.foods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  serving_size numeric,
  serving_unit text, -- g, ml, cup, etc.
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fat numeric not null,
  fiber numeric,
  is_custom boolean default true,
  created_at timestamp with time zone default now()
);

-- Create meals table (nutrition logs)
create table if not exists public.meals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null, -- breakfast, lunch, dinner, snack
  consumed_at timestamp with time zone not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create meal_foods (foods in a meal)
create table if not exists public.meal_foods (
  id uuid primary key default uuid_generate_v4(),
  meal_id uuid references public.meals(id) on delete cascade not null,
  food_id uuid references public.foods(id) on delete cascade not null,
  servings numeric not null,
  created_at timestamp with time zone default now()
);

-- Create body_metrics table (weight and body composition tracking)
create table if not exists public.body_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  measured_at timestamp with time zone not null,
  weight_kg numeric,
  body_fat_percentage numeric,
  notes text,
  created_at timestamp with time zone default now()
);

-- Create indexes for better query performance
create index if not exists idx_exercises_user_id on public.exercises(user_id);
create index if not exists idx_exercises_category on public.exercises(category);
create index if not exists idx_routines_user_id on public.routines(user_id);
create index if not exists idx_routine_exercises_routine_id on public.routine_exercises(routine_id);
create index if not exists idx_workout_logs_user_id on public.workout_logs(user_id);
create index if not exists idx_workout_logs_started_at on public.workout_logs(started_at);
create index if not exists idx_workout_exercises_workout_log_id on public.workout_exercises(workout_log_id);
create index if not exists idx_workout_sets_workout_exercise_id on public.workout_sets(workout_exercise_id);
create index if not exists idx_foods_user_id on public.foods(user_id);
create index if not exists idx_meals_user_id on public.meals(user_id);
create index if not exists idx_meals_consumed_at on public.meals(consumed_at);
create index if not exists idx_meal_foods_meal_id on public.meal_foods(meal_id);
create index if not exists idx_body_metrics_user_id on public.body_metrics(user_id);
create index if not exists idx_body_metrics_measured_at on public.body_metrics(measured_at);
