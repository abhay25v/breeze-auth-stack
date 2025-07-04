import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shield, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoginAttempt {
  id: string;
  user_id: string | null;
  session_id: string;
  risk_score: number;
  otp_code: string;
  is_valid: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserAnalytics {
  id: string;
  user_id: string | null;
  session_id: string;
  page_url: string | null;
  user_agent: string | null;
  typing_wpm: number;
  typing_keystrokes: number;
  typing_pauses: number;
  typing_corrections: number;
  mouse_clicks: number;
  mouse_movements: number;
  mouse_velocity: number;
  mouse_idle_time: number;
  scroll_depth: number;
  scroll_speed: number;
  scroll_events: number;
  focus_changes: number;
  focus_time: number;
  tab_switches: number;
  session_duration: number;
  page_views: number;
  interactions_count: number;
  created_at: string;
  updated_at: string;
}

const AdminPage = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLoginAttempts = async () => {
    try {
      console.log('Fetching OTP attempts...');
      setIsLoading(true);
      setError(null);

      // Fetch both OTP attempts and user analytics
      const [attemptsResult, analyticsResult] = await Promise.all([
        supabase
          .from('otp_attempts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
        supabase
          .from('user_analytics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (attemptsResult.error) {
        console.error('Supabase fetch error:', attemptsResult.error);
        throw new Error(attemptsResult.error.message);
      }

      if (analyticsResult.error) {
        console.error('Analytics fetch error:', analyticsResult.error);
        throw new Error(analyticsResult.error.message);
      }

      console.log('Fetched attempts:', attemptsResult.data?.length || 0, 'records');
      console.log('Fetched analytics:', analyticsResult.data?.length || 0, 'records');
      setAttempts(attemptsResult.data || []);
      setAnalytics(analyticsResult.data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch login attempts';
      setError(errorMessage);
      toast({
        title: "Failed to Load Data",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  const getRiskBadgeVariant = (riskScore: number) => {
    if (riskScore >= 70) return 'destructive';
    if (riskScore >= 40) return 'secondary';
    return 'default';
  };

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 70) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatUserId = (userId: string | null) => {
    if (!userId) return 'Anonymous';
    return userId.substring(0, 8) + '...';
  };

  const getValidationStatus = (isValid: boolean) => {
    return isValid ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Valid
      </Badge>
    ) : (
      <Badge variant="destructive">
        Invalid
      </Badge>
    );
  };

  const stats = {
    total: attempts.length,
    highRisk: attempts.filter(a => a.risk_score >= 70).length,
    failed: attempts.filter(a => !a.is_valid).length,
    unique: new Set(attempts.map(a => a.session_id)).size,
    totalAnalytics: analytics.length,
    avgTypingSpeed: analytics.length > 0 ? Math.round(analytics.reduce((sum, a) => sum + a.typing_wpm, 0) / analytics.length) : 0
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor login attempts and security events</p>
          </div>
          <Button onClick={fetchLoginAttempts} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-destructive" />
                Failed Attempts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Analytics Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalytics}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Typing Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTypingSpeed} WPM</div>
            </CardContent>
          </Card>
        </div>

        {/* User Analytics Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Behavior Analytics</CardTitle>
            <CardDescription>
              Detailed behavior tracking data from user sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No analytics data found.</p>
                <p className="text-sm">Visit the <a href="/shop" className="text-primary underline">Shop page</a> and interact with it to generate analytics data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Typing</TableHead>
                      <TableHead>Mouse</TableHead>
                      <TableHead>Scroll</TableHead>
                      <TableHead>Focus</TableHead>
                      <TableHead>Interactions</TableHead>
                      <TableHead>Page</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono text-xs">
                          {record.session_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div><span className="font-medium">WPM:</span> {record.typing_wpm}</div>
                            <div><span className="font-medium">Keys:</span> {record.typing_keystrokes}</div>
                            <div><span className="font-medium">Pauses:</span> {record.typing_pauses}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div><span className="font-medium">Clicks:</span> {record.mouse_clicks}</div>
                            <div><span className="font-medium">Moves:</span> {record.mouse_movements}</div>
                            <div><span className="font-medium">Velocity:</span> {record.mouse_velocity.toFixed(1)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div><span className="font-medium">Depth:</span> {record.scroll_depth}%</div>
                            <div><span className="font-medium">Speed:</span> {record.scroll_speed.toFixed(1)}</div>
                            <div><span className="font-medium">Events:</span> {record.scroll_events}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div><span className="font-medium">Changes:</span> {record.focus_changes}</div>
                            <div><span className="font-medium">Time:</span> {Math.round(record.focus_time/1000)}s</div>
                            <div><span className="font-medium">Tabs:</span> {record.tab_switches}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <Badge variant="outline">{record.interactions_count}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate">
                          {record.page_url || 'Unknown'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(record.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Attempts & Risk Assessment Table */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment & OTP Attempts</CardTitle>
            <CardDescription>
              Risk scoring results and OTP validation attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading attempts...
              </div>
            ) : attempts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No risk assessment data found.</p>
                <p className="text-sm">Risk assessments will appear here after analytics data is processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Risk Factors</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Behavior Stats</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-mono text-sm">
                          {formatTimestamp(attempt.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatUserId(attempt.user_id)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {attempt.session_id.substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{attempt.risk_score}</span>
                            <Badge variant={getRiskBadgeVariant(attempt.risk_score)}>
                              {getRiskLabel(attempt.risk_score)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {attempt.risk_score >= 70 && (
                              <Badge variant="destructive" className="text-xs">Suspicious Pattern</Badge>
                            )}
                            {attempt.risk_score >= 40 && attempt.risk_score < 70 && (
                              <Badge variant="secondary" className="text-xs">Unusual Behavior</Badge>
                            )}
                            {attempt.risk_score < 40 && (
                              <Badge variant="default" className="text-xs">Normal Activity</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getValidationStatus(attempt.is_valid)}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div><span className="font-medium">Session:</span> {attempt.session_id.substring(0, 8)}...</div>
                            <div><span className="font-medium">IP:</span> {attempt.ip_address || 'Unknown'}</div>
                            <div className="max-w-xs truncate"><span className="font-medium">Agent:</span> {attempt.user_agent || 'Unknown'}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminPage;