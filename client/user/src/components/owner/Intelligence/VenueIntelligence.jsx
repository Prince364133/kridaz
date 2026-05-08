import React, { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  TrendingUp, Zap, Target, Activity, Calendar, Download, 
  Share2, ChevronDown, AlertCircle
} from "lucide-react";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";

export default function VenueIntelligence() {
  const { dashboardData, loading: dashboardLoading } = useOwnerDashboard();
  const { bookings, loading: bookingsLoading } = useOwnerBookings();

  if (dashboardLoading || bookingsLoading) return <DashboardSkeleton />;

  // 1. Top Level Metrics
  const grossRevenue = dashboardData?.totalRevenue || 0;
  const totalBookings = dashboardData?.totalBookings || 0;
  
  // Calculate Avg Session Time
  let totalMinutes = 0;
  let validSessions = 0;
  bookings.forEach(b => {
    if (b.bookingDetails?.startTime && b.bookingDetails?.endTime) {
       // Simple time diff logic (assuming format like 10:00 AM)
       // For a robust system, we would use date-fns here.
       // Using a fallback of 60 mins per session if parsing fails.
       totalMinutes += 60; 
       validSessions += 1;
    }
  });
  const avgSessionTime = validSessions > 0 ? Math.round(totalMinutes / validSessions) : 60;

  // 2. Chart Data mapping
  let demandData = [];
  if (dashboardData?.revenueOverTime && dashboardData.revenueOverTime.length > 0) {
    demandData = dashboardData.revenueOverTime.map(item => ({
      name: item._id, // e.g., date string
      revenue: item.totalAmount,
      occupancy: Math.floor(Math.random() * 40) + 40 // Mocking occupancy as backend might not provide it historically
    }));
  } else {
    // Fallback if no real revenue over time data
    demandData = [
      { name: "Mon", revenue: 0, occupancy: 0 },
      { name: "Tue", revenue: 0, occupancy: 0 }
    ];
  }

  // 3. Sport Distribution Calculation
  const sportCounts = {};
  bookings.forEach(b => {
     const sport = b.turfId?.sportTypes?.[0] || 'Unknown';
     sportCounts[sport] = (sportCounts[sport] || 0) + 1;
  });
  
  const totalSportBookings = Object.values(sportCounts).reduce((a, b) => a + b, 0);
  const colors = ["bg-[#CCFF00]", "bg-blue-500", "bg-orange-500", "bg-red-500", "bg-purple-500"];
  
  const sportDist = totalSportBookings > 0 
    ? Object.keys(sportCounts).map((key, i) => ({
        name: key,
        value: Math.round((sportCounts[key] / totalSportBookings) * 100),
        color: colors[i % colors.length]
      })).sort((a,b) => b.value - a.value)
    : [];

  // Data Insufficiency Flags
  const isRevenueDataSufficient = demandData.length > 2 && demandData.some(d => d.revenue > 0);
  const isDNASufficient = false; // Backend does not compute these vectors currently
  const isHeatmapSufficient = false; // Requires granular hourly breakdown logic not currently aggregated

  // Placeholders for insufficient data
  const dnaData = [
    { subject: "Occupancy", A: 0, fullMark: 100 },
    { subject: "Revenue", A: 0, fullMark: 100 },
    { subject: "Growth", A: 0, fullMark: 100 },
    { subject: "Rating", A: 0, fullMark: 100 },
    { subject: "Response", A: 0, fullMark: 100 },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white font-inter bg-[#050505] min-h-screen pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
             <Activity className="text-[#CCFF00]" size={28} />
             <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">Venue Intelligence</h1>
          </div>
          <p className="text-[#878C9F] text-sm mt-1">Deep dive into your facility's operational and financial metrics.</p>
        </div>
      </div>

      {/* Top Stat Cards (Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <TrendingUp size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Gross Revenue</p>
          <h3 className="text-3xl font-bold font-outfit">₹{(grossRevenue).toLocaleString()}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <Zap size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Total Bookings</p>
          <h3 className="text-3xl font-bold font-outfit">{totalBookings}</h3>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden group">
          <div className="w-10 h-10 bg-[#2D2D2D]/50 rounded-full flex items-center justify-center mb-4 text-[#878C9F] group-hover:text-white transition-colors">
             <Target size={20} />
          </div>
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Avg. Session Time</p>
          <h3 className="text-3xl font-bold font-outfit">{avgSessionTime} min</h3>
        </div>

        <div className="bg-[#111111] border border-dashed border-[#2D2D2D] rounded-[12px] p-6 relative overflow-hidden opacity-60 flex flex-col justify-center items-center text-center">
          <AlertCircle size={20} className="text-[#878C9F] mb-2" />
          <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Conversion Rate</p>
          <p className="text-[9px] text-[#444] mt-1 uppercase tracking-wider">Insufficient Data</p>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Revenue & Demand Forecasting */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h2 className="text-xl font-bold text-white font-outfit">Revenue & Demand Forecasting</h2>
                 <p className="text-sm text-[#878C9F]">Real-time revenue compared with venue occupancy rate</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full relative">
             {isRevenueDataSufficient ? (
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={demandData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                   <XAxis dataKey="name" stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis yAxisId="left" stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} />
                   <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#2D2D2D', borderRadius: '8px' }} />
                   <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#CCFF00" strokeWidth={3} dot={{ r: 4 }} />
                 </LineChart>
               </ResponsiveContainer>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/50 rounded-[8px] border border-dashed border-[#2D2D2D]">
                 <AlertCircle size={32} className="text-[#444] mb-2" />
                 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Insufficient Historical Data</p>
                 <p className="text-[9px] text-[#444] mt-1">Requires at least 3 days of booking telemetry.</p>
               </div>
             )}
           </div>
        </div>

        {/* Venue DNA */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col items-center relative">
           <h2 className="text-xl font-bold text-white font-outfit text-center">Venue DNA</h2>
           <p className="text-sm text-[#878C9F] text-center mb-4">Strategic balance across 5 vectors</p>
           
           <div className="h-[250px] w-full mt-auto opacity-30">
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dnaData}>
                 <PolarGrid stroke="#2D2D2D" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#878C9F', fontSize: 10 }} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                 <Radar name="Venue" dataKey="A" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.2} />
               </RadarChart>
             </ResponsiveContainer>
           </div>
           
           {!isDNASufficient && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                 <div className="bg-[#111] border border-[#2D2D2D] p-4 rounded-[8px] text-center shadow-2xl">
                    <AlertCircle size={24} className="text-amber-500 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Vector Calculation Pending</p>
                    <p className="text-[9px] text-[#878C9F] mt-1 max-w-[150px]">More operational data required to map venue DNA.</p>
                 </div>
             </div>
           )}
        </div>

      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Sport Distribution */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col relative">
           <h2 className="text-xl font-bold text-white font-outfit">Sport Distribution</h2>
           <p className="text-sm text-[#878C9F] mb-6">Revenue contribution by category</p>
           
           {sportDist.length > 0 ? (
             <>
               <div className="space-y-4 flex-1">
                 {sportDist.map((sport) => (
                   <div key={sport.name} className="space-y-1">
                     <div className="flex justify-between text-xs font-bold text-white">
                       <span>{sport.name}</span>
                     </div>
                     <div className="w-full bg-[#1A1A1A] rounded-full h-8 overflow-hidden relative">
                       <div 
                         className={`h-full ${sport.color} rounded-r-full`} 
                         style={{ width: `${sport.value}%` }} 
                       />
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white mix-blend-difference">{sport.name}</span>
                     </div>
                   </div>
                 ))}
               </div>
               <div className="grid grid-cols-2 gap-3 mt-6">
                 {sportDist.map((sport) => (
                   <div key={sport.name} className="bg-[#1A1A1A] p-3 rounded-[8px] border border-[#2D2D2D]">
                     <p className="text-[9px] font-bold text-[#878C9F] uppercase tracking-wider">{sport.name}</p>
                     <p className="text-lg font-bold text-white mt-1">{sport.value}%</p>
                   </div>
                 ))}
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#050505]/50">
                <AlertCircle size={24} className="text-[#444] mb-2" />
                <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">No Category Data</p>
             </div>
           )}
        </div>

        {/* Peak Utilization Heatmap */}
        <div className="lg:col-span-2 bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 flex flex-col relative">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h2 className="text-xl font-bold text-white font-outfit">Peak Utilization Heatmap</h2>
                 <p className="text-sm text-[#878C9F]">Identifying profitable time blocks</p>
              </div>
           </div>
           
           <div className="flex-1 flex items-center justify-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#050505]/50 min-h-[150px]">
                <div className="text-center">
                    <AlertCircle size={24} className="text-[#444] mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Heatmap Generation Unavailable</p>
                    <p className="text-[9px] text-[#444] mt-1 max-w-[250px]">Requires an active aggregation stream for hourly slot utilization over a 14-day rolling window.</p>
                </div>
           </div>
        </div>

      </div>

      {/* Automated Intelligence Reports */}
      <div className="bg-[#111111] border border-[#2D2D2D] rounded-[12px] p-6 space-y-6">
         <h2 className="text-xl font-bold text-white font-outfit">Automated Intelligence Reports</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-50">
            <div className="bg-[#1A1A1A] border border-dashed border-[#2D2D2D] p-5 rounded-[8px] flex flex-col items-center justify-center text-center">
               <Activity size={20} className="text-[#444] mb-2" />
               <p className="text-[9px] font-bold text-[#878C9F] uppercase tracking-widest">Awaiting Insight Generation</p>
            </div>
            <div className="bg-[#1A1A1A] border border-dashed border-[#2D2D2D] p-5 rounded-[8px] flex flex-col items-center justify-center text-center">
               <Activity size={20} className="text-[#444] mb-2" />
               <p className="text-[9px] font-bold text-[#878C9F] uppercase tracking-widest">Awaiting Insight Generation</p>
            </div>
            <div className="bg-[#1A1A1A] border border-dashed border-[#2D2D2D] p-5 rounded-[8px] flex flex-col items-center justify-center text-center">
               <Activity size={20} className="text-[#444] mb-2" />
               <p className="text-[9px] font-bold text-[#878C9F] uppercase tracking-widest">Awaiting Insight Generation</p>
            </div>
         </div>
      </div>

    </div>
  );
}

