-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions
-- These functions bypass RLS checks internally to prevent circular dependencies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Coaches can view their students profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can view their students" ON coach_students;
DROP POLICY IF EXISTS "Admins can view all coach_students" ON coach_students;
DROP POLICY IF EXISTS "Coaches can view their students workout logs" ON workout_logs;
DROP POLICY IF EXISTS "Admins can view all workout logs" ON workout_logs;

-- Create helper functions with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION is_coach_of_user(coach_id uuid, student_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM coach_students 
    WHERE coach_students.coach_id = is_coach_of_user.coach_id 
    AND coach_students.student_id = is_coach_of_user.student_id
  );
$$;

CREATE OR REPLACE FUNCTION get_coach_student_ids(coach_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT student_id FROM coach_students WHERE coach_students.coach_id = get_coach_student_ids.coach_id;
$$;

-- Recreate profiles policies using helper functions
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Coaches can view their students profiles"
  ON profiles FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'coach' 
    AND id IN (SELECT get_coach_student_ids(auth.uid()))
  );

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Recreate coach_students policies
CREATE POLICY "Coaches can view their students"
  ON coach_students FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can view all coach_students"
  ON coach_students FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can view their coach relationship"
  ON coach_students FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Coaches can manage their students"
  ON coach_students FOR ALL
  USING (coach_id = auth.uid());

CREATE POLICY "Admins can manage all coach_students"
  ON coach_students FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Recreate workout_logs policies for coaches
CREATE POLICY "Coaches can view their students workout logs"
  ON workout_logs FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'coach' 
    AND user_id IN (SELECT get_coach_student_ids(auth.uid()))
  );

CREATE POLICY "Admins can view all workout logs"
  ON workout_logs FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Fix other tables that might have similar issues
DROP POLICY IF EXISTS "Coaches can view their students meal logs" ON meal_logs;
DROP POLICY IF EXISTS "Admins can view all meal logs" ON meal_logs;

CREATE POLICY "Coaches can view their students meal logs"
  ON meal_logs FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'coach' 
    AND user_id IN (SELECT get_coach_student_ids(auth.uid()))
  );

CREATE POLICY "Admins can view all meal logs"
  ON meal_logs FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

-- Fix body_metrics
DROP POLICY IF EXISTS "Coaches can view their students body metrics" ON body_metrics;
DROP POLICY IF EXISTS "Admins can view all body metrics" ON body_metrics;

CREATE POLICY "Coaches can view their students body metrics"
  ON body_metrics FOR SELECT
  USING (
    get_user_role(auth.uid()) = 'coach' 
    AND user_id IN (SELECT get_coach_student_ids(auth.uid()))
  );

CREATE POLICY "Admins can view all body metrics"
  ON body_metrics FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');
