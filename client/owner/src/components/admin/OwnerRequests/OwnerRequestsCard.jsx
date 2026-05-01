import React from "react";
import { format } from "date-fns";
import {
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

const OwnerRequestCard = ({
  request,
  onAccept,
  onReject,
  onReconsider,
  isProcessing,
  isRejected,
}) => {
  return (
    <div className="group relative bg-[#111] rounded-2xl border border-white/10 p-6 space-y-6 transition-all duration-300 hover:border-[#84CC16]/30 shadow-2xl overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#84CC16]/5 blur-[50px] group-hover:bg-[#84CC16]/10 transition-colors"></div>
      
      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">{request.role || 'Venue Owner'}</p>
            <h3 className="text-2xl font-bold uppercase text-white tracking-tight truncate">
              {request.name}
            </h3>
          </div>
          {request.role && (
            <div className="px-2 py-1 rounded bg-[#84CC16]/10 border border-[#84CC16]/20 text-[10px] font-bold text-[#84CC16] uppercase">
              Upgrade
            </div>
          )}
        </div>

        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
           {request.businessDetails?.businessName && (
             <div className="space-y-1">
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Business Name</p>
               <p className="text-sm font-semibold text-white">{request.businessDetails.businessName}</p>
             </div>
           )}
           {request.businessDetails?.registrationNumber && (
             <div className="space-y-1">
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Reg Number</p>
               <p className="text-sm font-semibold text-white">{request.businessDetails.registrationNumber}</p>
             </div>
           )}
           {request.businessDetails?.specialization && (
             <div className="space-y-1">
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Specialization</p>
               <p className="text-sm font-semibold text-white">{request.businessDetails.specialization}</p>
             </div>
           )}
           {request.businessDetails?.experience && (
             <div className="space-y-1">
               <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Experience</p>
               <p className="text-sm font-semibold text-white">{request.businessDetails.experience}</p>
             </div>
           )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
            <Mail size={14} className="text-[#84CC16]" />
            <span className="truncate">{request.email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
            <Calendar size={14} className="text-[#84CC16]" />
            <span>Submitted: {format(new Date(request.createdAt), "dd MMM yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="relative pt-4 border-t border-white/10 flex gap-3">
        {isRejected ? (
          <button
            onClick={() => onReconsider(request._id)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50"
            disabled={isProcessing}
          >
            {isProcessing ? (
               <span className="flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Processing...
              </span>
            ) : "Reconsider"}
          </button>
        ) : (
          <>
            <button
              onClick={() => onAccept(request._id)}
              className="flex-1 py-3 bg-[#84CC16] hover:scale-[1.02] active:scale-[0.98] text-black font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(132,204,22,0.2)]"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  Approving...
                </span>
              ) : "Approve"}
            </button>
            <button
              onClick={() => onReject(request._id)}
              className="flex-1 py-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 font-bold uppercase text-xs rounded-xl transition-all disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "Rejecting..." : "Reject"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerRequestCard;
