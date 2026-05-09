import { Clock, MapPin, IndianRupee, Calendar, QrCode, ShieldCheck, Zap, Activity, Wallet, CreditCard, FileText, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
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
    <div className="min-h-screen bg-[#000] pt-4 pb-20 px-4 relative overflow-hidden">
      {/* Decorative Background Elements */}


      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6 text-center md:text-left">
          <div className="space-y-3">
            <div className="flex items-center justify-center md:justify-start gap-3 text-[#84CC16] font-bold text-[10px] uppercase tracking-normal">
               <Activity size={14} className="animate-pulse" />
               <span>Booking Management Active</span>
            </div>
            <h1 className="text-5xl font-bold uppercase tracking-tight text-white">
              Booking <span className="text-[#84CC16]">History</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-md">
              View and manage your previous bookings and upcoming games.
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="px-8 py-6 bg-[#0A0A0A] border border-white/10 rounded-2xl text-center min-w-[140px] group hover:border-[#84CC16]/30 transition-all">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal mb-2">Total Bookings</p>
                <p className="text-4xl font-bold text-white group-hover:text-[#84CC16] transition-colors">{bookings.length}</p>
             </div>
             <div className="px-8 py-6 bg-[#0A0A0A] border border-white/10 rounded-2xl text-center min-w-[140px] group hover:border-[#84CC16]/30 transition-all">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal mb-2">Member Level</p>
                <p className="text-4xl font-bold text-white group-hover:text-[#84CC16] transition-colors">PRO</p>
             </div>
          </div>
        </div>

        {/* Bookings Feed */}
        <div className="space-y-8">
          {bookings.length === 0 ? (
            <div className="p-16 text-center bg-[#0A0A0A] rounded-[32px] border border-white/10 space-y-8">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-500">
                  <Calendar size={36} />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-white uppercase">No Bookings Yet</h3>
                  <p className="text-gray-400 text-sm mt-3 max-w-sm mx-auto">You haven't booked any venues yet. Explore local arenas and start playing!</p>
               </div>
               <button className="px-10 py-4 bg-[#84CC16] text-black rounded-xl font-bold uppercase text-xs tracking-normal hover:scale-105 active:scale-95 transition-all">
                 Explore Venues
               </button>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking._id}
                className="group relative overflow-hidden bg-[#0A0A0A] border border-white/10 rounded-3xl transition-all duration-500 hover:border-[#84CC16]/30 hover:shadow-2xl"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                    {/* QR Code Section */}
                    <div className="relative shrink-0 group/qr">

                      <Link to={`/booking-pass/${booking._id}`} className="relative p-4 bg-white rounded-2xl block hover:scale-105 transition-transform">
                        <img
                          src={booking.qrCode}
                          alt="Booking QR"
                          className="w-32 h-32"
                        />
                      </Link>
                      <div className="mt-3 text-center">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Entry Pass</span>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="flex-1 space-y-6 w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h2 className="text-3xl font-bold text-white uppercase tracking-tight group-hover:text-[#84CC16] transition-colors">
                            {booking.turf.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-2 text-gray-400 font-medium text-xs">
                            <MapPin size={12} className="text-[#84CC16]" />
                            {booking.turf.location}
                          </div>
                        </div>
                        <div className="px-4 py-1.5 bg-[#84CC16]/10 border border-[#84CC16]/20 rounded-full">
                           <span className="text-[10px] font-bold text-[#84CC16] uppercase tracking-normal">Confirmed</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-white/5">
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Booking Date</p>
                          <div className="flex items-center gap-2 text-white font-bold">
                             <Calendar size={14} className="text-[#84CC16]" />
                             <span className="tracking-tight">{booking.timeSlot.date}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Time Slot</p>
                          <div className="flex items-center gap-2 text-white font-bold">
                             <Clock size={14} className="text-[#84CC16]" />
                             <span className="tracking-tight">{booking.timeSlot.formattedStartTime} - {booking.timeSlot.formattedEndTime}</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Payment Mode</p>
                          <div className="flex items-center gap-2 text-white font-bold uppercase text-[10px]">
                             {booking.paymentMethod === "WALLET" ? <Wallet size={12} className="text-[#84CC16]" /> : <CreditCard size={12} className="text-[#84CC16]" />}
                             <span className="tracking-widest">{booking.paymentMethod}</span>
                          </div>
                          {booking.cashback > 0 && (
                            <div className="flex items-center gap-1 text-[#84CC16] text-[8px] font-black uppercase mt-1">
                                <Zap size={8} fill="currentColor" />
                                <span>₹{booking.cashback} Cashback</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-normal">Payment Summary</p>
                          <div className="space-y-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-white uppercase tracking-tight">Paid: ₹{booking.advanceAmount || booking.totalPrice}</span>
                                <span className={`text-[9px] font-black uppercase tracking-tighter ${booking.paymentType === "PARTIAL" ? "text-orange-400" : "text-[#84CC16]"}`}>
                                    {booking.paymentType === "PARTIAL" ? `Balance: ₹${booking.balanceAmount}` : "Fully Paid"}
                                </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-3 pt-6">
                        <Link
                          to={`/booking-pass/${booking._id}`}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#84CC16] border border-[#84CC16] text-black hover:bg-[#a3e635] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all group/btn shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                        >
                          <Ticket size={12} className="group-hover/btn:rotate-12 transition-all" />
                          Open Ticket
                        </Link>
                        
                        <Link
                          to={`/booking-invoice/${booking._id}`}
                          className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 hover:border-white/30 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all group/btn"
                        >
                          <FileText size={12} className="group-hover/btn:scale-110 transition-all" />
                          See Invoice
                        </Link>

                        <button
                          className="flex items-center gap-2 px-6 py-2.5 border border-white/10 hover:border-[#84CC16]/50 text-white hover:text-[#84CC16] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all group/btn"
                          onClick={() => openReviewModal(booking.turf._id)}
                        >
                          <Zap size={12} className="group-hover/btn:fill-[#84CC16] transition-all" />
                          Write a Review
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
         <div className="rotate-90 origin-right text-[10px] font-bold text-white/5 uppercase tracking-normal whitespace-nowrap">
            PLAYER DASHBOARD
         </div>
      </div>
    </div>
  );
};


export default TurfBookingHistory;
