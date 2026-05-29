import React, { useState } from "react";
import { 
  Calendar, 
  MapPin, 
  User, 
  Trophy, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  Info
} from "lucide-react";
import { useGetMyOnDemandBookingsQuery } from "../../../redux/api/professionalApi";

const BookingsTab = ({ role }) => {
  const { data: bookingsData, isLoading, refetch } = useGetMyOnDemandBookingsQuery();
  const [activeSubTab, setActiveSubTab] = useState("active");

  const bookings = bookingsData?.bookings || [];
  const nonAcceptedBookings = bookingsData?.nonAcceptedBookings || [];

  const activeBookings = bookings.filter(
    (b) => b.status === "ASSIGNED" || b.status === "IN_PROGRESS"
  );
  
  const completedBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED" || b.status === "NO_SHOW"
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-[#BFF367]/10 text-[#BFF367] border border-[#BFF367]/20";
      case "IN_PROGRESS":
        return "bg-green-500/10 text-green-400 border border-green-500/20";
      case "COMPLETED":
        return "bg-green-500/20 text-green-300 border border-green-500/30";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "NO_SHOW":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "REJECTED":
      case "EXPIRED":
      case "SKIPPED":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    }
  };

  const currentList = activeSubTab === "active" 
    ? activeBookings 
    : activeSubTab === "history" 
      ? completedBookings 
      : nonAcceptedBookings;

  return (
    <div className="space-y-6 text-white font-inter">
      {/* Tab Selectors */}
      <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-1">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSubTab("active")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors relative ${activeSubTab === "active" ? "text-[#BFF367] border-[#BFF367]" : "text-[#878C9F] border-transparent hover:text-white"}`}
          >
            Active Assignments ({activeBookings.length})
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors relative ${activeSubTab === "history" ? "text-[#BFF367] border-[#BFF367]" : "text-[#878C9F] border-transparent hover:text-white"}`}
          >
            Booking History ({completedBookings.length})
          </button>
          <button
            onClick={() => setActiveSubTab("nonAccepted")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors relative ${activeSubTab === "nonAccepted" ? "text-[#BFF367] border-[#BFF367]" : "text-[#878C9F] border-transparent hover:text-white"}`}
          >
            Non Accepted ({nonAcceptedBookings.length})
          </button>
        </div>

        <button 
          onClick={refetch}
          className="text-xs text-[#878C9F] hover:text-[#BFF367] transition-colors"
        >
          Refresh List
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-[#878C9F]">Loading assignments...</div>
      ) : currentList.length === 0 ? (
        <div className="p-12 text-center bg-[#141414] border border-[#2D2D2D] rounded-2xl space-y-4">
          <div className="mx-auto w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold">No bookings found</h4>
            <p className="text-sm text-[#878C9F] mt-1">
              {activeSubTab === "active" 
                ? "You do not have any active or in-progress match assignments right now." 
                : activeSubTab === "history"
                  ? "No completed or historical matching records found on this account."
                  : "No rejected, expired, or skipped matching requests found."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentList.map((booking) => (
            <div 
              key={booking.id} 
              className="p-5 rounded-2xl bg-[#141414] border border-[#2D2D2D] hover:border-[#BFF367]/30 transition-all duration-300 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusStyle(booking.status)}`}>
                    {booking.status}
                  </span>
                  <div className="text-xs text-[#878C9F] flex items-center gap-1.5 mt-2">
                    <Calendar size={12} />
                    <span>{new Date(booking.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                  </div>
                </div>
                <h4 className="text-[#BFF367] font-bold text-lg">₹{booking.hourlyRate}</h4>
              </div>

              {/* Location details */}
              <div className="flex gap-2">
                <MapPin size={16} className="text-[#BFF367] flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-sm font-semibold text-white">
                    {booking.ground?.name || "Custom Venue"}
                  </h5>
                  <p className="text-xs text-[#878C9F] mt-0.5 line-clamp-2">
                    {booking.ground?.location || booking.customLocation?.address || "Custom geocoded location"}
                  </p>
                </div>
              </div>

              {/* Client information */}
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-[#2D2D2D] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#BFF367]/10 text-[#BFF367] flex items-center justify-center font-bold text-xs uppercase">
                    {booking.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h6 className="text-xs font-semibold text-white">{booking.user?.name || "Client"}</h6>
                    <p className="text-[10px] text-[#878C9F]">Requester</p>
                  </div>
                </div>
                {booking.user?.phone && (
                  <a 
                    href={`tel:${booking.user.phone}`} 
                    className="p-2 bg-black hover:bg-[#222] rounded-lg transition-colors border border-[#2d2d2d]"
                  >
                    <User size={14} className="text-[#878C9F] hover:text-[#BFF367]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsTab;
