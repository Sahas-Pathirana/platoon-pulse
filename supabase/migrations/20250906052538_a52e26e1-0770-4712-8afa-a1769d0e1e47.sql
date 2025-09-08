-- Create practice_sessions table for attendance management
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  practice_date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration_minutes integer GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 60
  ) STORED,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on practice_sessions
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for practice_sessions
CREATE POLICY "Admins can do everything on practice_sessions" 
ON public.practice_sessions 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Students can view practice_sessions" 
ON public.practice_sessions 
FOR SELECT 
TO authenticated
USING (true);

-- Create cadet_attendance table for attendance tracking
CREATE TABLE IF NOT EXISTS public.cadet_attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practice_session_id uuid REFERENCES public.practice_sessions(id) ON DELETE CASCADE NOT NULL,
  cadet_id uuid REFERENCES public.cadets(id) ON DELETE CASCADE NOT NULL,
  entry_time text,
  exit_time text,
  participation_minutes integer DEFAULT 0,
  attendance_percentage numeric(5,2) DEFAULT 0.0,
  attendance_status text DEFAULT 'not_marked' CHECK (attendance_status IN ('present', 'leave_early', 'absent', 'not_marked')),
  marked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(practice_session_id, cadet_id)
);

-- Enable RLS on cadet_attendance
ALTER TABLE public.cadet_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for cadet_attendance
CREATE POLICY "Admins can do everything on cadet_attendance" 
ON public.cadet_attendance 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Students can view own cadet_attendance" 
ON public.cadet_attendance 
FOR SELECT 
TO authenticated
USING (cadet_id = current_cadet_id());

CREATE POLICY "Students can insert own cadet_attendance" 
ON public.cadet_attendance 
FOR INSERT 
TO authenticated
WITH CHECK (cadet_id = current_cadet_id());

CREATE POLICY "Students can update own cadet_attendance" 
ON public.cadet_attendance 
FOR UPDATE 
TO authenticated
USING (cadet_id = current_cadet_id())
WITH CHECK (cadet_id = current_cadet_id());

-- Create trigger for practice_sessions updated_at
CREATE TRIGGER update_practice_sessions_updated_at
BEFORE UPDATE ON public.practice_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();