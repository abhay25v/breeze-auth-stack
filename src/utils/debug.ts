import { supabase } from '@/integrations/supabase/client';

export const testAnalyticsConnection = async () => {
  console.log('🔍 Testing analytics connection...');
  
  try {
    // Test 1: Simple select to verify connection
    const { data: testData, error: testError } = await supabase
      .from('user_analytics')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return { success: false, error: testError.message };
    }
    
    console.log('✅ Database connection successful');
    
    // Test 2: Try inserting a test record
    const testSessionId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('user_analytics')
      .insert({
        session_id: testSessionId,
        user_id: null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        typing_wpm: 0,
        typing_keystrokes: 0,
        typing_corrections: 0,
        mouse_clicks: 0,
        mouse_movements: 0,
        mouse_velocity: 0,
        mouse_idle_time: 0,
        scroll_depth: 0,
        scroll_speed: 0,
        scroll_events: 0,
        focus_changes: 0,
        focus_time: 0,
        tab_switches: 0,
        session_duration: 0,
        page_views: 1,
        interactions_count: 0,
        metadata: { test: true }
      });
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      return { success: false, error: insertError.message };
    }
    
    console.log('✅ Insert test successful');
    
    // Test 3: Verify the record was inserted
    const { data: verifyData, error: verifyError } = await supabase
      .from('user_analytics')
      .select('*')
      .eq('session_id', testSessionId)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return { success: false, error: verifyError.message };
    }
    
    console.log('✅ Verification successful:', verifyData);
    
    // Clean up test record
    await supabase
      .from('user_analytics')
      .delete()
      .eq('session_id', testSessionId);
    
    return { success: true, message: 'All tests passed!' };
    
  } catch (error: any) {
    console.error('❌ Test failed with exception:', error);
    return { success: false, error: error.message };
  }
};

// Add this to the window object for easy testing
if (typeof window !== 'undefined') {
  (window as any).testAnalyticsConnection = testAnalyticsConnection;
}
