-- =============================================
-- RLS POLICIES FOR COACH GROUPS
-- =============================================
ALTER TABLE coach_groups ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their own groups
CREATE POLICY "Coaches can view their own groups"
  ON coach_groups FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can create groups"
  ON coach_groups FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can update their own groups"
  ON coach_groups FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can delete their own groups"
  ON coach_groups FOR DELETE
  USING (coach_id = auth.uid());

-- Admins can see all groups
CREATE POLICY "Admins can view all groups"
  ON coach_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- RLS POLICIES FOR COACH-STUDENT RELATIONSHIPS
-- =============================================
ALTER TABLE coach_students ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their students
CREATE POLICY "Coaches can view their students"
  ON coach_students FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Coaches can add students"
  ON coach_students FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can remove students"
  ON coach_students FOR DELETE
  USING (coach_id = auth.uid());

-- Students can see their coach relationship
CREATE POLICY "Students can view their coach"
  ON coach_students FOR SELECT
  USING (student_id = auth.uid());

-- Admins can see all relationships
CREATE POLICY "Admins can view all coach-student relationships"
  ON coach_students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- RLS POLICIES FOR GROUP MEMBERS
-- =============================================
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Coaches can manage members of their groups
CREATE POLICY "Coaches can view members of their groups"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_groups 
      WHERE coach_groups.id = group_members.group_id 
      AND coach_groups.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can add members to their groups"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_groups 
      WHERE coach_groups.id = group_id 
      AND coach_groups.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can remove members from their groups"
  ON group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM coach_groups 
      WHERE coach_groups.id = group_members.group_id 
      AND coach_groups.coach_id = auth.uid()
    )
  );

-- Students can see groups they belong to
CREATE POLICY "Students can view their group memberships"
  ON group_members FOR SELECT
  USING (student_id = auth.uid());

-- Admins can see all
CREATE POLICY "Admins can view all group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- RLS POLICIES FOR ROUTINE ASSIGNMENTS
-- =============================================
ALTER TABLE routine_assignments ENABLE ROW LEVEL SECURITY;

-- Coaches can manage their assignments
CREATE POLICY "Coaches can view their assignments"
  ON routine_assignments FOR SELECT
  USING (assigned_by = auth.uid());

CREATE POLICY "Coaches can create assignments"
  ON routine_assignments FOR INSERT
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "Coaches can update their assignments"
  ON routine_assignments FOR UPDATE
  USING (assigned_by = auth.uid());

CREATE POLICY "Coaches can delete their assignments"
  ON routine_assignments FOR DELETE
  USING (assigned_by = auth.uid());

-- Students can see routines assigned to them
CREATE POLICY "Students can view their assigned routines"
  ON routine_assignments FOR SELECT
  USING (
    student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_members.group_id = routine_assignments.group_id 
      AND group_members.student_id = auth.uid()
    )
  );

-- Admins can see all
CREATE POLICY "Admins can view all assignments"
  ON routine_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =============================================
-- UPDATE PROFILES POLICIES FOR ADMIN ACCESS
-- =============================================
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Coaches can view their students' profiles
CREATE POLICY "Coaches can view their students profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_students 
      WHERE coach_students.coach_id = auth.uid() 
      AND coach_students.student_id = profiles.id
    )
  );

-- =============================================
-- UPDATE ROUTINES POLICIES FOR STUDENTS
-- =============================================
CREATE POLICY "Students can view assigned routines"
  ON routines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routine_assignments ra
      WHERE ra.routine_id = routines.id
      AND (
        ra.student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members gm 
          WHERE gm.group_id = ra.group_id 
          AND gm.student_id = auth.uid()
        )
      )
    )
  );

-- Coaches can view routines they created
CREATE POLICY "Coaches can view template routines"
  ON routines FOR SELECT
  USING (created_by_coach = auth.uid());

-- =============================================
-- UPDATE ROUTINE_EXERCISES POLICIES FOR STUDENTS
-- =============================================
CREATE POLICY "Students can view assigned routine exercises"
  ON routine_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routines r
      JOIN routine_assignments ra ON ra.routine_id = r.id
      WHERE r.id = routine_exercises.routine_id
      AND (
        ra.student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM group_members gm 
          WHERE gm.group_id = ra.group_id 
          AND gm.student_id = auth.uid()
        )
      )
    )
  );

-- =============================================
-- ADMIN POLICIES FOR WORKOUT DATA
-- =============================================
CREATE POLICY "Admins can view all workout logs"
  ON workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all exercises"
  ON exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all routines"
  ON routines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Coaches can view their students' workout logs
CREATE POLICY "Coaches can view their students workout logs"
  ON workout_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_students 
      WHERE coach_students.coach_id = auth.uid() 
      AND coach_students.student_id = workout_logs.user_id
    )
  );
