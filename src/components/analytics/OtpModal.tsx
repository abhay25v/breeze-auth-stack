import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Shield, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskScore: number;
  sessionId: string;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  riskScore,
  sessionId
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setOtpCode('');
      setError(null);
      setIsValidated(false);
      setAttemptsRemaining(3);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (otpCode.length !== 6) {
      setError('OTP code must be 6 digits');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('validate-otp', {
        body: {
          sessionId,
          otpCode,
          riskScore
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.success) {
        setIsValidated(true);
        toast({
          title: "Verification Successful",
          description: "Your identity has been verified successfully.",
        });
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(data.message || 'Invalid OTP code');
        setAttemptsRemaining(data.attemptsRemaining || attemptsRemaining - 1);
        
        if (attemptsRemaining <= 1) {
          toast({
            title: "Too Many Attempts",
            description: "Account temporarily locked due to multiple failed attempts.",
            variant: "destructive",
          });
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to validate OTP';
      setError(errorMessage);
      toast({
        title: "Validation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    toast({
      title: "OTP Sent",
      description: "A new verification code has been sent. Use: 123456",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            High Risk Activity Detected
          </DialogTitle>
          <DialogDescription>
            Your behavior indicates potential risk (Score: {riskScore}/100). 
            Please verify your identity to continue.
          </DialogDescription>
        </DialogHeader>

        {isValidated ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <CheckCircle className="h-16 w-16 text-success" />
            <div className="text-center">
              <h3 className="text-lg font-semibold">Verification Successful</h3>
              <p className="text-sm text-muted-foreground">
                Your identity has been confirmed. You may continue.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter 6-digit verification code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground text-center">
                For demo purposes, use: <span className="font-mono font-bold">123456</span>
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading || otpCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-sm"
              >
                Resend Code
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Attempts remaining: {attemptsRemaining}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This verification helps protect your account from suspicious activity.
              </AlertDescription>
            </Alert>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};