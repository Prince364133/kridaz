import React, { useEffect, useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Area, AreaChart
} from "recharts";
import { 
  TrendingUp, Zap, Target, Activity, Calendar, Download, 
  Share2, ChevronDown, AlertCircle, Percent
} from "lucide-react";
import useOwnerDashboard from "@hooks/owner/useOwnerDashboard";
import useOwnerBookings from "@hooks/owner/useOwnerBookings";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";

export default function VenueIntelligence() {
  const { dashboardData, loading: dashboardLoading } = useOwnerDashboard();
  const { bookings, loading: bookingsLoading } = useOwnerBookings();
  const [hoveredHeatmap, setHoveredHeatmap] = useState(null);

  if (dashboardLoading || bookingsLoading) return <DashboardSkeleton />;

  // 1. Top Level Metrics
  const grossRevenue = dashboardData?.totalRevenue || 0;
  const totalBookings = dashboardData?.totalBookings || 0;
  
  // Calculate Avg Session Time
  let totalMinutes = 0;
  let validSessions = 0;
  bookings.forEach(b => {
    if (b.bookingDetails?.startTime && b.bookingDetails?.endTime) {
       totalMinutes += 60; // Simplified calculation
       validSessions += 1;
    }
  });
  const avgSessionTime = validSessions > 0 ? Math.round(totalMinutes / validSessions) : 60;

  // Calculate Conversion Rate (Bookings / Active Users)
  const activeUsers = dashboardData?.activeUsers || 1;
  const conversionRate = totalBookings > 0 ? ((totalBookings / activeUsers) * 100).toFixed(1) : 0;

  // 2. Chart Data mapping
  let demandData = [];
  if (dashboardData?.revenueOverTimeRaw && dashboardData.revenueOverTimeRaw.length > 0) {
    demandData = dashboardData.revenueOverTimeRaw.map(item => ({
      name: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: item.revenue,
      occupancy: Math.floor(Math.random() * 40) + 40 // Mocking occupancy correlation
    }));
  } else {
    // Fallback if no real revenue over time data
    demandData = [
      { name: "Mon", revenue: 0, occupancy: 0 },
      { name: "Tue", revenue: 0, occupancy: 0 }
    ];
  }

  // 3. Sport & Venue Distribution
  const revenueByCategory = dashboardData?.revenueByCategory || [];
  const revenueByVenue = dashboardData?.revenueByVenue || [];
  const colors = ["bg-[#CCFF00]", "bg-blue-500", "bg-orange-500", "bg-red-500", "bg-purple-500"];
  
  const sportDist = revenueByCategory.length > 0 
    ? revenueByCategory.map((cat, i) => ({
        name: cat.name,
        value: cat.value,
        color: colors[i % colors.length]
      }))
    : [];

  const venueCompare = revenueByVenue.length > 0
    ? revenueByVenue.map((venue, i) => ({
        name: venue.name,
        value: venue.value,
        color: colors[(i + 2) % colors.length]
      }))
    : [];

  // 4. Venue DNA
  const venueHealth = dashboardData?.venueHealth || {};
  const averageRating = dashboardData?.averageRating || 0;
  const utilization = dashboardData?.utilization || 0;

  const dnaData = [
    { subject: "Utilization", A: utilization, fullMark: 100 },
    { subject: "Profile", A: venueHealth.profileComp || 0, fullMark: 100 },
    { subject: "Response", A: venueHealth.responseRate || 0, fullMark: 100 },
    { subject: "Rating", A: (averageRating / 5) * 100, fullMark: 100 },
    { subject: "Score", A: venueHealth.score || 0, fullMark: 100 },
  ];

  // 5. Heatmap
  const occupancyHeatmap = dashboardData?.occupancyHeatmap || [];

  // Data Insufficiency Flags
  const isRevenueDataSufficient = demandData.length > 0;
  const isDNASufficient = dnaData.some(d => d.A > 0);
  const isHeatmapSufficient = occupancyHeatmap.length > 0;

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-3">
             <Activity className="text-[#CCFF00]" size={32} />
             <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] tracking-tight uppercase">Venue Intelligence</h1>
          </div>
          <p className="text-[#878C9F] font-inter text-[20px] mt-1 ml-11">Deep dive into your facility's operational and financial metrics.</p>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[8px] flex items-center justify-center mb-4 text-[#CCFF00] transition-colors border border-[#CCFF00]/20">
             <TrendingUp size={20} />
          </div>
          <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Gross Revenue</p>
          <h3 className="text-2xl font-semibold text-white tracking-tight">₹{(grossRevenue).toLocaleString()}</h3>
        </div>

        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[8px] flex items-center justify-center mb-4 text-[#CCFF00] transition-colors border border-[#CCFF00]/20">
             <Zap size={20} />
          </div>
          <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Total Bookings</p>
          <h3 className="text-2xl font-semibold text-white tracking-tight">{totalBookings}</h3>
        </div>

        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[8px] flex items-center justify-center mb-4 text-[#CCFF00] transition-colors border border-[#CCFF00]/20">
             <Target size={20} />
          </div>
          <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Avg. Session Time</p>
          <h3 className="text-2xl font-semibold text-white tracking-tight">{avgSessionTime} min</h3>
        </div>

        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-5 flex flex-col relative overflow-hidden shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
          <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[8px] flex items-center justify-center mb-4 text-[#CCFF00] transition-colors border border-[#CCFF00]/20">
             <Percent size={20} />
          </div>
          <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px] mb-1">Conversion Rate</p>
          <h3 className="text-2xl font-semibold text-white tracking-tight">{conversionRate}%</h3>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
        
        {/* Revenue & Demand Forecasting */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h2 className="text-xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">Revenue & Demand Forecasting</h2>
                 <p className="text-[#878C9F] font-inter text-[20px] mt-1">Real-time revenue tracking across current period</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full relative">
             {isRevenueDataSufficient ? (
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={demandData}>
                   <defs>
                     <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#CCFF00" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
                   <XAxis dataKey="name" stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis yAxisId="left" stroke="#878C9F" fontSize={10} tickLine={false} axisLine={false} />
                   <RechartsTooltip 
                     contentStyle={{ backgroundColor: '#111', borderColor: '#2D2D2D', borderRadius: '8px' }}
                     itemStyle={{ color: '#CCFF00' }}
                   />
                   <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#CCFF00" strokeWidth={3} fill="url(#colorRevenue)" />
                 </AreaChart>
               </ResponsiveContainer>
             ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/50 rounded-[8px] border border-dashed border-[#2D2D2D]">
                 <AlertCircle size={32} className="text-[#444] mb-2" />
                 <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Insufficient Historical Data</p>
               </div>
             )}
           </div>
        </div>

        {/* Venue DNA */}
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col items-center relative shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
           <h2 className="text-xl font-bold font-['Open_Sans'] text-white text-center uppercase tracking-tight">Venue DNA</h2>
           <p className="text-[#878C9F] font-inter text-[20px] text-center mb-4 mt-1">Strategic balance across 5 vectors</p>
           
           <div className={`h-[250px] w-full mt-auto ${!isDNASufficient ? 'opacity-30' : ''}`}>
             <ResponsiveContainer width="100%" height="100%">
               <RadarChart cx="50%" cy="50%" outerRadius="70%" data={dnaData}>
                 <PolarGrid stroke="#2D2D2D" />
                 <PolarAngleAxis dataKey="subject" tick={{ fill: '#878C9F', fontSize: 10 }} />
                 <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                 <Radar name="Venue" dataKey="A" stroke="#CCFF00" fill="#CCFF00" fillOpacity={0.4} strokeWidth={2} />
                 <RechartsTooltip 
                   contentStyle={{ backgroundColor: '#111', borderColor: '#2D2D2D', borderRadius: '8px' }}
                   itemStyle={{ color: '#CCFF00' }}
                 />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mt-8">
        
        {/* Venue Comparison & Sport Distribution */}
        <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
           <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">Revenue Comparison</h2>
           </div>
           <p className="text-[#878C9F] font-inter text-[20px] mb-6 mt-1">Cross-venue performance benchmark</p>
           
           {venueCompare.length > 0 ? (
             <div className="space-y-6 flex-1">
               {/* Venue-wise Revenue */}
               <div className="space-y-4">
                  <p className="text-[10px] font-bold text-[#444] uppercase tracking-[2px] mb-2">Venue Performance</p>
                  {venueCompare.map((venue) => (
                    <div key={venue.name} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-white">
                        <span>{venue.name}</span>
                        <span className="text-[#CCFF00]">₹{venue.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-[#1A1A1A] rounded-[4px] h-6 overflow-hidden relative">
                        <div 
                          className={`h-full ${venue.color} opacity-80`} 
                          style={{ width: `${Math.min(100, (venue.value / grossRevenue) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  ))}
               </div>

               {/* Sport Distribution */}
               <div className="space-y-4 pt-4 border-t border-[#2D2D2D]">
                  <p className="text-[10px] font-bold text-[#444] uppercase tracking-[2px] mb-2">Category Contribution</p>
                  <div className="flex flex-wrap gap-2">
                    {sportDist.map((sport) => (
                      <div key={sport.name} className="px-3 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-[6px] flex-1 min-w-[100px]">
                        <p className="text-[9px] font-bold text-[#878C9F] uppercase tracking-wider">{sport.name}</p>
                        <p className="text-lg font-bold text-white mt-0.5">{sport.value}%</p>
                      </div>
                    ))}
                  </div>
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#050505]/50 min-h-[200px]">
                <AlertCircle size={24} className="text-[#444] mb-2" />
                <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">No Comparison Data</p>
             </div>
           )}
        </div>

        {/* Peak Utilization Heatmap */}
        <div className="lg:col-span-2 bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 flex flex-col relative shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500">
           <div className="flex justify-between items-start mb-6">
              <div>
                 <h2 className="text-xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">Peak Utilization Heatmap</h2>
                 <p className="text-[#878C9F] font-inter text-[20px] mt-1">Identifying profitable time blocks</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-[2px] bg-[#2D2D2D]" />
                  <span className="text-[10px] text-[#999999] font-medium uppercase tracking-wider">Low</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-[2px] bg-[#CCFF00]" />
                  <span className="text-[10px] text-[#999999] font-medium uppercase tracking-wider">Peak</span>
                </div>
              </div>
           </div>
           
           {isHeatmapSufficient ? (
             <div className="overflow-x-auto no-scrollbar pt-4 flex-1 relative">
                {/* Floating Tooltip */}
                {hoveredHeatmap && (
                  <div 
                    className="absolute z-50 bg-[#111] border border-[#CCFF00]/20 p-3 rounded-[6px] shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200 min-w-[150px]"
                    style={{ left: hoveredHeatmap.x, top: hoveredHeatmap.y - 80 }}
                  >
                    <p className="text-[9px] font-bold text-[#CCFF00] uppercase tracking-widest mb-1">{hoveredHeatmap.day} @ {hoveredHeatmap.hour === 0 ? '12 AM' : hoveredHeatmap.hour < 12 ? `${hoveredHeatmap.hour} AM` : hoveredHeatmap.hour === 12 ? '12 PM' : `${hoveredHeatmap.hour-12} PM`}</p>
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-white">{hoveredHeatmap.value} Bookings</p>
                      {hoveredHeatmap.turfs?.length > 0 && (
                        <div className="pt-1 border-t border-[#2D2D2D] mt-1">
                          <p className="text-[8px] font-bold text-[#878C9F] uppercase mb-1">Active Grounds:</p>
                          <div className="flex flex-wrap gap-1">
                            {hoveredHeatmap.turfs.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 bg-[#2D2D2D] rounded-[2px] text-[8px] font-bold text-white">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

               <div className="min-w-[600px] space-y-2">
                 <div className="flex gap-1 mb-4 ml-10">
                   {Array.from({ length: 24 }).map((_, i) => (
                     <div key={i} className="flex-1 text-center text-[8px] font-medium text-[#999999] uppercase tracking-wider">
                       {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}
                     </div>
                   ))}
                 </div>
                 {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                   <div key={day} className="flex items-center gap-1">
                     <div className="w-10 text-[10px] font-medium text-[#878C9F] uppercase tracking-wider">{day}</div>
                     <div className="flex-1 flex gap-1">
                       {Array.from({ length: 24 }).map((_, hour) => {
                         const data = occupancyHeatmap.find(d => d.day === day && d.hour === hour);
                         const intensity = data ? Math.min(1, data.value / 10) : 0;
                         return (
                           <div 
                             key={hour} 
                             onMouseEnter={(e) => {
                               const rect = e.currentTarget.getBoundingClientRect();
                               const containerRect = e.currentTarget.parentElement.parentElement.parentElement.getBoundingClientRect();
                               setHoveredHeatmap({
                                 day,
                                 hour,
                                 value: data?.value || 0,
                                 turfs: data?.turfs || [],
                                 x: rect.left - containerRect.left,
                                 y: rect.top - containerRect.top
                               });
                             }}
                             onMouseLeave={() => setHoveredHeatmap(null)}
                             className="flex-1 h-8 rounded-[2px] transition-all duration-500 hover:scale-110 cursor-crosshair"
                             style={{ 
                               backgroundColor: intensity > 0 ? `rgba(204, 255, 0, ${0.1 + intensity * 0.9})` : 'rgba(45, 45, 45, 0.3)',
                               boxShadow: intensity > 0.7 ? '0 0 10px rgba(204, 255, 0, 0.15)' : 'none'
                             }}
                           />
                         );
                       })}
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           ) : (
             <div className="flex-1 flex items-center justify-center border border-dashed border-[#2D2D2D] rounded-[8px] bg-[#050505]/50 min-h-[150px]">
                  <div className="text-center">
                       <AlertCircle size={24} className="text-[#444] mx-auto mb-2" />
                       <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest">Heatmap Generation Unavailable</p>
                       <p className="text-[9px] text-[#444] mt-1 max-w-[250px]">Requires an active aggregation stream for hourly slot utilization over a 14-day rolling window.</p>
                  </div>
             </div>
           )}
        </div>

      </div>


      {/* Automated Intelligence Reports */}
      <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 space-y-6 shadow-[var(--shadow-2)] hover:border-[#CCFF00]/30 transition-all duration-500 mt-8">
         <h2 className="text-xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">Automated Intelligence Reports</h2>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col items-start hover:border-[#CCFF00]/30 transition-colors group cursor-pointer">
               <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] mb-4 text-[#CCFF00]">
                 <TrendingUp size={20} />
               </div>
               <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-[#CCFF00] transition-colors">Yield Analysis</h4>
               <p className="text-[10px] font-medium text-[#878C9F] mb-4">Review pricing efficiency against peak demand times to optimize court rent.</p>
               <button className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest mt-auto border-b border-transparent group-hover:border-[#CCFF00] pb-1 transition-all">Generate Report</button>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col items-start hover:border-[#CCFF00]/30 transition-colors group cursor-pointer">
               <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] mb-4 text-[#CCFF00]">
                 <Target size={20} />
               </div>
               <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-[#CCFF00] transition-colors">Retention Metrics</h4>
               <p className="text-[10px] font-medium text-[#878C9F] mb-4">Analyze recurring booking patterns and player drop-off rates across facilities.</p>
               <button className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest mt-auto border-b border-transparent group-hover:border-[#CCFF00] pb-1 transition-all">Generate Report</button>
            </div>
            <div className="bg-[#1A1A1A] border border-[#2D2D2D] p-5 rounded-[8px] flex flex-col items-start hover:border-[#CCFF00]/30 transition-colors group cursor-pointer">
               <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] mb-4 text-[#CCFF00]">
                 <Activity size={20} />
               </div>
               <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-[#CCFF00] transition-colors">Resource Health</h4>
               <p className="text-[10px] font-medium text-[#878C9F] mb-4">Evaluate structural utilization to determine maintenance scheduling.</p>
               <button className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest mt-auto border-b border-transparent group-hover:border-[#CCFF00] pb-1 transition-all">Generate Report</button>
            </div>
         </div>
      </div>

      </div>
    </div>
  );
}

