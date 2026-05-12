import React from "react";
import {
  Video,
  Calendar,
  Star,
  DollarSign,
  MonitorPlay,
  MapPin,
  BarChart as BarChartIcon,
  CheckCircle2,
} from "lucide-react";
import StatCard from "../admin/Dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useStreamerDashboard from "@hooks/owner/useStreamerDashboard";
import DashboardSkeleton from "../owner/Dashboard/DashboardSkeleton";
import { useNavigate } from "react-router-dom";

export default function StreamerDashboard() {
  const { dashboardData, loading, error } = useStreamerDashboard();
  const navigate = useNavigate();

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-violet-500">System Offline</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-violet-500/50 text-violet-500 font-bold uppercase rounded-xl hover:bg-violet-500/10 transition-all"
        >
          Retry Link
        </button>
      </div>
    );
  }

  const {
    matchesStreamed = 0,
    upcomingStreams = 0,
    officialRating = 0,
    earnings = 0,
    matchEngagement = [],
    upcomingAssignments = [],
  } = dashboardData || {};

  return (
    <div className="h-full custom-scrollbar">
      <div className="p-4 md:p-10 space-y-6 md:space-y-12 animate-fade-in pt-2 pb-24 md:pb-12 max-w-[1600px] mx-auto">

        {/* Primary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="Matches Streamed" value={matchesStreamed} icon={Video} />
          <StatCard title="Upcoming Streams" value={upcomingStreams} icon={Calendar} />
          <StatCard title="Official Rating" value={officialRating} icon={Star} />
          <StatCard title="Earnings" value={earnings} icon={DollarSign} prefix="₹" />
        </div>

        {/* Streaming Center */}
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#111] to-[#050505] rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
            <MonitorPlay size={120} className="text-violet-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-2">
              Streaming Center
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">
              Official Match Broadcasting & Live Operations
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Active Match Streams */}
              <div
                className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-violet-500/30 transition-all group/app cursor-pointer"
                onClick={() => navigate("/streamer/matches")}
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 border border-violet-500/20 group-hover/app:bg-violet-500 group-hover/app:text-white transition-all text-violet-500">
                  <MonitorPlay size={24} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Live Broadcasts
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Manage active streams, configure keys, and monitor live match status.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-violet-500 uppercase tracking-widest">
                  Launch App <CheckCircle2 size={12} />
                </div>
              </div>

              {/* Match Assignments */}
              <div
                className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 hover:border-violet-500/30 transition-all group/app cursor-pointer"
                onClick={() => navigate("/streamer/schedule")}
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center mb-4 border border-violet-500/20 group-hover/app:bg-violet-500 group-hover/app:text-white transition-all text-violet-500">
                  <Calendar size={24} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Stream Schedule
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  View upcoming stream assignments and accept or decline requests.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-violet-500 uppercase tracking-widest">
                  View Schedule <CheckCircle2 size={12} />
                </div>
              </div>

              {/* Streaming Analytics */}
              <div className="p-6 bg-white/[0.01] rounded-3xl border border-white/5 opacity-40 cursor-not-allowed">
                <div className="w-12 h-12 bg-gray-500/10 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                  <BarChartIcon size={24} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-500 mb-2">
                  Stream Analytics
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
