// Re-export all analytics types for easy importing
export type {
  TypingMetrics,
  ScrollMetrics,
  MouseMetrics,
  FocusMetrics,
  UserAnalytics,
  UseUserAnalyticsOptions
} from '@/hooks/useUserAnalytics';

export type {
  AnalyticsConfig
} from '@/services/analyticsService';

export type {
  AnalyticsApiResponse
} from '@/utils/analyticsApi';

export type {
  WithAnalyticsOptions
} from '@/components/analytics/withAnalytics';

export type {
  AnalyticsProviderProps
} from '@/providers/AnalyticsProvider';
