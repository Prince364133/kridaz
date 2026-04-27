
"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Loader2, Calendar, Share2, ArrowRight, Check } from "lucide-react";
import { BookingQRCode } from "./BookingQRCode";
import BookingsApi from "@/lib/bookings/api";
import { Booking } from "@/lib/bookings/types";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface BookingSuccessModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingSuccessModal = ({ bookingId, isOpen, onClose }: BookingSuccessModalProps) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("BookingSuccessModal: Mounted", { isOpen, bookingId });
    if (isOpen && bookingId) {
      const fetchDetails = async () => {
        try {
          console.log("BookingSuccessModal: Fetching details...");
          const data = await BookingsApi.getBookingDetails(bookingId);
          console.log("BookingSuccessModal: Details fetched", data);
          setBooking(data);
        } catch (error) {
          console.error("BookingSuccessModal Error:", error);
          toast.error("Could not load booking details.");
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    }
  }, [isOpen, bookingId]);

  const addToGoogleCalendar = () => {
    if (!booking) return;
    const start = format(parseISO(booking.bookingDate + 'T' + booking.startTime.split('T')[1]), "yyyyMMdd'T'HHmmss");
    const end = format(parseISO(booking.bookingDate + 'T' + booking.endTime.split('T')[1]), "yyyyMMdd'T'HHmmss");
    const title = `Game at ${booking.venueName}`;
    const details = `Booking Reference: ${booking.bookingReference}\nCourt: ${booking.courtName}`;
    const location = `${booking.venueName}, ${booking.venueCity}`;
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-none shadow-2xl">
        <div className="relative flex flex-col items-center justify-center min-h-[400px]">
           
           <AnimatePresence mode="wait">
             {loading ? (
                <motion.div 
                    key="loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    className="flex flex-col items-center space-y-4 py-12"
                >
                    <div className="relative">
                        <motion.div 
                           className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                           animate={{ scale: [1, 1.2, 1] }} 
                           transition={{ repeat: Infinity, duration: 2 }} 
                        />
                        <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                    </div>
                    <p className="text-muted-foreground font-medium animate-pulse">Securing your slot...</p>
                </motion.div>
             ) : (
                <motion.div 
                    key="success"
                    className="w-full flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Hero Animation Section */}
                    <div className="bg-gradient-to-b from-green-50 to-background dark:from-green-950/20 dark:to-background pt-12 pb-6 px-6 flex flex-col items-center relative overflow-hidden">
                        
                        {/* Ripple Background */}
                        <motion.div 
                            className="absolute top-0 w-full h-full flex items-center justify-center pointer-events-none opacity-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                        >
                             {[1, 2, 3].map((i) => (
                                <motion.div
                                    key={i}
                                    className="absolute rounded-full border-2 border-green-500"
                                    initial={{ width: 0, height: 0, opacity: 1 }}
                                    animate={{ width: 400, height: 400, opacity: 0 }}
                                    transition={{ 
                                        repeat: 0, 
                                        duration: 2, 
                                        delay: i * 0.4,
                                        ease: "easeOut"
                                    }}
                                />
                             ))}
                        </motion.div>

                        {/* Checkmark Icon */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 z-10"
                        >
                            <Check className="h-10 w-10 text-white" strokeWidth={4} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-center mt-6 space-y-1 z-10"
                        >
                            <h2 className="text-2xl font-bold tracking-tight">Booking Confirmed!</h2>
                            <p className="text-muted-foreground">You&apos;re all set to play.</p>
                        </motion.div>
                    </div>

                    {/* Ticket Slide Up */}
                    <motion.div 
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: "spring", damping: 25 }}
                        className="p-6 space-y-6"
                    >
                         {/* Details Card */}
                         {booking && (
                            <div className="bg-muted/30 border rounded-2xl p-4 flex flex-col gap-4 relative overflow-hidden">
                                {/* Ticket Perforation Style */}
                                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full border border-border/50" />
                                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full border border-border/50" />
                                
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg">{booking.courtName}</h3>
                                        <p className="text-sm text-muted-foreground">{booking.venueName}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono text-xs text-muted-foreground">REF</div>
                                        <div className="font-bold">{booking.bookingReference}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4 border-t border-dashed pt-4 mt-2">
                                     <div className="flex-1">
                                        <div className="text-xs text-muted-foreground uppercase">Date</div>
                                        <div className="font-semibold">{format(parseISO(booking.bookingDate), 'MMM dd, yyyy')}</div>
                                     </div>
                                     <div className="flex-1">
                                        <div className="text-xs text-muted-foreground uppercase">Time</div>
                                        <div className="font-semibold">
                                            {format(parseISO(booking.startTime), 'HH:mm')} - {format(parseISO(booking.endTime), 'HH:mm')}
                                        </div>
                                     </div>
                                </div>

                                <div className="flex justify-center pt-2">
                                    <Button variant="link" className="text-xs h-auto p-0 text-primary" onClick={() => {
                                        const el = document.getElementById('qr-reveal');
                                        if (el) el.classList.toggle('hidden');
                                    }}>
                                        Show QR Code for Entry
                                    </Button>
                                </div>
                                <div id="qr-reveal" className="hidden flex justify-center pt-2 animate-in slide-in-from-top-2">
                                     <BookingQRCode bookingId={booking.id} bookingReference={booking.bookingReference} />
                                </div>
                            </div>
                         )}

                         <div className="grid grid-cols-2 gap-3">
                             <Button variant="outline" onClick={addToGoogleCalendar}>
                                <Calendar className="mr-2 h-4 w-4" /> Add to Cal
                             </Button>
                             <Button variant="outline" onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: "Game at " + (booking?.venueName || "Venue"),
                                        url: window.location.href
                                    }).catch(() => {});
                                } else {
                                    toast.info("Link copied!");
                                    navigator.clipboard.writeText(window.location.href);
                                }
                             }}>
                                <Share2 className="mr-2 h-4 w-4" /> Share
                             </Button>
                         </div>
                         
                         <Button className="w-full text-md" size="lg" onClick={() => /* eslint-disable-next-line no-restricted-syntax */
router.push('/bookings')}>
                             View My Bookings
                             <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                    </motion.div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
