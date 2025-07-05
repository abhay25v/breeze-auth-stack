import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Mouse,
  Keyboard,
  ScrollText,
  Eye,
  ShoppingCart,
  Search,
  Timer,
  Monitor,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SessionActivityData {
  // User Analytics
  analytics: Array<{
    id: string;
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
    interactions_count: number;
    created_at: string;
    metadata?: any;
  }>;
  // OTP Attempts (including shop activity)
  otpAttempts: Array<{
    id: string;
    session_id: string;
    risk_score: number;
    otp_code: string;
    is_valid: boolean;
    created_at: string;
    metadata?: any;
  }>;
}

interface SessionActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export const SessionActivityModal: React.FC<SessionActivityModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const [data, setData] = useState<SessionActivityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionActivity();
    }
  }, [isOpen, sessionId]);

  const fetchSessionActivity = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user analytics for this session
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (analyticsError) {
        throw new Error(`Analytics error: ${analyticsError.message}`);
      }

      // Fetch OTP attempts for this session (includes shop activity)
      const { data: otpData, error: otpError } = await supabase
        .from('otp_attempts')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (otpError) {
        throw new Error(`OTP attempts error: ${otpError.message}`);
      }

      setData({
        analytics: analyticsData || [],
        otpAttempts: otpData || []
      });
    } catch (err) {
      console.error('Error fetching session activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session activity');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getShopActivities = () => {
    const shopActivities: Array<{
      timestamp: string;
      productViews: number[];
      cartActions: number;
      wishlistActions: number;
      categoryChanges: number;
      searches: number;
    }> = [];

    // Extract from OTP attempts
    data?.otpAttempts.forEach(attempt => {
      if (attempt.otp_code?.startsWith('SHOP_ACTIVITY_') && attempt.metadata) {
        shopActivities.push({
          timestamp: attempt.created_at,
          productViews: attempt.metadata.product_views || [],
          cartActions: attempt.metadata.cart_actions || 0,
          wishlistActions: attempt.metadata.wishlist_actions || 0,
          categoryChanges: attempt.metadata.category_changes || 0,
          searches: attempt.metadata.searches || 0
        });
      }
    });

    // Extract from analytics metadata
    data?.analytics.forEach(record => {
      if (record.metadata?.shop_metrics) {
        const shop = record.metadata.shop_metrics;
        shopActivities.push({
          timestamp: record.created_at,
          productViews: shop.product_views || [],
          cartActions: shop.cart_actions || 0,
          wishlistActions: shop.wishlist_actions || 0,
          categoryChanges: shop.category_changes || 0,
          searches: shop.searches || 0
        });
      }
    });

    return shopActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  const getLatestAnalytics = () => {
    return data?.analytics[0] || null;
  };

  const getTotalInteractions = () => {
    const analytics = getLatestAnalytics();
    if (!analytics) return 0;
    
    return analytics.mouse_clicks + 
           analytics.typing_keystrokes + 
           analytics.scroll_events +
           analytics.focus_changes;
  };

  const getRiskEvents = () => {
    return data?.otpAttempts.filter(attempt => 
      attempt.otp_code?.startsWith('AUTO_RISK_') || 
      (!attempt.otp_code?.startsWith('SHOP_ACTIVITY_') && attempt.risk_score > 0)
    ) || [];
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Session Activity Details
          </DialogTitle>
          <DialogDescription>
            Detailed activity tracking for session: <code className="font-mono text-xs">{sessionId.substring(0, 16)}...</code>
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading session data...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>Error: {error}</p>
          </div>
        )}

        {data && !loading && (
          <ScrollArea className="h-[60vh]">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                <TabsTrigger value="shopping">Shopping</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Total Events
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{data.analytics.length + data.otpAttempts.length}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Interactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{getTotalInteractions()}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Timer className="h-4 w-4" />
                        Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-bold">
                        {getLatestAnalytics() ? formatDuration(getLatestAnalytics()!.session_duration) : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Risk Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {Math.max(...(getRiskEvents().map(e => e.risk_score).concat([0])))}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {getLatestAnalytics() && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Session Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Page URL:</strong> 
                          <p className="truncate">{getLatestAnalytics()!.page_url || 'Unknown'}</p>
                        </div>
                        <div>
                          <strong>User Agent:</strong>
                          <p className="truncate">{getLatestAnalytics()!.user_agent || 'Unknown'}</p>
                        </div>
                        <div>
                          <strong>First Activity:</strong>
                          <p>{formatTimestamp(data.analytics[data.analytics.length - 1]?.created_at || data.otpAttempts[data.otpAttempts.length - 1]?.created_at)}</p>
                        </div>
                        <div>
                          <strong>Last Activity:</strong>
                          <p>{formatTimestamp(data.analytics[0]?.created_at || data.otpAttempts[0]?.created_at)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4">
                {getLatestAnalytics() ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Keyboard className="h-5 w-5" />
                          Typing Behavior
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>WPM:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.typing_wpm}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Keystrokes:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.typing_keystrokes}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Corrections:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.typing_corrections}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mouse className="h-5 w-5" />
                          Mouse Behavior
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Clicks:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.mouse_clicks}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Movements:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.mouse_movements}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Velocity:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.mouse_velocity.toFixed(1)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Idle Time:</span>
                          <Badge variant="outline">{formatDuration(getLatestAnalytics()!.mouse_idle_time)}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ScrollText className="h-5 w-5" />
                          Scroll Behavior
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Max Depth:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.scroll_depth}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Speed:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.scroll_speed.toFixed(1)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Events:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.scroll_events}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="h-5 w-5" />
                          Focus Behavior
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span>Focus Time:</span>
                          <Badge variant="outline">{formatDuration(getLatestAnalytics()!.focus_time)}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Focus Changes:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.focus_changes}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Tab Switches:</span>
                          <Badge variant="outline">{getLatestAnalytics()!.tab_switches}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No behavior data available for this session.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                {getLatestAnalytics() ? (
                  <div className="space-y-4">
                    {/* Risk Score Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Risk Score Analysis
                        </CardTitle>
                        <CardDescription>
                          Detailed breakdown of how the risk score is calculated
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(() => {
                            const analytics = getLatestAnalytics()!;
                            const riskFactors = [];
                            let totalRisk = 0;
                            
                            // Typing Analysis
                            if (analytics.typing_wpm > 120) {
                              riskFactors.push({ factor: 'Extremely fast typing speed', score: 25, category: 'Typing' });
                              totalRisk += 25;
                            } else if (analytics.typing_wpm < 10 && analytics.typing_keystrokes > 0) {
                              riskFactors.push({ factor: 'Unusually slow typing speed', score: 15, category: 'Typing' });
                              totalRisk += 15;
                            }
                            
                            if (analytics.typing_corrections > analytics.typing_keystrokes * 0.3) {
                              riskFactors.push({ factor: 'High correction rate', score: 20, category: 'Typing' });
                              totalRisk += 20;
                            }
                            
                            // Mouse Analysis
                            if (analytics.mouse_velocity > 1000) {
                              riskFactors.push({ factor: 'Abnormally high mouse velocity', score: 30, category: 'Mouse' });
                              totalRisk += 30;
                            }
                            
                            if (analytics.mouse_clicks > 0 && analytics.mouse_movements === 0) {
                              riskFactors.push({ factor: 'Clicks without movement', score: 25, category: 'Mouse' });
                              totalRisk += 25;
                            }
                            
                            // Scroll Analysis
                            if (analytics.scroll_speed > 500) {
                              riskFactors.push({ factor: 'Rapid scrolling behavior', score: 20, category: 'Scroll' });
                              totalRisk += 20;
                            }
                            
                            if (analytics.scroll_depth > 95 && analytics.session_duration < 10000) {
                              riskFactors.push({ factor: 'Full page scroll in short time', score: 15, category: 'Scroll' });
                              totalRisk += 15;
                            }
                            
                            // Focus Analysis
                            if (analytics.focus_time < 5000 && analytics.session_duration > 30000) {
                              riskFactors.push({ factor: 'Low focus time relative to session', score: 20, category: 'Focus' });
                              totalRisk += 20;
                            }
                            
                            if (analytics.tab_switches > 10) {
                              riskFactors.push({ factor: 'Excessive tab switching', score: 15, category: 'Focus' });
                              totalRisk += 15;
                            }
                            
                            // Cap the risk score at 100
                            totalRisk = Math.min(100, totalRisk);
                            
                            const riskLevel = totalRisk >= 70 ? 'High' : totalRisk >= 40 ? 'Medium' : 'Low';
                            const riskColor = totalRisk >= 70 ? 'destructive' : totalRisk >= 40 ? 'secondary' : 'default';
                            
                            return (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                  <div>
                                    <h3 className="font-semibold">Overall Risk Score</h3>
                                    <p className="text-sm text-muted-foreground">
                                      Based on {riskFactors.length} risk factors
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold">{totalRisk}</div>
                                    <Badge variant={riskColor}>{riskLevel} Risk</Badge>
                                  </div>
                                </div>
                                
                                {riskFactors.length > 0 ? (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Risk Factors Detected:</h4>
                                    {riskFactors.map((risk, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 bg-destructive/10 rounded">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-xs">
                                            {risk.category}
                                          </Badge>
                                          <span className="text-sm">{risk.factor}</span>
                                        </div>
                                        <Badge variant="destructive" className="text-xs">
                                          +{risk.score}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 bg-green-50 rounded-lg text-center">
                                    <p className="text-sm text-green-800">
                                      No suspicious behavior patterns detected. This appears to be normal human activity.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Behavioral Metrics Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5" />
                          Behavioral Metrics Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(() => {
                            const analytics = getLatestAnalytics()!;
                            const metrics = [
                              {
                                category: 'Typing',
                                icon: <Keyboard className="h-4 w-4" />,
                                items: [
                                  { label: 'Words Per Minute', value: analytics.typing_wpm, normal: '30-80 WPM', status: analytics.typing_wpm >= 30 && analytics.typing_wpm <= 80 ? 'normal' : 'warning' },
                                  { label: 'Total Keystrokes', value: analytics.typing_keystrokes, normal: 'Variable', status: 'normal' },
                                  { label: 'Corrections Made', value: analytics.typing_corrections, normal: '<30% of keystrokes', status: analytics.typing_corrections < analytics.typing_keystrokes * 0.3 ? 'normal' : 'warning' },
                                  { label: 'Accuracy Rate', value: `${Math.round(((analytics.typing_keystrokes - analytics.typing_corrections) / Math.max(analytics.typing_keystrokes, 1)) * 100)}%`, normal: '>70%', status: ((analytics.typing_keystrokes - analytics.typing_corrections) / Math.max(analytics.typing_keystrokes, 1)) * 100 > 70 ? 'normal' : 'warning' }
                                ]
                              },
                              {
                                category: 'Mouse',
                                icon: <Mouse className="h-4 w-4" />,
                                items: [
                                  { label: 'Click Count', value: analytics.mouse_clicks, normal: 'Variable', status: 'normal' },
                                  { label: 'Movement Count', value: analytics.mouse_movements, normal: 'Variable', status: 'normal' },
                                  { label: 'Average Velocity', value: analytics.mouse_velocity.toFixed(1), normal: '<1000 px/s', status: analytics.mouse_velocity < 1000 ? 'normal' : 'warning' },
                                  { label: 'Idle Time', value: `${Math.round(analytics.mouse_idle_time/1000)}s`, normal: 'Variable', status: 'normal' }
                                ]
                              },
                              {
                                category: 'Scroll',
                                icon: <ScrollText className="h-4 w-4" />,
                                items: [
                                  { label: 'Maximum Depth', value: `${analytics.scroll_depth}%`, normal: '0-100%', status: 'normal' },
                                  { label: 'Average Speed', value: analytics.scroll_speed.toFixed(1), normal: '<500 px/s', status: analytics.scroll_speed < 500 ? 'normal' : 'warning' },
                                  { label: 'Scroll Events', value: analytics.scroll_events, normal: 'Variable', status: 'normal' }
                                ]
                              },
                              {
                                category: 'Focus',
                                icon: <Eye className="h-4 w-4" />,
                                items: [
                                  { label: 'Focus Time', value: `${Math.round(analytics.focus_time/1000)}s`, normal: '>5s for long sessions', status: analytics.focus_time > 5000 ? 'normal' : 'warning' },
                                  { label: 'Focus Changes', value: analytics.focus_changes, normal: '<frequent', status: 'normal' },
                                  { label: 'Tab Switches', value: analytics.tab_switches, normal: '<10', status: analytics.tab_switches < 10 ? 'normal' : 'warning' }
                                ]
                              }
                            ];
                            
                            return metrics.map((metric, idx) => (
                              <div key={idx} className="space-y-2">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                  {metric.icon}
                                  {metric.category}
                                </h4>
                                <div className="space-y-1">
                                  {metric.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">{item.label}:</span>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={item.status === 'normal' ? 'default' : 'destructive'} className="text-xs">
                                          {item.value}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                          ({item.normal})
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No behavioral data available for risk analysis.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="shopping" className="space-y-4">
                {getShopActivities().length > 0 ? (
                  <div className="space-y-4">
                    {getShopActivities().map((activity, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            Shopping Activity
                          </CardTitle>
                          <CardDescription>
                            {formatTimestamp(activity.timestamp)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold">{activity.productViews.length}</p>
                              <p className="text-sm text-muted-foreground">Products Viewed</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold">{activity.cartActions}</p>
                              <p className="text-sm text-muted-foreground">Cart Actions</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold">{activity.wishlistActions}</p>
                              <p className="text-sm text-muted-foreground">Wishlist Actions</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold">{activity.categoryChanges}</p>
                              <p className="text-sm text-muted-foreground">Category Changes</p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold">{activity.searches}</p>
                              <p className="text-sm text-muted-foreground">Searches</p>
                            </div>
                          </div>
                          {activity.productViews.length > 0 && (
                            <div className="mt-4">
                              <strong className="text-sm">Viewed Products:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {activity.productViews.map(id => (
                                  <Badge key={id} variant="secondary" className="text-xs">
                                    Product {id}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No shopping activity recorded for this session.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                    <CardDescription>
                      Chronological view of all tracked events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Combine and sort all events */}
                      {[
                        ...data.analytics.map(record => ({
                          type: 'analytics',
                          timestamp: record.created_at,
                          data: record
                        })),
                        ...data.otpAttempts.map(attempt => ({
                          type: 'otp_attempt',
                          timestamp: attempt.created_at,
                          data: attempt
                        }))
                      ]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((event, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 mt-1">
                              {event.type === 'analytics' ? (
                                <BarChart3 className="h-4 w-4 text-blue-500" />
                              ) : (event.type === 'otp_attempt' && 'otp_code' in event.data && event.data.otp_code?.startsWith('SHOP_ACTIVITY_')) ? (
                                <ShoppingCart className="h-4 w-4 text-green-500" />
                              ) : (
                                <Activity className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-sm">
                                  {event.type === 'analytics' ? 'Behavior Analytics' : 
                                   (event.type === 'otp_attempt' && 'otp_code' in event.data && event.data.otp_code?.startsWith('SHOP_ACTIVITY_')) ? 'Shopping Activity' :
                                   (event.type === 'otp_attempt' && 'otp_code' in event.data && event.data.otp_code?.startsWith('AUTO_RISK_')) ? 'Risk Assessment' : 'Security Event'}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {formatTimestamp(event.timestamp)}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {event.type === 'analytics' ? (
                                  `${('interactions_count' in event.data) ? event.data.interactions_count : 0} interactions • ${('page_url' in event.data) ? event.data.page_url || 'Unknown page' : 'Unknown page'}`
                                ) : (event.type === 'otp_attempt' && 'otp_code' in event.data && event.data.otp_code?.startsWith('SHOP_ACTIVITY_')) ? (
                                  `Shopping session • Risk: ${('risk_score' in event.data) ? event.data.risk_score : 0}`
                                ) : (
                                  `Risk Score: ${('risk_score' in event.data) ? event.data.risk_score : 0} • ${('otp_code' in event.data) ? event.data.otp_code : 'Unknown'}`
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
