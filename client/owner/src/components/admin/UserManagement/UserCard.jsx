import React from "react";
import { Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import Avatar from "react-avatar";

const UserCard = ({ user }) => {
  return (
    <div className="group relative bg-[#111111] notched-corner border border-white/5 p-6 space-y-6 transition-all duration-300 hover:border-primary/30 shadow-2xl overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[50px] group-hover:bg-primary/10 transition-colors"></div>
      
      {/* Card Telemetry */}
      <div className="flex items-center justify-between mb-2">
         <div className="text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em]">Record: {user._id?.slice(-8).toUpperCase()}</div>
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.6)]"></div>
      </div>

      <div className="relative flex items-center gap-5">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 group-hover:bg-primary/40 transition-colors"></div>
          <div className="relative border-2 border-primary/30 notched-corner p-1 group-hover:border-primary transition-colors bg-black/50">
            <Avatar 
              name={user.name} 
              size={60} 
              round={false} 
              color="#000"
              fgColor="#84CC16"
              className="font-display font-black italic notched-corner"
            />
          </div>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[10px] text-primary uppercase tracking-[0.2em]">Verified Player</p>
          <h3 className="text-2xl font-display font-black italic uppercase text-white tracking-tight truncate max-w-[180px]">
            {user.name}
          </h3>
        </div>
      </div>

      <div className="relative space-y-2 pt-4 border-t border-white/5">
        <div className="flex items-center gap-3 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Mail size={12} className="text-primary" />
          <span className="truncate">{user.email}</span>
        </div>
        <div className="flex items-center gap-3 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
          <Calendar size={12} className="text-primary" />
          <span>JOINED: {format(new Date(user.createdAt), "dd.MM.yyyy")}</span>
        </div>
      </div>

      {/* Stats Overlay Decoration */}
      <div className="absolute bottom-4 right-4 flex gap-1 opacity-10 group-hover:opacity-30 transition-opacity">
        <div className="w-1 h-3 bg-primary"></div>
        <div className="w-1 h-5 bg-primary"></div>
        <div className="w-1 h-2 bg-primary"></div>
      </div>
    </div>
  );
};

export default UserCard;
