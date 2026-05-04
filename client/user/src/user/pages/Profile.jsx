import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  User, MapPin, Clock, IndianRupee, Calendar, Zap, Activity,
  ArrowRight, ShieldCheck, Trophy, Star, Camera, Edit2
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../hooks/useAxiosInstance";
import { login, updateUser } from "@redux/slices/authSlice";
import useBookingHistory from "../hooks/useBookingHistory";
import useWriteReview from "../hooks/useWriteReview";
import TurfBookingHistorySkeleton from "../components/ui/TurfBookingHistorySkeleton";
import WriteReview from "../components/reviews/WriteReview";

const PRI = "#84CC16";
const BDR = "#2A2A2A";

// Derive member level from booking count
const getMemberLevel = (count) => {
  if (count >= 20) return { label: "PRO", color: PRI };
  if (count >= 5) return { label: "ADVANCED", color: "#F59E0B" };
  return { label: "ROOKIE", color: "#60A5FA" };
};

export default function Profile() {
  const { user, role, token } = useSelector((state) => state.auth);
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

  const dispatch = useDispatch();
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    setUploading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      dispatch(updateUser({ profilePicture: response.data.profilePicture }));
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const memberLevel = getMemberLevel(bookings.length);
  const totalSpent = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

  if (loading) return <TurfBookingHistorySkeleton />;

  return (
    <div className="min-h-screen bg-black text-white pb-24 overflow-x-hidden">

      {/* ── HERO HEADER ── */}
      <div className="border-b" style={{ borderColor: BDR, backgroundColor: "#050505" }}>
        <div className="max-w-5xl mx-auto px-6 pt-4 pb-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">

            {/* Left: Identity */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center border shrink-0 overflow-hidden relative bg-[#111]"
                  style={{ borderColor: BDR }}
                >
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} style={{ color: PRI }} />
                  )}
                  
                  {/* Upload Overlay */}
                  <label htmlFor="profile-upload" className={`absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer transition-all ${uploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Camera size={24} className="text-white" />
                    )}
                  </label>
                </div>
                <input type="file" id="profile-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                    style={{ color: memberLevel.color, backgroundColor: `${memberLevel.color}15` }}
                  >
                    {memberLevel.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-2 py-1 rounded-md border" style={{ borderColor: BDR }}>
                    {role?.toUpperCase() || "MEMBER"}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight leading-none">
                  My <span style={{ color: PRI }}>Profile</span>
                </h1>
                <p className="text-gray-500 text-sm mt-2 uppercase tracking-widest">Athlete Dashboard</p>
              </div>
            </div>

            {/* Right: Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Bookings", value: bookings.length, icon: Calendar },
                { label: "Amount Spent", value: `₹${totalSpent.toLocaleString()}`, icon: IndianRupee },
                { label: "Member Level", value: memberLevel.label, icon: Trophy },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="px-5 py-4 rounded-2xl border text-center group hover:border-[#84CC16]/30 transition-all"
                  style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}
                >
                  <stat.icon size={14} className="mx-auto mb-2 text-gray-600 group-hover:text-[#84CC16] transition-colors" />
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-lg font-bold text-white group-hover:text-[#84CC16] transition-colors">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-6 pt-4">

        {/* Section label */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Activity size={14} style={{ color: PRI }} className="animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Booking History · {bookings.length} Records
            </span>
          </div>
          <Link
            to="/turfs"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-[#84CC16] transition-colors"
          >
            Book New Slot <ArrowRight size={12} />
          </Link>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {bookings.length === 0 ? (
            <div
              className="p-16 text-center rounded-[32px] border space-y-6"
              style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}
            >
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: "#111", border: `1px solid ${BDR}` }}>
                <Calendar size={32} className="text-gray-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">No Bookings Yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  You haven't booked any venues yet. Explore local arenas and start playing!
                </p>
              </div>
              <Link
                to="/turfs"
                className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all hover:scale-105 text-black"
                style={{ backgroundColor: PRI }}
              >
                Explore Venues <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking._id}
                className="group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:border-[#84CC16]/30"
                style={{ borderColor: BDR, backgroundColor: "#0A0A0A" }}
              >
                {/* Green accent bar on hover */}
                <div className="absolute top-0 left-0 w-1 h-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: PRI }} />

                <div className="p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">

                    {/* QR Code */}
                    <div className="shrink-0">
                      <div className="p-3 bg-white rounded-2xl">
                        <img src={booking.qrCode} alt="Booking QR" className="w-28 h-28" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest text-center mt-2">Entry Pass</p>
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-5 w-full">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <h2 className="text-2xl font-bold uppercase tracking-tight text-white group-hover:text-[#84CC16] transition-colors">
                            {booking.turf.name}
                          </h2>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <MapPin size={11} style={{ color: PRI }} />
                            {booking.turf.location}
                          </div>
                        </div>
                        <div
                          className="px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest"
                          style={{ borderColor: `${PRI}33`, color: PRI, backgroundColor: `${PRI}10` }}
                        >
                          Confirmed
                        </div>
                      </div>

                      {/* Meta grid */}
                      <div
                        className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-5 border-t"
                        style={{ borderColor: BDR }}
                      >
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Booking Date</p>
                          <div className="flex items-center gap-2 text-white font-bold text-sm">
                            <Calendar size={12} style={{ color: PRI }} />
                            {booking.timeSlot.date}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Time Slot</p>
                          <div className="flex items-center gap-2 text-white font-bold text-sm">
                            <Clock size={12} style={{ color: PRI }} />
                            {booking.timeSlot.formattedStartTime} – {booking.timeSlot.formattedEndTime}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Amount Paid</p>
                          <div className="flex items-center gap-1 font-bold text-xl" style={{ color: PRI }}>
                            <IndianRupee size={15} />
                            {booking.totalPrice}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => openReviewModal(booking.turf._id)}
                          className="flex items-center gap-2 px-6 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl hover:border-[#84CC16]/50 hover:text-[#84CC16] group/btn"
                          style={{ borderColor: BDR, color: "#888" }}
                        >
                          <Star size={12} className="group-hover/btn:fill-[#84CC16] group-hover/btn:text-[#84CC16] transition-all" />
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

      {/* Review Modal */}
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
    </div>
  );
}
