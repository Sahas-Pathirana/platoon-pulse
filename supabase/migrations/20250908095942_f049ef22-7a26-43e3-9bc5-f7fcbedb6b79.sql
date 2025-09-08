-- Create cadet linking requests table
CREATE TABLE public.cadet_linking_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_number text NOT NULL,
  full_name text NOT NULL,
  date_of_birth date,
  additional_info text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cadet_linking_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own requests
CREATE POLICY "Students can view own linking requests" 
ON public.cadet_linking_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Students can create their own requests
CREATE POLICY "Students can create linking requests" 
ON public.cadet_linking_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all requests
CREATE POLICY "Admins can manage all linking requests" 
ON public.cadet_linking_requests 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_cadet_linking_requests_updated_at
BEFORE UPDATE ON public.cadet_linking_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to approve linking request
CREATE OR REPLACE FUNCTION public.approve_cadet_linking(request_id uuid, admin_notes_param text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_record cadet_linking_requests%ROWTYPE;
  cadet_record cadets%ROWTYPE;
  result json;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can approve linking requests';
  END IF;

  -- Get the linking request
  SELECT * INTO request_record 
  FROM cadet_linking_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Linking request not found or already processed'
    );
  END IF;

  -- Find matching cadet record by application number
  SELECT * INTO cadet_record 
  FROM cadets 
  WHERE application_number = request_record.application_number;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No cadet record found with application number: ' || request_record.application_number
    );
  END IF;

  -- Update user profile with cadet_id
  UPDATE user_profiles 
  SET cadet_id = cadet_record.id, updated_at = now()
  WHERE id = request_record.user_id;

  -- Update request status
  UPDATE cadet_linking_requests 
  SET 
    status = 'approved',
    admin_notes = admin_notes_param,
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Cadet account successfully linked'
  );
END;
$$;

-- Function to reject linking request
CREATE OR REPLACE FUNCTION public.reject_cadet_linking(request_id uuid, admin_notes_param text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject linking requests';
  END IF;

  -- Update request status
  UPDATE cadet_linking_requests 
  SET 
    status = 'rejected',
    admin_notes = admin_notes_param,
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Linking request not found or already processed'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Linking request rejected'
  );
END;
$$;