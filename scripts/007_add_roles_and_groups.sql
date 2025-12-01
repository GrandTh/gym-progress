-- =============================================
-- ROLES SYSTEM
-- =============================================

-- Add role column to profiles (admin, coach, student, null for personal use)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role text CHECK (role IN ('admin', 'coach', 'student')),
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS email text;

-- =============================================
-- COACH GROUPS (for coaches to organize students)
-- =============================================
CREATE TABLE IF NOT EXISTS coach_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- COACH-STUDENT RELATIONSHIPS
-- =============================================
CREATE TABLE IF NOT EXISTS coach_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(coach_id, student_id)
);

-- =============================================
-- GROUP MEMBERS (students in groups)
-- =============================================
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES coach_groups(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(group_id, student_id)
);

-- =============================================
-- ROUTINE ASSIGNMENTS (coach assigns routines to students/groups)
-- =============================================
CREATE TABLE IF NOT EXISTS routine_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Either student_id OR group_id should be set, not both
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES coach_groups(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (student_id IS NOT NULL AND group_id IS NULL) OR 
    (student_id IS NULL AND group_id IS NOT NULL)
  )
);

-- Add is_template flag to routines (coach routines that can be assigned)
ALTER TABLE routines
ADD COLUMN IF NOT EXISTS is_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_coach uuid REFERENCES auth.users(id);
