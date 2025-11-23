-- Add superset_id to routine_exercises to group exercises
ALTER TABLE routine_exercises 
ADD COLUMN IF NOT EXISTS superset_id INTEGER;

-- Add superset_id to workout_exercises to group exercises in logs
ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS superset_id INTEGER;

-- Ensure notes column exists in workout_exercises (it should, but just in case)
ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS notes TEXT;
