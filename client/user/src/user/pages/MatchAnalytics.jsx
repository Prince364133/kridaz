import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  ArrowLeft, 
  Activity,
  Star,
  Award,
  Share2,
  Download
} from 'lucide-react';
import useCricketScoring from '@hooks/shared/useCricketScoring';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import BallByBallHistory from '../../components/shared/BallByBallHistory';

const MatchAnalytics = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { fetchAnalytics } = useCricketScoring(matchId);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = React.useRef(null);

  const handleShare = async () => {
    if (!captureRef.current) return;
    setIsCapturing(true);
    toast.loading("Generating your scorecard...", { id: 'share' });
    
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#000',
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800 // Consistent width for sharing
      });
      
      const image = canvas.toDataURL('image/png');
      
      if (navigator.share) {
        const blob = await (await fetch(image)).blob();
        const file = new File([blob], `kridaz-scorecard-${matchId}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'Kridaz Cricket Scorecard',
          text: 'Check out my match performance on Kridaz!',
          files: [file]
        });
        toast.success("Ready to share!", { id: 'share' });
      } else {
        const link = document.createElement('a');
        link.href = image;
        link.download = `kridaz-scorecard-${matchId}.png`;
        link.click();
        toast.success("Scorecard downloaded!", { id: 'share' });
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast.error("Failed to generate image", { id: 'share' });
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await fetchAnalytics();
      if (data.success) {
        setAnalytics(data);
      }
      setLoading(false);
    };
    loadAnalytics();
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-[#84CC16] border-t-transparent animate-spin mb-4" />
          <p className="text-gray-500 uppercase tracking-widest text-[10px] font-bold">Analyzing Match Data...</p>
        </div>
      </div>
    );
  }

  const { scoring, analytics: stats } = analytics || {};
  const mvp = stats?.mvp;

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-black uppercase tracking-tighter">Match Performance</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Post-Match Analytics</p>
          </div>
          <button 
            onClick={handleShare}
            disabled={isCapturing}
            className="p-3 bg-[#84CC16]/10 text-[#84CC16] border border-[#84CC16]/20 rounded-2xl hover:bg-[#84CC16] hover:text-black transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Share2 size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Share Card</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6" ref={captureRef}>
        {/* Branding for Capture */}
        {isCapturing && (
          <div className="text-center py-8 border-b border-white/5 mb-8">
            <h2 className="text-4xl font-black text-[#84CC16] tracking-tighter uppercase mb-2">Kridaz Performance</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Official Match Scorecard</p>
          </div>
        )}
        {/* MVP Card */}
        {mvp && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden bg-gradient-to-br from-[#84CC16] to-[#4D7C0F] rounded-[2.5rem] p-8"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden bg-black/20">
                  <img 
                    src={mvp.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mvp.name}`} 
                    alt={mvp.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white text-black p-2 rounded-full shadow-xl">
                  <Trophy size={16} />
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white mb-2">
                  Player of the Match
                </span>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-1">{mvp.name}</h2>
                <p className="text-white/80 font-bold uppercase tracking-widest text-xs">Dominated the field with {mvp.points} Performance Points</p>
              </div>

              <div className="flex gap-4">
                <div className="px-6 py-4 bg-black/10 backdrop-blur-md rounded-3xl border border-white/10 text-center">
                  <span className="block text-[10px] font-bold uppercase opacity-60">Points</span>
                  <span className="text-2xl font-black">{mvp.points}</span>
                </div>
              </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16" />
          </motion.div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex flex-col group hover:border-[#84CC16]/30 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Runs</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{scoring?.innings[0]?.totalRuns || 0}</span>
              <span className="text-sm font-bold text-gray-500">/ {scoring?.innings[0]?.totalWickets || 0}</span>
            </div>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex flex-col group hover:border-[#84CC16]/30 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Run Rate</span>
            <span className="text-4xl font-black text-[#84CC16]">{stats?.runRate || '0.00'}</span>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex flex-col group hover:border-[#84CC16]/30 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Fours</span>
            <span className="text-4xl font-black text-white">{stats?.totalFours || 0}</span>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-6 rounded-[2rem] flex flex-col group hover:border-[#84CC16]/30 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Sixes</span>
            <span className="text-4xl font-black text-white">{stats?.totalSixes || 0}</span>
          </div>
        </div>

        {/* Top Performers List */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
              <Award className="text-[#84CC16]" />
              Impact Leaders
            </h3>
          </div>
          <div className="grid gap-4">
            {stats?.topPerformers?.map((player, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-3xl group hover:bg-white/[0.04] transition-all"
              >
                <div className="text-xl font-black text-white/20 w-8">{idx + 1}</div>
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                  <img 
                    src={player.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.name}`} 
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold uppercase text-sm">{player.name}</h4>
                  <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: mvp?.points > 0 ? `${(player.points / mvp.points) * 100}%` : '0%' }}
                      className="h-full bg-[#84CC16]"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase">Points</span>
                  <span className="text-lg font-black text-[#84CC16]">{player.points}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Scorecard (Compact) */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 border-b border-white/5">
             <h3 className="text-xl font-black uppercase tracking-tighter">Innings Scorecard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <th className="px-8 py-4">Batter</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">R</th>
                  <th className="px-4 py-4 text-right">B</th>
                  <th className="px-4 py-4 text-right">4s</th>
                  <th className="px-4 py-4 text-right">6s</th>
                  <th className="px-8 py-4 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scoring?.battingStats?.map((s, i) => (
                  <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 font-bold text-sm uppercase">{s.user?.name}</td>
                    <td className="px-4 py-4 text-[10px] text-gray-500 font-bold uppercase">{s.outStatus || 'Not Out'}</td>
                    <td className="px-4 py-4 text-right font-black text-[#84CC16]">{s.runs}</td>
                    <td className="px-4 py-4 text-right text-gray-400 text-sm">{s.balls}</td>
                    <td className="px-4 py-4 text-right text-gray-400 text-sm">{s.fours}</td>
                    <td className="px-4 py-4 text-right text-gray-400 text-sm">{s.sixes}</td>
                    <td className="px-8 py-4 text-right font-bold text-sm">{s.strikeRate?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ball-by-Ball History Section */}
        <div className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8">
           <h3 className="text-xl font-black uppercase tracking-tighter mb-8">Ball-by-Ball Timeline</h3>
           <BallByBallHistory matchData={scoring} />
        </div>
      </div>
    </div>
  );
};

export default MatchAnalytics;
