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

const AdminPage = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLoginAttempts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('otp_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setAttempts(data || []);
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
    unique: new Set(attempts.map(a => a.session_id)).size
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
              <CardTitle className="text-sm font-medium">Unique Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique}</div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Attempts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Login Attempts & Security Events</CardTitle>
            <CardDescription>
              Recent OTP validation attempts with risk assessment data
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
                No login attempts found. Attempts will appear here after users interact with the risk assessment system.
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