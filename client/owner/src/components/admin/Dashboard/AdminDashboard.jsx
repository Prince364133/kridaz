import React from "react";
import { Users, Landmark, CreditCard, Activity, ShieldCheck, Zap } from "lucide-react";
import StatCard from "./StatCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Mon', active: 4000, bookings: 2400 },
  { name: 'Tue', active: 3000, bookings: 1398 },
  { name: 'Wed', active: 2000, bookings: 9800 },
  { name: 'Thu', active: 2780, bookings: 3908 },
  { name: 'Fri', active: 1890, bookings: 4800 },
  { name: 'Sat', active: 2390, bookings: 3800 },
  { name: 'Sun', active: 3490, bookings: 4300 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-[0.4em]">
            <Zap size={14} className="animate-pulse" />
            <span>System Status: Optimal</span>
          </div>
          <h1 className="text-5xl font-display font-black italic uppercase tracking-tighter text-white">
            Supreme <span className="text-primary">Command</span>
          </h1>
          <p className="text-gray-500 font-mono text-xs">GLOBAL PLATFORM OVERWATCH // V2.0.4</p>
        </div>
        
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-black notched-corner border border-white/5 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
      </div>

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Operators" value={128} icon={Users} />
        <StatCard title="Active Venues" value={45} icon={Landmark} />
        <StatCard title="Transaction Vol" value={14500} icon={CreditCard} prefix="₹" />
        <StatCard title="System Load" value={24} icon={Activity} />
      </div>

      {/* Advanced Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 p-8 bg-[#0A0A0A] notched-corner border border-white/5 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white">Network Activity</h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">7-Day Transactional Intelligence</p>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary/50" />
               <div className="w-3 h-3 rounded-sm bg-gray-800 border border-white/10" />
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#84CC16" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#84CC16" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4b5563', fontSize: 10, fontFamily: 'monospace'}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#4b5563', fontSize: 10, fontFamily: 'monospace'}}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#000', border: '1px solid rgba(132,204,22,0.2)', borderRadius: '0px', fontFamily: 'monospace'}}
                  itemStyle={{color: '#84CC16'}}
                />
                <Area type="monotone" dataKey="bookings" stroke="#84CC16" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security / System Logs Panel */}
        <div className="p-8 bg-[#0A0A0A] notched-corner border border-white/5 flex flex-col">
          <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white mb-6">Security Logs</h2>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {[
              { id: 'SEC-402', msg: 'Admin Login: saavik_admin', time: '2m ago', type: 'info' },
              { id: 'SEC-405', msg: 'New Venue Verified: Mumbai Sports', time: '14m ago', type: 'success' },
              { id: 'SEC-409', msg: 'Unauthorized Access Blocked', time: '28m ago', type: 'warning' },
              { id: 'SEC-412', msg: 'System Backup Complete', time: '1h ago', type: 'info' },
              { id: 'SEC-415', msg: 'New Operator Joined: Rahul_S', time: '2h ago', type: 'info' },
            ].map((log, i) => (
              <div key={i} className="group cursor-default border-l-2 border-white/5 hover:border-primary pl-4 py-2 transition-all bg-white/[0.02] hover:bg-white/[0.05]">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[9px] font-mono text-primary/60 uppercase tracking-widest">{log.id}</span>
                  <span className="text-[9px] font-mono text-gray-500">{log.time}</span>
                </div>
                <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">{log.msg}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 bg-white/5 hover:bg-primary hover:text-black notched-corner border border-white/10 transition-all duration-300 font-display font-black italic uppercase text-xs tracking-widest">
            View All Protocols
          </button>
        </div>
      </div>

      {/* Operator Quick View */}
      <div className="p-8 bg-[#0A0A0A] notched-corner border border-white/5">
        <div className="flex justify-between items-center mb-8">
           <div>
              <h2 className="text-xl font-display font-black italic uppercase tracking-tight text-white">Active Operators</h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Real-time Personnel Tracking</p>
            </div>
            <button className="text-[10px] font-mono text-primary uppercase tracking-[0.2em] border-b border-primary/30 pb-1 hover:border-primary transition-all">Export Roster</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[1, 2, 3].map((_, i) => (
             <div key={i} className="p-4 border border-white/5 bg-white/[0.02] notched-corner flex items-center gap-4 group hover:border-primary/20 transition-all">
                <div className="w-12 h-12 rounded-none notched-corner bg-gray-800 border border-white/10 flex items-center justify-center text-primary font-display font-black italic text-xl">
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-display font-bold text-white group-hover:text-primary transition-colors">Operator_{i+102}</h3>
                  <p className="text-[10px] font-mono text-gray-500">Tier 1 // Access Granted</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
