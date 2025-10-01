-- Remove temporary_password column from pending_cadets table
ALTER TABLE pending_cadets DROP COLUMN IF EXISTS temporary_password;

-- Remove temporary_password column from cadets table
ALTER TABLE cadets DROP COLUMN IF EXISTS temporary_password;