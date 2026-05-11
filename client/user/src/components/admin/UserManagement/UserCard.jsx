import React from "react";
import { Mail, Calendar, ChevronRight, ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";
import Avatar from "react-avatar";

const UserCard = ({ user }) => {
  const joinDate = user.createdAt ? format(new Date(user.createdAt), "dd MMM yyyy") : "N/A";
  const userId = user._id?.slice(-8).toUpperCase() || "N/A";

  return (
    <div className="group relative bg-[#000000] border border-[#2D2D2D] rounded-[12px] p-4 lg:px-8 lg:py-5 transition-all duration-500 hover:border-[#CCFF00]/40 shadow-xl overflow-hidden cursor-pointer">
      {/* Interaction Highlight */}
      <div className="absolute inset-y-0 left-0 w-1 bg-[#CCFF00] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 shadow-[0_0_15px_#CCFF00]" />
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* User Profile Info */}
        <div className="lg:col-span-4 flex items-center gap-5">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-[#CCFF00]/5 blur-lg rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative border border-white/10 rounded-full p-0.5 group-hover:border-[#CCFF00]/30 transition-colors bg-[#0d0d0d]">
              <Avatar 
                name={user.name} 
                size={42} 
                round={true} 
                color="#000"
                fgColor="#CCFF00"
                className="font-black text-xs"
              />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black text-white uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors truncate font-open-sans">
              {user.name}
            </h3>
            <p className="text-[9px] font-black text-[#878C9F] uppercase tracking-[0.2em] mt-0.5">
              ID: <span className="text-white/40">{userId}</span>
            </p>
          </div>
        </div>

        {/* Contact Email */}
        <div className="lg:col-span-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
            <Mail size={14} />
          </div>
          <span className="text-[12px] font-bold text-white/60 truncate group-hover:text-white transition-colors">
            {user.email}
          </span>
        </div>

        {/* Registration Date */}
        <div className="lg:col-span-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-[#CCFF00] transition-colors border border-white/5 group-hover:border-[#CCFF00]/20">
            <Calendar size={14} />
          </div>
          <span className="text-[12px] font-bold text-white/60 group-hover:text-white transition-colors uppercase tracking-tight">
            {joinDate}
          </span>
        </div>

        {/* Account Status */}
        <div className="lg:col-span-2 flex items-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/5 border border-green-500/20 rounded-full group-hover:bg-green-500/10 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" />
            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Active User</span>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-1 flex justify-end">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-[#CCFF00] group-hover:text-black transition-all border border-white/5 group-hover:border-[#CCFF00]">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
