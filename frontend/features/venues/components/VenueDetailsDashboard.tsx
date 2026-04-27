"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { BookingSuccessModal } from "@/components/booking/BookingSuccessModal";
import Image from "next/image";
import Link from "next/link";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils"; // Assuming utils exist
import { motion, AnimatePresence } from "framer-motion";
import { ErrorBoundary } from "react-error-boundary";

import {
  Loader2,
  MapPin,
  Star,
  Gamepad2,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Share2,
  ArrowRight,
  Wifi,
  Car,
  Droplets,
  Lock,
  ShowerHead,
  Shirt,
  Coffee,
  HeartPulse,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { FollowButton, useVenueDetails } from "@/features/venues";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { format, parseISO, addDays, isSameDay } from "date-fns";
import { DiscoveryApi } from "@/lib/discovery/api";
import type { AvailableSlot, VenueDetail } from '@/lib/discovery/types';
import { BookingsApi } from "@/lib/bookings/api";
import type { CreateBookingRequest, CreateBookingResponse } from "@/lib/bookings/types";
import { useAuth } from "@/lib/hooks/useAuth";
import { PaymentOptionCard } from "@/components/booking/PaymentOptionCard";
import dynamic from "next/dynamic";
import { useFeatureFlags } from "@/infrastructure/config/FeatureFlagProvider";

const VenueReviewSection = dynamic(
  () => import("@/features/reviews").then((mod) => mod.VenueReviewSection),
  {
    loading: () => (
      <div className="mt-8 pt-8 border-t space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-4 w-64 bg-muted/60 rounded animate-pulse mb-6" />
        {[1, 2].map((i) => (
          <div key={i} className="h-32 w-full bg-muted/40 rounded-xl animate-pulse" />
        ))}
      </div>
    ),
  }
);

// Horizontal Date Scroller Component
function DateScroller({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (date: Date) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Generate next 14 days
  const dates = React.useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => addDays(new Date(), i));
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
        onClick={() => scroll('left')}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide py-2 px-1 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelect(date)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[4.5rem] p-2 rounded-xl border transition-all duration-200",
                isSelected 
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-105 transform" 
                  : "bg-background border-border hover:border-primary/50 hover:bg-muted"
              )}
            >
              <span className="text-[10px] uppercase font-bold tracking-wide opacity-80 mb-0.5">
                {format(date, 'EEE')}
              </span>
              <span className="text-xl font-bold leading-none">
                {format(date, 'dd')}
              </span>
            </button>
          );
        })}
      </div>

      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => scroll('right')}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Reusable Slot Component
function SlotButton({ slot, isSelected, onSelect }: { slot: AvailableSlot; isSelected: boolean; onSelect: (s: AvailableSlot) => void }) {
    const isAvailable = slot.status === 'AVAILABLE';
    const isExpired = new Date(slot.startTime) < new Date();
    const isDisabled = !isAvailable || isExpired;

    return (
        <button
            onClick={() => !isDisabled && onSelect(slot)}
            disabled={isDisabled}
            className={cn(
                "relative flex flex-col items-center justify-center py-4 px-6 rounded-xl border transition-all duration-300 outline-none min-w-[6rem] snap-start shrink-0",
                
                // Available State
                isAvailable && !isExpired && !isSelected && 
                "bg-card hover:bg-muted/50 border-border/60 hover:border-primary/30 text-foreground cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 hover:scale-105",
                
                // Expired State (Visible but distinct)
                isExpired && 
                "bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 border-transparent cursor-not-allowed select-none",
                
                 // Taken State
                !isAvailable && !isExpired &&
                "bg-muted text-muted-foreground opacity-50 cursor-not-allowed border-muted",

                // Selected State
                isSelected && 
                "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/25 scale-110 z-10 font-medium ring-0"
            )}
        >
            <span className={cn("text-base font-bold tracking-tight", isExpired && "opacity-50 line-through decoration-neutral-400/40")}>
                {format(parseISO(slot.startTime), 'HH:mm')}
            </span>
            <span className={cn("text-[11px] uppercase tracking-wide font-medium mt-1.5", isSelected ? "text-primary-foreground/90" : "text-muted-foreground", isExpired && "opacity-0")}>
              {isExpired ? "" : (isAvailable ? `₹${slot.price}` : slot.status)}
            </span>
            {isExpired && (
                <span className="absolute bottom-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500/70">
                    Ended
                </span>
            )}
        </button>
    );
}


