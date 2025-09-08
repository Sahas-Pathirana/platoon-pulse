-- Create or replace RPC to fetch attendance report for a practice session
CREATE OR REPLACE FUNCTION public.get_attendance_report(session_id uuid)
RETURNS TABLE (
  id uuid,
  cadet_name text,
  application_number text,
  platoon text,
  entry_time text,
  exit_time text,
  participation_minutes integer,
  attendance_percentage numeric,
  attendance_status public.attendance_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ca.id,
    c.name_full AS cadet_name,
    c.application_number,
    c.platoon,
    ca.entry_time,
    ca.exit_time,
    ca.participation_minutes,
    ca.attendance_percentage,
    ca.attendance_status
  FROM cadet_attendance ca
  JOIN cadets c ON c.id = ca.cadet_id
  WHERE ca.practice_session_id = session_id
    AND (
      public.is_admin() OR ca.cadet_id = public.current_cadet_id()
    )
  ORDER BY c.name_full;
$$;