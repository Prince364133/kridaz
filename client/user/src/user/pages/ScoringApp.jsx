import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Settings, 
  History, 
  Users, 
  Circle, 
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import useCricketScoring from '@hooks/shared/useCricketScoring';

const ScoringApp = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { matchData, loading, error, recordBall, startInnings, completeMatch } = useCricketScoring(matchId);
  const [activeTab, setActiveTab] = useState('score'); // 'score', 'stats', 'history'
  const [isFinishing, setIsFinishing] = useState(false);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">Syncing Match Data</p>
    </div>
  );

  if (error && !matchData) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
      <AlertCircle size={48} className="text-red-500 mb-4" />
      <h2 className="text-xl font-black uppercase mb-2">Sync Error</h2>
      <p className="text-gray-400 text-sm mb-6">Unable to connect to scoring server. Check your connection.</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-primary text-black font-black rounded-xl uppercase text-xs"
      >
        Retry Connection
      </button>
    </div>
  );

  const handleFinishMatch = async () => {
    if (!window.confirm("Are you sure you want to finish the match? This will aggregate all stats.")) return;
    setIsFinishing(true);
    const result = await completeMatch();
    if (result.success) {
      toast.success("Match completed successfully!");
      
      // Process earned badges
      if (result.data?.earnedBadges && result.data.earnedBadges.length > 0) {
        result.data.earnedBadges.forEach(entry => {
          entry.badges.forEach(badge => {
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-[#0A0A0A] shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-[#84CC16]/50 p-4 border border-[#84CC16]/20`}>
                <div className="flex-1 w-0 p-2">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-12 h-12 bg-[#84CC16]/10 rounded-xl flex items-center justify-center border border-[#84CC16]/20">
                        <Zap className="text-[#84CC16]" size={20} />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-xs font-black text-[#84CC16] uppercase tracking-[0.2em] mb-1">Badge Earned!</p>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">
                        {entry.userName} unlocked <span className="text-[#84CC16]">{badge.name}</span>
                      </p>
                      <p className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-white/5">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                  >
                    Close
                  </button>
                </div>
              </div>
            ), { duration: 6000, position: 'top-center' });
          });
        });
      }

      setTimeout(() => {
        navigate(`/analytics/${matchId}`);
      }, 2000);
    } else {
      toast.error(result.error || "Failed to complete match");
    }
    setIsFinishing(false);
  };

  const currentInnings = matchData?.innings?.[matchData.innings.length - 1];
  const battingTeam = currentInnings?.team === 'TeamA' ? matchData?.hostedGameId?.teams?.teamA : matchData?.hostedGameId?.teams?.teamB;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans select-none">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h1 className="text-xs font-black uppercase tracking-[0.15em] text-gray-500">Live Scoring</h1>
          <p className="text-sm font-bold text-white truncate max-w-[150px]">
            {matchData?.hostedGameId?.teams?.teamA?.name} vs {matchData?.hostedGameId?.teams?.teamB?.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleFinishMatch}
            disabled={isFinishing}
            className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
          >
            {isFinishing ? '...' : 'Finish'}
          </button>
          <button className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Score Overview Board */}
      <section className="p-4 pt-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#111] to-[#050505] rounded-[2rem] border border-white/10 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Zap size={120} />
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20 mb-4">
              {currentInnings?.team ? `1st Innings: ${battingTeam?.name}` : 'Toss Pending'}
            </span>
            
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black tracking-tighter">
                {currentInnings?.score || 0}
              </span>
              <span className="text-3xl font-bold text-gray-500">/</span>
              <span className="text-4xl font-bold text-gray-400">
                {currentInnings?.wickets || 0}
              </span>
            </div>
            
            <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">
              Overs {currentInnings?.overs || 0}.{currentInnings?.ballsInCurrentOver || 0}
            </p>

            <div className="grid grid-cols-3 gap-8 w-full pt-6 border-t border-white/5">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">CRR</p>
                <p className="text-sm font-bold text-white">0.00</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Extras</p>
                <p className="text-sm font-bold text-white">{currentInnings?.extras?.total || 0}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Target</p>
                <p className="text-sm font-bold text-white">-</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pb-32">
        {!currentInnings ? (
          <div className="h-full flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Circle size={40} className="text-primary" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black uppercase mb-2">Start Match</h3>
              <p className="text-gray-500 text-xs px-12 mb-8">Initialize the match by selecting the team batting first.</p>
              <div className="grid grid-cols-2 gap-4 w-full px-4">
                <button 
                  onClick={() => startInnings('TeamA')}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] hover:bg-white/10 transition-all"
                >
                  {matchData?.hostedGameId?.teams?.teamA?.name}
                </button>
                <button 
                  onClick={() => startInnings('TeamB')}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] hover:bg-white/10 transition-all"
                >
                  {matchData?.hostedGameId?.teams?.teamB?.name}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-slide-up">
            {/* Current Batsmen/Bowler */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-primary uppercase mb-2">Striker</p>
                <p className="text-sm font-bold truncate">Select Player</p>
                <p className="text-lg font-black mt-1">0 <span className="text-xs text-gray-500">(0)</span></p>
              </div>
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Non-Striker</p>
                <p className="text-sm font-bold truncate">Select Player</p>
                <p className="text-lg font-black mt-1">0 <span className="text-xs text-gray-500">(0)</span></p>
              </div>
            </div>

            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Bowler</p>
                <p className="text-sm font-bold">Select Bowler</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">0-0 <span className="text-xs text-gray-500">(0.0)</span></p>
              </div>
            </div>

            {/* This Over Timeline */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">This Over</h3>
                <span className="text-[10px] font-bold text-gray-600">6 Balls remaining</span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="flex-1 aspect-square rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-600">
                    -
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Scoring Actions Bar (Floating Mobile Menu Style) */}
      {currentInnings && (
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent backdrop-blur-md">
          <div className="max-w-md mx-auto space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => recordBall({ runs: 0 })} className="h-14 bg-white/10 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">0</button>
              <button onClick={() => recordBall({ runs: 1 })} className="h-14 bg-white/10 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">1</button>
              <button onClick={() => recordBall({ runs: 2 })} className="h-14 bg-white/10 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">2</button>
              <button onClick={() => recordBall({ runs: 3 })} className="h-14 bg-white/10 rounded-2xl font-black text-lg hover:bg-white/20 transition-all">3</button>
              <button onClick={() => recordBall({ runs: 4 })} className="h-14 bg-primary text-black rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(132,204,22,0.3)]">4</button>
              <button onClick={() => recordBall({ runs: 6 })} className="h-14 bg-primary text-black rounded-2xl font-black text-lg shadow-[0_0_20px_rgba(132,204,22,0.3)]">6</button>
              <button onClick={() => recordBall({ type: 'wide' })} className="h-14 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase text-gray-400">WD</button>
              <button onClick={() => recordBall({ type: 'noball' })} className="h-14 bg-white/5 border border-white/10 rounded-2xl font-black text-xs uppercase text-gray-400">NB</button>
            </div>
            
            {/* Out / Undo */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button className="h-14 bg-red-600/20 border border-red-500/30 rounded-2xl font-black uppercase text-xs tracking-widest text-red-500 flex items-center justify-center gap-2">
                OUT
              </button>
              <button className="h-14 bg-white/5 rounded-2xl font-black uppercase text-xs tracking-widest text-gray-400 flex items-center justify-center gap-2">
                UNDO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Bottom Desktop / Top Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-white/5 flex items-center justify-around px-6 md:hidden z-30">
        <button onClick={() => setActiveTab('score')} className={`p-2 ${activeTab === 'score' ? 'text-primary' : 'text-gray-500'}`}>
          <Circle size={20} fill={activeTab === 'score' ? 'currentColor' : 'none'} />
        </button>
        <button onClick={() => setActiveTab('stats')} className={`p-2 ${activeTab === 'stats' ? 'text-primary' : 'text-gray-500'}`}>
          <Users size={20} />
        </button>
        <button onClick={() => setActiveTab('history')} className={`p-2 ${activeTab === 'history' ? 'text-primary' : 'text-gray-500'}`}>
          <History size={20} />
        </button>
      </nav>
    </div>
  );
};

export default ScoringApp;
