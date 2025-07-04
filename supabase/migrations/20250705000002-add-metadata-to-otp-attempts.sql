-- Add metadata JSONB column to otp_attempts table to store additional e-commerce analytics
ALTER TABLE public.otp_attempts ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for better query performance on JSON data
CREATE INDEX idx_otp_attempts_metadata ON public.otp_attempts USING GIN (metadata);

COMMENT ON COLUMN public.otp_attempts.metadata IS 'Stores additional structured data like e-commerce activity details';
