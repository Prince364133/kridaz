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
    <div className="group relative bg-[#111111] notched-corner border border-white/5 p-6 space-y-6 transition-all duration-300 hover:border-primary/30 shadow-2xl overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-colors"></div>
      
      <div className="relative space-y-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">Recruit Profile</p>
          <h3 className="text-3xl font-display font-black italic uppercase text-white tracking-tight truncate">
            {request.name}
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-gray-500 font-mono text-xs uppercase tracking-wider">
            <Mail size={14} className="text-primary" />
            <span className="truncate">{request.email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-500 font-mono text-xs uppercase tracking-wider">
            <Calendar size={14} className="text-primary" />
            <span>ENLISTED: {format(new Date(request.createdAt), "dd.MM.yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="relative pt-4 border-t border-white/5 flex gap-3">
        {isRejected ? (
          <button
            onClick={() => onReconsider(request._id)}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-display font-black italic uppercase text-sm notched-corner transition-all disabled:opacity-50"
            disabled={isProcessing}
          >
            {isProcessing ? (
               <span className="flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Processing
              </span>
            ) : "RECONSIDER"}
          </button>
        ) : (
          <>
            <button
              onClick={() => onAccept(request._id)}
              className="flex-1 py-3 bg-primary hover:scale-[1.02] active:scale-[0.98] text-black font-display font-black italic uppercase text-sm notched-corner transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(113,179,0,0.2)]"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin" />
                  AUTH...
                </span>
              ) : "APPROVE"}
            </button>
            <button
              onClick={() => onReject(request._id)}
              className="flex-1 py-3 bg-red-600/10 border border-red-600/20 hover:bg-red-600/20 text-red-600 font-display font-black italic uppercase text-sm notched-corner transition-all disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? "DENYING..." : "REJECT"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default OwnerRequestCard;
