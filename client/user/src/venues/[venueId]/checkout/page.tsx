"use client";

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  MapPin,
  CalendarDays,
  Clock,
  CreditCard,
  AlertCircle,
  Loader2,
  CheckCircle,
  Banknote,
} from 'lucide-react';
import { format, parseISO, addMinutes, isAfter } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
const Image = (props: any) => <img {...props} />;
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CheckoutPaymentMethod, type SplitPaymentFormData } from '@/components/booking/CheckoutPaymentMethod';

import { useBookingDetails, usePayment } from '@/hooks/useBookings';
import { config } from '@/lib/config';
import type { RazorpayResponse } from '@/types/razorpay';
import { useRazorpay } from '@/hooks/useRazorpay';
import { BookingsApi } from '@/lib/bookings/api';
import type { BookingStatus, HandlePaymentCallbackRequest } from '@/lib/bookings/types';
import { toast } from 'sonner';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  };
}

// Extend window interface for Razorpay
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
        on: (event: string, handler: (response: RazorpayErrorResponse) => void) => void;
        open: () => void;
    };
  }
}

export default function VenueCheckoutPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId"); 

  const { booking: bookingDetails, loading: isBookingLoading, error: bookingError, loadBooking } = useBookingDetails();
  const { initiatePayment, loading: isInitiatingPayment } = usePayment();
  const { isLoaded: isRazorpayLoaded, error: razorpayError } = useRazorpay();

  const [paymentProcessingError, setPaymentProcessingError] = useState<string | null>(null);
  const [paymentFinalStatus, setPaymentFinalStatus] = useState<BookingStatus | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [paymentData, setPaymentData] = useState<SplitPaymentFormData | null>(null);
  const [, setIsPaymentValid] = useState(true);


  useEffect(() => {
    if (bookingId && !bookingDetails) {
      loadBooking(bookingId);
    }
  }, [bookingId, bookingDetails, loadBooking]);

  // Reservation Timer Logic
  useEffect(() => {
    if (!bookingDetails || bookingDetails.status !== 'PENDING_PAYMENT') return;

    const expiryTime = addMinutes(parseISO(bookingDetails.createdAt), 5);
    
    const timer = setInterval(() => {
        const now = new Date();
        if (isAfter(now, expiryTime)) {
            setIsExpired(true);
            setTimeLeft("00:00");
            clearInterval(timer);
            toast.error("Reservation expired. Please book again.");
        } else {
            const diff = expiryTime.getTime() - now.getTime();
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingDetails]);


  const handleCompletePayment = async () => {
    if (!bookingDetails) return;
    if (!isRazorpayLoaded) {
      toast.error("Payment system loading, please wait...");
      return;
    }

    try {
      setPaymentProcessingError(null);
      
      const paymentType = paymentData?.paymentType || 'FULL';
      // Ensure we only pass valid participant contacts if splitting
      const participants = paymentType === 'SPLIT' 
        ? paymentData?.participants.map(p => ({ 
            email: p.email || undefined, 
            phone: p.phone || undefined 
          })) 
        : undefined;

      // 1. Order Creation
      const paymentOrder = await initiatePayment(
          bookingDetails.id, 
          paymentType, 
          undefined, // callbackUrl
          participants
      );
      
      if (!paymentOrder?.orderId) {
        throw new Error("Failed to create payment order");
      }

      // 2. Razorpay Options
      const options = {
        key: config.razorpay.keyId,
        amount: paymentOrder.amount, 
        currency: paymentOrder.currency,
        name: "PlaySpots", // Branding
        description: `${bookingDetails.sportName} at ${bookingDetails.venueName}`,
        order_id: paymentOrder.orderId,
        handler: async function (response: RazorpayResponse) {
             // 3. Payment Success & Verification
             try {
                const callbackRequest: HandlePaymentCallbackRequest = {
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id,
                    signature: response.razorpay_signature,
                    status: 'success'
                };
                
                toast.loading("Verifying payment...");
                await BookingsApi.handlePaymentCallback(callbackRequest);
                
                toast.dismiss();
                toast.success("Payment verified successfully!");
                setPaymentFinalStatus('CONFIRMED');
                loadBooking(bookingId!);
             } catch (err) {
                console.error("Verification failed", err);
                toast.dismiss();
                toast.error("Payment successful but verification failed.");
                setPaymentProcessingError("Verification failed. Please check 'My Bookings'.");
             }
        },
        prefill: {
            // Can be prefilled if user details are available
        },
        theme: {
            color: "#0F172A" // Primary color
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response: RazorpayErrorResponse){
            console.error("Payment Failed", response.error);
            setPaymentProcessingError(response.error.description || "Payment failed");
            toast.error("Payment failed. Please try again.");
      });
      rzp1.open();

    } catch (err: unknown) {
      console.error("Initiation failed", err);
      toast.error((err as Error).message || "Failed to initiate payment");
    }
  };


  // Combined Loading State
  if (isBookingLoading) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2 text-lg text-muted-foreground">Loading checkout details...</span>
      </div>
    );
  }

  // Combined Error State
  if (bookingError || razorpayError) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Checkout Error</AlertTitle>
          <AlertDescription>{bookingError || razorpayError?.message}. Please try again.</AlertDescription>
          <Button asChild className="mt-4 w-full">
            <Link to={`/my-bookings`}>Back to My Bookings</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  if (!bookingDetails) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Booking Details Missing</AlertTitle>
          <AlertDescription>No booking details found. Please go back to my bookings page.</AlertDescription>
          <Button asChild className="mt-4 w-full">
            <Link to={`/my-bookings`}>Back to My Bookings</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  // Determine button text and action based on payment status
  const isPaymentSuccessful = bookingDetails.status === 'CONFIRMED' || paymentFinalStatus === 'CONFIRMED';
  const isPaymentPending = bookingDetails.status === 'PENDING_PAYMENT' || bookingDetails.status === 'PAYMENT_IN_PROGRESS';
  const isBookingCancelled = bookingDetails.status.startsWith('CANCELLED');

  return (
    <AuthGuard redirectMessage="Please log in to complete your checkout">
    <div className="container mx-auto p-4 py-8 md:p-8 space-y-8 bg-background text-foreground min-h-[calc(100vh-theme(spacing.16))]">
      <Card className="shadow-lg max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-2">
            <Banknote className="h-7 w-7 text-primary" aria-hidden="true" /> Checkout
          </CardTitle>
          <CardDescription>
            Review your booking and complete your payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Booking Details */}
            <Card className="shadow-sm border-muted">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl font-semibold">Booking Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-4 shadow-sm">
                  <Image src="/assets/images/placeholder-venue.jpg" alt={bookingDetails.venueName || "Venue"} fill style={{ objectFit: 'cover' }} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-foreground">{bookingDetails.sportName}</h3>
                    <p className="text-lg text-muted-foreground">{bookingDetails.venueName}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                    <p className="text-sm text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> {bookingDetails.venueAddress}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                    <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" /> {format(parseISO(bookingDetails.startTime), "PPP")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                    <Clock className="h-4 w-4 text-primary" aria-hidden="true" /> {format(parseISO(bookingDetails.startTime), 'p')} - {format(parseISO(bookingDetails.endTime), 'p')}
                    </div>
                </div>

                <div className="flex justify-between items-center font-semibold text-foreground mt-4 pt-4 border-t">
                  <span>Booking Status:</span>
                  <Badge variant={isPaymentSuccessful ? 'default' : isPaymentPending ? 'secondary' : 'destructive'} className="text-sm px-3 py-1">
                    {isPaymentSuccessful ? 'Confirmed' : isPaymentPending ? 'Pending Payment' : 'Cancelled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Payment Details */}
            <Card className="shadow-sm border-muted flex flex-col h-full">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-xl font-semibold">Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6 flex-grow flex flex-col">
                {/* Price Summary & Payment Method */}
                <div className="space-y-6">
                  <div className="space-y-2">
                      <div className="flex justify-between items-center text-foreground">
                        <span>Booking Amount (Base)</span>
                        <span className="font-medium">{bookingDetails.currency} {bookingDetails.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground text-sm">
                        <span>Platform Fee</span>
                        <span>{bookingDetails.currency} 0.00</span>
                      </div>
                       <div className="flex justify-between items-center text-muted-foreground text-sm">
                        <span>Taxes</span>
                        <span>{bookingDetails.currency} 0.00</span>
                      </div>
                      <Separator />
                  </div>
                  
                  <CheckoutPaymentMethod 
                      totalAmount={bookingDetails.totalAmount} 
                      currency={bookingDetails.currency} 
                      onMethodChange={(data, valid) => {
                          setPaymentData(data);
                          setIsPaymentValid(valid);
                      }} 
                  />
                </div>

                <div className="flex-grow"></div>

                {/* Status Messages & Actions */}
                {isPaymentSuccessful ? (
                    <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                             <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-green-800 dark:text-green-300">Payment Successful!</h3>
                            <p className="text-green-600 dark:text-green-400">Your booking is confirmed. We&apos;ve sent you an email.</p>
                        </div>
                        <Button asChild className="w-full" size="lg">
                            <Link to={`/booking/${bookingDetails.id}`}>View Booking Ticket</Link>
                        </Button>
                    </div>
                ) : isBookingCancelled ? (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Booking Cancelled</AlertTitle>
                        <AlertDescription>This booking has been cancelled.</AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <AlertTitle className="text-blue-800 dark:text-blue-300">Payment Pending</AlertTitle>
                             <AlertDescription className="text-blue-600 dark:text-blue-400">Complete payment to confirm your slot.</AlertDescription>
                        </Alert>
                        
                        {timeLeft && !isExpired && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                                    <Clock className="h-4 w-4 animate-pulse" />
                                    <span className="text-sm font-medium">Reservation expires in</span>
                                </div>
                                <span className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">{timeLeft}</span>
                            </div>
                        )}

                        {isExpired && (
                             <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Reservation Expired</AlertTitle>
                                <AlertDescription>Your 5-minute hold on this slot has expired. Please select the slot again.</AlertDescription>
                            </Alert>
                        )}
                        
                        <div className="flex items-start space-x-2 py-2">
                            <Checkbox 
                                id="terms-checkout" 
                                checked={acceptTerms} 
                                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)} 
                            />
                            <div className="grid gap-1 leading-none">
                                <label
                                    htmlFor="terms-checkout"
                                    className="text-xs font-medium leading-none cursor-pointer"
                                >
                                    I agree to the <Link to="/terms" className="text-primary underline">Terms of Service</Link> and <Link to="/refund-policy" className="text-primary underline">Cancellation Policy</Link>
                                </label>
                            </div>
                        </div>

                        {paymentProcessingError && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Payment Failed</AlertTitle>
                                <AlertDescription>{paymentProcessingError}</AlertDescription>
                            </Alert>
                        )}
                        
                         <Button
                            className="w-full text-lg h-12"
                            onClick={handleCompletePayment}
                            disabled={isInitiatingPayment || !isRazorpayLoaded || !acceptTerms || isExpired}
                            size="lg"
                        >
                            {isInitiatingPayment ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                            </>
                            ) : (
                            <>
                                <CreditCard className="mr-2 h-5 w-5" aria-hidden="true" /> Pay Now
                            </>
                            )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span> 
                            Secured by Razorpay
                        </p>
                    </div>
                )}


              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
    </AuthGuard>
  );
}
