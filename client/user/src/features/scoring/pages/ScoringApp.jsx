import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, History, Users, Circle, Zap, CheckCircle2, AlertCircle, Filter, Shield, User, PlayCircle, Undo2, Trophy, Play, Sparkles, X, Pause, FileText, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import useCricketScoring from '../hooks/useCricketScoring';
import BallByBallHistory from '@features/scoring/components/BallByBallHistory';
import InningsSetupModal from '@features/scoring/components/InningsSetupModal';
import WicketModal from '@features/scoring/components/WicketModal';
import ExtraRunsModal from '@features/scoring/components/ExtraRunsModal';
import SelectBowlerModal from '@features/scoring/components/SelectBowlerModal';
import TossModal from '@features/scoring/components/TossModal';
import { io } from 'socket.io-client';
import axiosInstance from '@hooks/useAxiosInstance';
import ScoringPasswordModal from '../components/ScoringPasswordModal';
import TickerThemeStoreModal from '@features/scoring/components/TickerThemeStoreModal';
import VisualWagonWheelModal from '../components/VisualWagonWheelModal';
import PenaltyModal from '../components/PenaltyModal';
import MatchReportModal from '../components/MatchReportModal';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6001';
/**
 * ScoringApp — The primary match scoring console.
 * Fully rebranded for the Scorer Portal with Teal Green (#BFF367) and Inter font.
 */

const THEME_COLOR = '#BFF367';

