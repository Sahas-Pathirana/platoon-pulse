/*
  # Create Attendance Management System

  1. New Tables
    - `practice_sessions` - Admin-created practice schedules
      - `id` (uuid, primary key)
      - `title` (text) - Practice session title
      - `description` (text) - Practice description
      - `practice_date` (date) - Date of practice
      - `start_time` (time) - Scheduled start time
      - `end_time` (time) - Scheduled end time
      - `duration_minutes` (integer) - Total duration in minutes
      - `created_by` (uuid) - Admin who created the session
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `cadet_attendance` - Individual cadet attendance records
      - `id` (uuid, primary key)
      - `practice_session_id` (uuid) - Reference to practice session
      - `cadet_id` (uuid) - Reference to cadet
      - `entry_time` (time) - When cadet entered
      - `exit_time` (time) - When cadet left
      - `participation_minutes` (integer) - Calculated participation time
      - `attendance_status` (enum) - present, leave_early, absent
      - `attendance_percentage` (decimal) - Percentage of practice attended
      - `marked_at` (timestamp) - When attendance was marked
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Admins can manage practice sessions and view all attendance
    - Students can view practice sessions and mark their own attendance
    - Students can only view their own attendance records

  3. Functions
    - Auto-calculate attendance status based on participation percentage
    - Generate attendance reports
*/

-- Create enum for attendance status
CREATE TYPE attendance_status AS ENUM ('present', 'leave_early', 'absent');

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  practice_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  duration_minutes integer GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time - start_time)) / 60
  ) STORED,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cadet_attendance table
CREATE TABLE IF NOT EXISTS cadet_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_session_id uuid REFERENCES practice_sessions(id) ON DELETE CASCADE NOT NULL,
  cadet_id uuid REFERENCES cadets(id) ON DELETE CASCADE NOT NULL,
  entry_time time,
  exit_time time,
  participation_minutes integer DEFAULT 0,
  attendance_status attendance_status DEFAULT 'absent',
  attendance_percentage decimal(5,2) DEFAULT 0.00,
  marked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(practice_session_id, cadet_id)
);

-- Enable RLS
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadet_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for practice_sessions
CREATE POLICY "Everyone can view practice sessions"
  ON practice_sessions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage practice sessions"
  ON practice_sessions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Policies for cadet_attendance
CREATE POLICY "Admins can view all attendance"
  ON cadet_attendance
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Students can view own attendance"
  ON cadet_attendance
  FOR SELECT
  USING (cadet_id = public.current_cadet_id());

CREATE POLICY "Admins can manage all attendance"
  ON cadet_attendance
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Students can mark own attendance"
  ON cadet_attendance
  FOR INSERT
  WITH CHECK (cadet_id = public.current_cadet_id());

CREATE POLICY "Students can update own attendance"
  ON cadet_attendance
  FOR UPDATE
  USING (cadet_id = public.current_cadet_id())
  WITH CHECK (cadet_id = public.current_cadet_id());

-- Function to calculate attendance status
CREATE OR REPLACE FUNCTION calculate_attendance_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  session_duration integer;
  participation_duration integer;
  percentage decimal;
BEGIN
  -- Get the practice session duration
  SELECT duration_minutes INTO session_duration
  FROM practice_sessions
  WHERE id = NEW.practice_session_id;

  -- Calculate participation duration if both entry and exit times are provided
  IF NEW.entry_time IS NOT NULL AND NEW.exit_time IS NOT NULL THEN
    participation_duration := EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;
    
    -- Ensure participation doesn't exceed session duration
    IF participation_duration > session_duration THEN
      participation_duration := session_duration;
    END IF;
    
    -- Calculate percentage
    percentage := (participation_duration::decimal / session_duration::decimal) * 100;
    
    -- Update the record
    NEW.participation_minutes := participation_duration;
    NEW.attendance_percentage := percentage;
    
    -- Determine attendance status
    IF percentage >= 80 THEN
      NEW.attendance_status := 'present';
    ELSIF percentage >= 20 THEN
      NEW.attendance_status := 'leave_early';
    ELSE
      NEW.attendance_status := 'absent';
    END IF;
  ELSE
    -- If times are not complete, mark as absent
    NEW.participation_minutes := 0;
    NEW.attendance_percentage := 0.00;
    NEW.attendance_status := 'absent';
  END IF;

  NEW.marked_at := now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic attendance calculation
CREATE TRIGGER calculate_attendance_trigger
  BEFORE INSERT OR UPDATE ON cadet_attendance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_attendance_status();

-- Create trigger for updating timestamps
CREATE TRIGGER update_practice_sessions_updated_at
  BEFORE UPDATE ON practice_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate attendance report for a practice session
CREATE OR REPLACE FUNCTION get_attendance_report(session_id uuid)
RETURNS TABLE (
  cadet_name text,
  application_number text,
  platoon text,
  entry_time time,
  exit_time time,
  participation_minutes integer,
  attendance_percentage decimal,
  attendance_status attendance_status
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can generate attendance reports';
  END IF;

  RETURN QUERY
  SELECT 
    c.name_full,
    c.application_number,
    c.platoon,
    ca.entry_time,
    ca.exit_time,
    ca.participation_minutes,
    ca.attendance_percentage,
    ca.attendance_status
  FROM cadets c
  LEFT JOIN cadet_attendance ca ON c.id = ca.cadet_id AND ca.practice_session_id = session_id
  ORDER BY c.name_full;
END;
$$;