import React from "react";
import { Users, Calendar, Video, TrendingUp, Zap, Award, Target } from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', sessions: 2, revenue: 2400 },
  { name: 'Tue', sessions: 5, revenue: 5000 },
  { name: 'Wed', sessions: 3, revenue: 3500 },
  { name: 'Thu', sessions: 8, revenue: 9000 },
  { name: 'Fri', sessions: 4, revenue: 4500 },
  { name: 'Sat', sessions: 10, revenue: 12000 },
  { name: 'Sun', sessions: 6, revenue: 7000 },
];

export default function CoachDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.4em]">
            <Target size={14} className="animate-pulse" />
            <span>Coaching Mode: Active</span>
          </div>
          <h1 className="text-5xl font-display font-black italic uppercase tracking-tighter text-white">
            Training <span className="text-primary">Intel</span>
          </h1>
          <p className="text-gray-500 font-mono text-xs">ELITE PERFORMANCE TRACKER // ALPHA-1</p>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-black notched-corner border border-white/5 flex items-center gap-2">
            <Award size={16} className="text-primary" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Pro License Verified</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Trainees" value={42} icon={Users} />
        <StatCard title="Total Sessions" value={156} icon={Calendar} />
        <StatCard title="Live Stream Mins" value={450} icon={Video} />
        <StatCard title="Performance Index" value={98} icon={TrendingUp} prefix="+" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Graph */}
        <div className="lg:col-span-2 p-8 bg-[#0A0A0A] notched-corner border border-white/5 relative group">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white">Student Progress</h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Aggregate Achievement Metrics</p>
            </div>
            <div className="p-2 bg-white/5 notched-corner border border-white/5">
               <TrendingUp className="text-primary" size={16} />
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="coachColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#000', border: '1px solid rgba(132,204,22,0.2)', fontFamily: 'monospace'}}
                  itemStyle={{color: '#84CC16'}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#84CC16" strokeWidth={3} fill="url(#coachColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Roster */}
        <div className="p-8 bg-[#0A0A0A] notched-corner border border-white/5 flex flex-col">
          <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white mb-6">Upcoming Ops</h2>
          <div className="flex-1 space-y-4">
            {[
              { name: 'Advanced Batting', time: '14:00', student: 'Rahul K.', type: 'Private' },
              { name: 'Bowling Masterclass', time: '16:30', student: 'Group (12)', type: 'Batch' },
              { name: 'Video Analysis', time: '19:00', student: 'Sanya M.', type: 'Virtual' },
            ].map((op, i) => (
              <div key={i} className="p-4 bg-white/[0.02] border-l-2 border-primary group hover:bg-white/[0.05] transition-all">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-gray-400">{op.time}</span>
                  <span className="text-[9px] font-mono text-primary uppercase tracking-tighter">{op.type}</span>
                </div>
                <h4 className="text-sm font-display font-bold text-white mb-1 uppercase tracking-tight">{op.name}</h4>
                <p className="text-[10px] font-mono text-gray-500 uppercase">{op.student}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 bg-primary text-black notched-corner font-display font-black italic uppercase text-xs tracking-widest hover:scale-[0.98] transition-all">
            Schedule Session
          </button>
        </div>
      </div>
    </div>
  );
}
