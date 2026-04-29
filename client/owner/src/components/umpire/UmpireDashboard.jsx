import React from "react";
import { Trophy, Calendar, Star, DollarSign, Zap, Shield, MapPin } from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const matchData = [
  { name: 'Wk 1', matches: 4 },
  { name: 'Wk 2', matches: 7 },
  { name: 'Wk 3', matches: 5 },
  { name: 'Wk 4', matches: 8 },
];

export default function UmpireDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.4em]">
            <Shield size={14} className="animate-pulse" />
            <span>Duty Status: Ready</span>
          </div>
          <h1 className="text-5xl font-display font-black italic uppercase tracking-tighter text-white">
            Officiating <span className="text-primary">Ops</span>
          </h1>
          <p className="text-gray-500 font-mono text-xs">MATCH INTEGRITY MONITOR // V4.1</p>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-black notched-corner border border-white/5 flex items-center gap-2">
            <Trophy size={16} className="text-primary" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">A-Grade Official</span>
          </div>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Matches Officiated" value={18} icon={Trophy} />
        <StatCard title="Upcoming Matches" value={2} icon={Calendar} />
        <StatCard title="Official Rating" value={4.9} icon={Star} />
        <StatCard title="Duty Earnings" value={12000} icon={DollarSign} prefix="₹" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match Volume Chart */}
        <div className="lg:col-span-2 p-8 bg-[#0A0A0A] notched-corner border border-white/5 relative">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white">Match Engagement</h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Monthly Assignment Intelligence</p>
            </div>
            <div className="p-2 bg-white/5 notched-corner border border-white/5">
               <BarChart size={16} className="text-primary" />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{backgroundColor: '#000', border: '1px solid rgba(132,204,22,0.2)', fontFamily: 'monospace'}}
                />
                <Bar dataKey="matches" fill="#84CC16" notched-corner />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Immediate Assignments */}
        <div className="p-8 bg-[#0A0A0A] notched-corner border border-white/5 flex flex-col">
          <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white mb-6">Active Assignments</h2>
          <div className="flex-1 space-y-4">
            {[
              { match: 'Mumbai Warriors vs Pune Stars', time: 'Tomorrow, 16:00', venue: 'Shivaji Park', role: 'Main Umpire' },
              { match: 'Corporate League Final', time: '25th Oct, 09:30', venue: 'MCA Stadium', role: '3rd Umpire' },
            ].map((match, i) => (
              <div key={i} className="p-5 bg-white/[0.02] notched-corner border border-white/5 group hover:bg-white/[0.05] transition-all relative">
                <div className="absolute top-4 right-4">
                  <Zap size={12} className="text-primary opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
                <h4 className="text-sm font-display font-bold text-white mb-2 uppercase tracking-tight leading-tight">{match.match}</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <Calendar size={10} /> {match.time}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
                    <MapPin size={10} /> {match.venue}
                  </div>
                  <div className="mt-3 text-[9px] font-mono text-primary uppercase tracking-[0.2em]">Assignment: {match.role}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 border border-white/10 hover:bg-white/5 notched-corner font-display font-black italic uppercase text-xs tracking-widest transition-all">
            Match Protocols
          </button>
        </div>
      </div>
    </div>
  );
}
