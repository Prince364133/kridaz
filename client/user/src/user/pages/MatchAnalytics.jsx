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
    setIsCapturing(true);
    toast.loading("Generating your scorecard...", { id: 'share' });

    try {
      const { scoring, analytics: stats } = analytics || {};
      const innings0 = scoring?.innings?.[0] || {};
      const legalBalls = innings0.legalBalls ?? 0;
      const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
      const runRate = legalBalls > 0
        ? ((innings0.totalRuns / legalBalls) * 6).toFixed(2)
        : '0.00';
      const batters = scoring?.battingStats?.slice(0, 6) || [];

      // Canvas dimensions
      const W = 900;
      const rowH = 44;
      const headerH = 220;
      const statsH = 160;
      const titleH = 60;
      const battingH = batters.length > 0 ? 48 + batters.length * rowH : 0;
      const footerH = 60;
      const H = titleH + headerH + statsH + battingH + footerH + 80;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#080808';
      ctx.fillRect(0, 0, W, H);

      // Top accent bar
      ctx.fillStyle = '#CCFF00';
      ctx.fillRect(0, 0, W, 5);

      let y = 30;

      // Brand title
      ctx.fillStyle = '#CCFF00';
      ctx.font = 'bold 38px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KRIDAZ', W / 2, y + 38);
      ctx.fillStyle = '#555';
      ctx.font = '700 11px Arial, sans-serif';
      ctx.fillText('OFFICIAL MATCH SCORECARD', W / 2, y + 60);

      y += 90;

      // Stat tiles
      const tiles = [
        ['TOTAL RUNS', `${innings0.totalRuns ?? 0}/${innings0.totalWickets ?? 0}`],
        ['RUN RATE', runRate],
        ['OVERS', overs],
        ['EXTRAS', `${innings0.extras ?? 0}`],
      ];
      const tileW = (W - 80) / 4;
      const tileH = 100;
      const tileGap = 16;
      const tileStartX = 40;

      tiles.forEach(([label, value], i) => {
        const tx = tileStartX + i * (tileW + tileGap);
        // Tile background
        ctx.fillStyle = '#111111';
        roundRect(ctx, tx, y, tileW, tileH, 14);
        ctx.fill();
        // Tile border
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        roundRect(ctx, tx, y, tileW, tileH, 14);
        ctx.stroke();
        // Label
        ctx.fillStyle = '#666666';
        ctx.font = '700 9px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, tx + tileW / 2, y + 26);
        // Value
        ctx.fillStyle = '#CCFF00';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText(value, tx + tileW / 2, y + 72);
      });

      y += tileH + 32;

      // Batting section
      if (batters.length > 0) {
        // Section header
        ctx.fillStyle = '#111111';
        roundRect(ctx, 40, y, W - 80, battingH, 16);
        ctx.fill();
        ctx.strokeStyle = '#222222';
        ctx.lineWidth = 1;
        roundRect(ctx, 40, y, W - 80, battingH, 16);
        ctx.stroke();

        ctx.fillStyle = '#888888';
        ctx.font = '700 10px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('BATTING SCORECARD', 64, y + 28);

        // Column headers
        const cols = { name: 64, runs: W - 260, balls: W - 200, fours: W - 140, sixes: W - 80 };
        ctx.fillStyle = '#444';
        ctx.font = '700 9px Arial, sans-serif';
        ctx.fillText('BATTER', cols.name, y + 44);
        ctx.textAlign = 'center';
        ctx.fillText('R', cols.runs, y + 44);
        ctx.fillText('B', cols.balls, y + 44);
        ctx.fillText('4s', cols.fours, y + 44);
        ctx.fillText('6s', cols.sixes, y + 44);

        y += 48;

        batters.forEach((s, i) => {
          const ry = y + i * rowH;
          // Alternate row tint
          if (i % 2 === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.02)';
            ctx.fillRect(40, ry, W - 80, rowH);
          }
          // Batter name
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText((s.user?.name || '—').toUpperCase(), cols.name, ry + 26);
          // Stats
          ctx.fillStyle = '#CCFF00';
          ctx.font = 'bold 16px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(s.runs ?? 0, cols.runs, ry + 26);
          ctx.fillStyle = '#888';
          ctx.font = '13px Arial, sans-serif';
          ctx.fillText(s.balls ?? 0, cols.balls, ry + 26);
          ctx.fillText(s.fours ?? 0, cols.fours, ry + 26);
          ctx.fillText(s.sixes ?? 0, cols.sixes, ry + 26);
          // Divider
          ctx.strokeStyle = '#1a1a1a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(64, ry + rowH);
          ctx.lineTo(W - 64, ry + rowH);
          ctx.stroke();
        });

        y += batters.length * rowH + 24;
      } else {
        y += 16;
      }

      // Footer
      ctx.fillStyle = '#333333';
      ctx.font = '700 10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`kridaz.com  •  ${new Date().toLocaleDateString()}`, W / 2, y + 24);

      // Bottom accent
      ctx.fillStyle = '#CCFF00';
      ctx.fillRect(0, H - 4, W, 4);

      // Export
      const image = canvas.toDataURL('image/png');

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(image)).blob();
          const file = new File([blob], `kridaz-scorecard-${matchId}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: 'Kridaz Cricket Scorecard', text: 'Check out my match on Kridaz!', files: [file] });
            toast.success("Ready to share!", { id: 'share' });
            return;
          }
        } catch (_) { /* fall through to download */ }
      }

      const link = document.createElement('a');
      link.href = image;
      link.download = `kridaz-scorecard-${matchId}.png`;
      link.click();
      toast.success("Scorecard downloaded!", { id: 'share' });

    } catch (err) {
      console.error("Share failed:", err);
      toast.error("Could not generate scorecard. Please try again.", { id: 'share' });
    } finally {
      setIsCapturing(false);
    }
  };

  // Helper: draw rounded rectangle path
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }



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
