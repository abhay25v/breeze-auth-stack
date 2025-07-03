import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const behaviorData = await req.json();
    
    // Mock risk score calculation based on behavior data
    const calculateRiskScore = (data: any) => {
      let risk = 0;
      
      // Typing behavior risk factors
      if (data.typing) {
        if (data.typing.wpm > 100) risk += 10; // Very fast typing
        if (data.typing.accuracy < 80) risk += 15; // Low accuracy
        if (data.typing.backspaces > data.typing.keystrokes * 0.3) risk += 10; // High backspace ratio
      }
      
      // Mouse behavior risk factors  
      if (data.mouse) {
        if (data.mouse.averageSpeed > 1000) risk += 15; // Erratic mouse movement
        if (data.mouse.clicks > 100) risk += 10; // Excessive clicking
        if (data.mouse.idleTime > 300000) risk += 20; // Long idle periods
      }
      
      // Focus behavior risk factors
      if (data.focus) {
        if (data.focus.tabSwitches > 20) risk += 15; // Frequent tab switching
        if (data.focus.blurEvents > data.focus.focusEvents) risk += 10; // More blur than focus
      }
      
      // Scroll behavior risk factors
      if (data.scroll) {
        if (data.scroll.scrollSpeed > 5000) risk += 10; // Very fast scrolling
      }
      
      // Session factors
      if (data.sessionDuration) {
        if (data.sessionDuration < 60000) risk += 20; // Very short sessions
        if (data.sessionDuration > 3600000) risk += 10; // Very long sessions
      }
      
      // Normalize to 0-100 scale
      return Math.min(Math.max(risk, 0), 100);
    };
    
    const riskScore = calculateRiskScore(behaviorData);
    
    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    
    console.log('Risk assessment completed:', { riskScore, riskLevel, sessionId: behaviorData.sessionId });
    
    return new Response(
      JSON.stringify({
        success: true,
        riskScore,
        riskLevel,
        timestamp: new Date().toISOString(),
        sessionId: behaviorData.sessionId,
        factors: {
          typing: behaviorData.typing ? 'analyzed' : 'not available',
          mouse: behaviorData.mouse ? 'analyzed' : 'not available',
          focus: behaviorData.focus ? 'analyzed' : 'not available',
          scroll: behaviorData.scroll ? 'analyzed' : 'not available'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in risk-score function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to calculate risk score',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});