-- Seed default routines (Push, Pull, Legs) for new users

-- Function to seed routines for a specific user
CREATE OR REPLACE FUNCTION seed_default_routines(target_user_id uuid)
RETURNS void AS $$
DECLARE
    push_routine_id uuid;
    pull_routine_id uuid;
    legs_routine_id uuid;
    bench_press_id uuid;
    overhead_press_id uuid;
    incline_bench_id uuid;
    tricep_extension_id uuid;
    pull_up_id uuid;
    row_id uuid;
    curl_id uuid;
    squat_id uuid;
    deadlift_id uuid;
    lunge_id uuid;
    calf_raise_id uuid;
BEGIN
    -- Get IDs for exercises (assuming they exist from seed_default_exercises)
    SELECT id INTO bench_press_id FROM exercises WHERE name = 'Bench Press' LIMIT 1;
    SELECT id INTO overhead_press_id FROM exercises WHERE name = 'Overhead Press' LIMIT 1;
    SELECT id INTO incline_bench_id FROM exercises WHERE name = 'Incline Dumbbell Press' LIMIT 1;
    SELECT id INTO tricep_extension_id FROM exercises WHERE name = 'Tricep Pushdown' LIMIT 1;
    
    SELECT id INTO pull_up_id FROM exercises WHERE name = 'Pull Up' LIMIT 1;
    SELECT id INTO row_id FROM exercises WHERE name = 'Barbell Row' LIMIT 1;
    SELECT id INTO curl_id FROM exercises WHERE name = 'Barbell Curl' LIMIT 1;
    
    SELECT id INTO squat_id FROM exercises WHERE name = 'Squat' LIMIT 1;
    SELECT id INTO deadlift_id FROM exercises WHERE name = 'Deadlift' LIMIT 1;
    SELECT id INTO lunge_id FROM exercises WHERE name = 'Walking Lunge' LIMIT 1;
    SELECT id INTO calf_raise_id FROM exercises WHERE name = 'Calf Raise' LIMIT 1;

    -- Create Push Routine
    INSERT INTO routines (user_id, name, description, category, is_active)
    VALUES (target_user_id, 'Push Day', 'Chest, Shoulders, and Triceps focus', 'Strength', true)
    RETURNING id INTO push_routine_id;

    IF bench_press_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (push_routine_id, bench_press_id, 0, 4, 8, 60, 120);
    END IF;

    IF overhead_press_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (push_routine_id, overhead_press_id, 1, 3, 10, 40, 90);
    END IF;

    IF incline_bench_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (push_routine_id, incline_bench_id, 2, 3, 10, 25, 90);
    END IF;

    IF tricep_extension_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (push_routine_id, tricep_extension_id, 3, 3, 12, 20, 60);
    END IF;


    -- Create Pull Routine
    INSERT INTO routines (user_id, name, description, category, is_active)
    VALUES (target_user_id, 'Pull Day', 'Back and Biceps focus', 'Strength', true)
    RETURNING id INTO pull_routine_id;

    IF pull_up_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (pull_routine_id, pull_up_id, 0, 3, 8, 0, 120);
    END IF;

    IF row_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (pull_routine_id, row_id, 1, 4, 10, 50, 90);
    END IF;

    IF curl_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (pull_routine_id, curl_id, 2, 3, 12, 20, 60);
    END IF;


    -- Create Legs Routine
    INSERT INTO routines (user_id, name, description, category, is_active)
    VALUES (target_user_id, 'Leg Day', 'Quads, Hamstrings, and Calves focus', 'Strength', true)
    RETURNING id INTO legs_routine_id;

    IF squat_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (legs_routine_id, squat_id, 0, 4, 6, 80, 180);
    END IF;

    IF deadlift_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (legs_routine_id, deadlift_id, 1, 3, 5, 100, 180);
    END IF;

    IF lunge_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (legs_routine_id, lunge_id, 2, 3, 12, 15, 60);
    END IF;

     IF calf_raise_id IS NOT NULL THEN
        INSERT INTO routine_exercises (routine_id, exercise_id, order_index, target_sets, target_reps, target_weight, rest_seconds)
        VALUES (legs_routine_id, calf_raise_id, 3, 4, 15, 40, 60);
    END IF;

END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-seed routines when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_user_routines()
RETURNS trigger AS $$
BEGIN
  PERFORM seed_default_routines(new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication errors during re-runs
DROP TRIGGER IF EXISTS on_auth_user_created_routines ON public.profiles;

CREATE TRIGGER on_auth_user_created_routines
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_routines();
