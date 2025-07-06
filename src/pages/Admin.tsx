import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Users, ShoppingCart, Eye, Heart, AlertTriangle } from 'lucide-react';
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setShowSessionModal(true);
  };

  const handleCloseSessionModal = () => {
    setShowSessionModal(false);
    setSelectedSessionId(null);
  };

  // Simplified stats that focus on shop and behavior metrics
  const stats = {
    totalSessions: new Set([
      ...attempts.map(a => a.session_id),
      ...analytics.map(a => a.session_id)
    ]).size,
    totalShopActivities: shopActivities.reduce((sum, a) => 
      sum + a.cartActions + a.wishlistActions + a.productViews.length + a.searches + a.categoryChanges, 0),
    productViews: shopActivities.reduce((sum, activity) => sum + activity.productViews.length, 0),
    avgTypingSpeed: analytics.length > 0 ? Math.round(analytics.reduce((sum, a) => sum + a.typing_wpm, 0) / analytics.length) : 0
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Behavior Analytics</h1>
            <p className="text-muted-foreground">Monitor shop activities and user behavior patterns</p>
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
                <Users className="h-4 w-4 text-blue-500" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Unique user sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-500" />
                Shop Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalShopActivities}</div>
              <p className="text-xs text-muted-foreground">Total shop actions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-purple-500" />
                Product Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.productViews}</div>
              <p className="text-xs text-muted-foreground">Products viewed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-orange-500" />
                Avg Typing Speed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.avgTypingSpeed}</div>
              <p className="text-xs text-muted-foreground">Words per minute</p>
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
        <Tabs defaultValue="shop" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shop">Shop Analytics</TabsTrigger>
            <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          </TabsList>
          
          {/* Shop Analytics Tab */}
          <TabsContent value="shop" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-blue-600" />
                      Shop Activity Dashboard
                    </CardTitle>
                    <CardDescription>
                      Real-time user interactions with products and shopping features
                    </CardDescription>
                  </div>
                  {!isLoading && shopActivities.length === 0 && (
                    <Button size="sm" asChild>
                      <a href="/shop">Generate Data</a>
                    </Button>
                  )}
                </div>
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
          
          {/* User Behavior Tab - Simplified and focused */}
          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  User Behavior Analytics
                </CardTitle>
                <CardDescription>
                  Detailed behavioral data from user sessions on the shop page
                </CardDescription>
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
                    <p className="text-sm">Visit the <a href="/shop" className="text-primary underline font-medium">Shop page</a> and interact with it to generate analytics data.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Typing (WPM)</TableHead>
                          <TableHead>Mouse Activity</TableHead>
                          <TableHead>Scroll Depth</TableHead>
                          <TableHead>Focus Time</TableHead>
                          <TableHead>Page Interactions</TableHead>
                          <TableHead>Session Duration</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analytics.map((record) => (
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
                              <Badge variant="outline" className={record.typing_wpm > 0 ? "bg-blue-50" : ""}>
                                {record.typing_wpm}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>Clicks: {record.mouse_clicks}</div>
                                <div>Moves: {record.mouse_movements}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-purple-50">
                                {record.scroll_depth}%
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-orange-50">
                                {Math.round(record.focus_time/1000)}s
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs">
                                <div>Views: {record.page_views}</div>
                                <div>Actions: {record.interactions_count}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {Math.round(record.session_duration/1000)}s
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {new Date(record.created_at).toLocaleTimeString()}
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