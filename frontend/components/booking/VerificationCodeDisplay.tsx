"use client";

/**
 * VerificationCodeDisplay Component
 * 
 * Displays the OTP verification code for partially paid bookings.
 * Used on the booking detail page to show the player their code
 * which they can share with venue staff for at-venue payment collection.
 */

import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Clock, Shield } from 'lucide-react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { toast } from 'sonner';

interface VerificationCodeDisplayProps {
  bookingId: string;
  paymentStatus: 'PENDING' | 'PARTIALLY_PAID' | 'FULLY_PAID' | 'REFUNDED';
  verificationCode?: string | null;
  verificationCodeExpiry?: string | null;
  onGenerateCode?: () => Promise<{ verificationCode: string; expiresAt: string } | null>;
}

export function VerificationCodeDisplay({
  bookingId: _bookingId,
  paymentStatus,
  verificationCode: initialCode,
  verificationCodeExpiry: initialExpiry,
  onGenerateCode,
}: VerificationCodeDisplayProps) {
  const [code, setCode] = useState(initialCode);
  const [expiry, setExpiry] = useState(initialExpiry);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Calculate time remaining
  useEffect(() => {
    if (!expiry) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiryDate = new Date(expiry);
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes} min`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiry]);

  // Don't render if not partially paid
  if (paymentStatus !== 'PARTIALLY_PAID') {
    return null;
  }

  const handleCopyCode = async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const handleGenerateCode = async () => {
    if (!onGenerateCode) return;

    setIsLoading(true);
    try {
      const result = await onGenerateCode();
      if (result) {
        setCode(result.verificationCode);
        setExpiry(result.expiresAt);
        toast.success('Verification code generated!');
      }
    } catch {
      toast.error('Failed to generate verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = expiry && new Date(expiry) < new Date();

  return (
    <Card className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <Shield className="h-5 w-5" />
          Verification Code
        </CardTitle>
        <CardDescription className="text-amber-600 dark:text-amber-400">
          Show this code to venue staff when paying the remaining balance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {code && !isExpired ? (
          <>
            {/* Code Display */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1">
                {code.split('').map((digit, index) => (
                  <div
                    key={index}
                    className="flex h-12 w-10 items-center justify-center rounded-lg bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-600 text-2xl font-mono font-bold text-amber-800 dark:text-amber-200"
                  >
                    {digit}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="h-12 w-12"
                title="Copy code"
              >
                {isCopied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>

            {/* Expiry Timer */}
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span>Valid for: {timeRemaining}</span>
            </div>
          </>
        ) : (
          <div className="text-center space-y-3">
            {isExpired ? (
              <p className="text-amber-700 dark:text-amber-300">
                Your verification code has expired. Generate a new one.
              </p>
            ) : (
              <p className="text-amber-700 dark:text-amber-300">
                Generate a verification code to show at the venue.
              </p>
            )}
            {onGenerateCode && (
              <Button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isLoading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isExpired ? 'Generate New Code' : 'Generate Code'}
              </Button>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/30 p-3 text-xs text-amber-700 dark:text-amber-300">
          <p className="font-medium mb-1">How it works:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Show this code to the venue staff</li>
            <li>Staff will enter it to verify your identity</li>
            <li>Pay the remaining balance at the venue</li>
            <li>Your booking will be marked as fully paid</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export default VerificationCodeDisplay;
