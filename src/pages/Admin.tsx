import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Shield, AlertTriangle, Users, ShoppingCart, Eye, Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SessionActivityModal } from '@/components/analytics/SessionActivityModal';

// Modify interfaces to handle optional metadata
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
  metadata?: any; // Make metadata optional
}

interface UserAnalytics {
  id: string;
  user_id: string | null;
  session_id: string;
  page_url: string | null;
  user_agent: string | null;
  typing_wpm: number;
  typing_keystrokes: number;
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
  metadata?: any; // Make metadata optional
}

// New interface for shop activities
interface ShopActivity {
  sessionId: string;
  timestamp: string;
  productViews: number[];
  cartActions: number;
  wishlistActions: number;
  categoryChanges: number;
  searches: number;
}

const AdminPage = () => {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [shopActivities, setShopActivities] = useState<ShopActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { toast } = useToast();

  const fetchLoginAttempts = async () => {
    try {
      console.log('Fetching data...');
      setIsLoading(true);
      setError(null);

      // Fetch both tables with explicit JSON logging for debugging
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

      // Type assertions to inform TypeScript about the data structure
      const attemptsData = attemptsResult.data as LoginAttempt[];
      const analyticsData = analyticsResult.data as UserAnalytics[];
      
      // Set analytics data
      setAnalytics(analyticsData || []);
      
      // Remove duplicates and filter for security-related attempts
      const uniqueAttempts = removeDuplicateTimestamps(attemptsData || []);
      
      // Filter for security-related attempts
      const riskAttempts = uniqueAttempts.filter(a => 
        !a.otp_code.startsWith('SHOP_') || 
        a.otp_code.startsWith('AUTO_RISK')
      );
      setAttempts(riskAttempts);
      
      // Extract shop activity metrics
      const shopData: ShopActivity[] = [];
      const shopEntries = uniqueAttempts.filter(attempt => 
        attempt.otp_code?.startsWith('SHOP_ACTIVITY_')
      );
      
      for (const attempt of shopEntries) {
        try {
          let metadata = attempt.metadata;
          
          if (metadata) {
            const activity: ShopActivity = {
              sessionId: attempt.session_id,
              timestamp: attempt.created_at,
              productViews: Array.isArray(metadata.product_views) ? metadata.product_views : [],
              cartActions: Number(metadata.cart_actions) || 0,
              wishlistActions: Number(metadata.wishlist_actions) || 0,
              categoryChanges: Number(metadata.category_changes) || 0,
              searches: Number(metadata.searches) || 0
            };
            
            shopData.push(activity);
          }
        } catch (err) {
          console.error('Error processing shop activity:', err);
        }
      }
      
      // Also check user_analytics for shop_metrics
      for (const record of analyticsData || []) {
        try {
          const rawMeta = record.metadata;
          
          if (rawMeta && rawMeta.shop_metrics) {
            const shopMetrics = rawMeta.shop_metrics;
            const activity: ShopActivity = {
              sessionId: record.session_id,
              timestamp: record.created_at,
              productViews: Array.isArray(shopMetrics.product_views) ? shopMetrics.product_views : [],
              cartActions: Number(shopMetrics.cart_actions) || 0,
              wishlistActions: Number(shopMetrics.wishlist_actions) || 0,
              categoryChanges: Number(shopMetrics.category_changes) || 0,
              searches: Number(shopMetrics.searches) || 0
            };
            
            shopData.push(activity);
          }
        } catch (err) {
          console.error('Error extracting shop metrics from analytics:', err);
        }
      }
      
      setShopActivities(shopData);
      
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

  // Helper function to update session map with activity data
  const updateSessionMap = (
    sessionMap: Map<string, ShopActivity>, 
    activity: ShopActivity
  ) => {
    const existing = sessionMap.get(activity.sessionId);
    
    if (existing) {
      // Merge the activities
      const mergedProductViews = [...existing.productViews];
      
      // Add any new product views
      activity.productViews.forEach(id => {
        if (!mergedProductViews.includes(id)) {
          mergedProductViews.push(id);
        }
      });
      
      // Update the existing entry
      existing.productViews = mergedProductViews;
      existing.cartActions += activity.cartActions;
      existing.wishlistActions += activity.wishlistActions;
      existing.categoryChanges += activity.categoryChanges;
      existing.searches += activity.searches;
      
      // Use the most recent timestamp
      if (new Date(activity.timestamp) > new Date(existing.timestamp)) {
        existing.timestamp = activity.timestamp;
      }
    } else {
      // Add new entry
      sessionMap.set(activity.sessionId, activity);
    }
  };

  // Update the removeDuplicateTimestamps function to handle any object with created_at
  const removeDuplicateTimestamps = <T extends { created_at: string }>(items: T[]): T[] => {
    if (!items || !Array.isArray(items)) {
      console.warn('removeDuplicateTimestamps received invalid items:', items);
      return [];
    }
    
    const seen = new Set<string>();
    return items.filter(item => {
      try {
        // Safely handle potentially invalid date strings
        let timeKey: string;
        try {
          timeKey = new Date(item.created_at).toISOString().substring(0, 16);
        } catch (e) {
          console.warn('Invalid date format in item:', item);
          timeKey = String(Date.now()); // Use current time as fallback
        }
        
        if (seen.has(timeKey)) {
          return false;
        }
        seen.add(timeKey);
        return true;
      } catch (e) {
        console.warn('Error processing item in removeDuplicateTimestamps:', e);
        return false; // Skip items that cause errors
      }
    });
  };

  // Remove the automatic polling to stop constant refreshing
  useEffect(() => {
    fetchLoginAttempts();
  }, []);

  // Remove the visibility change polling
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     if (document.visibilityState === 'visible') {
  //       fetchLoginAttempts();
  //     }
  //   };
  //   
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  // }, []);

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

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowSessionModal(true);
  };

  const handleCloseSessionModal = () => {
    setShowSessionModal(false);
    setSelectedSessionId(null);
  };

  // Simplified stats that focus on the most important metrics
  const stats = {
    totalSessions: new Set([
      ...attempts.map(a => a.session_id),
      ...analytics.map(a => a.session_id)
    ]).size,
    highRisk: attempts.filter(a => a.risk_score >= 70).length,
    totalShopActivities: shopActivities.reduce((sum, a) => 
      sum + a.cartActions + a.wishlistActions + a.productViews.length + a.searches + a.categoryChanges, 0),
    productViews: shopActivities.reduce((sum, activity) => sum + activity.productViews.length, 0),
    cartActions: shopActivities.reduce((sum, activity) => sum + activity.cartActions, 0),
    avgTypingSpeed: analytics.length > 0 ? Math.round(analytics.reduce((sum, a) => sum + a.typing_wpm, 0) / analytics.length) : 0
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Behavior Analytics</h1>
            <p className="text-muted-foreground">Monitor user activity and security events</p>
          </div>
          <Button onClick={fetchLoginAttempts} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                High Risk Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.highRisk}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                Shop Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShopActivities}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-500" />
                Product Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.productViews}</div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main content using tabs for better organization */}
        <Tabs defaultValue="shop" className="space-y-4">
          <TabsList>
            <TabsTrigger value="shop">Shop Analytics</TabsTrigger>
            <TabsTrigger value="behavior">User Behavior</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
          </TabsList>
          
          {/* Shop Analytics Tab */}
          <TabsContent value="shop" className="space-y-4">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Shop Behavior Analytics</CardTitle>
                  <CardDescription>
                    User interactions with products and shopping features
                  </CardDescription>
                </div>
                {!isLoading && shopActivities.length === 0 && (
                  <Button size="sm" asChild>
                    <a href="/shop">Generate Data</a>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading shop data...
                  </div>
                ) : shopActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No shop activity data found.</p>
                    <p className="text-sm">Visit the <a href="/shop" className="text-primary underline font-medium">Shop page</a> and interact with products to generate data.</p>
                    <div className="mt-4">
                      <ol className="list-decimal text-left max-w-md mx-auto">
                        <li className="mb-1">Click on the Shop page link above</li>
                        <li className="mb-1">View different products by scrolling</li>
                        <li className="mb-1">Add items to cart and wishlist</li>
                        <li className="mb-1">Switch between categories</li>
                        <li className="mb-1">Search for products</li>
                        <li>Return to this page to see your activity</li>
                      </ol>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Product Views</TableHead>
                          <TableHead>Cart Actions</TableHead>
                          <TableHead>Wishlist</TableHead>
                          <TableHead>Categories</TableHead>
                          <TableHead>Searches</TableHead>
                          <TableHead>Last Activity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shopActivities.map((activity, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {activity.sessionId.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-green-50">
                                {activity.productViews.length}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50">
                                {activity.cartActions}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-red-50">
                                {activity.wishlistActions}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {activity.categoryChanges}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {activity.searches}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {formatTimestamp(activity.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* User Behavior Tab - Enhanced with detailed tracking information */}
          <TabsContent value="behavior" className="space-y-4">
            {/* Behavior Tracking Overview */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Behavior Tracking Overview
                </CardTitle>
                <CardDescription>
                  Our system tracks comprehensive user behavior patterns for security analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Typing Patterns
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Words per minute (WPM)</li>
                      <li>• Total keystrokes</li>
                      <li>• Typing corrections</li>
                      <li>• Typing pauses</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Mouse Behavior
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Click patterns</li>
                      <li>• Movement velocity</li>
                      <li>• Idle time tracking</li>
                      <li>• Movement count</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Scroll Patterns
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Scroll depth %</li>
                      <li>• Scroll speed</li>
                      <li>• Scroll events count</li>
                      <li>• Reading patterns</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      Focus & Navigation
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Focus time duration</li>
                      <li>• Focus changes</li>
                      <li>• Tab switches</li>
                      <li>• Page interactions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Score Calculation */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Risk Score Calculation
                </CardTitle>
                <CardDescription>
                  How behavioral patterns are analyzed to calculate risk scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Low Risk (0-39)
                    </Badge>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Consistent typing speed (30-80 WPM)</li>
                      <li>• Normal mouse movement patterns</li>
                      <li>• Appropriate scroll behavior</li>
                      <li>• Reasonable focus time</li>
                      <li>• Human-like interaction patterns</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Medium Risk (40-69)
                    </Badge>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Unusually fast/slow typing</li>
                      <li>• Irregular mouse movements</li>
                      <li>• Erratic scrolling patterns</li>
                      <li>• Frequent focus changes</li>
                      <li>• Inconsistent behavior</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                      High Risk (70-100)
                    </Badge>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Bot-like typing patterns</li>
                      <li>• Automated mouse movements</li>
                      <li>• Suspicious scroll behavior</li>
                      <li>• Minimal focus time</li>
                      <li>• Non-human interaction patterns</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Detailed Behavior Analytics</CardTitle>
                  <CardDescription>
                    Individual session behavior data with risk assessment
                  </CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {analytics.length} sessions
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Loading behavior data...
                  </div>
                ) : analytics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No user behavior data found.</p>
                    <p className="text-sm">Visit any page and interact with it to generate analytics data.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Typing Patterns</TableHead>
                          <TableHead>Mouse Behavior</TableHead>
                          <TableHead>Scroll Activity</TableHead>
                          <TableHead>Focus & Navigation</TableHead>
                          <TableHead>Session Stats</TableHead>
                          <TableHead>Risk Indicators</TableHead>
                          <TableHead>Page & Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.map((record) => {
                          // Calculate risk indicators based on behavior
                          const riskFactors = [];
                          if (record.typing_wpm > 120 || record.typing_wpm < 10) riskFactors.push('Unusual typing speed');
                          if (record.mouse_velocity > 1000) riskFactors.push('High mouse velocity');
                          if (record.scroll_speed > 500) riskFactors.push('Rapid scrolling');
                          if (record.focus_time < 5000) riskFactors.push('Low focus time');
                          if (record.typing_corrections > record.typing_keystrokes * 0.3) riskFactors.push('High corrections');
                          
                          const riskScore = Math.min(100, riskFactors.length * 20);
                          
                          return (
                            <TableRow key={record.id}>
                              <TableCell className="font-mono text-xs">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-1 font-mono text-xs hover:bg-blue-50 hover:text-blue-600"
                                  onClick={() => handleSessionClick(record.session_id)}
                                  title="Click to view detailed session activity"
                                >
                                  {record.session_id.substring(0, 8)}...
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">WPM:</span> 
                                    <Badge variant={record.typing_wpm > 120 || record.typing_wpm < 10 ? "destructive" : "outline"}>
                                      {record.typing_wpm}
                                    </Badge>
                                  </div>
                                  <div><span className="font-medium">Keys:</span> {record.typing_keystrokes}</div>
                                  <div><span className="font-medium">Corrections:</span> {record.typing_corrections}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div><span className="font-medium">Clicks:</span> {record.mouse_clicks}</div>
                                  <div><span className="font-medium">Moves:</span> {record.mouse_movements}</div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Velocity:</span>
                                    <Badge variant={record.mouse_velocity > 1000 ? "destructive" : "outline"}>
                                      {record.mouse_velocity.toFixed(1)}
                                    </Badge>
                                  </div>
                                  <div><span className="font-medium">Idle:</span> {Math.round(record.mouse_idle_time/1000)}s</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div><span className="font-medium">Depth:</span> {record.scroll_depth}%</div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Speed:</span>
                                    <Badge variant={record.scroll_speed > 500 ? "destructive" : "outline"}>
                                      {record.scroll_speed.toFixed(1)}
                                    </Badge>
                                  </div>
                                  <div><span className="font-medium">Events:</span> {record.scroll_events}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div><span className="font-medium">Changes:</span> {record.focus_changes}</div>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Time:</span>
                                    <Badge variant={record.focus_time < 5000 ? "destructive" : "outline"}>
                                      {Math.round(record.focus_time/1000)}s
                                    </Badge>
                                  </div>
                                  <div><span className="font-medium">Tabs:</span> {record.tab_switches}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div><span className="font-medium">Duration:</span> {Math.round(record.session_duration/1000)}s</div>
                                  <div><span className="font-medium">Page Views:</span> {record.page_views}</div>
                                  <div>
                                    <Badge className="bg-blue-50 hover:bg-blue-100">
                                      {record.interactions_count} interactions
                                    </Badge>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">Risk:</span>
                                    <Badge variant={getRiskBadgeVariant(riskScore)}>
                                      {riskScore}
                                    </Badge>
                                  </div>
                                  {riskFactors.length > 0 && (
                                    <div className="max-w-xs">
                                      <div className="text-xs text-muted-foreground">
                                        {riskFactors.slice(0, 2).map((factor, idx) => (
                                          <div key={idx} className="truncate">• {factor}</div>
                                        ))}
                                        {riskFactors.length > 2 && (
                                          <div>• +{riskFactors.length - 2} more</div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-1">
                                  <div className="max-w-xs truncate">
                                    <span className="font-medium">Page:</span> {record.page_url ? new URL(record.page_url).pathname : 'Unknown'}
                                  </div>
                                  <div className="font-mono">
                                    {new Date(record.created_at).toLocaleTimeString()}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Events Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment & OTP Attempts</CardTitle>
                <CardDescription>
                  Security events and risk assessments
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1 font-mono text-xs hover:bg-blue-50 hover:text-blue-600"
                                onClick={() => handleSessionClick(attempt.session_id)}
                                title="Click to view detailed session activity"
                              >
                                {attempt.session_id.substring(0, 12)}...
                              </Button>
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
          </TabsContent>
          
        </Tabs>
      </div>
      
      {/* Session Activity Modal */}
      <SessionActivityModal
        isOpen={showSessionModal}
        onClose={handleCloseSessionModal}
        sessionId={selectedSessionId || ''}
      />
    </Layout>
  );
};

export default AdminPage;