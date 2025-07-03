import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OtpModal } from './OtpModal';

interface RiskScoreData {
  riskScore: number;
  riskLevel: string;
  timestamp: string;
  sessionId: string;
  factors: {
    typing: string;
    mouse: string;
    focus: string;
    scroll: string;
  };
}

interface RiskScoreDisplayProps {
  behaviorData?: any;
  sessionId: string;
}

export const RiskScoreDisplay: React.FC<RiskScoreDisplayProps> = ({ 
  behaviorData, 
  sessionId 
}) => {
  const [riskData, setRiskData] = useState<RiskScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const { toast } = useToast();

  const calculateRiskScore = async () => {
    if (!behaviorData) {
      toast({
        title: "No Data Available",
        description: "Please interact with the page to generate behavior data first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('risk-score', {
        body: {
          ...behaviorData,
          sessionId,
          timestamp: Date.now(),
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.success) {
        setRiskData(data);
        toast({
          title: "Risk Assessment Complete",
          description: `Risk level: ${data.riskLevel} (${data.riskScore}/100)`,
        });

        // Show OTP modal if risk score is high (> 70)
        if (data.riskScore > 70) {
          setShowOtpModal(true);
        }
      } else {
        throw new Error(data.message || 'Failed to calculate risk score');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to calculate risk score';
      setError(errorMessage);
      toast({
        title: "Assessment Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'medium':
        return <Shield className="h-5 w-5 text-warning" />;
      case 'low':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Behavior Risk Assessment
        </CardTitle>
        <CardDescription>
          Analyze user behavior patterns to calculate risk score
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={calculateRiskScore}
          disabled={isLoading || !behaviorData}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Calculate Risk Score'
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {riskData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {getRiskIcon(riskData.riskLevel)}
                <div>
                  <div className="font-semibold">Risk Score: {riskData.riskScore}/100</div>
                  <div className="text-sm text-muted-foreground">
                    Assessed at {new Date(riskData.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <Badge variant={getRiskColor(riskData.riskLevel) as any}>
                {riskData.riskLevel.toUpperCase()} RISK
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">
                <span className="font-medium">Typing:</span> {riskData.factors.typing}
              </div>
              <div className="text-sm">
                <span className="font-medium">Mouse:</span> {riskData.factors.mouse}
              </div>
              <div className="text-sm">
                <span className="font-medium">Focus:</span> {riskData.factors.focus}
              </div>
              <div className="text-sm">
                <span className="font-medium">Scroll:</span> {riskData.factors.scroll}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Session ID: {riskData.sessionId}
            </div>
          </div>
        )}

        {!behaviorData && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Start typing, moving your mouse, or scrolling to generate behavior data for analysis.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* OTP Modal for high-risk scores */}
      <OtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        riskScore={riskData?.riskScore || 0}
        sessionId={sessionId}
      />
    </Card>
  );
};