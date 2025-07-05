import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Database, AlertCircle, CheckCircle } from "lucide-react";

interface DatabaseDebuggerProps {
  sessionId?: string;
}

export const DatabaseDebugger: React.FC<DatabaseDebuggerProps> = ({ sessionId }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDatabaseDiagnostics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const diagnostics: any = {
        timestamp: new Date().toISOString(),
        sessionId: sessionId || 'all',
        results: {}
      };

      // Test 1: Check if user_analytics table exists and has data
      console.log('🔍 Checking user_analytics table...');
      const { data: analyticsData, error: analyticsError, count: analyticsCount } = await supabase
        .from('user_analytics')
        .select('*', { count: 'exact' })
        .limit(5);

      diagnostics.results.user_analytics = {
        exists: !analyticsError,
        error: analyticsError?.message,
        totalRecords: analyticsCount,
        sampleData: analyticsData,
        status: analyticsError ? 'error' : analyticsCount > 0 ? 'success' : 'warning'
      };

      // Test 2: Check if otp_attempts table exists and has data
      console.log('🔍 Checking otp_attempts table...');
      const { data: otpData, error: otpError, count: otpCount } = await supabase
        .from('otp_attempts')
        .select('*', { count: 'exact' })
        .limit(5);

      diagnostics.results.otp_attempts = {
        exists: !otpError,
        error: otpError?.message,
        totalRecords: otpCount,
        sampleData: otpData,
        status: otpError ? 'error' : otpCount > 0 ? 'success' : 'warning'
      };

      // Test 3: Check specific session data if provided
      if (sessionId) {
        console.log(`🔍 Checking session ${sessionId}...`);
        
        const { data: sessionAnalytics, error: sessionAnalyticsError } = await supabase
          .from('user_analytics')
          .select('*')
          .eq('session_id', sessionId);

        const { data: sessionOtp, error: sessionOtpError } = await supabase
          .from('otp_attempts')
          .select('*')
          .eq('session_id', sessionId);

        diagnostics.results.session_specific = {
          sessionId,
          analytics: {
            count: sessionAnalytics?.length || 0,
            error: sessionAnalyticsError?.message,
            data: sessionAnalytics
          },
          otp_attempts: {
            count: sessionOtp?.length || 0,
            error: sessionOtpError?.message,
            data: sessionOtp
          },
          status: (sessionAnalytics?.length || 0) > 0 || (sessionOtp?.length || 0) > 0 ? 'success' : 'warning'
        };
      }

      // Test 4: Check database connection
      console.log('🔍 Testing database connection...');
      const { data: connectionTest, error: connectionError } = await supabase
        .from('user_analytics')
        .select('count')
        .limit(1);

      diagnostics.results.connection = {
        status: connectionError ? 'error' : 'success',
        error: connectionError?.message,
        test: 'SELECT count query'
      };

      // Test 5: Check RLS policies
      console.log('🔍 Checking RLS policies...');
      const { data: currentUser } = await supabase.auth.getUser();
      diagnostics.results.auth = {
        isAuthenticated: !!currentUser.user,
        userId: currentUser.user?.id,
        status: currentUser.user ? 'success' : 'warning'
      };

      setDebugInfo(diagnostics);
      console.log('📋 Diagnostics complete:', diagnostics);

    } catch (err) {
      console.error('❌ Diagnostics failed:', err);
      setError(err instanceof Error ? err.message : 'Diagnostics failed');
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = async () => {
    try {
      console.log('🧪 Generating test analytics data...');
      
      const testSessionId = `test-session-${Date.now()}`;
      
      // Insert test analytics data
      const { data: testAnalytics, error: analyticsError } = await supabase
        .from('user_analytics')
        .insert({
          session_id: testSessionId,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          typing_wpm: 45,
          typing_keystrokes: 250,
          typing_corrections: 15,
          mouse_clicks: 12,
          mouse_movements: 850,
          mouse_velocity: 245.5,
          mouse_idle_time: 5000,
          scroll_depth: 75,
          scroll_speed: 125.3,
          scroll_events: 18,
          focus_changes: 3,
          focus_time: 45000,
          tab_switches: 2,
          session_duration: 60000,
          page_views: 1,
          interactions_count: 280,
          metadata: {
            test_data: true,
            generated_at: new Date().toISOString()
          }
        })
        .select();

      if (analyticsError) {
        throw new Error(`Failed to insert analytics: ${analyticsError.message}`);
      }

      // Insert test OTP attempt data
      const { data: testOtp, error: otpError } = await supabase
        .from('otp_attempts')
        .insert({
          session_id: testSessionId,
          risk_score: 25,
          otp_code: `TEST_${Date.now()}`,
          is_valid: true,
          user_agent: navigator.userAgent,
          metadata: {
            test_data: true,
            generated_at: new Date().toISOString()
          }
        })
        .select();

      if (otpError) {
        throw new Error(`Failed to insert OTP attempt: ${otpError.message}`);
      }

      console.log('✅ Test data generated successfully:', { testAnalytics, testOtp });
      
      // Refresh diagnostics
      await runDatabaseDiagnostics();
      
    } catch (err) {
      console.error('❌ Test data generation failed:', err);
      setError(err instanceof Error ? err.message : 'Test data generation failed');
    }
  };

  useEffect(() => {
    runDatabaseDiagnostics();
  }, [sessionId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Diagnostics
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDatabaseDiagnostics}
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={generateTestData}
              disabled={loading}
            >
              Generate Test Data
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Running diagnostics...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Error: {error}</p>
          </div>
        )}

        {debugInfo && !loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User Analytics Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(debugInfo.results.user_analytics?.status)}
                    User Analytics Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Status:</span>
                      {getStatusBadge(debugInfo.results.user_analytics?.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Total Records:</span>
                      <Badge variant="outline">{debugInfo.results.user_analytics?.totalRecords || 0}</Badge>
                    </div>
                    {debugInfo.results.user_analytics?.error && (
                      <div className="text-xs text-red-600 mt-2">
                        Error: {debugInfo.results.user_analytics.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* OTP Attempts Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(debugInfo.results.otp_attempts?.status)}
                    OTP Attempts Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Status:</span>
                      {getStatusBadge(debugInfo.results.otp_attempts?.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Total Records:</span>
                      <Badge variant="outline">{debugInfo.results.otp_attempts?.totalRecords || 0}</Badge>
                    </div>
                    {debugInfo.results.otp_attempts?.error && (
                      <div className="text-xs text-red-600 mt-2">
                        Error: {debugInfo.results.otp_attempts.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Database Connection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(debugInfo.results.connection?.status)}
                    Database Connection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Status:</span>
                      {getStatusBadge(debugInfo.results.connection?.status)}
                    </div>
                    {debugInfo.results.connection?.error && (
                      <div className="text-xs text-red-600 mt-2">
                        Error: {debugInfo.results.connection.error}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Authentication */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(debugInfo.results.auth?.status)}
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Status:</span>
                      {getStatusBadge(debugInfo.results.auth?.status)}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">User ID:</span>
                      <code className="text-xs">{debugInfo.results.auth?.userId || 'None'}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Session-specific data */}
            {debugInfo.results.session_specific && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {getStatusIcon(debugInfo.results.session_specific?.status)}
                    Session-Specific Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Session ID:</span>
                      <code className="text-xs">{debugInfo.results.session_specific.sessionId}</code>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Analytics Records:</span>
                      <Badge variant="outline">{debugInfo.results.session_specific.analytics.count}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs">OTP Records:</span>
                      <Badge variant="outline">{debugInfo.results.session_specific.otp_attempts.count}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Raw Data Sample */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sample Data</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">User Analytics Sample</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(debugInfo.results.user_analytics?.sampleData, null, 2)}
                    </pre>
                  </details>
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">OTP Attempts Sample</summary>
                    <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(debugInfo.results.otp_attempts?.sampleData, null, 2)}
                    </pre>
                  </details>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
