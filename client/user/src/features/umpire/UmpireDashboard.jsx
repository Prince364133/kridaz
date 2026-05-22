import React, { useState } from "react";
import {
  Trophy,
  Calendar,
  Star,
  DollarSign,
  Zap,
  MapPin,
  BarChart as BarChartIcon,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Award,
  Activity,
  TrendingUp,
  Clock,
  ChevronRight,
  ShieldCheck,
  Scale,
  Briefcase
} from "lucide-react";
import StatCard from "@features/admin/Dashboard/StatCard";
import { 
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import useUmpireDashboard from "@hooks/owner/useUmpireDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";
import { useNavigate } from "react-router-dom";

export default function UmpireDashboard() {
  const { dashboardData, loading, error } = useUmpireDashboard();
  const navigate = useNavigate();

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-primary">System Offline</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-primary/50 text-primary font-bold uppercase rounded-xl hover:bg-primary/10 transition-all"
        >
          Retry Link
        </button>
      </div>
    );
  }

  // MOCK DATA ENHANCEMENT FOR ENTERPRISE UI BASED ON SPEC
  const mockEnterpriseData = {
    kpi: {
      matchesOfficiated: 142,
      upcomingAssignments: 3,
      accuracy: 94.5,
      kridazRating: 4.8,
      earnings: 4500,
      complaintIndex: 0.2,
      reliability: 98.5,
      activeCertifications: 4
    },
    performanceTrend: [
      { month: "Jan", accuracy: 91, pressure: 85, fitness: 90 },
      { month: "Feb", accuracy: 92, pressure: 86, fitness: 88 },
      { month: "Mar", accuracy: 94, pressure: 89, fitness: 92 },
      { month: "Apr", accuracy: 93, pressure: 90, fitness: 95 },
      { month: "May", accuracy: 95, pressure: 93, fitness: 94 },
      { month: "Jun", accuracy: 96, pressure: 95, fitness: 96 },
    ],
    skillsRadar: [
      { skill: "LBW Accuracy", value: 92, fullMark: 100 },
      { skill: "Pressure", value: 95, fullMark: 100 },
      { skill: "Conflict", value: 88, fullMark: 100 },
      { skill: "No-ball calls", value: 98, fullMark: 100 },
      { skill: "Comms", value: 94, fullMark: 100 },
      { skill: "Fitness", value: 90, fullMark: 100 },
    ],
    upcomingMatches: [
      { id: "M1", tournament: "Corporate T20 Cup", teamA: "Strikers", teamB: "Titans", date: "Tomorrow, 14:00", venue: "Greenfield Arena", role: "On-Field", status: "Pending", distance: "12km" },
      { id: "M2", tournament: "State League", teamA: "Warriors", teamB: "Knights", date: "24 May, 09:00", venue: "City Sports Complex", role: "Third Umpire", status: "Accepted", distance: "5km" }
    ],
    disputes: [
      { id: "D-102", type: "Player Complaint", match: "Corporate T20 Final", status: "Under Review", severity: "Medium", date: "12 May 2026" },
      { id: "D-095", type: "Scoring Discrepancy", match: "Weekend League Grp B", status: "Resolved", severity: "Low", date: "05 May 2026" }
    ],
    certifications: [
      { name: "BCCI Level 2 Umpire", issuer: "BCCI", status: "Active", expiry: "Dec 2027", badge: "Elite" },
      { name: "ICC Referee Seminar", issuer: "ICC", status: "Active", expiry: "Aug 2026", badge: "Standard" }
    ],
    financials: [
      { month: "Jan", earnings: 450, travel: 50 },
      { month: "Feb", earnings: 600, travel: 80 },
      { month: "Mar", earnings: 550, travel: 60 },
      { month: "Apr", earnings: 800, travel: 120 },
      { month: "May", earnings: 950, travel: 150 },
    ]
  };

  const { kpi, performanceTrend, skillsRadar, upcomingMatches, disputes, certifications, financials } = mockEnterpriseData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-[#55DEE8]/20 p-4 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-white font-bold text-xs uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs font-bold mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-400 uppercase">{entry.name}:</span>
              <span style={{ color: entry.color }}>{entry.value}{entry.name === "earnings" || entry.name === "travel" ? "$" : "%"}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full custom-scrollbar">
      <div className="p-4 md:p-8 space-y-8 animate-fade-in pt-2 pb-24 md:pb-12 max-w-[1600px] mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">Umpire Command Center</h1>
              <span className="px-3 py-1 bg-gradient-to-r from-amber-500/20 to-amber-700/20 text-amber-500 border border-amber-500/30 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Star size={12} fill="currentColor" /> Elite Official
              </span>
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Enterprise Officiating OS &bull; ID: UMP-88219</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 flex items-center gap-2">
              <Zap size={14} className="text-[#55DEE8]" /> Scoring App
            </button>
            <button className="px-5 py-2.5 bg-[#55DEE8]/10 hover:bg-[#55DEE8]/20 text-[#55DEE8] rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-[#55DEE8]/30 flex items-center gap-2 shadow-[0_0_20px_rgba(85,222,232,0.15)]">
              <ShieldCheck size={14} /> My Identity
            </button>
          </div>
        </div>

        {/* SECTION 1: KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 md:gap-4">
          <StatCard title="Matches" value={kpi.matchesOfficiated} icon={Trophy} />
          <StatCard title="Upcoming" value={kpi.upcomingAssignments} icon={Calendar} />
          <StatCard title="Accuracy" value={`${kpi.accuracy}%`} icon={Zap} />
          <StatCard title="Rating" value={kpi.kridazRating} icon={Star} />
          <StatCard title="Earnings" value={kpi.earnings} icon={DollarSign} prefix="$" />
          <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-white/5 flex flex-col justify-between">
            <div className="text-gray-500 mb-2"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Complaints</p>
              <h3 className="text-lg font-black text-white">{kpi.complaintIndex}</h3>
            </div>
          </div>
          <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-white/5 flex flex-col justify-between">
            <div className="text-[#55DEE8] mb-2"><ShieldCheck size={18} /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Reliability</p>
              <h3 className="text-lg font-black text-[#55DEE8]">{kpi.reliability}%</h3>
            </div>
          </div>
          <div className="p-4 bg-[#0A0A0A] rounded-2xl border border-white/5 flex flex-col justify-between">
            <div className="text-amber-500 mb-2"><Award size={18} /></div>
            <div>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Certificates</p>
              <h3 className="text-lg font-black text-amber-500">{kpi.activeCertifications}</h3>
            </div>
          </div>
        </div>

        {/* SECTION 2 & 3: ANALYTICS & ASSIGNMENTS */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Performance Analytics (2 cols) */}
          <div className="xl:col-span-2 space-y-6">
            <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-[#55DEE8]/20 transition-colors">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#55DEE8]/5 rounded-full blur-3xl group-hover:bg-[#55DEE8]/10 transition-colors pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <TrendingUp size={20} className="text-[#55DEE8]" /> Enterprise Performance Engine
                  </h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                    AI-Driven Accuracy & Pressure Metrics
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trend Chart */}
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                      <YAxis domain={['auto', 100]} axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#55DEE8" strokeWidth={3} dot={{ r: 4, fill: "#0A0A0A", stroke: "#55DEE8", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#55DEE8" }} />
                      <Line type="monotone" dataKey="pressure" name="Pressure" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#0A0A0A", stroke: "#f59e0b", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                <div className="h-[250px] w-full bg-white/[0.02] rounded-3xl border border-white/5">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillsRadar}>
                      <PolarGrid stroke="#ffffff10" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: "#9ca3af", fontSize: 9, fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Skills" dataKey="value" stroke="#55DEE8" fill="#55DEE8" fillOpacity={0.3} />
                      <Tooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Financial Center */}
            <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 group hover:border-[#55DEE8]/20 transition-colors">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <DollarSign size={20} className="text-[#55DEE8]" /> Financial Center
                  </h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                    Earnings & Payout Analytics
                  </p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={financials} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#55DEE8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#55DEE8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="earnings" name="Earnings" stroke="#55DEE8" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Assignments & Disputes (1 col) */}
          <div className="space-y-6">
            
            {/* Upcoming Assignments */}
            <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 flex flex-col group hover:border-[#55DEE8]/20 transition-colors">
              <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-[#55DEE8]" /> Smart Assignments
              </h2>
              <div className="space-y-4">
                {upcomingMatches.map((match, i) => (
                  <div key={i} className="p-5 bg-white/[0.02] rounded-[1.5rem] border border-white/5 relative group/match overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${match.status === 'Pending' ? 'bg-amber-500' : 'bg-[#55DEE8]'}`}></div>
                    
                    <div className="flex justify-between items-start mb-3 pl-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border ${match.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-[#55DEE8]/10 text-[#55DEE8] border-[#55DEE8]/20'}`}>
                        {match.status}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                        <MapPin size={10} /> {match.distance}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white uppercase tracking-tight pl-2 mb-1">{match.tournament}</h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-4">
                      {match.teamA} <span className="text-[#55DEE8]">VS</span> {match.teamB}
                    </p>

                    <div className="pl-2 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Clock size={12} className="text-gray-400" /> {match.date}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <MapPin size={12} className="text-gray-400" /> {match.venue}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Briefcase size={12} className="text-gray-400" /> Role: <span className="text-white">{match.role}</span>
                      </div>
                    </div>

                    {match.status === 'Pending' && (
                      <div className="mt-4 pt-4 border-t border-white/5 pl-2 flex gap-2">
                        <button className="flex-1 py-2 bg-[#55DEE8]/10 hover:bg-[#55DEE8]/20 text-[#55DEE8] text-[10px] font-black uppercase tracking-widest rounded-lg border border-[#55DEE8]/20 transition-colors">Accept</button>
                        <button className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 transition-colors">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dispute & Incident Center */}
            <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 group hover:border-red-500/20 transition-colors">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <Scale size={20} className="text-red-500" /> Dispute Center
                </h2>
                <span className="w-6 h-6 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center text-xs font-black border border-red-500/20">{disputes.length}</span>
              </div>
              
              <div className="space-y-3">
                {disputes.map((dispute, i) => (
                  <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer flex items-center justify-between group/dispute">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldAlert size={12} className={dispute.severity === 'Medium' ? 'text-amber-500' : 'text-[#55DEE8]'} />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{dispute.type}</span>
                      </div>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest pl-5">{dispute.match}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover/dispute:text-white transition-colors" />
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-colors">
                View All Records
              </button>
            </div>

          </div>
        </div>

        {/* SECTION 4: CAREER PROFILE & CERTIFICATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 group hover:border-[#55DEE8]/20 transition-colors">
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <Award size={20} className="text-[#55DEE8]" /> License Management
            </h2>
            <div className="space-y-4">
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-5 bg-gradient-to-r from-white/[0.03] to-transparent rounded-[1.5rem] border border-white/5 relative overflow-hidden flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                      <Award size={20} className={cert.badge === 'Elite' ? 'text-amber-500' : 'text-[#55DEE8]'} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight uppercase mb-1">{cert.name}</h4>
                      <div className="flex items-center gap-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>{cert.issuer}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span>Exp: {cert.expiry}</span>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-[#55DEE8]/10 text-[#55DEE8] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[#55DEE8]/20">
                    {cert.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 group hover:border-[#55DEE8]/20 transition-colors">
            <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-2">
              <Activity size={20} className="text-[#55DEE8]" /> Compliance Status
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 bg-[#55DEE8]/10 rounded-full flex items-center justify-center border border-[#55DEE8]/20 text-[#55DEE8]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Identity</h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Verified Govt ID</p>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 bg-[#55DEE8]/10 rounded-full flex items-center justify-center border border-[#55DEE8]/20 text-[#55DEE8]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Background</h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Police Cleared</p>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20 text-amber-500">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Medical</h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Due in 12 days</p>
                </div>
              </div>
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-10 h-10 bg-[#55DEE8]/10 rounded-full flex items-center justify-center border border-[#55DEE8]/20 text-[#55DEE8]">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Banking</h4>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">KYC Complete</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
