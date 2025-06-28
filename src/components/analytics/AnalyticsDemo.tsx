import React, { useEffect } from 'react';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { initializeAnalytics, getAnalyticsService } from '@/services/analyticsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

// Initialize analytics service (you can do this in your app setup)
const analyticsService = initializeAnalytics({
  endpoint: '/api/analytics', // Replace with your actual endpoint
  apiKey: 'your-api-key', // Optional
  batchSize: 5,
  retryAttempts: 3
});

export const AnalyticsDemo: React.FC = () => {
  const { analytics, sendAnalytics, getAnalyticsJSON, sessionId } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 30000, // Send every 30 seconds
    onDataReady: (data) => {
      // Automatically send to backend when data is ready
      const service = getAnalyticsService();
      if (service) {
        service.addToQueue(data);
      }
    }
  });

  const handleManualSend = () => {
    const data = sendAnalytics();
    console.log('Analytics data sent:', data);
  };

  const handleViewJSON = () => {
    const jsonData = getAnalyticsJSON();
    console.log('Analytics JSON:', jsonData);
    
    // Copy to clipboard
    navigator.clipboard.writeText(jsonData).then(() => {
      alert('Analytics data copied to clipboard!');
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">User Analytics Demo</h1>
        <p className="text-muted-foreground">
          This page tracks your typing speed, scroll behavior, mouse movement, and focus events.
        </p>
        <Badge variant="secondary" className="mt-2">
          Session ID: {sessionId}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Typing Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Typing Speed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.typing.wpm} WPM</div>
            <p className="text-xs text-muted-foreground">
              {analytics.typing.keystrokes} keystrokes
            </p>
            <p className="text-xs text-muted-foreground">
              {analytics.typing.accuracy}% accuracy
            </p>
          </CardContent>
        </Card>

        {/* Scroll Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scroll Depth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.scroll.maxDepth}%</div>
            <p className="text-xs text-muted-foreground">
              Current: {analytics.scroll.currentDepth}%
            </p>
            <p className="text-xs text-muted-foreground">
              Distance: {Math.round(analytics.scroll.totalScrollDistance)}px
            </p>
          </CardContent>
        </Card>

        {/* Mouse Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mouse Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.mouse.clicks}</div>
            <p className="text-xs text-muted-foreground">
              Distance: {Math.round(analytics.mouse.totalDistance)}px
            </p>
            <p className="text-xs text-muted-foreground">
              Idle: {Math.round(analytics.mouse.idleTime / 1000)}s
            </p>
          </CardContent>
        </Card>

        {/* Focus Metrics */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Focus Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.focus.focusEvents}</div>
            <p className="text-xs text-muted-foreground">
              Blurs: {analytics.focus.blurEvents}
            </p>
            <p className="text-xs text-muted-foreground">
              Tab switches: {analytics.focus.tabSwitches}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Elements */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Test Typing Speed</CardTitle>
            <CardDescription>
              Type in the text area below to see your typing metrics update in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Start typing here to track your typing speed and accuracy..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Controls</CardTitle>
            <CardDescription>
              Manually send analytics data or view the JSON output.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={handleManualSend} variant="default">
                Send Analytics Now
              </Button>
              <Button onClick={handleViewJSON} variant="outline">
                View JSON Data
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Queue size: {analyticsService.getQueueSize()} items pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test Analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Typing:</strong> Type in the text area above to see WPM and accuracy metrics</li>
            <li><strong>Scrolling:</strong> Scroll up and down this page to track scroll depth and speed</li>
            <li><strong>Mouse:</strong> Move your mouse around and click to track movement and interactions</li>
            <li><strong>Focus:</strong> Switch tabs or blur/focus the window to track attention metrics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
