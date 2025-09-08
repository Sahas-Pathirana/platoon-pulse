-- Auto-fill cadet_id on cadet_attendance inserts using the current user profile
CREATE OR REPLACE FUNCTION public.set_cadet_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If cadet_id not provided by the client, derive it from the current user profile
  IF NEW.cadet_id IS NULL THEN
    NEW.cadet_id := public.current_cadet_id();
  END IF;

  -- Validate presence after derivation
  IF NEW.cadet_id IS NULL THEN
    RAISE EXCEPTION 'No cadet profile linked to this user. Please contact an admin to link your account.';
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (idempotent)
DROP TRIGGER IF EXISTS trg_set_cadet_id_on_insert ON public.cadet_attendance;
CREATE TRIGGER trg_set_cadet_id_on_insert
BEFORE INSERT ON public.cadet_attendance
FOR EACH ROW
EXECUTE FUNCTION public.set_cadet_id_on_insert();