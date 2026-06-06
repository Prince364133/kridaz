import React from "react";
import {
  ClipboardList,
  Trophy,
  Wallet,
  IndianRupee,
  Activity,
  Calendar,
  Download,
  User,
  ChevronDown,
  Star,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

// Mock Data
const matchesTrendData = [
  { month: "Jun", matches: 4 },
  { month: "Jul", matches: 12 },
  { month: "Aug", matches: 10 },
  { month: "Sep", matches: 18 },
  { month: "Oct", matches: 25 },
  { month: "Nov", matches: 14 },
  { month: "Dec", matches: 12 },
  { month: "Jan", matches: 19 },
  { month: "Feb", matches: 15 },
  { month: "Mar", matches: 21 },
  { month: "Apr", matches: 24 },
  { month: "May", matches: 28 },
];

const occupancyData = [
  { day: "Mon", rate: 72 },
  { day: "Tue", rate: 68 },
  { day: "Wed", rate: 75 },
  { day: "Thu", rate: 70 },
  { day: "Fri", rate: 82 },
  { day: "Sat", rate: 88 },
  { day: "Sun", rate: 65 },
];

const moneyTrendData = [
  { month: "Jun", amount: 2000 },
  { month: "Jul", amount: 3500 },
  { month: "Aug", amount: 4000 },
  { month: "Sep", amount: 5500 },
  { month: "Oct", amount: 5000 },
  { month: "Nov", amount: 6000 },
  { month: "Dec", amount: 4500 },
  { month: "Jan", amount: 5000 },
  { month: "Feb", amount: 4800 },
  { month: "Mar", amount: 6500 },
  { month: "Apr", amount: 7800 },
  { month: "May", amount: 8450 },
];

const matchHistory = [
  { id: 1, match: "Hyderabad Premier League", tournament: "T20 League", sport: "Cricket", date: "24 May 2025", venue: "Samsung Grounds", rating: 4.9, sportColor: "#BFF367" },
  { id: 2, match: "Corporate Cup Final", tournament: "Corporate Cup", sport: "Cricket", date: "18 May 2025", venue: "Shiva Turf", rating: 4.8, sportColor: "#BFF367" },
  { id: 3, match: "Summer Smash 2025", tournament: "Box Cricket League", sport: "Box Cricket", date: "11 May 2025", venue: "PlayArena", rating: 4.9, sportColor: "#FF4B4B" },
  { id: 4, match: "City Super Six", tournament: "Tennis League", sport: "Tennis", date: "05 May 2025", venue: "Greenfield Stadium", rating: 4.8, sportColor: "#BFF367" },
  { id: 5, match: "Weekend Warriors", tournament: "Box Cricket League", sport: "Box Cricket", date: "28 Apr 2025", venue: "Game Point Turf", rating: 4.8, sportColor: "#FF4B4B" },
];

const reviews = [
  { id: 1, name: "Arjun Mehta", text: "Excellent decision making and game control. Very professional and calm throughout.", date: "20 May 2025", rating: 5, avatar: "https://i.pravatar.cc/150?u=arjun" },
  { id: 2, name: "Rohit Sharma", text: "Great umpire with accurate calls and perfect game management.", date: "17 May 2025", rating: 4, avatar: "https://i.pravatar.cc/150?u=rohit" },
  { id: 3, name: "Priya Nair", text: "Very good experience. Maintains fairness and handles pressure well.", date: "12 May 2025", rating: 4, avatar: "https://i.pravatar.cc/150?u=priya" },
];

const CoachDashboard = () => {
  return (
    <div className="min-h-screen bg-[#07090E] p-6 lg:p-8 font-sans text-white overflow-x-hidden relative">
      
      {/* Global Gradient Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#BFF367] rounded-full blur-[150px] opacity-[0.08]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#BFF367] rounded-full blur-[150px] opacity-[0.08]"></div>
      </div>

      <div className="relative z-10">
        {/* HEADER SECTION */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-transparent bg-clip-text">Performance Overview</h1>
            <p className="text-[#BFF367] text-sm font-medium">Umpire Analytics Dashboard</p>
          </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center gap-2 bg-transparent border border-white/10 hover:bg-white/5 px-5 py-3 rounded-lg text-sm font-medium transition-all shadow-lg">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </header>

      {/* KPI CARDS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6 mb-8">
        <KpiCard 
          title="Total Matches Officiated" 
          value="215" 
          growth="+12% vs last 6 months" 
          isPositive={true}
          icon={ClipboardList} 
          accent="#BFF367" 
        />
        <KpiCard 
          title="Tournaments Officiated" 
          value="42" 
          growth="+8% vs last 6 months" 
          isPositive={true}
          icon={Trophy} 
          accent="#BFF367" 
        />
        <KpiCard 
          title="Revenue Generated" 
          value="₹8,450" 
          growth="+15% vs last 6 months" 
          isPositive={true}
          icon={Wallet} 
          accent="#BFF367" 
        />
        <KpiCard 
          title="Amount / Dispute Money" 
          value="₹650" 
          growth="↓ 8% vs last 6 months" 
          isPositive={false}
          icon={IndianRupee} 
          accent="#A020F0" 
        />
        <KpiCard 
          title="Sports Covered" 
          value="3" 
          subtext="Cricket, Box Cricket, Tennis"
          icon={Activity} 
          accent="#A020F0" 
        />
      </div>

      {/* MAIN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Matches Trend */}
        <div className="bg-[#11141D] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-[#BFF367]/30 transition-all">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#BFF367]/5 blur-[60px] rounded-full"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h2 className="text-lg font-bold">Matches Trend <span className="text-xs font-normal text-gray-400 ml-2">(Last 12 Months)</span></h2>
            <div className="bg-[#1A1D27] border border-white/10 px-3 py-1.5 rounded-lg text-center">
              <p className="text-lg font-bold text-white leading-none">28</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">Matches<br/>This Month</p>
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={matchesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BFF367" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#BFF367" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#717582', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#717582', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#BFF367' }}
                />
                <Area type="monotone" dataKey="matches" stroke="#BFF367" strokeWidth={3} fillOpacity={1} fill="url(#colorMatches)" activeDot={{ r: 6, fill: '#BFF367', stroke: '#07090E', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Rates */}
        <div className="bg-[#11141D] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-[#BFF367]/30 transition-all">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#BFF367]/5 blur-[60px] rounded-full"></div>
          <h2 className="text-lg font-bold mb-6 relative z-10">Occupancy Rates <span className="text-xs font-normal text-gray-400 ml-2">(Daily)</span></h2>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#717582', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#717582', fontSize: 12}} tickFormatter={(value) => `${value}%`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#BFF367' }}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                  {
                    occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#BFF367" />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Money Trend */}
        <div className="bg-[#11141D] border border-white/5 rounded-xl p-6 relative overflow-hidden group hover:border-[#BFF367]/30 transition-all">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#BFF367]/5 blur-[60px] rounded-full"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <h2 className="text-lg font-bold">Money Trend <span className="text-xs font-normal text-gray-400 ml-2">(Last 12 Months)</span></h2>
            <div className="bg-[#1A1D27] border border-white/10 px-3 py-1.5 rounded-lg text-center">
              <p className="text-lg font-bold text-white leading-none">₹8.45K</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">This Month</p>
            </div>
          </div>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moneyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMoney" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BFF367" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#BFF367" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#717582', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#717582', fontSize: 12}} tickFormatter={(value) => `₹${value/1000}K`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1D27', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#BFF367' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="amount" stroke="#BFF367" strokeWidth={3} fillOpacity={1} fill="url(#colorMoney)" activeDot={{ r: 6, fill: '#BFF367', stroke: '#07090E', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Match History */}
        <div className="lg:col-span-2 bg-[#11141D] border border-white/5 rounded-xl p-6 relative overflow-hidden">
          <h2 className="text-lg font-bold mb-6">Recent Match History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="pb-3 font-medium">Match</th>
                  <th className="pb-3 font-medium">Tournament</th>
                  <th className="pb-3 font-medium">Sport</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Venue</th>
                  <th className="pb-3 font-medium">Rating</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 font-medium">{row.match}</td>
                    <td className="py-4 text-gray-300">{row.tournament}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: row.sportColor}}></div>
                        <span>{row.sport}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-300">{row.date}</td>
                    <td className="py-4 text-gray-300">{row.venue}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-1 font-semibold">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        {row.rating}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <button className="text-[#BFF367] text-sm font-semibold hover:text-[#BFF367] transition-colors flex items-center gap-2">
              View All Matches <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Ratings / Reviews Panel */}
        <div className="bg-[#11141D] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">Ratings / Reviews</h2>
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center justify-center relative">
              {/* Fake circular progress */}
              <div className="w-24 h-24 rounded-full border-4 border-[#2A2D35] flex items-center justify-center relative">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="transparent" stroke="#BFF367" strokeWidth="8" strokeDasharray="289" strokeDashoffset="28" className="drop-shadow-[0_0_8px_rgba(191,243,103,0.5)]" />
                </svg>
                <div className="text-center z-10">
                  <span className="text-3xl font-bold text-[#BFF367]">4.8</span>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />)}
              </div>
              <p className="text-xs text-gray-400 mt-2">(248 Reviews)</p>
            </div>
            
            <div className="flex-1 ml-6 space-y-2">
              <RatingBar stars="5 Stars" percentage={78} />
              <RatingBar stars="4 Stars" percentage={17} />
              <RatingBar stars="3 Stars" percentage={4} />
              <RatingBar stars="2 Stars" percentage={1} />
              <RatingBar stars="1 Star" percentage={0} />
            </div>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-[#1A1D27] p-4 rounded-lg border border-white/5 hover:border-[#BFF367]/30 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <img src={review.avatar} alt={review.name} className="w-8 h-8 rounded-full border border-white/10" />
                    <div>
                      <h4 className="text-sm font-semibold">{review.name}</h4>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">{review.date}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed group-hover:text-white transition-colors">{review.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button className="text-[#BFF367] text-sm font-semibold hover:text-[#BFF367] transition-colors flex items-center gap-2">
              View All Reviews <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
      
        {/* Footer Disclaimer */}
        <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-start gap-2 border-t border-white/5 pt-4">
          <div className="w-4 h-4 rounded-full border border-gray-500 flex items-center justify-center font-serif italic text-[10px]">i</div>
          All statistics are calculated based on matches completed in the selected date range.
        </div>
      </div>
    </div>
  );
};

// Sub-components

const KpiCard = ({ title, value, growth, isPositive, icon: Icon, accent, subtext }) => {
  return (
    <div className="bg-[#11141D] border border-white/5 rounded-xl p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300"
         style={{ '--hover-border': accent }}>
      <div 
        className="absolute -top-10 -right-10 w-28 h-28 blur-[40px] rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: accent }}
      ></div>
      
      <div className="flex items-start gap-4 mb-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
          style={{ backgroundColor: `${accent}15` }}
        >
          <Icon size={24} style={{ color: accent }} className="drop-shadow-[0_0_8px_currentColor]" />
        </div>
        <div>
          <p className="text-gray-400 text-xs font-medium mb-1 leading-snug">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-white leading-none">{value}</h3>
        </div>
      </div>
      
      <div className="mt-4">
        {growth && (
          <p className="text-xs font-medium flex items-center gap-1" style={{ color: isPositive ? '#BFF367' : '#FF4B4B' }}>
            {isPositive ? '↑' : ''} {growth}
          </p>
        )}
        {subtext && (
          <p className="text-xs text-gray-400 font-medium truncate">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

const RatingBar = ({ stars, percentage }) => {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="text-gray-400 w-12">{stars}</span>
      <div className="flex-1 h-1.5 bg-[#2A2D35] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full drop-shadow-[0_0_4px_rgba(191,243,103,0.5)]" 
          style={{ width: `${percentage}%`, backgroundColor: percentage > 10 ? '#BFF367' : (percentage > 0 ? '#BFF367' : '#2A2D35') }}
        ></div>
      </div>
      <span className="text-gray-400 w-8 text-right">{percentage}%</span>
    </div>
  );
};

export default CoachDashboard;
