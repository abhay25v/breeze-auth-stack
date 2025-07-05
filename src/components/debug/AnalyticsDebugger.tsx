import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserAnalytics } from "@/hooks/useUserAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Mouse, Keyboard, ScrollText, Eye, Activity } from "lucide-react";

export const AnalyticsDebugger: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [testText, setTestText] = useState('');
  const [lastSent, setLastSent] = useState<string | null>(null);

  // Initialize analytics tracking
  const { analytics, sendAnalytics, sessionId } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 3000, // Send every 3 seconds for debugging
    onDataReady: async (data) => {
      console.log('🔄 Analytics data ready:', data);
      setAnalyticsData(data);
      
      if (isTracking) {
        try {
          console.log('📊 Sending analytics to database...');
          
          const payload = {
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
              debug_mode: true,
              timestamp: new Date().toISOString(),
              test_text_length: testText.length
            }
          };

          const { error } = await supabase
            .from('user_analytics')
            .upsert(payload, {
              onConflict: 'session_id'
            });

          if (error) {
            console.error('❌ Failed to store analytics:', error);
          } else {
            console.log('✅ Analytics stored successfully');
            setLastSent(new Date().toLocaleTimeString());
          }
        } catch (error) {
          console.error('❌ Analytics error:', error);
        }
      }
    }
  });

  const startTracking = () => {
    setIsTracking(true);
    console.log('🎯 Analytics tracking started');
  };

  const stopTracking = () => {
    setIsTracking(false);
    console.log('⏹️ Analytics tracking stopped');
  };

  const manualSend = () => {
    console.log('📤 Manual analytics send triggered');
    sendAnalytics();
  };

  const triggerScrollEvent = () => {
    // Scroll to bottom and then back to top to generate scroll events
    window.scrollTo(0, document.body.scrollHeight);
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 500);
  };

  const triggerMouseEvents = () => {
    // Create synthetic mouse events
    const event = new MouseEvent('mousemove', {
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight,
      bubbles: true
    });
    document.dispatchEvent(event);
    
    // Create click event
    const clickEvent = new MouseEvent('click', {
      bubbles: true
    });
    document.dispatchEvent(clickEvent);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Analytics Debugger
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "Tracking" : "Stopped"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={startTracking} 
              disabled={isTracking}
              variant={isTracking ? "secondary" : "default"}
            >
              Start Tracking
            </Button>
            <Button 
              onClick={stopTracking} 
              disabled={!isTracking}
              variant="destructive"
            >
              Stop Tracking
            </Button>
            <Button 
              onClick={manualSend} 
              variant="outline"
            >
              Send Now
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">Session ID:</p>
              <code className="text-xs bg-gray-100 p-1 rounded">{sessionId}</code>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Last Sent:</p>
              <span className="text-xs">{lastSent || 'Never'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Test Area - Type here to generate typing metrics:</p>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Type here to generate typing analytics..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={triggerScrollEvent} variant="outline" size="sm">
              Trigger Scroll Events
            </Button>
            <Button onClick={triggerMouseEvents} variant="outline" size="sm">
              Trigger Mouse Events
            </Button>
          </div>
        </CardContent>
      </Card>

      {analyticsData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Live Analytics Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    Typing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">WPM:</span> {analyticsData.typing?.wpm || 0}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Keystrokes:</span> {analyticsData.typing?.keystrokes || 0}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Backspaces:</span> {analyticsData.typing?.backspaces || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Mouse className="h-4 w-4" />
                    Mouse
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">Clicks:</span> {analyticsData.mouse?.clicks || 0}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Distance:</span> {Math.round(analyticsData.mouse?.totalDistance || 0)}px
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Speed:</span> {(analyticsData.mouse?.averageSpeed || 0).toFixed(1)}px/s
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <ScrollText className="h-4 w-4" />
                    Scroll
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">Depth:</span> {analyticsData.scroll?.maxDepth || 0}%
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Distance:</span> {Math.round(analyticsData.scroll?.totalScrollDistance || 0)}px
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Speed:</span> {(analyticsData.scroll?.scrollSpeed || 0).toFixed(1)}px/s
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="text-xs">
                    <span className="font-medium">Events:</span> {analyticsData.focus?.focusEvents || 0}
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Time:</span> {Math.round((analyticsData.focus?.totalFocusTime || 0) / 1000)}s
                  </div>
                  <div className="text-xs">
                    <span className="font-medium">Switches:</span> {analyticsData.focus?.tabSwitches || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-medium text-sm">Raw Analytics Data</summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(analyticsData, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
