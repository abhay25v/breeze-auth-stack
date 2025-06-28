import { Layout } from '@/components/layout/Layout';
import { AnalyticsDemo } from '@/components/analytics/AnalyticsDemo';
import { usePageAnalytics } from '@/components/analytics/withAnalytics';

const AnalyticsPage = () => {
  // This will automatically track analytics for this page
  const { analytics, sendAnalytics, getAnalyticsJSON, sessionId } = usePageAnalytics('analytics-page');

  return (
    <Layout>
      <AnalyticsDemo />
    </Layout>
  );
};

export default AnalyticsPage;
