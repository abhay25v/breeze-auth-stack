import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { initializeAnalytics, AnalyticsService, AnalyticsConfig } from '@/services/analyticsService';

interface AnalyticsContextType {
  service: AnalyticsService | null;
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  service: null,
  isInitialized: false
});

export interface AnalyticsProviderProps {
  children: ReactNode;
  config: AnalyticsConfig;
  enabled?: boolean;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  config,
  enabled = true
}) => {
  const [service, setService] = React.useState<AnalyticsService | null>(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    if (enabled) {
      const analyticsService = initializeAnalytics(config);
      setService(analyticsService);
      setIsInitialized(true);

      // Optional: Send a page load event
      const pageLoadData = {
        sessionId: crypto.randomUUID(),
        timestamp: Date.now(),
        typing: {
          wpm: 0,
          cpm: 0,
          keystrokes: 0,
          backspaces: 0,
          totalTime: 0,
          accuracy: 100
        },
        scroll: {
          maxDepth: 0,
          currentDepth: 0,
          totalScrollDistance: 0,
          scrollSpeed: 0,
          timeSpentAtDepths: {}
        },
        mouse: {
          totalDistance: 0,
          clicks: 0,
          rightClicks: 0,
          hovers: 0,
          averageSpeed: 0,
          idleTime: 0
        },
        focus: {
          totalFocusTime: 0,
          focusEvents: 0,
          blurEvents: 0,
          averageFocusSession: 0,
          tabSwitches: 0
        },
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        sessionDuration: 0
      };

      // Send initial page load event
      analyticsService.addToQueue(pageLoadData);
    }
  }, [config, enabled]);

  return (
    <AnalyticsContext.Provider value={{ service, isInitialized }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};
