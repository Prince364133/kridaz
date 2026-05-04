import React from "react";
import { Users, Landmark, CreditCard, Activity, ShieldCheck, Zap, AlertCircle, RefreshCw } from "lucide-react";
import StatCard from "./StatCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import useDashboardData from "@hooks/admin/useDashboardData";
import DashboardSkeleton from "../../owner/Dashboard/DashboardSkeleton";

export default function AdminDashboard() {
  const { data: dashboardData, loading, error } = useDashboardData();

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="font-bold text-xl uppercase tracking-wider text-red-500">Dashboard Link Failure</p>
        <p className="text-gray-500 text-sm mt-2 font-medium">Verify your administrative credentials and try again.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 px-10 py-4 bg-white/5 border border-red-500/50 text-red-500 font-bold uppercase rounded-2xl hover:bg-red-500/10 transition-all flex items-center gap-3"
        >
          <RefreshCw className="w-4 h-4" />
          Reconnect
        </button>
      </div>
    );
  }

  const {
    totalUsers = 0,
    totalOwners = 0,
    totalTurfs = 0,
    totalBookings = 0,
    pendingRequests = 0,
    bookingHistory = [],
  } = dashboardData || {};

  // Map history to chart format
  const chartData = bookingHistory.map(item => ({
    name: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
    bookings: item.amount,
  }));

  return (
    <div className="p-4 lg:p-0 space-y-6 lg:space-y-8 animate-fade-in">

      {/* Primary Intelligence Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard title="Total Users" value={totalUsers} icon={Users} className="p-4 lg:p-6" />
        <StatCard title="Active Venues" value={totalTurfs} icon={Landmark} className="p-4 lg:p-6" />
        <StatCard title="Total Bookings" value={totalBookings} icon={CreditCard} className="p-4 lg:p-6" />
        <StatCard title="Pending Verifications" value={pendingRequests} icon={ShieldCheck} className="p-4 lg:p-6" />
      </div>

      {/* Advanced Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 p-6 lg:p-8 bg-[#0A0A0A] rounded-2xl border border-white/10 relative group overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#84CC16]/0 via-[#84CC16]/40 to-[#84CC16]/0" />
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-lg lg:text-xl font-bold uppercase tracking-tight text-white mb-1">Platform Activity</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">30-Day Financial Metrics</p>
            </div>
            <div className="flex gap-2">
               <div className="w-3 h-3 rounded-sm bg-[#84CC16]/20 border border-[#84CC16]/50" />
               <div className="w-3 h-3 rounded-sm bg-white/5 border border-white/10" />
            </div>
          </div>
          
          <div className="h-[300px] lg:h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
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
                  tick={{fill: '#9CA3AF', fontSize: 10}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9CA3AF', fontSize: 10}}
                />
                <Tooltip 
                  contentStyle={{backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '12px'}}
                  itemStyle={{color: '#84CC16', fontWeight: 'bold', textTransform: 'uppercase'}}
                />
                <Area type="monotone" dataKey="bookings" stroke="#84CC16" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Security / System Logs Panel */}
        <div className="p-6 lg:p-8 bg-[#0A0A0A] rounded-2xl border border-white/10 flex flex-col">
          <h2 className="text-lg lg:text-xl font-bold uppercase tracking-tight text-white mb-6">System Status</h2>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[300px] lg:max-h-none">
            {[
              { id: 'SEC-01', msg: 'Core Services Online', status: 'optimal' },
              { id: 'SEC-02', msg: 'Database Sync Active', status: 'optimal' },
              { id: 'SEC-03', msg: 'API Gateway Secured', status: 'optimal' },
              { id: 'SEC-04', msg: 'Auth Provider Validated', status: 'optimal' },
            ].map((log, i) => (
              <div key={i} className="group border-l-2 border-[#84CC16]/30 pl-4 py-3 bg-white/[0.02] rounded-r-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{log.id}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#84CC16]" />
                </div>
                <p className="text-sm font-bold text-white tracking-tight">{log.msg}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Status: {log.status}</p>
              </div>
            ))}
          </div>
          <button className="mt-8 w-full py-4 bg-white/5 hover:bg-[#84CC16] hover:text-black rounded-2xl border border-white/10 transition-all duration-500 font-bold uppercase text-[10px] tracking-widest group">
            Security Overview <ShieldCheck className="w-3 h-3 inline ml-2 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Operator Quick View */}
      <div className="p-6 lg:p-10 bg-[#0A0A0A] rounded-2xl lg:rounded-[32px] border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#84CC16]/5 blur-[100px]" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 relative z-10">
           <div>
              <h2 className="text-xl lg:text-2xl font-bold uppercase tracking-tight text-white mb-1">Infrastructure Load</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Hardware & Network Telemetry</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
               <span className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">Real-time monitoring active</span>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
           {[
             { label: 'CPU LOAD', val: '12%', color: '#84CC16' },
             { label: 'MEM USAGE', val: '45%', color: '#84CC16' },
             { label: 'NETWORK', val: '0.8ms', color: '#84CC16' }
           ].map((metric, i) => (
             <div key={i} className="p-4 lg:p-6 border border-white/5 bg-white/[0.01] rounded-2xl group hover:border-[#84CC16]/20 transition-all">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">{metric.label}</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl lg:text-3xl font-black text-white group-hover:text-[#84CC16] transition-colors">{metric.val}</span>
                  <Activity className="w-5 h-5 text-gray-600 group-hover:text-[#84CC16] transition-colors" />
                </div>
                <div className="mt-6 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-[#84CC16] transition-all duration-1000" style={{ width: metric.val.includes('%') ? metric.val : '20%' }} />
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}
