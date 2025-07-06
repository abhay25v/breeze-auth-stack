import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { DatabaseDebugger } from '@/components/debug/DatabaseDebugger';
import { AnalyticsDebugger } from '@/components/debug/AnalyticsDebugger';

const DebugPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Debug Tools</h1>
          <p className="text-muted-foreground">Debug database and analytics functionality</p>
        </div>
        
        <div className="space-y-4">
          <DatabaseDebugger />
          <AnalyticsDebugger />
        </div>
      </div>
    </Layout>
  );
};

export default DebugPage;