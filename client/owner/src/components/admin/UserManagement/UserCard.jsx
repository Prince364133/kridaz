import React from "react";
import { Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import Avatar from "react-avatar";

const UserCard = ({ user }) => {
  return (
    <div className="group relative bg-[#111] rounded-2xl border border-white/10 p-6 space-y-6 transition-all duration-300 hover:border-[#84CC16]/30 shadow-2xl overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#84CC16]/5 blur-[50px] group-hover:bg-[#84CC16]/10 transition-colors"></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
         <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID: {user._id?.slice(-8).toUpperCase()}</div>
         <div className="w-2 h-2 bg-[#84CC16] rounded-full shadow-[0_0_8px_rgba(132,204,22,0.6)]"></div>
      </div>

      <div className="relative flex items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-[#84CC16]/20 blur-xl rounded-full scale-150 group-hover:bg-[#84CC16]/40 transition-colors"></div>
          <div className="relative border-2 border-white/10 rounded-full p-1 group-hover:border-[#84CC16]/50 transition-colors bg-[#0a0a0a]">
            <Avatar 
              name={user.name} 
              size={60} 
              round={true} 
              color="#000"
              fgColor="#84CC16"
              className="font-bold"
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">Registered User</p>
          <h3 className="text-xl font-bold uppercase text-white tracking-tight truncate max-w-[180px]">
            {user.name}
          </h3>
        </div>
      </div>

      <div className="relative space-y-2 pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
          <Mail size={14} className="text-[#84CC16]" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-400 text-xs font-medium">
          <Calendar size={14} className="text-[#84CC16]" />
          <span>Joined: {format(new Date(user.createdAt), "dd MMM yyyy")}</span>
        </div>
      </div>


    </div>
  );
};

export default UserCard;
