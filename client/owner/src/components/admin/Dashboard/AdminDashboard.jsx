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

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={128} icon={Users} />
        <StatCard title="Active Venues" value={45} icon={Landmark} />
        <StatCard title="Transaction Vol" value={14500} icon={CreditCard} prefix="₹" />
        <StatCard title="Active Sessions" value={24} icon={Activity} />
      </div>

      {/* Advanced Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 p-8 bg-[#0A0A0A] rounded-2xl border border-white/10 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#84CC16]/0 via-[#84CC16]/40 to-[#84CC16]/0" />
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-1">Platform Activity</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">7-Day Booking Trends</p>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-sm bg-[#84CC16]/20 border border-[#84CC16]/50" />
               <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" />
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
                  tick={{fill: '#9CA3AF', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 12}}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px'}}
                  itemStyle={{color: '#84CC16', fontWeight: 'bold'}}
                />
                <Area type="monotone" dataKey="bookings" stroke="#84CC16" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security / System Logs Panel */}
        <div className="p-8 bg-[#0A0A0A] rounded-2xl border border-white/10 flex flex-col">
          <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-6">System Logs</h2>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {[
              { id: 'LOG-402', msg: 'Admin Login: saavik_admin', time: '2m ago', type: 'info' },
              { id: 'LOG-405', msg: 'New Venue Verified: Mumbai Sports', time: '14m ago', type: 'success' },
              { id: 'LOG-409', msg: 'Failed Login Attempt', time: '28m ago', type: 'warning' },
              { id: 'LOG-412', msg: 'System Backup Complete', time: '1h ago', type: 'info' },
              { id: 'LOG-415', msg: 'New User Registered: Rahul S.', time: '2h ago', type: 'info' },
            ].map((log, i) => (
              <div key={i} className="group cursor-default border-l-2 border-white/10 hover:border-[#84CC16] pl-4 py-2 transition-all bg-white/[0.02] hover:bg-white/[0.05] rounded-r-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{log.id}</span>
                  <span className="text-[10px] font-medium text-gray-500">{log.time}</span>
                </div>
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{log.msg}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-3 bg-white/5 hover:bg-[#84CC16] hover:text-black rounded-xl border border-white/10 transition-all duration-300 font-bold uppercase text-xs tracking-widest">
            View All Logs
          </button>
        </div>
      </div>

      {/* Operator Quick View */}
      <div className="p-8 bg-[#0A0A0A] rounded-2xl border border-white/10">
        <div className="flex justify-between items-center mb-8">
           <div>
              <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-1">Active Users</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recent Platform Activity</p>
            </div>
            <button className="text-[10px] font-bold text-[#84CC16] uppercase tracking-[0.2em] hover:text-white transition-colors">View All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[1, 2, 3].map((_, i) => (
             <div key={i} className="p-4 border border-white/5 bg-white/[0.02] rounded-xl flex items-center gap-4 group hover:border-[#84CC16]/30 transition-all">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#84CC16] font-bold text-xl">
                  {String.fromCharCode(65 + i)}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#84CC16] transition-colors">User_{i+102}</h3>
                  <p className="text-[10px] font-medium text-gray-400 mt-1">Premium Member</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-[#84CC16] shadow-[0_0_8px_rgba(132,204,22,0.8)]" />
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
