import React, { ComponentType } from 'react';
import { useUserAnalytics, UseUserAnalyticsOptions } from '@/hooks/useUserAnalytics';
import { getAnalyticsService } from '@/services/analyticsService';

interface WithAnalyticsOptions extends UseUserAnalyticsOptions {
  pageName?: string;
}

function withAnalytics<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAnalyticsOptions = {}
) {
  const WithAnalyticsComponent: React.FC<P> = (props) => {
    const { analytics, sendAnalytics, getAnalyticsJSON, sessionId } = useUserAnalytics({
      trackTyping: true,
      trackScroll: true,
      trackMouse: true,
      trackFocus: true,
      sendInterval: 30000, // 30 seconds
      onDataReady: (data) => {
        // Add page name to the data if provided
        if (options.pageName) {
          (data as any).pageName = options.pageName;
        }
        
        // Send to analytics service
        const service = getAnalyticsService();
        if (service) {
          service.addToQueue(data);
        }
      },
      ...options
    });

    // Add analytics data to component props
    const enhancedProps = {
      ...props,
      analytics: {
        data: analytics,
        send: sendAnalytics,
        getJSON: getAnalyticsJSON,
        sessionId
      }
    } as P & {
      analytics: {
        data: typeof analytics;
        send: typeof sendAnalytics;
        getJSON: typeof getAnalyticsJSON;
        sessionId: string;
      };
    };

    return <WrappedComponent {...enhancedProps} />;
  };

  WithAnalyticsComponent.displayName = `withAnalytics(${WrappedComponent.displayName || WrappedComponent.name})`;

  return WithAnalyticsComponent;
}

// Hook version for functional components
const usePageAnalytics = (pageName: string, options: UseUserAnalyticsOptions = {}) => {
  return useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 30000,
    onDataReady: (data) => {
      // Add page name to the data
      (data as any).pageName = pageName;
      
      // Send to analytics service
      const service = getAnalyticsService();
      if (service) {
        service.addToQueue(data);
      }
    },
    ...options
  });
};

// Export all items at the end for Fast Refresh compatibility
export { withAnalytics, usePageAnalytics };
export type { WithAnalyticsOptions };