/* ─── Helpers ─── */
const ballColor = (ball) => {
  if (ball.isWicket) return 'bg-red-500/20 text-red-500 border border-red-500/30';
  if (ball.isExtra) return 'bg-[#BFF367]/20 text-[#BFF367] border border-[#BFF367]/30';
  if (ball.runs === 6) return 'bg-[#BFF367] text-black shadow-[0_0_15px_rgba(0,193,135,0.4)]';
  if (ball.runs === 4) return 'bg-[#BFF367]/80 text-black';
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
  const teamA = game?.teamA || matchData?.teamA || (Array.isArray(game?.teams) ? game.teams.find(t => t.teamKey === 'teamA') : game?.teams?.teamA);
  const teamB = game?.teamB || matchData?.teamB || (Array.isArray(game?.teams) ? game.teams.find(t => t.teamKey === 'teamB') : game?.teams?.teamB);
  const activeTeam = teamTab === 'teamA' ? teamA : teamB;

  const getBattingStats = (userId) => {
    const s = matchData?.playerStats?.find(p => p.userId === userId || p.userId?.toString() === userId?.toString());
    if (!s || (s.battingBalls === 0 && s.battingRuns === 0 && matchData?.strikerId !== userId && matchData?.nonStrikerId !== userId)) return null;
    return {
      ...s,
      runs: s.battingRuns ?? 0,
      balls: s.battingBalls ?? 0,
    };
  };

  const getBowlingStats = (userId) => {
    const s = matchData?.playerStats?.find(p => p.userId === userId || p.userId?.toString() === userId?.toString());
    if (!s || (s.bowlingBalls === 0 && matchData?.bowlerId !== userId)) return null;
    return {
      ...s,
      runs: s.bowlingRuns ?? 0,
      wickets: s.bowlingWickets ?? 0,
    };
  };

  return (
    <div className="space-y-4 pb-4 font-inter">
      <div className="flex gap-2 bg-white/5 rounded-[8px] p-1.5 border border-white/5">
        {[['teamA', teamA?.name || 'TBD'], ['teamB', teamB?.name || 'TBD']].map(([key, label]) => (
          <button key={key} onClick={() => setTeamTab(key)}
            className={`flex-1 py-2.5 rounded-[8px] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${teamTab === key ? 'bg-[#BFF367] text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTeam?.slots?.length > 0 ? (
        <div className="space-y-2.5">
          {activeTeam.slots.map((slot, i) => {
            const uid = slot.user?._id || slot.user?.id || slot.userId || slot.user;
            const bat = getBattingStats(uid);
            const bowl = getBowlingStats(uid);
            return (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-[8px] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="w-11 h-11 rounded-[8px] bg-[#BFF367]/10 border border-[#BFF367]/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                  {slot.user?.profilePicture
                    ? <img src={slot.user.profilePicture} className="w-full h-full object-cover" alt="" />
                    : <User size={18} style={{ color: THEME_COLOR }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black uppercase tracking-tight text-white">{slot.user?.name || slot.customPlayer?.name || `Player ${i + 1}`}</p>
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">{slot.role || 'Player'}</p>
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
        <div className="py-20 text-center bg-white/[0.02] rounded-[8px] border border-dashed border-white/10">
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
  // @ts-ignore
  const { role } = useSelector((/** @type {any} */ state) => state.auth);

  const {
    matchData,
    loading,
    error,
    isMutating,
    recordBall,
    setPlayers,
    setToss,
    undoBall,
    completeMatch,
    updateMatchStatus,
    reviseTargetAndOvers,
    setMatchOfficials,
    substitutePlayer,
    useReview,
    setPowerplayOvers,
    toggleTimer,
    addPenalty,
    fetchMatchReport,
    refresh
  } = useCricketScoring(matchId);

  const [activeTab, setActiveTab] = useState('scoring');
  const [showSettings, setShowSettings] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);

  // Timers
  const [localTimerSecs, setLocalTimerSecs] = useState(0);

  useEffect(() => {
    if (matchData?.timerState === 'RUNNING') {
      const start = new Date(matchData.timerLastStartedAt).getTime();
      const initialDuration = matchData.totalDurationSeconds || 0;

      setLocalTimerSecs(initialDuration + Math.floor((Date.now() - start) / 1000));

      const interval = setInterval(() => {
        setLocalTimerSecs(initialDuration + Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setLocalTimerSecs(matchData?.totalDurationSeconds || 0);
    }
  }, [matchData?.timerState, matchData?.timerLastStartedAt, matchData?.totalDurationSeconds]);

  const formatTimer = (secs) => {
    if (!secs || isNaN(secs)) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [liveUrls, setLiveUrls] = useState(null);
  const [passwordVerified, setPasswordVerified] = useState(sessionStorage.getItem(`scoringAuth_${matchId}`) === 'true');
  const [authAction, setAuthAction] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [showMatchReport, setShowMatchReport] = useState(false);
  const [wagonWheelData, setWagonWheelData] = useState(null);

  const [isAiCommentaryEnabled, setIsAiCommentaryEnabled] = useState(false);
  const [commentaryVoice, setCommentaryVoice] = useState('alloy');
  const [commentaryLanguage, setCommentaryLanguage] = useState('en');
  const [commentaryStyle, setCommentaryStyle] = useState('professional');

  React.useEffect(() => {
    if (matchData?.hostedGameId) {
      setIsAiCommentaryEnabled(matchData.hostedGameId.isAiCommentaryEnabled || false);
      setCommentaryVoice(matchData.hostedGameId.commentaryVoice || 'alloy');
      setCommentaryLanguage(matchData.hostedGameId.commentaryLanguage || 'en');
      setCommentaryStyle(matchData.hostedGameId.commentaryStyle || 'professional');
    }
  }, [matchData?.hostedGameId]);

  const [scoringLock, setScoringLock] = useState('PENDING'); // 'PENDING' | 'GRANTED' | 'DENIED'

  React.useEffect(() => {
    if (!passwordVerified) return; // Wait until password verified

    const scorerToken = localStorage.getItem(`scorer_token_${matchId}`);

    // Connect to socket
    const socket = io(API_BASE, {
      auth: { token: scorerToken },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      socket.emit('scoring:acquire_lock', { matchId });
    });

    socket.on('scoring:lock_granted', () => {
      setScoringLock('GRANTED');
    });

    socket.on('scoring:lock_denied', () => {
      setScoringLock('DENIED');
    });

    socket.on('scoring:lock_released', () => {
      // Someone released it, try to acquire it again
      socket.emit('scoring:acquire_lock', { matchId });
    });

    return () => {
      socket.emit('scoring:release_lock', { matchId });
      socket.disconnect();
    };
  }, [matchId, passwordVerified]);

  React.useEffect(() => {
    if (!passwordVerified || !matchId) return;
    const hostedGame = matchData?.hostedGameId;
    if (!hostedGame) return;

    if (hostedGame.isLive) {
      if (!liveEnabled) {
        setLiveEnabled(true);
        const appBase = import.meta['env']?.VITE_APP_URL || window.location.origin;
        setLiveUrls({
          obsOverlay: `${appBase}/live-overlay/${matchId}?token=${hostedGame.overlayToken || ''}`,
          publicScoreboard: `${appBase}/analytics/${hostedGame.shortId || matchId}`,
        });
      }
    } else {
      const autoGoLive = async () => {
        try {
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:6001';
          const response = await axiosInstance.post(`/api/scoring/${matchId}/go-live`, {}, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ''}`
            }
          });
          const data = response.data;
          if (data.success) {
            setLiveEnabled(true);
            const appBase = import.meta['env']?.VITE_APP_URL || window.location.origin;
            setLiveUrls({
              obsOverlay: `${appBase}/live-overlay/${matchId}?token=${data.overlayToken || data.urls?.overlayToken || ''}`,
              publicScoreboard: `${appBase}/analytics/${hostedGame?.shortId || matchId}`,
            });
            refresh();
          }
        } catch (err) {
          console.error("Auto go-live error:", err);
        }
      };
      autoGoLive();
    }
  }, [matchData?.hostedGameId?.isLive, liveEnabled, matchId, passwordVerified, refresh]);

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
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showTossModal, setShowTossModal] = useState(false);
  const [showThemeStore, setShowThemeStore] = useState(false);
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
    const team = game?.[teamKey] || matchData?.[teamKey] || (Array.isArray(game?.teams) ? game.teams.find(t => t.teamKey === teamKey) : game?.teams?.[teamKey]);
    console.log(`[getTeamSlots] teamKey=${teamKey}`, { game, team, slots: team?.slots });
    return (team?.slots || []).map(s => ({
      userId: s.user?._id || s.user?.id || s.userId || s.user || s.customPlayerId || s.id,
      name: s.user?.name || s.customPlayer?.name || 'Player',
      role: s.role,
    })).filter(p => p.userId);
  };

  const currentInnings = matchData?.innings?.[matchData?.currentInningsIndex ?? 0];
  const battingTeamKey = currentInnings?.battingTeam || 'teamA';
  const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
  const battingSlots = getTeamSlots(battingTeamKey);
  const bowlingSlots = getTeamSlots(bowlingTeamKey);

  const strikerStats = (() => {
    const s = matchData?.playerStats?.find(p => p.userId === matchData?.strikerId || p.userId?.toString() === matchData?.strikerId?.toString());
    if (!s) return { runs: 0, balls: 0 };
    return {
      ...s,
      runs: s.battingRuns ?? 0,
      balls: s.battingBalls ?? 0,
    };
  })();
  const nonStrikerStats = (() => {
    const s = matchData?.playerStats?.find(p => p.userId === matchData?.nonStrikerId || p.userId?.toString() === matchData?.nonStrikerId?.toString());
    if (!s) return { runs: 0, balls: 0 };
    return {
      ...s,
      runs: s.battingRuns ?? 0,
      balls: s.battingBalls ?? 0,
    };
  })();
  const bowlerStats = (() => {
    const s = matchData?.playerStats?.find(p => p.userId === matchData?.bowlerId || p.userId?.toString() === matchData?.bowlerId?.toString());
    if (!s) return { wickets: 0, runs: 0, overs: 0, balls: 0 };
    return {
      ...s,
      runs: s.bowlingRuns ?? 0,
      wickets: s.bowlingWickets ?? 0,
      overs: Math.floor((s.bowlingBalls || 0) / 6),
      balls: (s.bowlingBalls || 0) % 6,
    };
  })();
  const strikerSlot = battingSlots.find(p => p.userId === matchData?.strikerId?.toString?.() || p.userId === matchData?.strikerId);
  const nonStrikerSlot = battingSlots.find(p => p.userId === matchData?.nonStrikerId?.toString?.() || p.userId === matchData?.nonStrikerId);
  const bowlerSlot = bowlingSlots.find(p => p.userId === matchData?.bowlerId?.toString?.() || p.userId === matchData?.bowlerId);

  const outBatterIds = new Set((matchData?.playerStats || []).filter(b => b.outStatus && b.outStatus !== 'NOT_OUT').map(b => b.userId?.toString?.() || b.userId));
  const remainingBatters = battingSlots.filter(p =>
    p.userId !== matchData?.strikerId?.toString?.() &&
    p.userId !== matchData?.nonStrikerId?.toString?.() &&
    !outBatterIds.has(p.userId)
  );

  const needsInningsSetup = (matchData?.id || matchData?._id) && matchData?.innings?.length > 0 && !matchData?.strikerId;
  const needsMatchStart = !matchData?.id && !matchData?._id;

  const isFirstInnings = matchData?.currentInningsIndex === 0;
  const isSecondInnings = matchData?.currentInningsIndex === 1;
  const oversPerInnings = matchData?.oversPerInnings || matchData?.hostedGameId?.oversPerInnings || 20;
  const maxBalls = oversPerInnings * 6;

  const isInningsComplete = currentInnings && (
    currentInnings.isCompleted ||
    currentInnings.totalWickets >= 10 ||
    currentInnings.totalBalls >= maxBalls ||
    (isSecondInnings && currentInnings.totalRuns > (matchData?.innings?.[0]?.totalRuns || 9999))
  );

  const isFirstInningsComplete = isFirstInnings && isInningsComplete;

  const [showInningsCompleteModal, setShowInningsCompleteModal] = useState(false);
  const [hasAutoPausedTimer, setHasAutoPausedTimer] = useState(false);

  useEffect(() => {
    if (isInningsComplete && isFirstInnings && !needsInningsSetup) {
      if (!showInningsCompleteModal) {
        setShowInningsCompleteModal(true);
        toast("Innings Complete! Timer automatically paused.", { icon: "⏸️" });
      }
    }
  }, [isInningsComplete, isFirstInnings, needsInningsSetup, showInningsCompleteModal]);
  const hasPassword = !!(matchData?.hostedGameId?.scoringPassword || matchData?.scoringPassword);
  const isLocked = hasPassword && !passwordVerified && !needsMatchStart;

  if (isLocked) {
    return (
      <ScoringPasswordModal
        matchId={matchId}
        onSuccess={(token) => {
          localStorage.setItem(`scorer_token_${matchId}`, token);
          setPasswordVerified(true);
        }}
        actionLabel="Unlock Scoring Console"
      />
    );
  }

  const checkTimerActive = () => {
    if (matchData?.timerState === 'PAUSED') {
      toast.error("Match is paused. Start the timer to score.");
      return false;
    }
    return true;
  };

  const handleScore = async (payload) => {
    if (isMutating) return { success: false, message: "Action in progress" };
    if (!checkTimerActive()) return { success: false, message: "Match is paused" };
    if (!matchData?.strikerId || !matchData?.bowlerId) {
      toast.error("Please setup the next pair and bowler first.");
      return { success: false, message: "Missing players" };
    }
    const fullPayload = {
      ...payload,
      batsmanId: matchData.strikerId,
      bowlerId: matchData.bowlerId
    };
    const result = await recordBall(fullPayload);
    if (!result.success) {
      toast.error(result.error || "Failed to update score.");
    }
    if (result.success && result.overComplete) {
      setShowBowlerModal(true);
    }
    return result;
  };

  if (scoringLock === 'PENDING' && passwordVerified) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#BFF367]/20 border-t-[#BFF367] rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-[13px] font-black uppercase tracking-widest text-[#BFF367]">Acquiring Scoring Lock</h2>
      </div>
    </div>
  );

  if (scoringLock === 'DENIED') return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-inter z-50">
      <Shield style={{ color: THEME_COLOR }} className="mb-6 opacity-80" size={56} />
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Scoring Locked</h2>
      <p className="text-[13px] text-neutral-400 font-medium mb-8 max-w-sm">
        Someone else is currently scoring this game. Please wait until they leave to gain access.
      </p>
      <div className="flex items-center gap-3 bg-[#BFF367]/10 border border-[#BFF367]/20 px-6 py-4 rounded-[8px]">
        <div className="w-4 h-4 border-2 border-[#BFF367]/30 border-t-[#BFF367] rounded-full animate-spin" />
        <span className="text-[11px] font-black uppercase tracking-widest text-[#BFF367]">Waiting in queue...</span>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="w-10 h-10 border-4 border-[#BFF367]/20 border-t-[#BFF367] rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-inter">
      <AlertCircle style={{ color: THEME_COLOR }} className="mb-6" size={56} />
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-3">Sync Interrupted</h2>
      <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/5 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-[#BFF367] border border-[#BFF367]/20">Establish New Link</button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return <MembersTab matchData={matchData} />;
      case 'history': return <HistoryTab matchData={matchData} />;
      default: return (
        <div className="space-y-6 font-inter">
          {matchData?.timerState === 'PAUSED' && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-[8px] flex items-center gap-3.5 shadow-lg animate-pulse">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Match is Paused</p>
                <p className="text-xs text-neutral-400 font-medium mt-0.5">Resume the timer in the header to record deliveries and runs.</p>
              </div>
            </div>
          )}
          {needsMatchStart && (
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-6 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-3xl pointer-events-none" />
              <div className="w-16 h-16 bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-[8px] flex items-center justify-center mx-auto shadow-lg">
                <Play size={28} style={{ color: THEME_COLOR }} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">Match Ready</h3>
                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-widest mt-2">Initialize scoring</p>
              </div>
              <button
                onClick={() => setShowTossModal(true)}
                className="w-full py-5 bg-[#BFF367]/10 border border-[#BFF367]/30 rounded-[8px] text-center text-[#BFF367] text-[13px] font-black uppercase tracking-[0.2em] shadow-xl"
              >
                ⚡ Start Match
              </button>
            </div>
          )}

          {needsInningsSetup && !needsMatchStart && !isFirstInningsComplete && (
            <button
              onClick={() => setShowInningsSetup(true)}
              className="w-full py-5 bg-[#BFF367]/10 border border-[#BFF367]/30 rounded-[8px] text-center text-[#BFF367] text-[11px] font-black uppercase tracking-[0.2em] animate-pulse shadow-xl"
            >
              ⚡ Setup Next Pair & Bowler
            </button>
          )}

          {isFirstInningsComplete && (
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[8px] space-y-6 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-3xl pointer-events-none" />
              <div className="w-16 h-16 bg-[#BFF367]/10 border border-[#BFF367]/20 rounded-[8px] flex items-center justify-center mx-auto shadow-lg">
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
                    const response = await axiosInstance.post(`/api/scoring/next-innings`, {
                      scoringId: matchData._id,
                      battingTeamId: matchData.innings[0].battingTeam === "teamA" ? "teamB" : "teamA"
                    }, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ''}`
                      }
                    });
                    const data = response.data;
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
                className="w-full py-5 rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl"
                style={{ backgroundColor: THEME_COLOR, color: '#000', boxShadow: `0 10px 30px ${THEME_COLOR}33` }}
              >
                Start 2nd Innings
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-[#BFF367]/30 rounded-[8px] p-6 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-[#BFF367]/10 border border-[#BFF367]/20 flex items-center justify-center shadow-inner">
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
            <div className="bg-white/[0.02] border border-white/5 rounded-[8px] p-6 space-y-4 opacity-40 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center">
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

          <div className="bg-gradient-to-r from-[#BFF367]/15 to-transparent border border-[#BFF367]/30 rounded-[8px] p-6 flex items-center justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-3xl pointer-events-none" />
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-12 h-12 rounded-[8px] bg-[#BFF367]/20 border border-[#BFF367]/30 flex items-center justify-center shadow-lg">
                <Zap size={22} style={{ color: THEME_COLOR }} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: THEME_COLOR }}>Active Bowler</p>
                <p className="text-[15px] font-black uppercase text-white mt-0.5">{bowlerSlot?.name || 'Wait for Bowl'}</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-3xl font-black text-white">{bowlerStats?.wickets ?? 0}<span className="text-[#BFF367] text-xl mx-1">-</span>{bowlerStats?.runs ?? 0}</p>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mt-1.5">{bowlerStats?.overs ?? 0}.{bowlerStats?.balls ?? 0} OVERS</p>
            </div>
          </div>

          <div className={`space-y-4 ${matchData?.timerState === 'PAUSED' ? 'opacity-50' : ''}`}>
            <div className="grid grid-cols-4 gap-3.5">
              {[0, 1, 2, 3].map(run => (
                <button key={run}
                  disabled={isMutating}
                  onClick={() => {
                    if (isMutating) return;
                    if (!checkTimerActive()) return;
                    if (run === 0) {
                      handleScore({ runs: run, extraType: 'NONE' });
                    } else {
                      setWagonWheelData({ runs: run, isBoundary: false, isFour: false, isSix: false });
                    }
                  }}
                  className={`h-16 bg-white/[0.03] border border-white/5 rounded-[8px] flex items-center justify-center text-2xl font-black text-white hover:bg-[#BFF367]/10 hover:border-[#BFF367]/40 transition-all transform active:scale-90 shadow-lg ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  {run}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3.5">
              {[4, 6].map(run => (
                <button key={run}
                  disabled={isMutating}
                  onClick={() => {
                    if (isMutating) return;
                    if (!checkTimerActive()) return;
                    setWagonWheelData({ runs: run, isBoundary: true, isFour: run === 4, isSix: run === 6 });
                  }}
                  className={`h-16 rounded-[8px] flex items-center justify-center text-2xl font-black text-black transform active:scale-95 shadow-xl transition-all ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}
                  style={{ backgroundColor: THEME_COLOR, boxShadow: `0 10px 25px ${THEME_COLOR}33` }}>
                  {run}
                </button>
              ))}
              <button disabled={isMutating} onClick={() => { if (!isMutating && checkTimerActive()) setExtraModal('WIDE'); }}
                className={`h-16 bg-white/[0.03] border border-white/5 text-[#BFF367] rounded-[8px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-[#BFF367]/10 transition-all border-[#BFF367]/20 ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
                WIDE
              </button>
              <button disabled={isMutating} onClick={() => { if (!isMutating && checkTimerActive()) setExtraModal('NO_BALL'); }}
                className={`h-16 bg-white/[0.03] border border-white/5 text-[#BFF367] rounded-[8px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-[#BFF367]/10 transition-all border-[#BFF367]/20 ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
                NB
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3.5">
              <button disabled={isMutating} onClick={() => { if (!isMutating && checkTimerActive()) setExtraModal('BYE'); }}
                className={`h-14 bg-white/[0.03] border border-white/5 text-neutral-400 rounded-[8px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:text-white transition-all ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
                BYE
              </button>
              <button disabled={isMutating} onClick={() => { if (!isMutating && checkTimerActive()) setExtraModal('LEG_BYE'); }}
                className={`h-14 bg-white/[0.03] border border-white/5 text-neutral-400 rounded-[8px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:text-white transition-all ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
                LEG BYE
              </button>
              <button disabled={isMutating} onClick={() => { if (!isMutating && checkTimerActive()) setShowPenaltyModal(true); }}
                className={`h-14 bg-white/[0.03] border border-white/5 text-red-400 rounded-[8px] flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:text-red-300 transition-all ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
                PENALTY
              </button>
            </div>
            <button disabled={isMutating} onClick={() => { if (!isMutating && checkTimerActive()) setShowWicketModal(true); }}
              className={`w-full h-20 bg-red-600 text-white rounded-[8px] flex items-center justify-center text-sm font-black uppercase tracking-[0.4em] shadow-[0_15px_40px_rgba(220,38,38,0.3)] hover:bg-red-700 transition-all transform active:scale-95 ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}>
              ⚡ DISMISSAL
            </button>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Timeline Snapshot</h3>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-neutral-800" />)}
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-4 px-2">
              {matchData?.timeline?.slice(-12).reverse().map((ball, i) => (
                <div key={i} className={`w-12 h-12 rounded-[8px] flex items-center justify-center text-sm font-black shrink-0 transition-all transform hover:scale-110 ${ballColor(ball)}`}>
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
    <div className="min-h-screen bg-[#000] text-white selection:bg-[#BFF367] selection:text-black font-inter">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl border-b border-white/5 p-5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2.5 bg-white/5 rounded-[8px] hover:bg-white/10 transition-all border border-white/5">
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
            {matchData?.status !== 'ENDED' && (
              <div className="flex items-center gap-2 bg-white/5 rounded-[8px] p-1 border border-white/5">
                <div className="px-3 py-1 font-mono text-[13px] font-black tracking-widest" style={{ color: THEME_COLOR }}>
                  {formatTimer(localTimerSecs)}
                </div>
                <button
                  onClick={async () => {
                    const isRunning = matchData?.timerState === 'RUNNING';
                    const isPaused = matchData?.timerState === 'PAUSED';
                    const res = await toggleTimer();
                    if (res.success) {
                      if (isRunning) {
                        toast.success('Match Paused');
                      } else if (isPaused) {
                        toast.success('Match Resumed');
                      } else {
                        toast.success('Match Started');
                      }
                    } else {
                      toast.error(res.message || 'Failed to toggle timer');
                    }
                  }}
                  className="p-1.5 bg-[#BFF367]/20 rounded-[8px] hover:bg-[#BFF367]/40 transition-all text-[#BFF367]"
                >
                  {matchData?.timerState === 'RUNNING' ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>
              </div>
            )}
            <div className={`px-3 py-1.5 rounded-[8px] flex items-center gap-2 border transition-all ${liveEnabled ? 'bg-[#BFF367]/10 border-[#BFF367]/30 shadow-[0_0_15px_rgba(0,193,135,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${liveEnabled ? 'bg-[#BFF367] animate-pulse' : 'bg-neutral-700'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${liveEnabled ? 'text-[#BFF367]' : 'text-neutral-500'}`}>
                {liveEnabled ? 'ON AIR' : 'LOCAL'}
              </span>
            </div>
            <button onClick={() => setShowSettings(true)} className="p-2.5 bg-white/5 rounded-[8px] border border-white/5 hover:border-[#BFF367]/30 transition-all">
              <Settings size={20} className="text-neutral-500 hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-5 pb-32 space-y-8 animate-in fade-in duration-700">
        {/* Score Display */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[8px] p-10 text-center space-y-4 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: THEME_COLOR, opacity: 0.1 }} />
          <p className="text-[11px] font-black text-neutral-500 uppercase tracking-[0.5em]">Score Engine</p>
          <div className="flex items-center justify-center gap-6">
            <h2 className="text-7xl font-black tracking-tighter italic text-white flex items-center">
              {score.totalRuns} <span className="text-3xl not-italic mx-3 font-light opacity-20">/</span> <span style={{ color: THEME_COLOR }}>{score.totalWickets}</span>
            </h2>
          </div>
          <div className="flex items-center justify-center gap-5 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 bg-white/5 py-3 px-6 rounded-[6px] w-fit mx-auto border border-white/5">
            <span className="text-white">{score.overs}.{score.balls} OVERS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <span style={{ color: THEME_COLOR }}>CRR: {score.crr}</span>
          </div>

          <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#BFF367]/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[8px] border border-white/5 shadow-inner">
          {[
            { id: 'scoring', icon: Zap, label: 'Control' },
            { id: 'members', icon: Users, label: 'Dossier' },
            { id: 'history', icon: History, label: 'Ledger' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[8px] transition-all border ${activeTab === tab.id ? 'bg-white/10 text-[#BFF367] border-[#BFF367]/20 shadow-lg' : 'text-neutral-500 hover:text-white border-transparent'}`}
            >
              <tab.icon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {renderContent()}

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-[60]">
          <div className="max-w-xl mx-auto grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowInningsSetup(true)}
              className="h-16 bg-white/5 border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5 text-white transform active:scale-95 shadow-xl"
            >
              <Users size={16} /> <span className="mt-0.5">Players</span>
            </button>
            <button
              disabled={isMutating}
              onClick={async () => {
                if (isMutating) return;
                if (!checkTimerActive()) return;
                const result = await undoBall();
                if (result.success) toast.success('Reverted last ball');
                else toast.error(result.error || 'Undo limit reached');
              }}
              className={`h-16 bg-white/5 border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1.5 text-white transform active:scale-95 shadow-xl ${isMutating ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Undo2 size={16} /> <span className="mt-0.5">Undo</span>
            </button>
            <button
              onClick={() => {
                if (hasPassword) {
                  setAuthAction('end');
                  setShowAuthModal(true);
                } else {
                  if (window.confirm('Are you sure you want to end this match?')) {
                    completeMatch();
                    navigate('/');
                  }
                }
              }}
              className="h-16 bg-white/[0.03] border border-white/10 rounded-[8px] text-[9px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-xl flex flex-col items-center justify-center gap-1.5"
              style={{ color: THEME_COLOR, borderColor: `${THEME_COLOR}33` }}
            >
              <CheckCircle2 size={16} /> <span className="mt-0.5">End Match</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl p-6 flex items-center justify-center animate-in fade-in duration-500">
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#000] border border-white/10 rounded-[8px] p-10 space-y-10 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFF367]/5 blur-3xl pointer-events-none" />
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Interface Config</h3>
              <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-[8px] border border-white/5 hover:text-white transition-all">
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <div className="space-y-6">
              {matchData?.hostedGameId && !liveEnabled && (
                <div className="py-12 text-center bg-white/[0.02] rounded-[8px] border border-dashed border-white/10">
                  <div className="w-8 h-8 border-2 border-[#BFF367] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Establishing Sync...</p>
                </div>
              )}

              {matchData?.hostedGameId && liveEnabled && (
                <div className="p-6 bg-white/[0.02] rounded-[8px] border border-white/5 space-y-6 animate-in slide-in-from-top duration-500">
                  <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Broadcast Credentials</p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="YouTube ID..."
                      defaultValue={matchData?.hostedGameId?.youtubeVideoId}
                      id="ytVideoId"
                      className="w-full bg-black/50 border border-white/5 rounded-[8px] px-6 py-4 text-xs focus:border-[#BFF367] outline-none text-white font-bold"
                    />
                    <button
                      onClick={async () => {
                        const rawVid = document.getElementById('ytVideoId')?.['value'] || '';
                        const extractYoutubeId = (url) => {
                          if (!url) return '';
                          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
                          const match = url.match(regExp);
                          return (match && match[2].length === 11) ? match[2] : url;
                        };
                        const vidId = extractYoutubeId(rawVid);
                        
                        try {
                          const response = await axiosInstance.post(`/api/scoring/${matchId}/stream-config`, {
                            youtubeVideoId: vidId
                          }, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || localStorage.getItem('token') || ''}`
                            }
                          });
                          const data = response.data;
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
                      className="w-full py-3 bg-[#BFF367]/10 border border-[#BFF367]/20 text-[#BFF367] text-[10px] font-black uppercase tracking-widest rounded-[8px] hover:bg-[#BFF367] hover:text-black transition-all"
                    >
                      Authorize Stream
                    </button>
                  </div>

                  {liveUrls && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">OBS Overlay (Copy this)</p>
                        <div className="flex gap-2">
                          <input readOnly value={liveUrls.obsOverlay} className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[9px] text-neutral-400 font-bold truncate outline-none" />
                          <button onClick={() => { navigator.clipboard.writeText(liveUrls.obsOverlay); toast.success('Copied!'); }} className="px-4 py-2 bg-[#BFF367]/10 text-[#BFF367] text-[8px] font-black uppercase rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black transition-all">Copy</button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowThemeStore(true)}
                          className="w-full mt-2 py-2.5 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black hover:shadow-[0_0_15px_rgba(0,193,135,0.15)] transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles size={12} />
                          Change Ticker Theme
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Public Match Analytics</p>
                        <div className="flex gap-2">
                          <input readOnly value={liveUrls.publicScoreboard} className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[9px] text-neutral-400 font-bold truncate outline-none" />
                          <button onClick={() => { navigator.clipboard.writeText(liveUrls.publicScoreboard); toast.success('Copied!'); }} className="px-4 py-2 bg-[#BFF367]/10 text-[#BFF367] text-[8px] font-black uppercase rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black transition-all">Copy</button>
                        </div>
                        <div className="flex gap-2 w-full mt-2">
                          <a
                            href={`/live-overlay/${matchId}/preview?theme=${matchData?.hostedGameId?.tickerTheme || 'neon_classic'}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full bg-[#BFF367]/20 text-[#BFF367] border border-[#BFF367]/50 rounded-[8px] px-4 py-2 text-xs font-bold text-center hover:bg-[#BFF367]/30 transition-colors"
                          >
                            Preview Theme
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="p-6 bg-white/[0.02] rounded-[8px] border border-white/5 space-y-6">
                <div className="space-y-4">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Match State</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={async () => {
                        const res = await updateMatchStatus('LIVE');
                        if (res.success) toast.success('Match Resumed!');
                        else toast.error('Failed to update status');
                      }}
                      className={`py-2 rounded-[8px] text-[9px] font-black uppercase transition-all ${matchData?.status === 'LIVE' ? 'bg-[#BFF367]/20 text-[#BFF367] border border-[#BFF367]/30' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >
                      Live
                    </button>
                    <button
                      onClick={async () => {
                        const res = await updateMatchStatus('RAIN_DELAY');
                        if (res.success) toast.success('Match Paused: Rain Delay');
                        else toast.error('Failed to update status');
                      }}
                      className={`py-2 rounded-[8px] text-[9px] font-black uppercase transition-all ${matchData?.status === 'RAIN_DELAY' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >
                      Rain Delay
                    </button>
                    <button
                      onClick={async () => {
                        const res = await updateMatchStatus('BAD_LIGHT');
                        if (res.success) toast.success('Match Paused: Bad Light');
                        else toast.error('Failed to update status');
                      }}
                      className={`py-2 rounded-[8px] text-[9px] font-black uppercase transition-all ${matchData?.status === 'BAD_LIGHT' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-white/5 text-neutral-400 hover:bg-white/10'}`}
                    >
                      Bad Light
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest flex items-center justify-between">
                    <span>AI Commentator (OpenAI TTS)</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] ${isAiCommentaryEnabled ? 'bg-[#BFF367]/20 text-[#BFF367]' : 'bg-white/5 text-neutral-500'}`}>
                      {isAiCommentaryEnabled ? 'ACTIVE' : 'OFF'}
                    </span>
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAiCommentaryEnabled(!isAiCommentaryEnabled)}
                      className={`flex-1 py-2.5 rounded-[8px] text-[9px] font-black uppercase tracking-widest transition-all ${isAiCommentaryEnabled ? 'bg-[#BFF367] text-black shadow-[0_0_15px_rgba(0,193,135,0.3)]' : 'bg-white/5 border border-white/10 text-white'}`}
                    >
                      {isAiCommentaryEnabled ? 'Disable' : 'Enable Commentary'}
                    </button>
                  </div>

                  {isAiCommentaryEnabled && (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <div className="flex gap-2">
                        <select
                          value={commentaryLanguage}
                          onChange={(e) => setCommentaryLanguage(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                        >
                          <option value="en">English (Default)</option>
                          <option value="hi">Hindi</option>
                          <option value="pa">Punjabi</option>
                          <option value="bn">Bengali</option>
                          <option value="mr">Marathi</option>
                          <option value="ta">Tamil</option>
                          <option value="te">Telugu</option>
                          <option value="gu">Gujarati</option>
                        </select>

                        <select
                          value={commentaryVoice}
                          onChange={(e) => setCommentaryVoice(e.target.value)}
                          className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                        >
                          <option value="alloy">Alloy (Neutral)</option>
                          <option value="echo">Echo (Male, Warm)</option>
                          <option value="fable">Fable (Male, British)</option>
                          <option value="onyx">Onyx (Male, Deep)</option>
                          <option value="nova">Nova (Female, Professional)</option>
                          <option value="shimmer">Shimmer (Female, Bright)</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <select
                          value={commentaryStyle}
                          onChange={(e) => setCommentaryStyle(e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                        >
                          <option value="professional">Professional Broadcast</option>
                          <option value="natural">Natural Human (Casual)</option>
                          <option value="funny">Funny & Witty</option>
                          <option value="dramatic">High Energy / Dramatic</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            const response = await axiosInstance.post(`/api/scoring/${matchId}/commentary-settings`, {
                              isAiCommentaryEnabled, commentaryVoice, commentaryLanguage, commentaryStyle
                            }, {
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ''}`
                              }
                            });
                            const data = response.data;
                            if (data.success) {
                              toast.success('Commentary settings saved!');
                            } else {
                              toast.error('Failed to save settings');
                            }
                          } catch (err) {
                            toast.error('Network error saving settings');
                          }
                        }}
                        className="w-full py-2 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black transition-all"
                      >
                        Save Commentary Profile
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">DLS / Target Revision</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="revisedTarget"
                      placeholder="Revised Target"
                      defaultValue={matchData?.revisedTarget || ''}
                      className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                    />
                    <input
                      type="number"
                      step="0.1"
                      id="revisedOvers"
                      placeholder="Revised Overs"
                      defaultValue={matchData?.revisedOvers || ''}
                      className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const tgt = parseInt(document.getElementById('revisedTarget').value);
                      const ovr = parseFloat(document.getElementById('revisedOvers').value);
                      if (isNaN(tgt) || isNaN(ovr)) return toast.error('Enter valid target and overs');
                      const res = await reviseTargetAndOvers(tgt, ovr);
                      if (res.success) toast.success('Target Revised!');
                      else toast.error('Failed to revise target');
                    }}
                    className="w-full py-2.5 bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-purple-500/20 hover:bg-purple-500 hover:text-white transition-all"
                  >
                    Apply DLS Revision
                  </button>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Match Officials</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="umpire1"
                      placeholder="Umpire 1"
                      defaultValue={matchData?.matchOfficials?.umpire1 || ''}
                      className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                    />
                    <input
                      type="text"
                      id="umpire2"
                      placeholder="Umpire 2"
                      defaultValue={matchData?.matchOfficials?.umpire2 || ''}
                      className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="matchReferee"
                      placeholder="Match Referee"
                      defaultValue={matchData?.matchOfficials?.matchReferee || ''}
                      className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                    />
                    <button
                      onClick={async () => {
                        const umpire1 = document.getElementById('umpire1').value;
                        const umpire2 = document.getElementById('umpire2').value;
                        const matchReferee = document.getElementById('matchReferee').value;
                        const res = await setMatchOfficials({ umpire1, umpire2, matchReferee });
                        if (res.success) toast.success('Officials Updated!');
                        else toast.error('Failed to update officials');
                      }}
                      className="px-6 py-2.5 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Match Rules (Phase 5)</p>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="powerplayOvers"
                      placeholder="Powerplay Overs"
                      defaultValue={matchData?.powerplayOvers || 0}
                      className="flex-1 bg-black/40 border border-white/5 rounded-[8px] px-4 py-2.5 text-[10px] text-white font-bold outline-none focus:border-[#BFF367]"
                    />
                    <button
                      onClick={async () => {
                        const overs = parseInt(document.getElementById('powerplayOvers').value);
                        if (isNaN(overs)) return toast.error('Enter valid overs');
                        const res = await setPowerplayOvers(overs);
                        if (res.success) toast.success('Powerplay Overs Updated!');
                        else toast.error('Failed to update powerplay');
                      }}
                      className="px-6 py-2.5 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black transition-all"
                    >
                      Set Powerplay
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        const isSuccess = window.confirm("Was the Batting Team's review successful? (Click OK for Yes, Cancel for No)");
                        const res = await useReview('batting', isSuccess);
                        if (res.success) toast.success(isSuccess ? 'Review Retained' : 'Review Lost');
                        else toast.error('Failed to use review');
                      }}
                      className="w-full py-2.5 bg-yellow-500/10 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-yellow-500/20 hover:bg-yellow-500 hover:text-white transition-all"
                    >
                      Use Batting Review ({matchData?.reviews?.batting ?? 2})
                    </button>

                    <button
                      onClick={async () => {
                        const isSuccess = window.confirm("Was the Fielding Team's review successful? (Click OK for Yes, Cancel for No)");
                        const res = await useReview('fielding', isSuccess);
                        if (res.success) toast.success(isSuccess ? 'Review Retained' : 'Review Lost');
                        else toast.error('Failed to use review');
                      }}
                      className="w-full py-2.5 bg-yellow-500/10 text-yellow-400 text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-yellow-500/20 hover:bg-yellow-500 hover:text-white transition-all"
                    >
                      Use Fielding Review ({matchData?.reviews?.fielding ?? 2})
                    </button>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Match Analysis</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowSettings(false);
                        setShowMatchReport(true);
                      }}
                      className="w-full py-3 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black hover:shadow-[0_0_15px_rgba(0,193,135,0.15)] transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={14} />
                      Match Report
                    </button>

                    <button
                      onClick={() => {
                        window.open(`/analytics/${matchData?.hostedGameId?.shortId || matchId}`, '_blank');
                      }}
                      className="w-full py-3 bg-[#BFF367]/10 text-[#BFF367] text-[9px] font-black uppercase tracking-widest rounded-[8px] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black hover:shadow-[0_0_15px_rgba(85,222,232,0.15)] transition-all flex items-center justify-center gap-2"
                    >
                      <TrendingUp size={14} />
                      Live Analytics
                    </button>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-full py-5 rounded-[8px] font-black uppercase text-[11px] tracking-[0.2em] transition-all transform active:scale-95 shadow-xl" style={{ backgroundColor: THEME_COLOR, color: '#000', boxShadow: `0 10px 30px ${THEME_COLOR}33` }}>Save Parameters</button>
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
            if (result.success) {
              toast.success('Node established! Scoring ready.');
              if (matchData?.timerState === 'PAUSED') {
                toggleTimer();
              }
            } else {
              toast.error(result.error || 'Player sync failed');
            }
            setShowInningsSetup(false);
          }}
          onClose={() => setShowInningsSetup(false)}
        />
      )}

      {showWicketModal && (
        <WicketModal
          fieldingTeamSlots={bowlingSlots}
          battingTeamSlots={remainingBatters}
          activeBatters={[
            strikerSlot ? { ...strikerSlot, role: 'Striker' } : null,
            nonStrikerSlot ? { ...nonStrikerSlot, role: 'Non-Striker' } : null
          ].filter(Boolean)}
          onConfirm={async ({ wicketType, fielderId, nextBatterId, runs, playerOutId }) => {
            const result = await handleScore({
              runs: runs || 0,
              isWicket: true,
              wicketType,
              fielderId,
              nextBatterId,
              playerOutId,
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


      {showThemeStore && (
        <TickerThemeStoreModal
          activeTheme={matchData?.hostedGameId?.tickerTheme || 'neon_classic'}
          matchId={matchId}
          onClose={() => setShowThemeStore(false)}
          onThemeApplied={(newTheme) => {
            if (matchData?.hostedGameId) {
              matchData.hostedGameId.tickerTheme = newTheme;
            }
            refresh();
          }}
        />
      )}
      {showPenaltyModal && (
        <PenaltyModal
          matchData={matchData}
          onClose={() => setShowPenaltyModal(false)}
          onConfirm={async (teamId, runs) => {
            const res = await addPenalty(teamId, runs);
            if (res.success) toast.success(`Added ${runs} penalty runs`);
            else toast.error(res.message || 'Failed to add penalty');
            setShowPenaltyModal(false);
          }}
        />
      )}

      {/* Innings Complete Modal */}
      {showInningsCompleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm bg-[#111] rounded-[8px] border border-white/10 p-6 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔄</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
              Innings Over
            </h3>
            <p className="text-sm text-white/60 mb-6 leading-relaxed">
              The {isFirstInnings ? 'first' : 'current'} innings has ended. The match timer has been paused. Set up the next innings to resume the match.
            </p>
            <button
              onClick={async () => {
                setShowInningsCompleteModal(false);
                const res = await advanceToNextInnings(bowlingTeamKey);
                if (res.success) {
                  toast.success("Ready for 2nd Innings Setup!");
                  // Force the UI to show the InningsSetupModal for the next innings
                  setShowInningsSetup(true);
                } else {
                  toast.error("Failed to advance innings: " + res.message);
                }
              }}
              className="w-full py-4 bg-gradient-to-r from-[#BFF367] to-[#BFF367] text-black font-black text-sm uppercase tracking-wider rounded-[8px] hover:opacity-90 transition-opacity"
            >
              Start Next Innings
            </button>
          </motion.div>
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
            if (result.success) {
              toast.success('Node established! Scoring ready.');
              if (matchData?.timerState === 'PAUSED' || hasAutoPausedTimer) {
                toggleTimer();
                setHasAutoPausedTimer(false);
                toast("Match Resumed", { icon: "▶️" });
              }
            } else {
              toast.error(result.error || 'Player sync failed');
            }
            setShowInningsSetup(false);
          }}
          onClose={() => setShowInningsSetup(false)}
        />
      )}

      {showWicketModal && (
        <WicketModal
          fieldingTeamSlots={bowlingSlots}
          battingTeamSlots={remainingBatters}
          activeBatters={[
            strikerSlot ? { ...strikerSlot, role: 'Striker' } : null,
            nonStrikerSlot ? { ...nonStrikerSlot, role: 'Non-Striker' } : null
          ].filter(Boolean)}
          onConfirm={async ({ wicketType, fielderId, nextBatterId, runs, playerOutId }) => {
            const result = await handleScore({
              runs: runs || 0,
              isWicket: true,
              wicketType,
              fielderId,
              nextBatterId,
              playerOutId,
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

      {wagonWheelData && (
        <VisualWagonWheelModal
          runs={wagonWheelData.runs}
          isBoundary={wagonWheelData.isBoundary}
          onConfirm={(data) => {
            handleScore({
              runs: wagonWheelData.runs,
              isBoundary: wagonWheelData.isBoundary,
              isFour: wagonWheelData.isFour,
              isSix: wagonWheelData.isSix,
              extraType: 'NONE',
              fieldingPosition: data.position,
              distance: data.distance
            });
            setWagonWheelData(null);
          }}
          onClose={() => setWagonWheelData(null)}
        />
      )}

      {extraModal && (
        <ExtraRunsModal
          extraType={extraModal}
          onConfirm={async (runs) => {
            const isWide = extraModal === 'WIDE';
            const isNoBall = extraModal === 'NO_BALL';
            const totalRuns = (isWide || isNoBall) ? runs + 1 : runs;
            const result = await handleScore({
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

      {showBowlerModal && (
        <SelectBowlerModal
          pool={bowlingSlots}
          currentBowlerId={matchData.bowlerId}
          onConfirm={async (bowlerId) => {
            const res = await setPlayers({ bowlerId });
            if (res.success) {
              toast.success('Next bowler selected');
              setShowBowlerModal(false);
            } else {
              toast.error(res.error || 'Failed to select bowler');
            }
          }}
        />
      )}

      {showTossModal && (
        <TossModal
          teamA={matchData?.teamA || matchData?.hostedGameId?.teamA || (Array.isArray(matchData?.hostedGameId?.teams) ? matchData.hostedGameId.teams.find(t => t.teamKey === 'teamA') : null)}
          teamB={matchData?.teamB || matchData?.hostedGameId?.teamB || (Array.isArray(matchData?.hostedGameId?.teams) ? matchData.hostedGameId.teams.find(t => t.teamKey === 'teamB') : null)}
          hasPassword={hasPassword && !passwordVerified}
          onCancel={() => setShowTossModal(false)}
          onConfirm={async ({ winnerTeam, decision, password }) => {

            // If a password was provided, verify it first or store it
            if (password) {
              try {
                const authRes = await axiosInstance.post(`/api/scoring/auth/${matchId}`, { password });
                if (authRes.data.success) {
                  localStorage.setItem(`scorer_token_${matchId}`, authRes.data.token);
                  setPasswordVerified(true);
                } else {
                  return toast.error('Invalid password');
                }
              } catch (e) {
                return toast.error('Error verifying password');
              }
            }

            try {
              // Determine batting team
              const isTeamAWinner = winnerTeam === (matchData?.teamA?.id || matchData?.hostedGameId?.teamA?.id);
              let battingTeam = 'teamA';
              if ((isTeamAWinner && decision === 'BAT') || (!isTeamAWinner && decision === 'BOWL')) {
                battingTeam = 'teamA';
              } else {
                battingTeam = 'teamB';
              }

              const response = await axiosInstance.post(`/api/scoring/start`, {
                matchId: matchData._id || matchData.id || matchData.hostedGameId?.id,
                battingTeam,
                tossWinner: winnerTeam,
                tossDecision: decision
              }, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem(`scorer_token_${matchId}`) || ''}`
                }
              });
              const data = response.data;
              if (data.success) {
                toast.success('Match started successfully!');
                setShowTossModal(false);
                await refresh();
              } else {
                toast.error('Failed to start match');
              }
            } catch (e) {
              toast.error('Error starting match');
            }
          }}
        />
      )}

      {showAuthModal && (
        <ScoringPasswordModal
          matchId={matchId}
          actionLabel={authAction === 'end' ? 'Confirm End Match' : 'Unlock Scoring Console'}
          onClose={() => setShowAuthModal(false)}
          onSuccess={(token) => {
            localStorage.setItem(`scorer_token_${matchId}`, token);
            setPasswordVerified(true);
            setShowAuthModal(false);
            if (authAction === 'start') {
              setShowTossModal(true);
            } else if (authAction === 'end') {
              completeMatch();
              navigate('/');
            }
          }}
        />
      )}

      {showThemeStore && (
        <TickerThemeStoreModal
          activeTheme={matchData?.hostedGameId?.tickerTheme || 'neon_classic'}
          matchId={matchId}
          onClose={() => setShowThemeStore(false)}
          onThemeApplied={(newTheme) => {
            if (matchData?.hostedGameId) {
              matchData.hostedGameId.tickerTheme = newTheme;
            }
            refresh();
          }}
        />
      )}
      {showPenaltyModal && (
        <PenaltyModal
          matchData={matchData}
          onClose={() => setShowPenaltyModal(false)}
          onConfirm={async (teamId, runs) => {
            const res = await addPenalty(teamId, runs);
            if (res.success) toast.success(`Added ${runs} penalty runs`);
            else toast.error(res.message || 'Failed to add penalty');
            setShowPenaltyModal(false);
          }}
        />
      )}

      {showMatchReport && (
        <MatchReportModal
          matchId={matchId}
          fetchMatchReport={fetchMatchReport}
          onClose={() => setShowMatchReport(false)}
        />
      )}


    </div>
  );
};

export default ScoringApp;
