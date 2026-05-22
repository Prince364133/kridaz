const fs = require('fs');
const filePath = 'c:\\\\Users\\\\Katta Manish Goud\\\\OneDrive\\\\Desktop\\\\Bms\\\\kridaz\\\\kridaz\\\\client\\\\user\\\\src\\\\features\\\\umpire\\\\UmpireDashboard.jsx';

const fullContent = \`import React from "react";
import {
  Trophy,
  Calendar,
  Star,
  DollarSign,
  Zap,
  MapPin,
  BarChart as BarChartIcon,
  CheckCircle2,
} from "lucide-react";
import StatCard from "@features/admin/Dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

  const {
    matchesOfficiated = 0,
    upcomingMatches = 0,
    officialRating = 0,
    earnings = 0,
    matchEngagement = [],
    upcomingAssignments = [],
  } = dashboardData || {};

  const profileData = {
    bio: dashboardData?.bio || "Certified BCCI Level 1 Umpire with extensive experience in corporate and domestic T20 leagues. Known for neutral decision-making and strong player control under pressure.",
    certifications: dashboardData?.certifications || [
      { name: "BCCI Level 1 Umpire", issueDate: "2020", status: "Active" },
      { name: "MCA Certified Scorer", issueDate: "2018", status: "Active" }
    ],
    performance: dashboardData?.performance || {
      accuracy: 94.5,
      pressureHandling: 92,
      communication: 96
    }
  };

  return (
    <div className="h-full custom-scrollbar">
      <div className="p-4 md:p-10 space-y-6 md:space-y-12 animate-fade-in pt-2 pb-24 md:pb-12 max-w-[1600px] mx-auto">

        {/* Primary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Matches Officiated" value={matchesOfficiated} icon={Trophy} />
          <StatCard title="Upcoming Matches" value={upcomingMatches} icon={Calendar} />
          <StatCard title="Official Rating" value={officialRating} icon={Star} />
          <StatCard title="Earnings" value={earnings} icon={DollarSign} prefix="$" />
        </div>

        {/* Scoring Center */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#111] to-[#050505] rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={120} className="text-primary" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">
              Scoring Center
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">
              Official Match Scoring Applications
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Cricket Scoring */}
              <div
                className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-primary/30 transition-all group/app cursor-pointer"
                onClick={() => navigate("/umpire/matches")}
              >
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 group-hover/app:bg-primary group-hover/app:text-black transition-all text-primary">
                  <Zap size={24} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Cricket Scoring
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Official ball-by-ball scoring engine with real-time sync and player analytics.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                  Launch App <CheckCircle2 size={12} />
                </div>
              </div>

              {/* Placeholder for future sports */}
              <div className="p-6 bg-white/[0.01] rounded-3xl border border-white/5 opacity-40 cursor-not-allowed">
                <div className="w-12 h-12 bg-gray-500/10 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                  <Star size={24} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-500 mb-2">
                  Football Scoring
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Match Volume Chart */}
          <div className="lg:col-span-2 p-6 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 relative transition-all hover:border-[#55DEE8]/20 group">
            <div className="flex justify-between items-center mb-8 md:mb-12">
              <div>
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white">
                  Match Engagement
                </h2>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-1">
                  Monthly Assignment Analytics
                </p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-[#55DEE8]/30 transition-colors">
                <BarChartIcon size={20} className="text-[#55DEE8]" />
              </div>
            </div>

            <div className="h-[300px] md:h-[400px] w-full flex items-center justify-center border border-white/5 border-dashed rounded-[2rem] overflow-hidden">
              {matchEngagement.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={matchEngagement} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#4b5563", fontSize: 10, fontWeight: "bold" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#4b5563", fontSize: 10, fontWeight: "bold" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#ffffff05" }}
                      contentStyle={{
                        backgroundColor: "#000",
                        border: "1px solid rgba(85,222,232,0.2)",
                        borderRadius: "16px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                      }}
                      itemStyle={{ color: "#55DEE8", fontWeight: "bold" }}
                    />
                    <Bar dataKey="matches" fill="#55DEE8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center space-y-3 opacity-30">
                  <BarChartIcon size={32} className="mx-auto" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    No match data yet
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="p-8 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 flex flex-col transition-all hover:border-[#55DEE8]/20 group">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-8">
              Upcoming Assignments
            </h2>
            <div className="flex-1 space-y-5 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
              {upcomingAssignments.length > 0 ? (
                upcomingAssignments.map((match, i) => (
                  <div
                    key={i}
                    className="p-5 md:p-6 bg-white/[0.02] rounded-[1.5rem] border border-white/5 group/item hover:bg-white/[0.05] transition-all relative"
                  >
                    <div className="absolute top-6 right-6">
                      <Zap
                        size={14}
                        className="text-[#55DEE8] opacity-30 group-hover/item:opacity-100 transition-opacity"
                      />
                    </div>
                    <h4 className="text-base font-bold text-white mb-3 uppercase tracking-tight leading-tight pr-6">
                      {match.match}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <Calendar size={12} className="text-[#55DEE8]" /> {match.time}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <MapPin size={12} className="text-[#55DEE8]" /> {match.venue}
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] font-black text-[#55DEE8] uppercase tracking-[0.2em]">
                          Role: {match.role}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-[#55DEE8] animate-pulse" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20 py-20">
                  <Zap size={48} className="text-gray-600" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    No upcoming assignments
                  </span>
                </div>
              )}
            </div>
            <button className="mt-10 w-full h-14 border border-white/10 hover:border-[#55DEE8]/50 hover:bg-[#55DEE8]/5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all text-gray-400 hover:text-white">
              Review Protocols
            </button>
          </div>
        </div>

        {/* Profile & Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-6 md:mt-8">
          
          {/* Performance Analytics */}
          <div className="lg:col-span-2 p-6 md:p-10 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 transition-all hover:border-[#55DEE8]/20 group">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-8">
              Performance Analytics
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  <span>Decision Accuracy</span>
                  <span className="text-[#55DEE8]">{profileData.performance.accuracy}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#55DEE8] h-full rounded-full transition-all duration-1000" style={{ width: \`\${profileData.performance.accuracy}%\` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  <span>Pressure Handling</span>
                  <span className="text-[#55DEE8]">{profileData.performance.pressureHandling}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#55DEE8] h-full rounded-full transition-all duration-1000" style={{ width: \`\${profileData.performance.pressureHandling}%\` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                  <span>Player Communication</span>
                  <span className="text-[#55DEE8]">{profileData.performance.communication}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="bg-[#55DEE8] h-full rounded-full transition-all duration-1000" style={{ width: \`\${profileData.performance.communication}%\` }}></div>
                </div>
              </div>
            </div>
            
            {/* Bio */}
            <div className="mt-10 pt-8 border-t border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">About Me</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">
                {profileData.bio}
              </p>
            </div>
          </div>

          {/* Right Column: Licenses & Compliance */}
          <div className="space-y-6 md:space-y-8">
            {/* Licenses */}
            <div className="p-8 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 hover:border-[#55DEE8]/20 transition-all group">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-6">
                Licenses
              </h2>
              <div className="space-y-4">
                {profileData.certifications.map((cert, idx) => (
                  <div key={idx} className="p-4 bg-white/[0.02] rounded-[1.5rem] border border-white/5 relative overflow-hidden group/cert hover:bg-white/[0.05] transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#55DEE8] opacity-50 group-hover/cert:opacity-100 transition-opacity"></div>
                    <div className="flex justify-between items-start pl-2">
                      <h4 className="text-sm font-bold text-white tracking-tight uppercase">{cert.name}</h4>
                      <span className="px-2 py-0.5 bg-[#55DEE8]/10 text-[#55DEE8] text-[9px] font-black uppercase tracking-widest rounded border border-[#55DEE8]/20">
                        {cert.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest pl-2 mt-2">Issued: {cert.issueDate}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance */}
            <div className="p-8 bg-[#0A0A0A] rounded-[2.5rem] border border-white/5 hover:border-[#55DEE8]/20 transition-all group">
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-6">
                Compliance
              </h2>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="w-5 h-5 rounded-full bg-[#55DEE8]/10 text-[#55DEE8] flex items-center justify-center border border-[#55DEE8]/20">
                    <CheckCircle2 size={10} />
                  </div>
                  Identity Verified
                </li>
                <li className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="w-5 h-5 rounded-full bg-[#55DEE8]/10 text-[#55DEE8] flex items-center justify-center border border-[#55DEE8]/20">
                    <CheckCircle2 size={10} />
                  </div>
                  Police Check
                </li>
                <li className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                    !
                  </div>
                  Medical Cert (12 days)
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
\`;

fs.writeFileSync(filePath, fullContent, 'utf8');
console.log('Successfully wrote the entire file.');
