-- Helper function to get current user's cadet_id
CREATE OR REPLACE FUNCTION public.current_cadet_id(user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT cadet_id FROM public.user_profiles WHERE id = user_id;
$$;

-- achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.achievements;
CREATE POLICY "Admins can do everything on achievements"
  ON public.achievements
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own achievements"
  ON public.achievements
  FOR SELECT
  USING (achievements.cadet_id = public.current_cadet_id());

-- attendance_records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.attendance_records;
CREATE POLICY "Admins can do everything on attendance_records"
  ON public.attendance_records
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own attendance_records"
  ON public.attendance_records
  FOR SELECT
  USING (attendance_records.cadet_id = public.current_cadet_id());

-- disciplinary_actions
ALTER TABLE public.disciplinary_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.disciplinary_actions;
CREATE POLICY "Admins can do everything on disciplinary_actions"
  ON public.disciplinary_actions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own disciplinary_actions"
  ON public.disciplinary_actions
  FOR SELECT
  USING (disciplinary_actions.cadet_id = public.current_cadet_id());

-- educational_qualifications
ALTER TABLE public.educational_qualifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.educational_qualifications;
CREATE POLICY "Admins can do everything on educational_qualifications"
  ON public.educational_qualifications
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own educational_qualifications"
  ON public.educational_qualifications
  FOR SELECT
  USING (educational_qualifications.cadet_id = public.current_cadet_id());

-- events_participation
ALTER TABLE public.events_participation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.events_participation;
CREATE POLICY "Admins can do everything on events_participation"
  ON public.events_participation
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own events_participation"
  ON public.events_participation
  FOR SELECT
  USING (events_participation.cadet_id = public.current_cadet_id());

-- family_contacts
ALTER TABLE public.family_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.family_contacts;
CREATE POLICY "Admins can do everything on family_contacts"
  ON public.family_contacts
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own family_contacts"
  ON public.family_contacts
  FOR SELECT
  USING (family_contacts.cadet_id = public.current_cadet_id());

-- foreign_visits
ALTER TABLE public.foreign_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.foreign_visits;
CREATE POLICY "Admins can do everything on foreign_visits"
  ON public.foreign_visits
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own foreign_visits"
  ON public.foreign_visits
  FOR SELECT
  USING (foreign_visits.cadet_id = public.current_cadet_id());

-- medical_records
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.medical_records;
CREATE POLICY "Admins can do everything on medical_records"
  ON public.medical_records
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own medical_records"
  ON public.medical_records
  FOR SELECT
  USING (medical_records.cadet_id = public.current_cadet_id());

-- performance_evaluations
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.performance_evaluations;
CREATE POLICY "Admins can do everything on performance_evaluations"
  ON public.performance_evaluations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own performance_evaluations"
  ON public.performance_evaluations
  FOR SELECT
  USING (performance_evaluations.cadet_id = public.current_cadet_id());

-- promotions
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.promotions;
CREATE POLICY "Admins can do everything on promotions"
  ON public.promotions
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own promotions"
  ON public.promotions
  FOR SELECT
  USING (promotions.cadet_id = public.current_cadet_id());

-- special_events
ALTER TABLE public.special_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.special_events;
CREATE POLICY "Admins can do everything on special_events"
  ON public.special_events
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own special_events"
  ON public.special_events
  FOR SELECT
  USING (special_events.cadet_id = public.current_cadet_id());

-- term_evaluations
ALTER TABLE public.term_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.term_evaluations;
CREATE POLICY "Admins can do everything on term_evaluations"
  ON public.term_evaluations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own term_evaluations"
  ON public.term_evaluations
  FOR SELECT
  USING (term_evaluations.cadet_id = public.current_cadet_id());

-- training_camps
ALTER TABLE public.training_camps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON public.training_camps;
CREATE POLICY "Admins can do everything on training_camps"
  ON public.training_camps
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Students can view own training_camps"
  ON public.training_camps
  FOR SELECT
  USING (training_camps.cadet_id = public.current_cadet_id());