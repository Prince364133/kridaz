'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription,  CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { Separator } from '@workspace/ui/components/separator';
import { Checkbox } from '@workspace/ui/components/checkbox';
import { MapPin, CalendarDays, Clock, Banknote } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useRazorpay } from '@/hooks/useRazorpay';
import { toast } from 'sonner';

interface ParticipantCheckoutCardProps {
  participantInfo: {
    participant: { status: string; shareAmount: number; [key: string]: unknown };
    booking: { venueName: string; venueCity?: string; bookingDate: string; startTime: string; endTime: string; currency: string; [key: string]: unknown };
  };
}

export function ParticipantCheckoutCard({ participantInfo }: ParticipantCheckoutCardProps) {
  const { participant, booking } = participantInfo;
  const { isLoaded: isRazorpayLoaded } = useRazorpay();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);

  // Status visual mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700">Paid Online</Badge>;
      case 'CASH_COLLECTION':
        return <Badge variant="secondary" className="bg-blue-600 text-white">Cash at Venue</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Payment</Badge>;
    }
  };

  const handlePayNow = async () => {
    // 1. In a complete flow, this would call BookingsApi.initiatePayment() with the specific participant context
    // 2. Open Razorpay options
    // 3. Handle success and reload
    setIsProcessing(true);
    toast.info('Payment Gateway Simulator: Initiating transaction...');
    
    // Simulate API delay
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('This feature requires dynamic signature verification on the backend to prevent tampering of the shareAmount. Pending next iteration.');
    }, 1500);
  };

  const isPaid = participant.status === 'PAID' || participant.status === 'CASH_COLLECTION';

  return (
    <Card className="shadow-lg max-w-md w-full mx-auto border-muted overflow-hidden">
      <div className="bg-primary/5 p-6 flex flex-col items-center justify-center border-b">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Banknote className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold text-center mb-2">Split Bill</CardTitle>
        <CardDescription className="text-center text-base">
          You&apos;ve been invited to join a booking.
        </CardDescription>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Booking Summary */}
        <div className="space-y-4 rounded-lg bg-muted/30 p-4 border">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-lg">{booking.venueName}</p>
              <div className="flex items-center text-muted-foreground text-sm mt-1">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {booking.venueCity || 'Venue Location'}
              </div>
            </div>
            {getStatusBadge(participant.status)}
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1 flex items-center"><CalendarDays className="h-3.5 w-3.5 mr-1" /> Date</p>
              <p className="font-medium">{format(parseISO(booking.bookingDate), 'MMM do, yyyy')}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1 flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> Time</p>
              <p className="font-medium">
                {format(parseISO(booking.startTime), 'h:mm a')} - {format(parseISO(booking.endTime), 'h:mm a')}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Detail */}
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg text-primary">
          <span className="font-semibold text-lg">Your Share</span>
          <span className="text-2xl font-bold">
             {new Intl.NumberFormat('en-IN', { style: 'currency', currency: booking.currency }).format(participant.shareAmount)}
          </span>
        </div>

        {/* Data Privacy Consent */}
        {!isPaid && (
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="consent" 
              checked={hasConsent}
              onCheckedChange={(checked) => setHasConsent(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="consent"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the Terms of Service and Privacy Policy
              </label>
              <p className="text-xs text-muted-foreground">
                By sliding to pay, you agree to secure data processing.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button 
            className="w-full h-12 text-lg" 
            size="lg"
            onClick={handlePayNow}
            disabled={isPaid || isProcessing || !isRazorpayLoaded || !hasConsent}
        >
          {isProcessing ? 'Processing...' : isPaid ? 'Payment Completed' : 'Pay Now'}
        </Button>

        {participant.status === 'PENDING' && (
          <p className="text-xs text-center text-muted-foreground">
            Payments are secured. Powered by Razorpay.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
