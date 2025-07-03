import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, otpCode, riskScore } = await req.json();
    
    if (!sessionId || !otpCode || riskScore === undefined) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: sessionId, otpCode, riskScore'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract user info from request
    const authHeader = req.headers.get('authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Mock OTP validation logic (in production, this would be more sophisticated)
    const validOtpCode = '123456'; // Mock valid OTP
    const isValid = otpCode === validOtpCode;
    
    // Get client IP and user agent
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log the OTP attempt to database
    const { error: logError } = await supabase
      .from('otp_attempts')
      .insert({
        user_id: userId,
        session_id: sessionId,
        risk_score: riskScore,
        otp_code: otpCode,
        is_valid: isValid,
        ip_address: clientIP,
        user_agent: userAgent
      });

    if (logError) {
      console.error('Error logging OTP attempt:', logError);
    }

    console.log('OTP validation attempt:', {
      sessionId,
      otpCode,
      isValid,
      riskScore,
      userId,
      clientIP
    });

    if (isValid) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP validated successfully',
          sessionId,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid OTP code',
          message: 'The OTP code you entered is incorrect. Please try again.',
          sessionId,
          attemptsRemaining: 2 // Mock attempts remaining
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Error in validate-otp function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});