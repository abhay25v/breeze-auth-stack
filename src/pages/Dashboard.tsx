
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Settings, User, TrendingUp } from 'lucide-react';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Add analytics tracking for Dashboard page
  const { analytics, sendAnalytics, sessionId } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 10000, // Send every 10 seconds
    onDataReady: async (data) => {
      try {
        console.log('Sending Dashboard analytics data...', data);
        
        const analyticsPayload = {
          session_id: data.sessionId,
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          typing_wpm: data.typing?.wpm || 0,
          typing_keystrokes: data.typing?.keystrokes || 0,
          typing_corrections: data.typing?.backspaces || 0,
          mouse_clicks: data.mouse?.clicks || 0,
          mouse_movements: Math.round(data.mouse?.totalDistance || 0),
          mouse_velocity: data.mouse?.averageSpeed || 0,
          mouse_idle_time: data.mouse?.idleTime || 0,
          scroll_depth: data.scroll?.maxDepth || 0,
          scroll_speed: data.scroll?.scrollSpeed || 0,
          scroll_events: Math.round(data.scroll?.totalScrollDistance / 100) || 0,
          focus_changes: data.focus?.focusEvents || 0,
          focus_time: data.focus?.totalFocusTime || 0,
          tab_switches: data.focus?.tabSwitches || 0,
          session_duration: data.sessionDuration || 0,
          page_views: 1,
          interactions_count: (data.mouse?.clicks || 0) + (data.typing?.keystrokes || 0) + Math.round((data.scroll?.totalScrollDistance || 0) / 100),
          metadata: {
            page_type: 'dashboard',
            user_id: user?.id,
            timestamp: new Date().toISOString()
          }
        };

        const { error: analyticsError } = await supabase
          .from('user_analytics')
          .upsert(analyticsPayload, {
            onConflict: 'session_id'
          });

        if (analyticsError) {
          console.error('Failed to store Dashboard analytics:', analyticsError);
        } else {
          console.log('Successfully stored Dashboard analytics');
        }
      } catch (error) {
        console.error('Dashboard analytics storage failed:', error);
      }
    }
  });

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name || user?.email}!</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/profile')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Update your personal information and preferences.
              </p>
              <Button variant="outline" className="w-full">
                View Profile
              </Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/analytics')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <CardTitle>Analytics</CardTitle>
              </div>
              <CardDescription>View your activity stats</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track your progress and performance metrics.
              </p>
              <Button variant="outline" className="w-full">
                View Analytics
              </Button>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleNavigate('/settings')}>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <CardTitle>Settings</CardTitle>
              </div>
              <CardDescription>Configure your preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Customize your experience and notifications.
              </p>
              <Button variant="outline" className="w-full">
                Open Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-2xl">24</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg. Session Time</CardDescription>
              <CardTitle className="text-2xl">45m</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +5% from last week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tasks Completed</CardDescription>
              <CardTitle className="text-2xl">152</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +18% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-2xl">98%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +2% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
