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
  Youtube,
  Facebook,
  ExternalLink,
  PlusCircle,
  Users,
  Eye,
  Video as VideoIcon,
  Palette
} from "lucide-react";
import StatCard from "@features/admin/Dashboard/StatCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import useStreamerDashboard from "@hooks/owner/useStreamerDashboard";
import DashboardSkeleton from "@features/venue-owner/Dashboard/DashboardSkeleton";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function StreamerDashboard() {
  const { dashboardData, loading, error } = useStreamerDashboard();
  const navigate = useNavigate();
  const { role, user, token } = useSelector((state) => state.auth);

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] text-white text-center">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-xl uppercase tracking-wider text-violet-500">System Offline</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-8 py-3 border border-violet-500/50 text-violet-500 font-bold uppercase rounded-[8px] hover:bg-violet-500/10 transition-all"
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
    socialStats = { youtube: null, facebook: null }
  } = dashboardData || {};

  const handleConnectYoutube = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:6001";
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const authUrl = `${apiBase}/youtube/oauth/start?token=${token}`;
    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(authUrl, 'YouTube Auth', `width=${width},height=${height},top=${top},left=${left}`);
  };

  const handleConnectFacebook = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:6001";
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const authUrl = `${apiBase}/facebook/oauth/start?token=${token}`;
    const width = 600, height = 700;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    window.open(authUrl, 'Facebook Auth', `width=${width},height=${height},top=${top},left=${left}`);
  };

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
        <div className="p-8 md:p-10 bg-gradient-to-br from-[#111] to-[#050505] rounded-[8px] border border-white/10 relative overflow-hidden group">
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
                className="p-6 bg-white/[0.03] rounded-[8px] border border-white/5 hover:border-violet-500/30 transition-all group/app cursor-pointer"
                onClick={() => navigate("/streamer/matches")}
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-[8px] flex items-center justify-center mb-4 border border-violet-500/20 group-hover/app:bg-violet-500 group-hover/app:text-white transition-all text-violet-500">
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
                className="p-6 bg-white/[0.03] rounded-[8px] border border-white/5 hover:border-violet-500/30 transition-all group/app cursor-pointer"
                onClick={() => navigate("/streamer/schedule")}
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-[8px] flex items-center justify-center mb-4 border border-violet-500/20 group-hover/app:bg-violet-500 group-hover/app:text-white transition-all text-violet-500">
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

              {/* Ticker Theme Selection */}
              <div
                className="p-6 bg-white/[0.03] rounded-[8px] border border-white/5 hover:border-violet-500/30 transition-all group/app cursor-pointer"
                onClick={() => navigate("/streamer/ticker-gallery")}
              >
                <div className="w-12 h-12 bg-violet-500/10 rounded-[8px] flex items-center justify-center mb-4 border border-violet-500/20 group-hover/app:bg-violet-500 group-hover/app:text-white transition-all text-violet-500">
                  <Palette size={24} />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                  Ticker Studio
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Select and preview broadcast ticker themes for your live streams.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-black text-violet-500 uppercase tracking-widest">
                  Browse Gallery <CheckCircle2 size={12} />
                </div>
              </div>

              {/* Streaming Analytics */}
              <div className="p-6 bg-white/[0.01] rounded-[8px] border border-white/5 opacity-40 cursor-not-allowed">
                <div className="w-12 h-12 bg-gray-500/10 rounded-[8px] flex items-center justify-center mb-4 border border-white/5">
                  <BarChartIcon size={24} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-gray-500 mb-2">
                  Stream Analytics
                </h3>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* YouTube Card */}
          <div className="p-8 bg-gradient-to-br from-[#111] to-[#050505] rounded-[8px] border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Youtube size={100} className="text-red-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-[8px] flex items-center justify-center border border-red-500/20 text-red-500">
                    <Youtube size={20} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">YouTube Channel</h3>
                </div>
                {socialStats?.youtube ? (
                  <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full">Connected</span>
                ) : (
                  <button 
                    onClick={handleConnectYoutube}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase rounded-[8px] transition-all flex items-center gap-2"
                  >
                    <PlusCircle size={14} /> Connect
                  </button>
                )}
              </div>

              {socialStats?.youtube ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-[8px] border border-white/5">
                    <img 
                      src={socialStats.youtube.thumbnail || "https://via.placeholder.com/150"} 
                      alt="Channel" 
                      className="w-12 h-12 rounded-full border-2 border-red-500/30"
                    />
                    <div>
                      <h4 className="text-white font-bold">{socialStats.youtube.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black">Official Connected Channel</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <div className="text-violet-500 mb-1 flex justify-center"><Users size={16} /></div>
                      <div className="text-white font-black text-lg">{socialStats.youtube.subscribers?.toLocaleString() || 0}</div>
                      <div className="text-[8px] text-gray-500 uppercase font-black">Subscribers</div>
                    </div>
                    <div className="text-center p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <div className="text-violet-500 mb-1 flex justify-center"><Eye size={16} /></div>
                      <div className="text-white font-black text-lg">{socialStats.youtube.views?.toLocaleString() || 0}</div>
                      <div className="text-[8px] text-gray-500 uppercase font-black">Total Views</div>
                    </div>
                    <div className="text-center p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <div className="text-violet-500 mb-1 flex justify-center"><VideoIcon size={16} /></div>
                      <div className="text-white font-black text-lg">{socialStats.youtube.videos || 0}</div>
                      <div className="text-[8px] text-gray-500 uppercase font-black">Videos</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[8px]">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">No Channel Linked</p>
                </div>
              )}
            </div>
          </div>

          {/* Facebook Card */}
          <div className="p-8 bg-gradient-to-br from-[#111] to-[#050505] rounded-[8px] border border-white/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Facebook size={100} className="text-blue-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-[8px] flex items-center justify-center border border-blue-500/20 text-blue-500">
                    <Facebook size={20} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Facebook Page</h3>
                </div>
                {socialStats?.facebook ? (
                  <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-full">Connected</span>
                ) : (
                  <button 
                    onClick={handleConnectFacebook}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-[8px] transition-all flex items-center gap-2"
                  >
                    <PlusCircle size={14} /> Connect
                  </button>
                )}
              </div>

              {socialStats?.facebook ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-[8px] border border-white/5">
                    <img 
                      src={socialStats.facebook.thumbnail || "https://via.placeholder.com/150"} 
                      alt="Page" 
                      className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                    />
                    <div>
                      <h4 className="text-white font-bold">{socialStats.facebook.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase font-black">Official Connected Page</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <div className="text-violet-500 mb-1 flex justify-center"><Users size={16} /></div>
                      <div className="text-white font-black text-lg">{socialStats.facebook.followers?.toLocaleString() || 0}</div>
                      <div className="text-[8px] text-gray-500 uppercase font-black">Followers</div>
                    </div>
                    <div className="text-center p-3 bg-white/[0.02] rounded-[8px] border border-white/5">
                      <div className="text-violet-500 mb-1 flex justify-center"><Star size={16} /></div>
                      <div className="text-white font-black text-lg">{socialStats.facebook.likes?.toLocaleString() || 0}</div>
                      <div className="text-[8px] text-gray-500 uppercase font-black">Page Likes</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[8px]">
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">No Page Linked</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
