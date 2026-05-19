import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, History, Users, Circle, Zap, CheckCircle2, AlertCircle, Filter, Shield, User, PlayCircle, Undo2, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import useCricketScoring from '../hooks/useCricketScoring';
import BallByBallHistory from '../components/BallByBallHistory';
import InningsSetupModal from '../components/InningsSetupModal';
import WicketModal from '../components/WicketModal';
import ExtraRunsModal from '../components/ExtraRunsModal';

/**
 * ScoringApp — The primary match scoring console.
 * Fully rebranded for the Scorer Portal with Teal Green (#00C187) and Inter font.
 */

const THEME_COLOR = '#00C187';

/* ─── Helpers ─── */
const ballColor = (ball) => {
  if (ball.isWicket) return 'bg-red-500/20 text-red-500 border border-red-500/30';
  if (ball.isExtra) return 'bg-[#00C187]/20 text-[#00C187] border border-[#00C187]/30';
  if (ball.runs === 6) return 'bg-[#00C187] text-black shadow-[0_0_15px_rgba(0,193,135,0.4)]';
  if (ball.runs === 4) return 'bg-[#00C187]/80 text-black';
  if (ball.runs === 0) return 'bg-white/5 text-neutral-600 border border-white/5';
  return 'bg-white/10 text-white border border-white/10';
};