// Amenity Icon Helper
function getAmenityIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes('wifi') || n.includes('net')) return <Wifi className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('park') || n.includes('valet')) return <Car className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('water') || n.includes('drink')) return <Droplets className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('locker') || n.includes('safe')) return <Lock className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('shower') || n.includes('bath')) return <ShowerHead className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('chang') || n.includes('room')) return <Shirt className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('food') || n.includes('caf') || n.includes('cant')) return <Coffee className="h-4 w-4 mr-2 text-primary" />;
    if (n.includes('aid') || n.includes('medic')) return <HeartPulse className="h-4 w-4 mr-2 text-primary" />;
    
    return <CheckCircle className="h-4 w-4 mr-2 text-primary" />;
}

// Hero Carousel Component
function VenueHeroCarousel({ photos, venueName }: { photos: { photoUrl: string }[]; venueName: string }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!photos || photos.length <= 1) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % photos.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [photos]);

    if (!photos || photos.length === 0) {
        return (
             <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white/20">
                <Gamepad2 className="h-32 w-32" />
             </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    <Image
                        src={photos[index].photoUrl}
                        alt={`${venueName} - Photo ${index + 1}`}
                        layout="fill"
                        objectFit="cover"
                        priority={index === 0}
                        className="brightness-[0.7]"
                    />
                </motion.div>
            </AnimatePresence>
            
            {/* Dots Indicator */}
            {photos.length > 1 && (
                <div className="absolute bottom-10 left-0 right-0 z-20 flex justify-center gap-2">
                    {photos.map((_, i) => (
                        <button
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300 backdrop-blur-sm shadow-sm",
                                i === index ? "w-8 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
                            )}
                            onClick={() => setIndex(i)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export const VenueDetailsDashboard = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { flags } = useFeatureFlags();
  const venueId = params.venueId as string;
  const searchParams = useSearchParams();
  const successBookingId = searchParams.get('bookingId');
  
  useEffect(() => {
    console.log("DEBUG PARAMS:", { successBookingId, all: searchParams.toString(), windowUrl: window.location.href });
  }, [searchParams, successBookingId]);

  const { isAuthenticated } = useAuth();

  const { venue, loading, error, updateFollowStatus } = useVenueDetails(venueId);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  // const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null); // Replaced with array
  const [selectedSlots, setSelectedSlots] = useState<AvailableSlot[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentSelection, setShowPaymentSelection] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<CreateBookingResponse | null>(null);
  const [paymentType, setPaymentType] = useState<'FULL' | 'DEPOSIT'>('FULL');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showHours, setShowHours] = useState(false);


  useEffect(() => {
    if (!venue) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      // Reset selected slots when date changes
      setSelectedSlots([]);
      
      try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const response = await DiscoveryApi.getVenueAvailableSlots(venue.id, { startDate: dateString, endDate: dateString });
        // Assuming response structure: { slotsGroupedByCourt: { ... } }
        setAvailableSlots(response.slotsGroupedByCourt ? Object.values(response.slotsGroupedByCourt).flatMap(court => court.slots).sort((a,b) => a.startTime.localeCompare(b.startTime)) : []);
      } catch (err) {
        console.error("Failed to fetch available slots:", err);
        // Don't toast on every date change error, just log
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [venue, selectedDate]);

  const handleSlotSelect = (slot: AvailableSlot) => {
    if (slot.status !== 'AVAILABLE') return; // Prevent selecting booked slots
    setSelectedSlots(prev => {
      const exists = prev.some(s => s.id === slot.id);
      if (exists) return prev.filter(s => s.id !== slot.id);
      return [...prev, slot];
    });
  };

  const proceedToPayment = async (bookingId: string, type: 'FULL' | 'DEPOSIT') => {
    setIsBooking(true);
    try {
        const callbackUrl = `${window.location.origin}/venues/${venueId}?bookingId=${bookingId}`; // Redirect back with booking context
        const paymentResponse = await BookingsApi.initiatePayment(bookingId, type, callbackUrl);
        if (paymentResponse.checkoutUrl) {
            window.location.href = paymentResponse.checkoutUrl;
        } else {
            toast.error("Payment initiation failed.");
            setIsBooking(false);
        }
    } catch (err) {
        console.error("Failed to initiate payment:", err);
        toast.error("Failed to initiate payment. Please try again.");
        setIsBooking(false);
    }
  };

  const handleConfirmPaymentSelection = () => {
    if (bookingResponse) {
        setShowPaymentSelection(false);
        proceedToPayment(bookingResponse.bookingId, paymentType);
    }
  };
  
    // Handle auto-resume of booking (keep existing logic)
  useEffect(() => {
      // (Implementation kept same as before for robustness, checking params)
      const action = params?.action || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('action') : null);
      const slotId = params?.slotId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('slotId') : null);
  
      if (isAuthenticated && action === 'book' && slotId && availableSlots.length > 0 && !isBooking) {
          const slotToResume = availableSlots.find(s => s.id === slotId);
          if (slotToResume) {
              setSelectedSlots([slotToResume]);
              // Clean URL
              const url = new URL(window.location.href);
              url.searchParams.delete('action');
              url.searchParams.delete('slotId');
              url.searchParams.delete('date');
              window.history.replaceState({}, '', url.toString());

              // Auto-trigger
               setTimeout(() => {
                  const autoBook = async () => {
                       setIsBooking(true);
                       try {
                           const bookingRequest: CreateBookingRequest = { slotId: slotToResume.id };
                           const response = await BookingsApi.createBooking(bookingRequest);
                            if (response.allowPartialPayment && response.depositAmount) {
                                setBookingResponse(response);
                                setPaymentType('FULL');
                                setShowPaymentSelection(true);
                                setIsBooking(false);
                            } else {
                                await proceedToPayment(response.bookingId, 'FULL');
                            }
                       } catch(err) {
                           console.error("Auto-booking failed:", err);
                           setIsBooking(false);
                       }
                  };
                  autoBook();
               }, 500);
          }
      }
    }, [isAuthenticated, availableSlots, isBooking, params?.action, params?.slotId, router, venueId]);


  const handleBookNow = async () => {
    if (!isAuthenticated) {
      toast.info("Please log in to book a slot");
      const dateString = format(selectedDate, "yyyy-MM-dd");
      const returnUrl = `/venues/${venueId}?action=book&slotId=${selectedSlots[0]?.id}&date=${dateString}`;
      const encodedReturn = encodeURIComponent(returnUrl);
      router.push(`/login?redirect=${encodedReturn}`);
      return;
    }

    if (selectedSlots.length === 0 || !venue) {
      toast.error("Please select at least one slot.");
      return;
    }

    if (selectedSlots.length > 1) {
        toast.info(`Batch booking is coming soon! Proceeding with the first slot (${format(parseISO(selectedSlots[0].startTime), 'HH:mm')}). Please book others separately.`);
        // Proceed with only the first slot
    }

    setIsBooking(true);
    try {
      // Use the first selected slot for now
      const response = await BookingsApi.createBooking({ slotId: selectedSlots[0].id });
      
      if (response.allowPartialPayment && response.depositAmount) {
          setBookingResponse(response);
          setPaymentType('FULL');
          setShowPaymentSelection(true);
          setIsBooking(false);
      } else {
          await proceedToPayment(response.bookingId, 'FULL');
      }
    } catch (err: any) {
      console.error("Failed to create booking:", err);
      // Show specific error if slot is taken or expired
      const message = err.message || "Failed to create booking. Please try again.";
      toast.error(message);
      
      // If error suggests slot issue, maybe refresh slots?
      if (message.toLowerCase().includes('slot') || message.toLowerCase().includes('available')) {
         // trigger slot refresh logic if possible, or user will just reload
      }
      setIsBooking(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (error || !venue) return <div className="flex h-screen items-center justify-center text-destructive">{error instanceof Error ? error.message : "Venue not found"}</div>;

  return (
    <div className="bg-background min-h-screen">
      {/* Immersive Hero Section */}
      <div className="relative w-full h-[60vh] md:h-[70vh]">
        <VenueHeroCarousel photos={venue.photos || []} venueName={venue.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-black/30" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-16">
           <div className="container mx-auto">
              <div className="max-w-3xl space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <div className="flex items-center gap-2 text-white/90 font-medium tracking-wide text-sm uppercase">
                    {(venue.primarySports || []).slice(0, 3).join(" • ")}
                  </div>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-none text-shadow-md">
                      {venue.name}
                    </h1>
                    <div className="flex items-center gap-3 pb-2">
                       <FollowButton 
                        venueId={venue.id}
                        isFollowing={venue.isFollowing}
                        followersCount={venue.followersCount}
                        onStatusChange={updateFollowStatus}
                        className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20"
                       />
                       <Button variant="outline" size="icon" className="rounded-full bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                          <Share2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 md:gap-8 pt-2 text-white/80">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span className="text-lg">{venue.city}, {venue.province}</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <Star className="h-5 w-5 text-yellow-400 fill-current" />
                         <span className="text-lg font-semibold">{venue.rating ? venue.rating.toFixed(1) : "New"}</span>
                      </div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          
          {/* Left Column: Editorial Content (No Cards) */}
          <div className="lg:col-span-8 space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            
            {/* About Section */}
            <section className="space-y-6">
               <h2 className="text-3xl font-bold tracking-tight text-foreground">About the Venue</h2>
               
               {/* Amenities on Top */}
               <div className="flex flex-wrap gap-2.5 pb-2">
                  {(venue.amenities || []).map((amenity, i) => (
                    <span key={i} className="inline-flex items-center px-3.5 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-sm font-medium shadow-sm hover:shadow-md cursor-default select-none">
                      {getAmenityIcon(amenity)}
                      {amenity}
                    </span>
                  ))}
               </div>

               <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p>{venue.description || "Experience top-tier facilities at this venue. Perfect for both casual games and competitive matches."}</p>
               </div>
            </section>

             <Separator className="bg-border/50" />

            {/* Location Section */}
            <section className="space-y-6">
               <h2 className="text-3xl font-bold tracking-tight text-foreground">Location</h2>
               <div className="flex items-start gap-4 text-lg text-muted-foreground bg-muted/20 p-6 rounded-2xl border border-border/50">
                   <MapPin className="h-6 w-6 text-primary shrink-0 mt-1" />
                   <div>
                      <p className="font-medium text-foreground">{venue.address}</p>
                      <p>{venue.city}, {venue.province}, {venue.country}</p>
                      <Button variant="link" className="p-0 h-auto mt-2 text-primary font-semibold">
                        Get Directions <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                   </div>
               </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Operating Hours */}
             {/* Operating Hours (Collapsible) */}
             <section className="space-y-4">
               <button 
                 onClick={() => setShowHours(!showHours)}
                 className="flex items-center justify-between w-full text-left group"
               >
                 <h2 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">Operating Hours</h2>
                 {showHours ? <ChevronRight className="h-5 w-5 rotate-90 transition-transform" /> : <ChevronRight className="h-5 w-5 transition-transform" />}
               </button>
               
               {showHours && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 fade-in duration-300">
                    {venue.operatingHours ? Object.entries(venue.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center p-3 rounded-lg border bg-card/50 text-sm">
                         <span className="font-medium capitalize">{day}</span>
                         <span className="text-muted-foreground">{hours.openTime} - {hours.closeTime}</span>
                      </div>
                    )) : (
                      <p className="text-muted-foreground">Hours not available.</p>
                    )}
                 </div>
               )}
            </section>

             <Separator className="bg-border/50" />

            {/* WIDE SLOTS SELECTION SECTION */}
            <section className="space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200" id="book-slots">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Available Slots</h2>
                    {loadingSlots && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </div>

                {/* Date Scroller (Main Content) */}
                <div className="bg-card rounded-xl border p-4 shadow-sm">
                   <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3 block">Select Date</Label>
                   <DateScroller selectedDate={selectedDate} onSelect={setSelectedDate} />
                </div>

                {/* Court Timelines */}
               <div className="space-y-8">
                  {!loadingSlots && availableSlots.length > 0 ? (
                    // Group and Render Logic
                    Object.entries(availableSlots.reduce((acc, slot) => {
                       if (!acc[slot.courtName]) acc[slot.courtName] = [];
                       acc[slot.courtName].push(slot);
                       return acc;
                    }, {} as Record<string, AvailableSlot[]>)).map(([courtName, slots]) => {
                       // Split AM/PM
                       const amSlots = slots.filter(s => parseInt(format(parseISO(s.startTime), 'H')) < 12);
                       const pmSlots = slots.filter(s => parseInt(format(parseISO(s.startTime), 'H')) >= 12);

                       return (
                          <div key={courtName} className="space-y-3">
                             <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="px-3 py-1 font-semibold text-base">
                                   {courtName}
                                </Badge>
                                <Separator className="flex-1" />
                             </div>
                             
                             {/* AM Row */}
                             {amSlots.length > 0 && (
                                <div className="flex items-center gap-4">
                                   <div className="w-8 text-xs font-bold text-muted-foreground uppercase pt-1">AM</div>
                                   <div className="flex gap-4 overflow-x-auto py-4 flex-1 scrollbar-hide snap-x px-1">
                                      {amSlots.map(slot => (
                                         <SlotButton 
                                            key={slot.id} 
                                            slot={slot} 
                                            isSelected={selectedSlots.some(s => s.id === slot.id)} 
                                            onSelect={handleSlotSelect} 
                                         />
                                      ))}
                                   </div>
                                </div>
                             )}

                             {/* PM Row */}
                             {pmSlots.length > 0 && (
                                <div className="flex items-center gap-4">
                                   <div className="w-8 text-xs font-bold text-muted-foreground uppercase pt-1">PM</div>
                                   <div className="flex gap-4 overflow-x-auto py-4 flex-1 scrollbar-hide snap-x px-1">
                                      {pmSlots.map(slot => (
                                         <SlotButton 
                                            key={slot.id} 
                                            slot={slot} 
                                            isSelected={selectedSlots.some(s => s.id === slot.id)} 
                                            onSelect={handleSlotSelect} 
                                         />
                                      ))}
                                   </div>
                                </div>
                             )}
                          </div>
                       );
                    })
                  ) : !loadingSlots ? (
                     <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">No slots available for this date</p>
                        <p className="text-sm">Try selecting another date above</p>
                     </div>
                  ) : (
                     // Skeleton for Wide View
                     <div className="space-y-6">
                        {[1, 2].map(i => (
                           <div key={i} className="space-y-3">
                              <div className="h-8 w-32 bg-muted rounded-md animate-pulse" />
                              <div className="flex gap-2 overflow-hidden">
                                 {[1, 2, 3, 4, 5].map(j => (
                                    <div key={j} className="h-16 w-24 bg-muted rounded-md animate-pulse shrink-0" />
                                 ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

            </section>

            {flags.enableAdvancedReviews && (
              <ErrorBoundary fallback={<div className="p-6 text-center text-muted-foreground border rounded-xl bg-muted/10 bg-destructive/10">Unable to load reviews section.</div>}>
                <VenueReviewSection venueId={venueId} />
              </ErrorBoundary>
            )}

          </div>

          {/* Right Column: Sticky Booking Summary */}
          <div className="lg:col-span-4 relative">
             <div className="sticky top-8 space-y-6">
                <Card className="border-0 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden bg-card/95 backdrop-blur-md">
                   <div className="h-2 w-full bg-primary/90" /> {/* Brand strip */}
                   <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex justify-between items-center">
                         <span>Booking Summary</span>
                      </CardTitle>
                      <CardDescription>Review your selection before payment</CardDescription>
                   </CardHeader>
                   
                   <CardContent className="space-y-6">
                      
                       {selectedSlots.length > 0 ? (
                          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                              {selectedSlots.map((slot, index) => (
                                <div key={slot.id} className="bg-muted/40 p-3 rounded-lg border border-border/50 text-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <Badge variant="outline" className="bg-background font-mono">
                                            {format(parseISO(slot.startTime), 'HH:mm')} - {format(parseISO(slot.endTime), 'HH:mm')}
                                        </Badge>
                                        <span className="font-bold">₹{slot.price}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground text-xs">
                                        <span>{slot.courtName}</span>
                                        <span>{format(parseISO(slot.startTime), "MMM dd")}</span>
                                    </div>
                                </div>
                              ))}
                          </div>
                      ) : (
                          <div className="py-8 text-center bg-muted/20 rounded-lg border border-dashed text-muted-foreground text-sm">
                             <MapPin className="h-8 w-8 mx-auto mb-2 opacity-20" />
                             Select slots from the timeline to proceed.
                          </div>
                      )}

                      {/* Summary & Action */}
                      <div className="pt-2 space-y-3">
                         <div className="flex justify-between items-center text-sm font-medium">
                            <span>Total Amount</span>
                            <span className="text-2xl font-bold">
                              ₹{selectedSlots.reduce((acc, s) => acc + s.price, 0)}
                            </span>
                         </div>
                         <Button 
                            className="w-full text-lg py-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" 
                            size="lg"
                            onClick={handleBookNow}
                            disabled={selectedSlots.length === 0 || isBooking}
                          >
                            {isBooking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : `Pay & Book (${selectedSlots.length})`}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                            Secure payment via Razorpay/Stripe
                          </p>
                      </div>

                   </CardContent>
                </Card>

                {/* Quick Navigation / Help */}
                 <div className="bg-muted/30 p-4 rounded-lg border text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">Need Help?</p>
                    <p>Contact the venue directly at <span className="text-foreground">{venue.contactNumber || "+91 98765 43210"}</span></p>
                 </div>
             </div>
          </div>
          
        </div>
      </div>

       {/* Payment Dialog (kept same) */}
       <Dialog open={showPaymentSelection} onOpenChange={setShowPaymentSelection}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Select Payment Option</DialogTitle>
            <DialogDescription>
              Choose how you would like to pay for your booking.
            </DialogDescription>
          </DialogHeader>
          
          {bookingResponse && (
            <div className="space-y-4 py-2">
              <PaymentOptionCard
                type="FULL"
                amount={bookingResponse.totalAmount}
                totalAmount={bookingResponse.totalAmount}
                isSelected={paymentType === 'FULL'}
                onSelect={() => setPaymentType('FULL')}
              />
              {bookingResponse.allowPartialPayment && bookingResponse.depositAmount && (
                <PaymentOptionCard
                  type="DEPOSIT"
                  amount={bookingResponse.depositAmount}
                  totalAmount={bookingResponse.totalAmount}
                  depositAmount={bookingResponse.depositAmount}
                  isSelected={paymentType === 'DEPOSIT'}
                  onSelect={() => setPaymentType('DEPOSIT')}
                />
              )}
            </div>
          )}

          <div className="flex items-start space-x-2 py-4">
            <Checkbox 
                id="terms" 
                checked={acceptTerms} 
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)} 
            />
            <div className="grid gap-1.5 leading-none">
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    I accept the <Link href="/terms" className="text-primary underline">Terms & Conditions</Link> and <Link href="/refund-policy" className="text-primary underline">Cancellation Policy</Link>
                </label>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowPaymentSelection(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmPaymentSelection}
              disabled={!acceptTerms || isBooking}
              className="min-w-[140px]"
            >
              Proceed to Pay ₹{paymentType === 'FULL' ? bookingResponse?.totalAmount : bookingResponse?.depositAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BookingSuccessModal 
        isOpen={!!successBookingId} 
        bookingId={successBookingId || ''} 
        onClose={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('bookingId');
            url.searchParams.delete('payment_status');
            // Clean Razorpay params too
            url.searchParams.delete('razorpay_payment_id');
            url.searchParams.delete('razorpay_payment_link_id');
            url.searchParams.delete('razorpay_payment_link_reference_id');
            url.searchParams.delete('razorpay_payment_link_status');
            url.searchParams.delete('razorpay_signature');
            
            window.history.replaceState({}, '', url.toString());
        }}
      />
    </div>
  );
}