import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, History, Users, Circle, Zap, CheckCircle2, AlertCircle, Filter, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useCricketScoring from '@hooks/shared/useCricketScoring';
import BallByBallHistory from '../../components/shared/BallByBallHistory';
import InningsSetupModal from '../components/scoring/InningsSetupModal';
import WicketModal from '../components/scoring/WicketModal';
import ExtraRunsModal from '../components/scoring/ExtraRunsModal';

/* ─── Helpers ─── */
const ballColor = (ball) => {
  if (ball.isWicket) return 'bg-red-600 text-white';
  if (ball.isExtra) return 'bg-yellow-500 text-black';
  if (ball.runs === 6) return 'bg-primary text-black';
  if (ball.runs === 4) return 'bg-green-500 text-black';
  if (ball.runs === 0) return 'bg-white/10 text-gray-400';
  return 'bg-white/20 text-white';
};
const ballLabel = (ball) => {
  if (ball.isWicket) return 'W';
  if (ball.extraType === 'WIDE') return 'Wd';
  if (ball.extraType === 'NO_BALL') return 'Nb';
  return String(ball.runs ?? '-');
};
const fmt = (n) => (n ?? 0);

/* ─── Members Tab ─── */
function MembersTab({ matchData }) {
  const [teamTab, setTeamTab] = useState('teamA');
  const game = matchData?.hostedGameId;
  const teamA = game?.teams?.teamA;
  const teamB = game?.teams?.teamB;
  const activeTeam = teamTab === 'teamA' ? teamA : teamB;

  const getBattingStats = (userId) =>
    matchData?.battingStats?.find(s => s.user?._id === userId || s.user === userId);
  const getBowlingStats = (userId) =>
    matchData?.bowlingStats?.find(s => s.user?._id === userId || s.user === userId);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
        {[['teamA', teamA?.name || 'Team A'], ['teamB', teamB?.name || 'Team B']].map(([key, label]) => (
          <button key={key} onClick={() => setTeamTab(key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${teamTab === key ? 'bg-primary text-black' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTeam?.slots?.length > 0 ? (
        <div className="space-y-2">
          {activeTeam.slots.map((slot, i) => {
            const uid = slot.user?._id || slot.user;
            const bat = getBattingStats(uid);
            const bowl = getBowlingStats(uid);
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {slot.user?.profilePicture
                    ? <img src={slot.user.profilePicture} className="w-full h-full object-cover" alt="" />
                    : <User size={16} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase truncate">{slot.user?.name || `Player ${i + 1}`}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{slot.role}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {bat && <p className="text-[10px] text-primary font-bold">{bat.runs}({bat.balls}) <span className="text-gray-600">BAT</span></p>}
                  {bowl && <p className="text-[10px] text-blue-400 font-bold">{bowl.wickets}/{bowl.runs} <span className="text-gray-600">BWL</span></p>}
                  {!bat && !bowl && <p className="text-[10px] text-gray-600">No stats yet</p>}
                </div>
                {slot.status === 'JOINED' && <CheckCircle2 size={14} className="text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center">
          <Users size={32} className="mx-auto mb-3 text-gray-700" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No players joined yet</p>
        </div>
      )}
    </div>
  );
}

/* ─── History Tab Wrapper ─── */
function HistoryTab({ matchData }) {
  return <BallByBallHistory matchData={matchData} />;
}

const ScoringApp = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scoring');
  const [showSettings, setShowSettings] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [liveUrls, setLiveUrls] = useState(null);

  const {
    matchData,
    loading,
    error,
    recordBall,
    setPlayers,
    undoBall,
    completeMatch,
    refresh
  } = useCricketScoring(matchId);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [extraModal, setExtraModal] = useState(null); // null | 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE'

  // ── Score computation ────────────────────────────────────────────────────────
  const score = (() => {
    const innings = matchData?.innings || [];
    const current = innings[matchData?.currentInningsIndex ?? innings.length - 1];
    if (!current) return { totalRuns: 0, totalWickets: 0, overs: 0, balls: 0, crr: '0.00' };
    const totalRuns = current.totalRuns ?? 0;
    const totalWickets = current.totalWickets ?? 0;
    const totalBalls = current.totalBalls ?? 0;
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    const crr = totalBalls > 0 ? ((totalRuns / totalBalls) * 6).toFixed(2) : '0.00';
    return { totalRuns, totalWickets, overs, balls, crr };
  })();

  // ── Player slot helpers ──────────────────────────────────────────────────────
  const getTeamSlots = (teamKey) => {
    const game = matchData?.hostedGameId;
    const team = game?.teams?.[teamKey];
    return (team?.slots || []).map(s => ({
      userId: s.user?._id || s.user,
      name: s.user?.name || s.customPlayer?.name || 'Player',
    })).filter(p => p.userId);
  };

  const currentInnings = matchData?.innings?.[matchData?.currentInningsIndex ?? 0];
  const battingTeamKey = currentInnings?.battingTeam || 'teamA';
  const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
  const battingSlots = getTeamSlots(battingTeamKey);
  const bowlingSlots = getTeamSlots(bowlingTeamKey);

  // Active player lookups from scoring doc
  const strikerStats  = matchData?.battingStats?.find(b => b.user?._id === matchData?.currentStriker || b.user === matchData?.currentStriker);
  const nonStrikerStats = matchData?.battingStats?.find(b => b.user?._id === matchData?.currentNonStriker || b.user === matchData?.currentNonStriker);
  const bowlerStats   = matchData?.bowlingStats?.find(b => b.user?._id === matchData?.currentBowler || b.user === matchData?.currentBowler);
  const strikerSlot   = battingSlots.find(p => p.userId === matchData?.currentStriker?.toString?.() || p.userId === matchData?.currentStriker);
  const nonStrikerSlot= battingSlots.find(p => p.userId === matchData?.currentNonStriker?.toString?.() || p.userId === matchData?.currentNonStriker);
  const bowlerSlot    = bowlingSlots.find(p => p.userId === matchData?.currentBowler?.toString?.() || p.userId === matchData?.currentBowler);

  // Remaining batsmen (haven't batted yet — not in battingStats at all or still NOT_OUT)
  const outBatterIds = new Set((matchData?.battingStats || []).filter(b => b.outStatus !== 'NOT_OUT').map(b => b.user?.toString?.() || b.user));
  const remainingBatters = battingSlots.filter(p =>
    p.userId !== matchData?.currentStriker?.toString?.() &&
    p.userId !== matchData?.currentNonStriker?.toString?.() &&
    !outBatterIds.has(p.userId)
  );

  // Auto-show innings setup if scoring started but no striker set
  const needsInningsSetup = matchData?._id && matchData?.innings?.length > 0 && !matchData?.currentStriker;

  // Detect Innings completion (1st innings)
  const maxOvers = matchData?.matchId?.oversPerInnings || 20;
  const totalPlayersPerTeam = matchData?.matchId?.maxPlayers || 11;
  
  const isFirstInnings = matchData?.currentInningsIndex === 0;
  const isAllOut = currentInnings?.totalWickets >= (totalPlayersPerTeam - 1);
  const isOversDone = currentInnings?.totalBalls >= (maxOvers * 6);
  const isFirstInningsComplete = isFirstInnings && (isAllOut || isOversDone);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-black uppercase mb-2">Match Not Found</h2>
      <button onClick={() => navigate(-1)} className="text-primary text-xs font-bold uppercase tracking-widest">Go Back</button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return <MembersTab matchData={matchData} />;
      case 'history': return <HistoryTab matchData={matchData} />;
      default: return (
        <div className="space-y-6">
          {/* Innings setup prompt banner */}
          {needsInningsSetup && !isFirstInningsComplete && (
            <button
              onClick={() => setShowInningsSetup(true)}
              className="w-full py-4 bg-yellow-500/15 border border-yellow-500/40 rounded-3xl text-center text-yellow-400 text-xs font-black uppercase tracking-widest animate-pulse"
            >
              ⚡ Tap to select opening batsmen &amp; bowler
            </button>
          )}

          {/* Transition to 2nd Innings Banner */}
          {isFirstInningsComplete && (
            <div className="p-6 bg-red-600/10 border border-red-600/30 rounded-[32px] space-y-4 text-center">
              <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
                <Zap size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Innings Complete!</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                  Target: <span className="text-white">{(currentInnings?.totalRuns || 0) + 1}</span>
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:6001'}/api/scoring/next-innings`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ 
                        scoringId: matchData._id, 
                        battingTeamId: matchData.innings[0].battingTeam === "teamA" ? "teamB" : "teamA" 
                      })
                    });
                    const data = await response.json();
                    if (data.success) {
                      toast.success('2nd Innings Started!');
                      refresh();
                      setShowInningsSetup(true);
                    } else {
                      toast.error(data.message || 'Transition failed');
                    }
                  } catch (err) {
                    toast.error('Error transitioning innings');
                  }
                }}
                className="w-full py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-red-600/20"
              >
                Start 2nd Innings
              </button>
            </div>
          )}

          {/* Batter cards — reads from currentStriker/NonStriker */}
          <div className="grid grid-cols-2 gap-4">
            {/* Striker */}
            <div className="bg-white/[0.03] border border-primary/20 rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-[8px] text-primary font-black uppercase tracking-widest">On Strike ●</p>
                  <p className="text-[10px] font-black uppercase truncate">{strikerSlot?.name || 'Striker TBD'}</p>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black">{strikerStats?.runs ?? 0}</p>
                <p className="text-[10px] text-gray-500 font-bold">({strikerStats?.balls ?? 0}b)</p>
              </div>
            </div>
            {/* Non-Striker */}
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 space-y-3 opacity-60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <User size={14} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">Non-Striker</p>
                  <p className="text-[10px] font-black uppercase truncate">{nonStrikerSlot?.name || 'TBD'}</p>
                </div>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black">{nonStrikerStats?.runs ?? 0}</p>
                <p className="text-[10px] text-gray-500 font-bold">({nonStrikerStats?.balls ?? 0}b)</p>
              </div>
            </div>
          </div>

          {/* Bowler Card */}
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Zap size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-blue-400">Current Bowler</p>
                <p className="text-sm font-black uppercase">{bowlerSlot?.name || 'TBD'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{bowlerStats?.wickets ?? 0}-{bowlerStats?.runs ?? 0}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{bowlerStats?.overs ?? 0}.{bowlerStats?.balls ?? 0} Ovs</p>
            </div>
          </div>

          {/* Scoring Buttons */}
          <div className="space-y-3">
            {/* Row 1: 0–3 */}
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map(run => (
                <button key={run}
                  onClick={() => recordBall({ runs: run, extraType: 'NONE' })}
                  className="h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl font-black hover:bg-white/10 transition-all">
                  {run}
                </button>
              ))}
            </div>
            {/* Row 2: 4, 6, Wide, NB */}
            <div className="grid grid-cols-4 gap-3">
              {[4, 6].map(run => (
                <button key={run}
                  onClick={() => recordBall({ runs: run, isBoundary: true, extraType: 'NONE' })}
                  className="h-16 bg-primary text-black rounded-2xl flex items-center justify-center text-xl font-black hover:scale-[1.02] transition-all">
                  {run}
                </button>
              ))}
              <button onClick={() => setExtraModal('WIDE')}
                className="h-16 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest hover:bg-yellow-500/20 transition-all">
                WIDE
              </button>
              <button onClick={() => setExtraModal('NO_BALL')}
                className="h-16 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest hover:bg-orange-500/20 transition-all">
                NB
              </button>
            </div>
            {/* Row 3: Bye, LB */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setExtraModal('BYE')}
                className="h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
                BYE
              </button>
              <button onClick={() => setExtraModal('LEG_BYE')}
                className="h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest hover:bg-purple-500/20 transition-all">
                LEG BYE
              </button>
            </div>
            {/* Wicket */}
            <button onClick={() => setShowWicketModal(true)}
              className="w-full h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(220,38,38,0.2)] hover:bg-red-700 transition-colors">
              ⚡ WICKET
            </button>
          </div>
          {/* Recent Balls */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recent Balls</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {matchData?.timeline?.slice(-12).reverse().map((ball, i) => (
                <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${ballColor(ball)}`}>
                  {ballLabel(ball)}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter">{matchData?.hostedGameId?.name || 'Scoring App'}</h1>
              <p className="text-[8px] text-primary font-bold uppercase tracking-widest">LIVE • {matchData?.hostedGameId?.shortId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 rounded-md flex items-center gap-1.5 ${liveEnabled ? 'bg-primary/20 border border-primary/30' : 'bg-white/5'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${liveEnabled ? 'bg-primary animate-pulse' : 'bg-gray-600'}`} />
              <span className={`text-[8px] font-black uppercase tracking-widest ${liveEnabled ? 'text-primary' : 'text-gray-500'}`}>
                {liveEnabled ? 'BROADCASTING' : 'OFFLINE'}
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/5 rounded-full">
              <Settings size={20} className="text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Score Display */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 text-center space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Current Score</p>
          <div className="flex items-center justify-center gap-4">
            <h2 className="text-6xl font-black tracking-tighter italic">
              {score.totalRuns} <span className="text-primary text-4xl not-italic">/</span> {score.totalWickets}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-400">
             <span>{score.overs}.{score.balls} OVERS</span>
             <span className="w-1 h-1 rounded-full bg-white/20" />
             <span>CRR: {score.crr}</span>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl">
          {[
            { id: 'scoring', icon: Zap, label: 'Score' },
            { id: 'members', icon: Users, label: 'Members' },
            { id: 'history', icon: History, label: 'History' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-primary' : 'text-gray-500 hover:text-white'}`}
            >
              <tab.icon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {renderContent()}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
            <button 
              onClick={async () => {
                const result = await undoBall();
                if (result.success) toast.success('Last ball undone');
                else toast.error(result.error || 'Cannot undo');
              }}
              className="h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              ↩ Undo Last Ball
            </button>
            <button 
              onClick={() => completeMatch()}
              className="h-14 bg-[#84CC16]/20 border border-[#84CC16]/30 text-[#84CC16] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#84CC16] hover:text-black transition-all"
            >
              Finish Match
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal - Simplified for now */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm p-6 flex items-center justify-center">
          <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Scoring Settings</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div>
                    <p className="text-xs font-black uppercase">Enable Live Broadcast</p>
                    <p className="text-[10px] text-gray-500">Sync scores with OBS & Website</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (!liveEnabled) {
                        try {
                          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:6001'}/api/scoring/${matchId}/go-live`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                          });
                          const data = await response.json();
                          if (data.success) {
                            setLiveEnabled(true);
                            setLiveUrls(data.urls);
                            toast.success('Match is now LIVE!');
                          } else {
                            toast.error(data.message || 'Failed to go live');
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error('Error starting live broadcast');
                        }
                      } else {
                        try {
                          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:6001'}/api/scoring/${matchId}/end-live`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            }
                          });
                          const data = await response.json();
                          if (data.success) {
                            setLiveEnabled(false);
                            setLiveUrls(null);
                            toast.success('Broadcast Stopped');
                          } else {
                            toast.error(data.message || 'Failed to stop broadcast');
                          }
                        } catch (err) {
                          console.error(err);
                          toast.error('Error stopping live broadcast');
                        }
                      }
                    }}
                    className={`w-12 h-6 rounded-full relative transition-colors ${liveEnabled ? 'bg-primary' : 'bg-gray-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${liveEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {liveEnabled && (
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">YouTube Broadcast</p>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="YouTube Video ID (e.g. dQw4w9WgXcQ)"
                        defaultValue={matchData?.hostedGameId?.youtubeVideoId}
                        id="ytVideoId"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-primary outline-none"
                      />
                      <button 
                        onClick={async () => {
                          const vidId = document.getElementById('ytVideoId').value;
                          try {
                            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:6001'}/api/scoring/${matchId}/stream-config`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              },
                              body: JSON.stringify({ youtubeVideoId: vidId })
                            });
                            const data = await response.json();
                            if (data.success) {
                              toast.success('Broadcast Linked!');
                              refresh();
                            } else {
                              toast.error(data.message || 'Failed to link broadcast');
                            }
                          } catch (err) {
                            toast.error('Error linking broadcast');
                          }
                        }}
                        className="w-full py-2 bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest rounded-lg"
                      >
                        Link YouTube Video
                      </button>
                    </div>
                  </div>
                )}

                {liveEnabled && liveUrls && (
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest text-center">Broadcast Control Panel</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(liveUrls.obsOverlay);
                          toast.success('Overlay Link Copied!');
                        }}
                        className="w-full py-3 bg-black/40 rounded-xl text-[8px] font-black uppercase tracking-widest text-white border border-white/5 flex items-center justify-center gap-2"
                      >
                        <Shield size={12} className="text-primary" /> Copy OBS Overlay Link
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(liveUrls.publicScoreboard);
                          toast.success('Scoreboard Link Copied!');
                        }}
                        className="w-full py-3 bg-black/40 rounded-xl text-[8px] font-black uppercase tracking-widest text-white border border-white/5 flex items-center justify-center gap-2"
                      >
                        <Users size={12} className="text-primary" /> Copy Public Score Link
                      </button>
                    </div>
                  </div>
                )}

               <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/20">Save & Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 1 Modals ── */}

      {/* Innings Setup — auto-shown when no striker set */}
      {(showInningsSetup || needsInningsSetup) && (
        <InningsSetupModal
          battingTeamSlots={battingSlots}
          bowlingTeamSlots={bowlingSlots}
          inningsLabel={matchData?.currentInningsIndex === 0 ? '1st Innings' : '2nd Innings'}
          onConfirm={async (players) => {
            const result = await setPlayers(players);
            if (result.success) {
              toast.success('Players set! Scoring can begin.');
            } else {
              toast.error(result.error || 'Failed to set players');
            }
            setShowInningsSetup(false);
          }}
          onClose={() => setShowInningsSetup(false)}
        />
      )}

      {/* Wicket modal */}
      {showWicketModal && (
        <WicketModal
          fieldingTeamSlots={bowlingSlots}
          battingTeamSlots={remainingBatters}
          onConfirm={async ({ wicketType, fielderId, nextBatterId }) => {
            const result = await recordBall({
              runs: 0,
              isWicket: true,
              wicketType,
              fielderId,
              nextBatterId,
              extraType: 'NONE',
            });
            if (result.success) {
              toast.success(`Wicket! ${wicketType?.replace('_', ' ')}`);
              if (result.overComplete) toast('Over complete — select next bowler', { icon: '🏏' });
            } else {
              toast.error(result.error || 'Failed to record wicket');
            }
            setShowWicketModal(false);
          }}
          onClose={() => setShowWicketModal(false)}
        />
      )}

      {/* Extra runs modal (Wide / NB / Bye / LegBye) */}
      {extraModal && (
        <ExtraRunsModal
          extraType={extraModal}
          onConfirm={async (runs) => {
            const isWide = extraModal === 'WIDE';
            const isNoBall = extraModal === 'NO_BALL';
            // For Wide: total runs = runs (penalty auto-added server-side to innings via extras.wides)
            // We send the run count including the penalty (1 + runs off bat)
            const totalRuns = (isWide || isNoBall) ? runs + 1 : runs;
            const result = await recordBall({
              runs: totalRuns,
              isExtra: true,
              extraType: extraModal,
              isBoundary: false,
            });
            if (result.success) toast.success(`${extraModal.replace('_', ' ')} recorded`);
            else toast.error(result.error || 'Failed to record extra');
            setExtraModal(null);
          }}
          onClose={() => setExtraModal(null)}
        />
      )}
    </div>
  );
};

export default ScoringApp;
