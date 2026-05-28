import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Filter, Calendar, TrendingUp } from 'lucide-react';
import axiosInstance from '@hooks/useAxiosInstance';

const PeakHoursChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [turfs, setTurfs] = useState([]);
  const [selectedTurf, setSelectedTurf] = useState('');
  const [filter, setFilter] = useState('week'); // day, week, month, year
  const [summary, setSummary] = useState({ totalWeeklyBookings: 0, peakTime: 'N/A' });

  useEffect(() => {
    fetchTurfs();
  }, []);

  const fetchTurfs = async () => {
    try {
      const res = await axiosInstance.get('/api/owner/turf/owner/all');
      const data = Array.isArray(res.data) ? res.data : [];
      setTurfs(data);
      if (data.length > 0) {
        setSelectedTurf(data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching turfs:", error);
    }
  };

  useEffect(() => {
    if (selectedTurf) {
      fetchData();
    }
  }, [filter, selectedTurf]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/owner/dashboard/occupancy?filter=${filter}&turfId=${selectedTurf}`);
      if (res.data.success) {
        setData(res.data.peakHours);
        setSummary(res.data.summary);
      }
    } catch (error) {
      console.error("Error fetching peak hours:", error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#151617] border border-[#2D2D2D] p-3 rounded-[6px] shadow-2xl">
          <p className="text-[10px] text-[#878C9F] uppercase tracking-widest font-bold mb-1">{payload[0].payload.time}</p>
          <p className="text-white font-black flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#BFF367]" />
            {payload[0].value} Bookings
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#000000] p-6 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <h2 className="text-[14px] font-black text-white uppercase tracking-tighter whitespace-nowrap" style={{ fontFamily: "'Open Sans', sans-serif" }}>Peak Booking Hours</h2>
             <div className="px-1.5 py-0.5 bg-[#BFF367]/10 text-[#BFF367] rounded text-[8px] font-black uppercase tracking-widest border border-[#BFF367]/20">Live</div>
          </div>
          <p className="text-[10px] font-normal text-[#878C9F] uppercase tracking-widest">Time distribution analysis</p>
        </div>

        <div className="flex flex-nowrap shrink-0 items-center gap-1 mt-3 sm:mt-0">
          <select 
            value={selectedTurf} 
            onChange={(e) => setSelectedTurf(e.target.value)}
            className="bg-[#151617] border border-[#2D2D2D] text-white text-[7px] font-black uppercase tracking-widest rounded-[4px] px-1.5 py-0.5 focus:outline-none focus:border-[#BFF367]/50 transition-all cursor-pointer hover:border-[#BFF367]/30"
          >
            <option value="" disabled>Select Facility</option>
            {turfs.map(turf => (
              <option key={turf._id} value={turf._id}>{turf.name}</option>
            ))}
          </select>

          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#151617] border border-[#2D2D2D] text-white text-[7px] font-black uppercase tracking-widest rounded-[4px] px-1.5 py-0.5 focus:outline-none focus:border-[#BFF367]/50 transition-all cursor-pointer hover:border-[#BFF367]/30"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#BFF367" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#BFF367" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" vertical={false} />
            <XAxis 
              dataKey="time" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#878C9F', fontSize: 10, fontWeight: 500 }}
              interval={3}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#878C9F', fontSize: 10, fontWeight: 500 }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#BFF367', strokeWidth: 1 }} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#BFF367" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
         <div className="bg-[#151617] p-2.5 rounded-[6px] border border-[#2D2D2D] flex items-center gap-2.5 group hover:border-[#BFF367]/30 transition-all">
            <div className="p-1.5 bg-[#BFF367]/10 text-[#BFF367] rounded-[4px] group-hover:scale-110 transition-transform">
               <TrendingUp size={14} />
            </div>
            <div>
               <p className="text-[8px] text-[#878C9F] uppercase font-black tracking-widest mb-0.5">Peak Time</p>
               <p className="text-white font-black text-sm uppercase tracking-tight">{summary.peakTime}</p>
            </div>
         </div>
         <div className="bg-[#151617] p-2.5 rounded-[6px] border border-[#2D2D2D] flex items-center gap-2.5 group hover:border-[#BFF367]/30 transition-all">
            <div className="p-1.5 bg-[#BFF367]/10 text-[#BFF367] rounded-[4px] group-hover:scale-110 transition-transform">
               <Calendar size={14} />
            </div>
            <div>
               <p className="text-[8px] text-[#878C9F] uppercase font-black tracking-widest mb-0.5">Total Vol.</p>
               <p className="text-white font-black text-sm uppercase tracking-tight">{data.reduce((acc, curr) => acc + curr.count, 0)}</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PeakHoursChart;
