import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, MapPin, Phone } from 'lucide-react';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user } = useAuth();

  // Add analytics tracking for Profile page
  const { analytics, sendAnalytics, sessionId } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 15000, // Send every 15 seconds
    onDataReady: async (data) => {
      try {
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
          interactions_count: (data.mouse?.clicks || 0) + (data.typing?.keystrokes || 0),
          metadata: {
            page_type: 'profile',
            user_id: user?.id,
            timestamp: new Date().toISOString()
          }
        };

        const { error } = await supabase
          .from('user_analytics')
          .upsert(analyticsPayload, {
            onConflict: 'session_id'
          });

        if (error) {
          console.error('Failed to store Profile analytics:', error);
        }
      } catch (error) {
        console.error('Profile analytics storage failed:', error);
      }
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and personal information.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Overview */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src="" alt={user?.name || user?.email} />
                <AvatarFallback className="text-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{user?.name || 'User'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              <Badge variant="secondary" className="w-fit mx-auto">
                Premium Member
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Joined December 2024
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                New York, USA
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="John" defaultValue={user?.name?.split(' ')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Doe" defaultValue={user?.name?.split(' ')[1]} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="+1 (555) 123-4567" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself..." 
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="New York, USA" />
              </div>

              <div className="flex gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Settings */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
              <Button variant="outline" className="w-full">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full">
                Login Sessions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience and notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full">
                Notification Settings
              </Button>
              <Button variant="outline" className="w-full">
                Privacy Settings
              </Button>
              <Button variant="outline" className="w-full">
                Theme Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
