# User Analytics System

This custom React hook and service system tracks user behavior including typing speed, scroll depth, mouse movement, and focus/blur events. The data is serialized to JSON and can be sent to your backend for analysis.

## Files Added

### Core Hook
- **`src/hooks/useUserAnalytics.tsx`** - Main React hook that tracks all user interactions

### Services
- **`src/services/analyticsService.ts`** - Service for batching and sending analytics data to backend
- **`src/utils/analyticsApi.ts`** - API utility for communicating with analytics endpoints

### Components
- **`src/components/analytics/AnalyticsDemo.tsx`** - Demo component showing real-time analytics
- **`src/components/analytics/withAnalytics.tsx`** - HOC and hook for adding analytics to pages

### Providers
- **`src/providers/AnalyticsProvider.tsx`** - Context provider for initializing analytics service

### Pages
- **`src/pages/Analytics.tsx`** - Updated analytics page with demo functionality

## What is Tracked

### Typing Metrics
- **WPM (Words Per Minute)** - Calculated based on keystrokes
- **CPM (Characters Per Minute)** - Raw typing speed
- **Keystrokes** - Total number of keys pressed
- **Backspaces** - Number of corrections made
- **Accuracy** - Percentage of correct keystrokes
- **Total Time** - Time spent typing

### Scroll Metrics
- **Max Depth** - Maximum scroll percentage reached
- **Current Depth** - Current scroll position
- **Total Scroll Distance** - Total pixels scrolled
- **Scroll Speed** - Current scrolling velocity
- **Time Spent at Depths** - Time spent at different scroll positions

### Mouse Metrics
- **Total Distance** - Total mouse movement in pixels
- **Clicks** - Number of left clicks
- **Right Clicks** - Number of right clicks
- **Hovers** - Number of hover events
- **Average Speed** - Average mouse movement speed
- **Idle Time** - Time with no mouse activity

### Focus Metrics
- **Total Focus Time** - Time window/page was focused
- **Focus Events** - Number of focus events
- **Blur Events** - Number of blur events
- **Average Focus Session** - Average time per focus session
- **Tab Switches** - Number of times user switched tabs

## How to Use

### 1. Basic Usage

```tsx
import { useUserAnalytics } from '@/hooks/useUserAnalytics';

const MyComponent = () => {
  const { analytics, sendAnalytics, getAnalyticsJSON } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 30000, // Send every 30 seconds
    onDataReady: (data) => {
      console.log('Analytics data:', data);
      // Send to your backend here
    }
  });

  return (
    <div>
      <p>Typing Speed: {analytics.typing.wpm} WPM</p>
      <p>Scroll Depth: {analytics.scroll.maxDepth}%</p>
      <button onClick={() => sendAnalytics()}>
        Send Analytics Now
      </button>
    </div>
  );
};
```

### 2. Using the HOC

```tsx
import { withAnalytics } from '@/components/analytics/withAnalytics';

const MyPage = ({ analytics }) => {
  return (
    <div>
      <h1>My Page</h1>
      <p>Current typing speed: {analytics.data.typing.wpm} WPM</p>
    </div>
  );
};

export default withAnalytics(MyPage, { pageName: 'my-page' });
```

### 3. Using the Page Hook

```tsx
import { usePageAnalytics } from '@/components/analytics/withAnalytics';

const MyPage = () => {
  const { analytics } = usePageAnalytics('my-page');
  
  return (
    <div>
      <h1>My Page</h1>
      <p>Mouse clicks: {analytics.mouse.clicks}</p>
    </div>
  );
};
```

## Backend Integration

### Environment Variables

Add these to your `.env` file:

```bash
VITE_ANALYTICS_ENDPOINT=http://your-backend.com/api/analytics
VITE_ANALYTICS_API_KEY=your-api-key
VITE_ENABLE_ANALYTICS=true
```

### Expected Backend Endpoints

#### POST /api/analytics
Send single analytics record:
```json
{
  "sessionId": "uuid",
  "timestamp": 1640995200000,
  "typing": { "wpm": 45, "cpm": 225, ... },
  "scroll": { "maxDepth": 75, ... },
  "mouse": { "totalDistance": 1500, ... },
  "focus": { "totalFocusTime": 30000, ... },
  "pageUrl": "https://yourapp.com/page",
  "userAgent": "...",
  "sessionDuration": 60000
}
```

#### POST /api/analytics/batch
Send multiple analytics records:
```json
{
  "analytics": [
    { /* analytics record 1 */ },
    { /* analytics record 2 */ }
  ]
}
```

#### GET /api/analytics?sessionId=uuid&startDate=...&endDate=...
Retrieve analytics data with optional filters.

#### DELETE /api/analytics/{sessionId}
Delete analytics data for a session.

## Customization

### Tracking Options

```tsx
const options = {
  trackTyping: true,     // Enable/disable typing tracking
  trackScroll: true,     // Enable/disable scroll tracking
  trackMouse: true,      // Enable/disable mouse tracking
  trackFocus: true,      // Enable/disable focus tracking
  sendInterval: 30000,   // Auto-send interval in ms (0 to disable)
  onDataReady: (data) => {
    // Custom handler for analytics data
  }
};
```

### Service Configuration

```tsx
const config = {
  endpoint: '/api/analytics',
  apiKey: 'your-api-key',
  batchSize: 10,         // Number of records to batch
  retryAttempts: 3,      // Number of retry attempts
  retryDelay: 1000       // Delay between retries (ms)
};
```

## Testing the Analytics

1. Visit `/analytics` page to see the demo
2. Type in the text area to see typing metrics
3. Scroll the page to see scroll depth tracking
4. Move your mouse and click to see mouse metrics
5. Switch tabs to see focus tracking
6. Check browser console for analytics data
7. Use "Send Analytics Now" button to manually send data

## Privacy Considerations

- All data is collected anonymously with session IDs
- No personal information is tracked
- Users should be informed about analytics collection
- Consider implementing opt-out functionality
- Ensure compliance with privacy regulations (GDPR, CCPA, etc.)

## Performance Notes

- Analytics tracking is optimized with throttling and batching
- Event listeners are properly cleaned up on component unmount
- Background processing doesn't block UI interactions
- Failed requests are retried with exponential backoff

## Troubleshooting

1. **Analytics not tracking**: Check that the provider is wrapped around your app
2. **Data not sending**: Verify endpoint URL and API key
3. **High memory usage**: Reduce batch size or send interval
4. **Network errors**: Check retry configuration and endpoint availability
