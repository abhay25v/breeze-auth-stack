-- This script will fix any issues with metadata columns and ensure they're of JSONB type

-- First check what the current structure looks like
SELECT 
  table_name,
  column_name,
  data_type
FROM 
  information_schema.columns
WHERE 
  table_name IN ('otp_attempts', 'user_analytics')
ORDER BY 
  table_name, column_name;

-- Add or fix metadata column on otp_attempts
ALTER TABLE public.otp_attempts 
  DROP COLUMN IF EXISTS metadata;
  
ALTER TABLE public.otp_attempts 
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  
CREATE INDEX IF NOT EXISTS idx_otp_attempts_metadata 
  ON public.otp_attempts USING GIN (metadata);

-- Add or fix metadata column on user_analytics
ALTER TABLE public.user_analytics 
  DROP COLUMN IF EXISTS metadata;
  
ALTER TABLE public.user_analytics 
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  
CREATE INDEX IF NOT EXISTS idx_user_analytics_metadata 
  ON public.user_analytics USING GIN (metadata);

-- Test if metadata column works with a sample entry
INSERT INTO public.otp_attempts (session_id, risk_score, otp_code, is_valid, metadata)
VALUES ('test_session', 10, 'TEST_METADATA', true, '{"test_key": "test_value"}'::jsonb);

-- Clean up test entry
DELETE FROM public.otp_attempts WHERE otp_code = 'TEST_METADATA';