const ballLabel = (ball) => {
  if (ball.isWicket) return 'W';
  if (ball.extraType === 'WIDE') return 'Wd';
  if (ball.extraType === 'NO_BALL') return 'Nb';
  return String(ball.runs ?? '-');
};

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
    <div className="space-y-4 pb-4 font-inter">
      <div className="flex gap-2 bg-white/5 rounded-2xl p-1.5 border border-white/5">
        {[['teamA', teamA?.name || 'Team A'], ['teamB', teamB?.name || 'Team B']].map(([key, label]) => (
          <button key={key} onClick={() => setTeamTab(key)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${teamTab === key ? 'bg-[#00C187] text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTeam?.slots?.length > 0 ? (
        <div className="space-y-2.5">
          {activeTeam.slots.map((slot, i) => {
            const uid = slot.user?._id || slot.user;
            const bat = getBattingStats(uid);
            const bowl = getBowlingStats(uid);
            return (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="w-11 h-11 rounded-2xl bg-[#00C187]/10 border border-[#00C187]/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {slot.user?.profilePicture
                    ? <img src={slot.user.profilePicture} className="w-full h-full object-cover" alt="" />
                    : <User size={18} style={{ color: THEME_COLOR }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black uppercase tracking-tight text-white truncate">{slot.user?.name || `Player ${i + 1}`}</p>
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">{slot.role}</p>
                </div>
                <div className="text-right shrink-0 space-y-1">
                  {bat && <p className="text-[11px] font-black" style={{ color: THEME_COLOR }}>{bat.runs}({bat.balls}) <span className="text-[8px] text-neutral-600">BAT</span></p>}
                  {bowl && <p className="text-[11px] text-blue-400 font-black">{bowl.wickets}/{bowl.runs} <span className="text-[8px] text-neutral-600">BWL</span></p>}
                  {!bat && !bowl && <p className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">Inactive</p>}
                </div>
                {slot.status === 'JOINED' && <CheckCircle2 size={16} style={{ color: THEME_COLOR }} className="shrink-0" />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
          <Users size={40} className="mx-auto mb-4 text-neutral-800" />
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Grid is empty</p>
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
  const { role } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('scoring');
  const [showSettings, setShowSettings] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [liveUrls, setLiveUrls] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);

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

  React.useEffect(() => {
    const hostedGame = matchData?.hostedGameId;
    if (hostedGame?.isLive && !liveEnabled) {
      setLiveEnabled(true);
      const appBase = import.meta.env.VITE_APP_URL || window.location.origin;
      setLiveUrls({
        obsOverlay: `${appBase}/live-overlay/${matchId}?token=${hostedGame.overlayToken || ''}`,
        publicScoreboard: `${appBase}/live-score/${matchId}`,
      });
    } else if (!hostedGame?.isLive && liveEnabled) {
      setLiveEnabled(false);
      setLiveUrls(null);
    }
  }, [matchData?.hostedGameId?.isLive, liveEnabled, matchId]);

  React.useEffect(() => {
    const handleMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'STREAM_KEYS_READY' && e.data?.matchId === matchId) {
        toast.success("Stream Keys Ready! Please start broadcasting in OBS.");
        refresh();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [matchId, refresh]);

  const [showInningsSetup, setShowInningsSetup] = useState(false);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [extraModal, setExtraModal] = useState(null);

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

  const strikerStats  = matchData?.battingStats?.find(b => b.user?._id === matchData?.currentStriker || b.user === matchData?.currentStriker);
  const nonStrikerStats = matchData?.battingStats?.find(b => b.user?._id === matchData?.currentNonStriker || b.user === matchData?.currentNonStriker);
  const bowlerStats   = matchData?.bowlingStats?.find(b => b.user?._id === matchData?.currentBowler || b.user === matchData?.currentBowler);
  const strikerSlot   = battingSlots.find(p => p.userId === matchData?.currentStriker?.toString?.() || p.userId === matchData?.currentStriker);
  const nonStrikerSlot= battingSlots.find(p => p.userId === matchData?.currentNonStriker?.toString?.() || p.userId === matchData?.currentNonStriker);
  const bowlerSlot    = bowlingSlots.find(p => p.userId === matchData?.currentBowler?.toString?.() || p.userId === matchData?.currentBowler);

  const outBatterIds = new Set((matchData?.battingStats || []).filter(b => b.outStatus !== 'NOT_OUT').map(b => b.user?.toString?.() || b.user));
  const remainingBatters = battingSlots.filter(p =>
    p.userId !== matchData?.currentStriker?.toString?.() &&
    p.userId !== matchData?.currentNonStriker?.toString?.() &&
    !outBatterIds.has(p.userId)
  );

  const needsInningsSetup = matchData?._id && matchData?.innings?.length > 0 && !matchData?.currentStriker;
  const isFirstInnings = matchData?.currentInningsIndex === 0;
  const isFirstInningsComplete = isFirstInnings && (currentInnings?.totalWickets >= 10 || currentInnings?.totalBalls >= (matchData?.matchId?.oversPerInnings * 6));

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="w-10 h-10 border-4 border-[#00C187]/20 border-t-[#00C187] rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-inter">
      <AlertCircle style={{ color: THEME_COLOR }} className="mb-6" size={56} />
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Sync Interrupted</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#00C187] border border-[#00C187]/20">Establish New Link</button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return <MembersTab matchData={matchData} />;
      case 'history': return <HistoryTab matchData={matchData} />;
      default: return (
        <div className="space-y-6 font-inter">
          {needsInningsSetup && !isFirstInningsComplete && (
            <button
              onClick={() => setShowInningsSetup(true)}
              className="w-full py-5 bg-[#00C187]/10 border border-[#00C187]/30 rounded-[2rem] text-center text-[#00C187] text-[11px] font-black uppercase tracking-[0.2em] animate-pulse shadow-xl"
            >
              ⚡ Setup Next Pair & Bowler
            </button>
          )}

          {isFirstInningsComplete && (
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
              <div className="w-16 h-16 bg-[#00C187]/10 border border-[#00C187]/20 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
                <Trophy size={28} style={{ color: THEME_COLOR }} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Innings Break</h3>
                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-widest mt-2">
                  Target: <span style={{ color: THEME_COLOR }}>{(currentInnings?.totalRuns || 0) + 1}</span> runs
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
                      toast.success('2nd Innings Initiated!');
                      refresh();
                      setShowInningsSetup(true);
                    } else {
                      toast.error(data.message || 'Transition failed');
                    }
                  } catch (err) {
                    toast.error('Connection lost during transition');
                  }
                }}
                className="w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                style={{ backgroundColor: THEME_COLOR, color: '#000', boxShadow: `0 10px 30px ${THEME_COLOR}33` }}
              >
                Start 2nd Innings
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-[#00C187]/30 rounded-[2.5rem] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#00C187]/10 border border-[#00C187]/20 flex items-center justify-center shadow-inner">
                  <User size={16} style={{ color: THEME_COLOR }} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: THEME_COLOR }}>Striker ●</p>
                  <p className="text-[12px] font-black uppercase truncate text-white">{strikerSlot?.name || 'TBD'}</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4">
                <p className="text-4xl font-black text-white">{strikerStats?.runs ?? 0}</p>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest pb-1.5">{strikerStats?.balls ?? 0} balls</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 space-y-4 opacity-40 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <User size={16} className="text-neutral-500" />
                </div>
                <div>
                  <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em]">Off Strike</p>
                  <p className="text-[12px] font-black uppercase truncate text-white">{nonStrikerSlot?.name || 'TBD'}</p>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4">
                <p className="text-4xl font-black text-white">{nonStrikerStats?.runs ?? 0}</p>
                <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest pb-1.5">{nonStrikerStats?.balls ?? 0} balls</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#00C187]/15 to-transparent border border-[#00C187]/30 rounded-[2.5rem] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#00C187]/20 border border-[#00C187]/30 flex items-center justify-center shadow-lg">
                <Zap size={22} style={{ color: THEME_COLOR }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: THEME_COLOR }}>Active Bowler</p>
                <p className="text-[15px] font-black uppercase text-white mt-0.5">{bowlerSlot?.name || 'Wait for Bowl'}</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-3xl font-black text-white">{bowlerStats?.wickets ?? 0}<span className="text-[#00C187] text-xl mx-1">-</span>{bowlerStats?.runs ?? 0}</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1.5">{bowlerStats?.overs ?? 0}.{bowlerStats?.balls ?? 0} OVERS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3.5">
              {[0, 1, 2, 3].map(run => (
                <button key={run}
                  onClick={() => recordBall({ runs: run, extraType: 'NONE' })}
                  className="h-16 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-center text-2xl font-black text-white hover:bg-[#00C187]/10 hover:border-[#00C187]/40 transition-all transform active:scale-90 shadow-lg">
                  {run}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3.5">
              {[4, 6].map(run => (
                <button key={run}
                  onClick={() => recordBall({ runs: run, isBoundary: true, extraType: 'NONE' })}
                  className="h-16 rounded-3xl flex items-center justify-center text-2xl font-black text-black transform active:scale-95 shadow-xl transition-all"
                  style={{ backgroundColor: THEME_COLOR, boxShadow: `0 10px 25px ${THEME_COLOR}33` }}>
                  {run}
                </button>
              ))}
              <button onClick={() => setExtraModal('WIDE')}
                className="h-16 bg-white/[0.03] border border-white/5 text-[#00C187] rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-[#00C187]/10 transition-all border-[#00C187]/20">
                WIDE
              </button>
              <button onClick={() => setExtraModal('NO_BALL')}
                className="h-16 bg-white/[0.03] border border-white/5 text-[#00C187] rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-[#00C187]/10 transition-all border-[#00C187]/20">
                NB
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3.5">
              <button onClick={() => setExtraModal('BYE')}
                className="h-14 bg-white/[0.03] border border-white/5 text-neutral-400 rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                BYE
              </button>
              <button onClick={() => setExtraModal('LEG_BYE')}
                className="h-14 bg-white/[0.03] border border-white/5 text-neutral-400 rounded-3xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                LEG BYE
              </button>
            </div>
            <button onClick={() => setShowWicketModal(true)}
              className="w-full h-20 bg-red-600 text-white rounded-[2.5rem] flex items-center justify-center text-sm font-black uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(220,38,38,0.3)] hover:bg-red-700 transition-all transform active:scale-95">
              ⚡ DISMISSAL
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-2">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Timeline Snapshot</h3>
               <div className="flex gap-1">
                 {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-neutral-800" />)}
               </div>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 px-2">
              {matchData?.timeline?.slice(-12).reverse().map((ball, i) => (
                <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 transition-all transform hover:scale-110 ${ballColor(ball)}`}>
                  {ballLabel(ball)}
                </div>
              ))}
              {(!matchData?.timeline || matchData.timeline.length === 0) && (
                 <div className="py-2 text-[10px] font-black uppercase text-neutral-800 tracking-widest">Waiting for first delivery...</div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-[#00C187] selection:text-black font-inter">
      <Helmet>
        <title>Scoring App | Kridaz</title>
      </Helmet>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5 p-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-[15px] font-black uppercase tracking-tighter leading-tight text-white">{matchData?.hostedGameId?.name || 'Scorer Terminal'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: THEME_COLOR }}>Live Node</span>
                <span className="w-1 h-1 rounded-full bg-neutral-800" />
                <span className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">#{matchData?.hostedGameId?.shortId}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border transition-all ${liveEnabled ? 'bg-[#00C187]/10 border-[#00C187]/30 shadow-[0_0_15px_rgba(0,193,135,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${liveEnabled ? 'bg-[#00C187] animate-pulse' : 'bg-neutral-700'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${liveEnabled ? 'text-[#00C187]' : 'text-neutral-500'}`}>
                {liveEnabled ? 'ON AIR' : 'LOCAL'}
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#00C187]/30 transition-all">
              <Settings size={20} className="text-neutral-500 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-5 pb-32 space-y-8 animate-in fade-in duration-700">
        {/* Score Display */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 text-center space-y-4 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: THEME_COLOR, opacity: 0.1 }} />
          <p className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.5em]">Score Engine</p>
          <div className="flex items-center justify-center gap-6">
            <h2 className="text-7xl font-black tracking-tighter italic text-white flex items-center">
              {score.totalRuns} <span className="text-3xl not-italic mx-3 font-light opacity-20">/</span> <span style={{ color: THEME_COLOR }}>{score.totalWickets}</span>
            </h2>
          </div>
          <div className="flex items-center justify-center gap-5 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 bg-white/5 py-3 px-6 rounded-full w-fit mx-auto border border-white/5">
             <span className="text-white">{score.overs}.{score.balls} OVERS</span>
             <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
             <span style={{ color: THEME_COLOR }}>CRR: {score.crr}</span>
          </div>
          
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#00C187]/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[2rem] border border-white/5 shadow-inner">
          {[
            { id: 'scoring', icon: Zap, label: 'Control' },
            { id: 'members', icon: Users, label: 'Dossier' },
            { id: 'history', icon: History, label: 'Ledger' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[1.5rem] transition-all border ${activeTab === tab.id ? 'bg-white/10 text-[#00C187] border-[#00C187]/20 shadow-lg' : 'text-neutral-500 hover:text-white border-transparent'}`}
            >
              <tab.icon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {renderContent()}

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-[60]">
          <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
            <button 
              onClick={async () => {
                const result = await undoBall();
                if (result.success) toast.success('Reverted last ball');
                else toast.error(result.error || 'Undo limit reached');
              }}
              className="h-16 bg-white/5 border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-white transform active:scale-95 shadow-xl"
            >
              <Undo2 size={16} /> Undo Ball
            </button>
            <button 
              onClick={() => completeMatch()}
              className="h-16 bg-white/[0.03] border border-white/10 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl flex items-center justify-center gap-3"
              style={{ color: THEME_COLOR, borderColor: `${THEME_COLOR}33` }}
            >
              <CheckCircle2 size={16} /> Terminate
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl p-6 flex items-center justify-center animate-in fade-in duration-500">
          <div className="w-full max-w-sm bg-[#000] border border-white/10 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center">
               <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Interface Config</h3>
               <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:text-white transition-all">
                  <X size={20} className="text-neutral-500" />
               </button>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase text-white tracking-tight">Sync Global Node</p>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">External Overlay Sync</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if (liveLoading) return;
                      setLiveLoading(true);
                      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:6001';
                      if (!liveEnabled) {
                        try {
                          const response = await fetch(`${apiBase}/api/scoring/${matchId}/go-live`, {
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
                            toast.success('Sync Established!');
                          } else {
                            toast.error(data.message || 'Sync failed');
                          }
                        } catch (err) {
                          toast.error('Network node failure');
                        } finally {
                          setLiveLoading(false);
                        }
                      } else {
                        try {
                          const response = await fetch(`${apiBase}/api/scoring/${matchId}/end-live`, {
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
                            toast.success('Sync Disconnected');
                          } else {
                            toast.error(data.message || 'Termination failed');
                          }
                        } catch (err) {
                          toast.error('Network node failure');
                        } finally {
                          setLiveLoading(false);
                        }
                      }
                    }}
                    disabled={liveLoading}
                    className={`w-14 h-7 rounded-full relative transition-all duration-500 ${liveEnabled ? 'bg-[#00C187] shadow-[0_0_20px_rgba(0,193,135,0.4)]' : 'bg-neutral-800'} ${liveLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-lg transition-all duration-500 ${liveEnabled ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>

                {liveEnabled && (
                  <div className="p-6 bg-white/[0.02] rounded-3xl border border-white/5 space-y-6 animate-in slide-in-from-top duration-500">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Broadcast Credentials</p>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="YouTube ID..."
                        defaultValue={matchData?.hostedGameId?.youtubeVideoId}
                        id="ytVideoId"
                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-6 py-4 text-xs focus:border-[#00C187] outline-none text-white font-bold"
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
                              toast.error('Link failure');
                            }
                          } catch (err) {
                            toast.error('Network failure');
                          }
                        }}
                        className="w-full py-3 bg-[#00C187]/10 border border-[#00C187]/20 text-[#00C187] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#00C187] hover:text-black transition-all"
                      >
                        Authorize Stream
                      </button>
                    </div>

                    {liveUrls && (
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">OBS Overlay (Copy this)</p>
                          <div className="flex gap-2">
                            <input readOnly value={liveUrls.obsOverlay} className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[9px] text-neutral-400 font-bold truncate outline-none" />
                            <button onClick={() => { navigator.clipboard.writeText(liveUrls.obsOverlay); toast.success('Copied!'); }} className="px-4 py-2 bg-[#00C187]/10 text-[#00C187] text-[8px] font-black uppercase rounded-xl border border-[#00C187]/20 hover:bg-[#00C187] hover:text-black transition-all">Copy</button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Public Scoreboard</p>
                          <div className="flex gap-2">
                            <input readOnly value={liveUrls.publicScoreboard} className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-[9px] text-neutral-400 font-bold truncate outline-none" />
                            <button onClick={() => { navigator.clipboard.writeText(liveUrls.publicScoreboard); toast.success('Copied!'); }} className="px-4 py-2 bg-[#00C187]/10 text-[#00C187] text-[8px] font-black uppercase rounded-xl border border-[#00C187]/20 hover:bg-[#00C187] hover:text-black transition-all">Copy</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button onClick={() => setShowSettings(false)} className="w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl" style={{ backgroundColor: THEME_COLOR, color: '#000', boxShadow: `0 10px 30px ${THEME_COLOR}33` }}>Save Parameters</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 1 Modals ── */}
      {(showInningsSetup || needsInningsSetup) && (
        <InningsSetupModal
          battingTeamSlots={battingSlots}
          bowlingTeamSlots={bowlingSlots}
          inningsLabel={matchData?.currentInningsIndex === 0 ? '1st Innings' : '2nd Innings'}
          onConfirm={async (players) => {
            const result = await setPlayers(players);
            if (result.success) toast.success('Node established! Scoring ready.');
            else toast.error(result.error || 'Player sync failed');
            setShowInningsSetup(false);
          }}
          onClose={() => setShowInningsSetup(false)}
        />
      )}

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
              toast.success(`Wicket Confirmed`);
            } else {
              toast.error(result.error || 'Sync failure');
            }
            setShowWicketModal(false);
          }}
          onClose={() => setShowWicketModal(false)}
        />
      )}

      {extraModal && (
        <ExtraRunsModal
          extraType={extraModal}
          onConfirm={async (runs) => {
            const isWide = extraModal === 'WIDE';
            const isNoBall = extraModal === 'NO_BALL';
            const totalRuns = (isWide || isNoBall) ? runs + 1 : runs;
            const result = await recordBall({
              runs: totalRuns,
              isExtra: true,
              extraType: extraModal,
              isBoundary: false,
            });
            if (result.success) toast.success(`${extraModal} Event Recorded`);
            else toast.error(result.error || 'Sync failure');
            setExtraModal(null);
          }}
          onClose={() => setExtraModal(null)}
        />
      )}
    </div>
  );
};

const X = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;

export default ScoringApp;
