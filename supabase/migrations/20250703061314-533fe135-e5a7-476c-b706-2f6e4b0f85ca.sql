-- Create table for OTP attempt logging
CREATE TABLE public.otp_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  otp_code TEXT NOT NULL,
  is_valid BOOLEAN NOT NULL DEFAULT FALSE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.otp_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for OTP attempts
CREATE POLICY "Users can view their own OTP attempts" 
ON public.otp_attempts 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create OTP attempts" 
ON public.otp_attempts 
FOR INSERT 
WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_otp_attempts_session_id ON public.otp_attempts(session_id);
CREATE INDEX idx_otp_attempts_user_id ON public.otp_attempts(user_id);
CREATE INDEX idx_otp_attempts_created_at ON public.otp_attempts(created_at);