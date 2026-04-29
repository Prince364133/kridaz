import { Clock, MapPin, IndianRupee, Calendar, QrCode, ShieldCheck, Zap, Activity } from "lucide-react";
import useBookingHistory from "../../hooks/useBookingHistory";
import useWriteReview from "../../hooks/useWriteReview";
import TurfBookingHistorySkeleton from "../../components/ui/TurfBookingHistorySkeleton";
import WriteReview from "../../components/reviews/WriteReview";

const TurfBookingHistory = () => {
  const { loading, bookings } = useBookingHistory();
  const {
    isReviewModalOpen,
    rating,
    review,
    isSubmitting,
    openReviewModal,
    closeReviewModal,
    handleRatingChange,
    handleReviewChange,
    submitReview,
  } = useWriteReview();

  if (loading) {
    return <TurfBookingHistorySkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#000] py-12 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 text-center md:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3 text-primary font-mono text-[10px] uppercase tracking-[0.4em]">
               <Activity size={14} className="animate-pulse" />
               <span>Player Passport Active</span>
            </div>
            <h1 className="text-5xl font-display font-black italic uppercase tracking-tighter text-white">
              Mission <span className="text-primary">Logs</span>
            </h1>
            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
              Global Booking Intelligence // History Verified
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="px-6 py-4 bg-[#0A0A0A] border border-white/5 notched-corner text-center min-w-[120px] group hover:border-primary/30 transition-all">
                <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">Bookings</p>
                <p className="text-3xl font-display font-black italic text-white group-hover:text-primary transition-colors">{bookings.length}</p>
             </div>
             <div className="px-6 py-4 bg-[#0A0A0A] border border-white/5 notched-corner text-center min-w-[120px] group hover:border-primary/30 transition-all">
                <p className="text-[10px] font-mono text-gray-500 uppercase mb-1">Rank</p>
                <p className="text-3xl font-display font-black italic text-white group-hover:text-primary transition-colors">PRO</p>
             </div>
          </div>
        </div>

        {/* Bookings Feed */}
        <div className="space-y-8">
          {bookings.length === 0 ? (
            <div className="p-12 text-center bg-[#0A0A0A] notched-corner border border-white/5 space-y-6">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                  <Calendar size={32} />
               </div>
               <div>
                  <h3 className="text-xl font-display font-bold text-white uppercase italic">No Missions Logged</h3>
                  <p className="text-gray-500 font-mono text-xs mt-2 uppercase tracking-widest">Awaiting your first stadium deployment...</p>
               </div>
               <button className="px-8 py-3 bg-primary text-black notched-corner font-display font-black italic uppercase text-xs tracking-widest hover:scale-95 transition-all">
                 Book Arena Now
               </button>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking._id}
                className="group relative overflow-hidden bg-[#0A0A0A] border border-white/5 notched-corner transition-all duration-500 hover:border-primary/30 hover:scale-[1.01]"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* QR Code Section */}
                    <div className="relative shrink-0 group/qr">
                      <div className="absolute inset-0 bg-primary/20 blur-[20px] rounded-full opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                      <div className="relative p-3 bg-white notched-corner">
                        <img
                          src={booking.qrCode}
                          alt="Booking QR"
                          className="w-32 h-32"
                        />
                      </div>
                      <div className="mt-3 text-center">
                         <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Entry Token</span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 space-y-6 w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h2 className="text-3xl font-display font-black italic text-white uppercase tracking-tighter group-hover:text-primary transition-colors">
                            {booking.turf.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 text-gray-500 font-mono text-[10px] uppercase tracking-widest">
                            <MapPin size={10} className="text-primary" />
                            {booking.turf.location}
                          </div>
                        </div>
                        <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 notched-corner">
                           <span className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] font-bold">Confirmed</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Deployment Date</p>
                          <div className="flex items-center gap-2 text-white font-display font-bold">
                             <Calendar size={14} className="text-primary" />
                             <span className="uppercase tracking-tight">{booking.timeSlot.date}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Time Window</p>
                          <div className="flex items-center gap-2 text-white font-display font-bold">
                             <Clock size={14} className="text-primary" />
                             <span className="uppercase tracking-tight">{booking.timeSlot.formattedStartTime} - {booking.timeSlot.formattedEndTime}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Mission Cost</p>
                          <div className="flex items-center gap-1 text-primary font-display font-black text-xl italic">
                             <IndianRupee size={16} />
                             <span>{booking.totalPrice}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-4">
                        <button
                          className="flex items-center gap-2 px-6 py-2 border border-white/10 hover:border-primary/50 text-white hover:text-primary notched-corner text-[10px] font-mono uppercase tracking-[0.2em] transition-all group/btn"
                          onClick={() => openReviewModal(booking.turf._id)}
                        >
                          Submit Debrief
                          <Zap size={12} className="group-hover/btn:fill-primary transition-all" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isReviewModalOpen && (
        <WriteReview
          rating={rating}
          review={review}
          isSubmitting={isSubmitting}
          onClose={closeReviewModal}
          onRatingChange={handleRatingChange}
          onReviewChange={handleReviewChange}
          onSubmit={submitReview}
        />
      )}

      {/* Decorative Sidebar Labels */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden xl:block">
         <div className="rotate-90 origin-right text-[10px] font-mono text-gray-800 uppercase tracking-[1em] whitespace-nowrap">
            PLAYER_BOOKING_HISTORY_PROTOCOL_V4
         </div>
      </div>
    </div>
  );
};

export default TurfBookingHistory;
