import React from "react";
import { Mic, Radio, Users, IndianRupee, PlayCircle, Settings, Activity } from "lucide-react";

export default function CommentatorDashboard() {
  const themeColor = "#55DEE8"; // A unique color for Commentator, e.g. gold/yellow

  return (
    <div className="space-y-8 animate-fade-in font-inter pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: themeColor }} />
          <div>
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white font-inter uppercase leading-none">
              Commentator <span style={{ color: themeColor }}>Overview</span>
            </h1>
            <p className="text-[#878C9F] text-[10px] font-black uppercase tracking-[0.2em] font-inter mt-1.5">Manage your commentary sessions & stats</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="h-12 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[8px] font-black uppercase text-[12px] tracking-[0.2em] text-white transition-all flex items-center gap-2 shadow-xl">
            <Settings size={18} /> Audio Sync Test
          </button>
          <button 
            className="h-12 px-6 rounded-lg font-black uppercase text-[12px] tracking-[0.2em] transition-all transform active:scale-95 flex items-center gap-2 shadow-xl text-black"
            style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
          >
            <PlayCircle size={18} /> Join Live Match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Matches Covered", value: "24", icon: Mic },
          { label: "Voice Airtime", value: "48 hrs", icon: Radio },
          { label: "Total Earnings", value: "Γé╣12,500", icon: IndianRupee },
          { label: "Audience Reach", value: "15.2k", icon: Users },
        ].map((stat, i) => (
          <div key={i} className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-6 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon size={80} style={{ color: themeColor }} />
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-4">
              <stat.icon size={20} style={{ color: themeColor }} />
            </div>
            <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-white mt-1 tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Radio size={16} style={{ color: themeColor }} /> Assigned Matches
          </h2>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
            <Activity size={40} className="text-neutral-600 mb-4" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight">No Upcoming Assignments</h3>
            <p className="text-xs text-neutral-500 mt-2 max-w-sm">You have no scheduled matches to commentate. Check back later.</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Activity size={16} style={{ color: themeColor }} /> Live Context Board
          </h2>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[8px] p-6 min-h-[300px]">
             <p className="text-[11px] text-neutral-500 font-medium leading-relaxed italic">
                 Join a live match to see team stats, active batsmen, bowlers, and real-time events to assist your commentary.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
