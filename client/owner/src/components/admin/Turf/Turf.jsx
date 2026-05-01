import React from "react";
import { MapPin, Clock, Star, Calendar, Check, X } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

const Turf = ({ turf, onApprove, onReject }) => {
  const handleApprove = async () => {
    if (window.confirm(`Approve ${turf.name}?`)) {
      const success = await onApprove(turf._id);
      if (success) toast.success("Turf Approved");
      else toast.error("Action Failed");
    }
  };

  const handleReject = async () => {
    if (window.confirm(`Reject ${turf.name}?`)) {
      const success = await onReject(turf._id);
      if (success) toast.success("Turf Rejected");
      else toast.error("Action Failed");
    }
  };

  return (
    <div className="bms-card group flex flex-col relative">
      {/* ── Image ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "200px" }}>
        <img
          src={turf.image}
          alt={turf.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = "/banner-2.png"; }}
        />
        {/* Price badge */}
        <div className="absolute top-3 left-3">
          <span className="badge-featured">₹{turf.pricePerHour}/hr</span>
        </div>
        {/* Status badge */}
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            turf.status === 'approved' ? 'bg-green-500/80 text-white' :
            turf.status === 'rejected' ? 'bg-red-500/80 text-white' :
            'bg-yellow-500/80 text-white'
        }`}>
          <span>{turf.status}</span>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Rating row */}
        <div className="flex items-center justify-between">
          <span className="badge-sport">Arena</span>
          <div className="flex items-center gap-1">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-white text-xs font-semibold">{turf.avgRating || "NEW"}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display text-lg uppercase tracking-wide text-white group-hover:text-primary transition-colors leading-tight line-clamp-2">
          {turf.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-[#888] text-xs">
          <MapPin size={11} className="text-[#84CC16] shrink-0" />
          <span className="truncate">{turf.location}</span>
        </div>

        {/* Added date */}
        {turf.createdAt && (
          <div className="flex items-center gap-1.5 text-[#888] text-[10px] font-bold uppercase tracking-tighter">
            <Calendar size={11} className="text-[#84CC16] shrink-0" />
            <span>Added {format(new Date(turf.createdAt), "dd MMM yyyy")}</span>
          </div>
        )}

        {/* Admin Actions */}
        {turf.status === 'pending' && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/5">
                <button 
                    onClick={handleApprove}
                    className="flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <Check size={12} />
                    Approve
                </button>
                <button 
                    onClick={handleReject}
                    className="flex items-center justify-center gap-2 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    <X size={12} />
                    Reject
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default Turf;

