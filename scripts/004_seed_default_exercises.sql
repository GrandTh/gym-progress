-- Seed default exercises (non-custom exercises available to all users)
insert into public.exercises (user_id, name, description, category, muscle_group, equipment, is_custom) values
  -- Push exercises
  (null, 'Barbell Bench Press', 'Compound chest exercise', 'push', 'chest', 'barbell', false),
  (null, 'Incline Dumbbell Press', 'Upper chest focused press', 'push', 'chest', 'dumbbell', false),
  (null, 'Push-ups', 'Bodyweight chest exercise', 'push', 'chest', 'bodyweight', false),
  (null, 'Overhead Press', 'Shoulder compound movement', 'push', 'shoulders', 'barbell', false),
  (null, 'Lateral Raises', 'Side delt isolation', 'push', 'shoulders', 'dumbbell', false),
  (null, 'Tricep Dips', 'Bodyweight tricep exercise', 'push', 'triceps', 'bodyweight', false),
  (null, 'Tricep Pushdown', 'Cable tricep isolation', 'push', 'triceps', 'cable', false),
  
  -- Pull exercises
  (null, 'Deadlift', 'Compound full body pull', 'pull', 'back', 'barbell', false),
  (null, 'Pull-ups', 'Bodyweight back exercise', 'pull', 'back', 'bodyweight', false),
  (null, 'Barbell Row', 'Compound back exercise', 'pull', 'back', 'barbell', false),
  (null, 'Lat Pulldown', 'Cable back exercise', 'pull', 'back', 'cable', false),
  (null, 'Face Pulls', 'Rear delt and upper back', 'pull', 'back', 'cable', false),
  (null, 'Barbell Curl', 'Bicep compound exercise', 'pull', 'biceps', 'barbell', false),
  (null, 'Hammer Curls', 'Bicep and forearm exercise', 'pull', 'biceps', 'dumbbell', false),
  
  -- Leg exercises
  (null, 'Barbell Squat', 'Compound leg exercise', 'legs', 'quadriceps', 'barbell', false),
  (null, 'Romanian Deadlift', 'Hamstring focused exercise', 'legs', 'hamstrings', 'barbell', false),
  (null, 'Leg Press', 'Machine quad exercise', 'legs', 'quadriceps', 'machine', false),
  (null, 'Leg Curl', 'Hamstring isolation', 'legs', 'hamstrings', 'machine', false),
  (null, 'Leg Extension', 'Quad isolation', 'legs', 'quadriceps', 'machine', false),
  (null, 'Calf Raises', 'Calf exercise', 'legs', 'calves', 'machine', false),
  (null, 'Lunges', 'Unilateral leg exercise', 'legs', 'quadriceps', 'bodyweight', false),
  
  -- Cardio
  (null, 'Running', 'Outdoor or treadmill running', 'cardio', 'full body', 'none', false),
  (null, 'Cycling', 'Stationary or outdoor cycling', 'cardio', 'legs', 'machine', false),
  (null, 'Rowing', 'Full body cardio', 'cardio', 'full body', 'machine', false),
  (null, 'Jump Rope', 'High intensity cardio', 'cardio', 'full body', 'equipment', false)
on conflict do nothing;
