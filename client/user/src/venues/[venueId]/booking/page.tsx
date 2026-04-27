"use client";

/**
 * Enhanced Venue Booking Page
 * With visual slot timeline, animated pricing, and better UX
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  CalendarDays,
  Clock,
  AlertCircle,
  CheckCircle,
  Wallet,
  Star,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
const Image = (props: any) => <img {...props} />;

import { useVenueDetails, useSlotAvailability } from '@/hooks/useDiscovery';
import { useCreateBooking } from '@/hooks/useBookings';
import { useAuthStatus } from '@/hooks/useAuthStatus';
import { MultiCourtTimeline } from '@/components/booking/SlotTimeline';
import { AnimatedPriceSummary } from '@/components/booking/AnimatedPriceSummary';
import { Skeleton, SlotGridSkeleton } from '@/components/ui/Skeleton';
import { NoSlotsAvailable } from '@/components/ui/EmptyState';
import type { AvailableSlot } from '@/lib/discovery/types';
import { toast } from 'sonner';

export default function VenueBookingPage() {
  const params = useParams();
  const navigate = useNavigate();
  const venueId = params.venueId as string;

  // Auth hook
  const { isAuthenticated } = useAuthStatus();

  // API hooks
  const { venue, loading: isVenueLoading, error: venueError, loadVenue } = useVenueDetails();
  const { slotsGroupedByCourt, loading: isSlotsLoading, error: slotsError, loadSlots } = useSlotAvailability();
  const { createBooking, loading: isBooking, error: bookingError } = useCreateBooking();

  // Local state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlots, setSelectedSlots] = useState<AvailableSlot[]>([]);

  // Load venue on mount
  useEffect(() => {
    if (venueId) {
      loadVenue(venueId);
    }
  }, [venueId, loadVenue]);

  // Load slots when date changes
  useEffect(() => {
    if (venueId && selectedDate) {
      const startDateStr = format(selectedDate, 'yyyy-MM-dd');
      // Fix: Query until the next day to cover the full 24h of the selected date
      const endDateStr = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
      loadSlots(venueId, startDateStr, endDateStr);
      setSelectedSlots([]);
    }
  }, [venueId, selectedDate, loadSlots]);

  // Handle slot click
  const handleSlotClick = (slot: AvailableSlot) => {
    if (slot.status !== 'AVAILABLE') return;
    
    setSelectedSlots(prev => {
      if (prev.some(s => s.id === slot.id)) {
        return prev.filter(s => s.id !== slot.id);
      }
      return [...prev, slot];
    });
  };

  // Calculate average price
  const avgPrice = useMemo(() => {
    if (selectedSlots.length === 0) return venue?.pricePerHour || 0;
    return selectedSlots.reduce((sum, s) => sum + s.price, 0) / selectedSlots.length;
  }, [selectedSlots, venue]);

  // Handle checkout with auth guard
  const handleProceedToCheckout = async () => {
    if (selectedSlots.length === 0) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.info('Please log in to book this venue');
      // Redirect to login with return URL
      const currentUrl = `/venues/${venueId}/booking`;
      navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const firstSlot = selectedSlots[0];
    if (!firstSlot) return;

    const totalPrice = selectedSlots.reduce((sum, s) => sum + s.price, 0);

    const result = await createBooking({ 
      slotId: firstSlot.id,
      totalPrice,
      selectedSlots: selectedSlots.map(s => ({ id: s.id, price: s.price }))
    });
    
    if (result) {
      navigate(`/venues/${venueId}/checkout?bookingId=${result.bookingId}`);
    }
  };

  // Loading skeleton
  if (isVenueLoading) {
    return (
      <div className="container mx-auto p-4 py-8 md:p-8 space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-60 w-full rounded-lg" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="lg:col-span-2">
                <SlotGridSkeleton count={12} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (venueError || !venue) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Venue</AlertTitle>
          <AlertDescription>{venueError || 'Venue not found'}.</AlertDescription>
          <Button asChild className="mt-4 w-full">
            <Link to="/venues">Back to Venues</Link>
          </Button>
        </Alert>
      </div>
    );
  }

  // Fix: Safe access to photos with fallback
  const primaryPhoto = venue.photos?.find(p => p.isPrimary) || venue.photos?.[0];
  const hasSlots = Object.keys(slotsGroupedByCourt).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {primaryPhoto && (
          <>
            <Image
              src={primaryPhoto.photoUrl}
              alt={venue.name}
              fill
              style={{ objectFit: 'cover' }}
              className="brightness-75"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </>
        )}
        
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Venue info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                  {venue.name}
                </h1>
                <div className="flex items-center gap-4 mt-2 text-white/90">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {venue.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    4.5
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {/* SAFEGUARD: Fallback to empty array if primarySports is undefined */}
                {(venue.primarySports || []).slice(0, 3).map((sport: string) => (
                  <Badge key={sport} variant="secondary" className="bg-white/20 text-white border-0">
                    {sport}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 -mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Calendar & Info */}
          <div className="space-y-6">
            {/* Date Selection Card */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal h-12 ${!selectedDate && "text-muted-foreground"}`}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        <span className="font-medium">
                          {format(selectedDate, "EEEE, MMM d")}
                        </span>
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      fromDate={new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Venue Details Card */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Venue Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{venue.address}, {venue.city}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{venue.totalCourts} courts available</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>From ₹{venue.pricePerHour}/hour</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Slot Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Available Slots
                  </CardTitle>
                  {selectedSlots.length > 0 && (
                    <Badge variant="default" className="text-sm">
                      {selectedSlots.length} selected
                    </Badge>
                  )}
                </div>
                {selectedDate && (
                  <CardDescription>
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {/* Check hasSlots again here to ensure we don't show empty state if slots exist */}
                {!selectedDate ? (
                  <NoSlotsAvailable />
                ) : isSlotsLoading ? (
                  <SlotGridSkeleton count={16} />
                ) : slotsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{slotsError}</AlertDescription>
                  </Alert>
                ) : !hasSlots ? (
                  <NoSlotsAvailable date={selectedDate} />
                ) : (
                  <MultiCourtTimeline
                    slotsGroupedByCourt={slotsGroupedByCourt}
                    selectedSlots={selectedSlots as AvailableSlot[]}
                    onSlotClick={handleSlotClick}
                  />
                )}
              </CardContent>
            </Card>

            {/* Booking Summary - Sticky on Mobile */}
            <Card className="shadow-lg border-0 bg-card/80 backdrop-blur-sm lg:sticky lg:top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AnimatedPriceSummary
                  basePrice={avgPrice}
                  slotCount={selectedSlots.length}
                  currency="₹"
                />

                {bookingError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{bookingError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full h-12 text-lg font-semibold"
                  onClick={handleProceedToCheckout}
                  disabled={selectedSlots.length === 0 || isBooking}
                >
                  {isBooking ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : selectedSlots.length === 0 ? (
                    "Select slots to continue"
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Book Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}