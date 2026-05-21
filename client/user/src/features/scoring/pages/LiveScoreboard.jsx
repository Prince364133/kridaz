/**
 * LiveScoreboard.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * Mobile-first public scoreboard — shared via QR code or URL.
 * Anyone near the boundary can open /live-score/:matchId.
 *
 * Sections (top → bottom on 375px phone):
 * 1. Header + Live badge + Share button
 * 2. Score hero (runs/wickets, overs, CRR, target)
 * 3. Batsmen table (striker highlighted)
 * 4. Bowler panel
 * 5. Current over balls (coloured pills)
 * 6. Ball event toast (floats in from top for 2.5 s)
 * 7. AI Commentary card
 * 8. YouTube embed (if youtubeVideoId available in snapshot)
 * 9. Real-time sync footer badge
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
 ChevronLeft, Share2, Zap, Activity, User,
 Target, TrendingUp, Radio, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6001';

// ─── Ball colour helpers ─────────────────────────────────────────────────────
function getBallCls(ball) {
 if (!ball) return 'bg-gray-800 text-gray-500';
 if (ball.isWicket || ball.type === 'wicket') return 'bg-red-600 text-white';
 const lbl = ball.label || '';
 if (lbl === '6' || ball.type === 'six') return 'bg-purple-600 text-white';
 if (lbl === '4' || ball.type === 'four') return 'bg-blue-600 text-white';
 if (lbl === 'wd' || ball.type === 'wide') return 'bg-yellow-500 text-black';
 if (lbl === 'nb' || ball.type === 'no_ball') return 'bg-orange-500 text-white';
 if (lbl === '0' || ball.type === 'dot') return 'bg-gray-700 text-gray-400';
 return 'bg-white/10 text-white';
}

function BallDot({ ball }) {
 const lbl = ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : '?');
 return (
 <motion.div
 initial={{ scale: 0, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 shadow-lg ${getBallCls(ball)}`}
 >
 {lbl}
 </motion.div>
 );
}

// ─── Floating ball-event toast ────────────────────────────────────────────────
function BallToast({ event }) {
 const label =
 event.type === 'six' ? '🏏 SIX!' :
 event.type === 'four' ? '🔵 FOUR!' :
 event.type === 'wicket' ? '🔴 WICKET!' :
 event.type === 'wide' ? '⚠️ Wide' :
 event.type === 'no_ball' ? '⚠️ No Ball' : null;

 if (!label) return null;

 return (
 <motion.div
 initial={{ y: -80, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: -60, opacity: 0 }}
 className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-black/90 border border-white/15 shadow-2xl text-sm font-black uppercase tracking-widest text-white whitespace-nowrap backdrop-blur-xl"
 >
 {label}
 {event.strikerName && <span className="text-primary ml-2">{event.strikerName}</span>}
 </motion.div>
 );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function Card({ children, className = '' }) {
 return (
 <div className={`bg-white/[0.03] border border-white/[0.06] rounded-3xl overflow-hidden ${className}`}>
 {children}
 </div>
 );
}

// ─── Main component ───────────────────────────────────────────────────────────
const LiveScoreboard = () => {
 const { matchId } = useParams();
 const navigate = useNavigate();

 const [score, setScore] = useState(null);
 const [connected, setConnected] = useState(false);
 const [toast_, setToast] = useState(null);
 const [ended, setEnded] = useState(false);
 const toastTimer = useRef(null);

 // ── HTTP initial load ────────────────────────────────────────────────────────
 const fetchScore = useCallback(async () => {
 try {
 const r = await fetch(`${API_BASE}/api/scoring/live-score/${matchId}`);
 if (!r.ok) return;
 const d = await r.json();
 if (d.success && d.data) setScore(d.data);
 } catch (_) { /* silent */ }
 }, [matchId]);

 // ── Show toast for 2.5 s ─────────────────────────────────────────────────────
 const showToast = useCallback((event) => {
 clearTimeout(toastTimer.current);
 setToast(event);
 toastTimer.current = setTimeout(() => setToast(null), 2500);
 }, []);

 // ── Socket.io ────────────────────────────────────────────────────────────────
 useEffect(() => {
 fetchScore();

 const socket = io(API_BASE, {
 reconnection: true,
 reconnectionAttempts: Infinity,
 reconnectionDelay: 1000,
 reconnectionDelayMax: 5000,
 });

 const joinRoom = () => socket.emit(SOCKET.JOIN_MATCH, matchId);

 socket.on('connect', () => { setConnected(true); joinRoom(); fetchScore(); });
 socket.on('disconnect', () => setConnected(false));
 socket.on('reconnect', () => { setConnected(true); joinRoom(); fetchScore(); });

 socket.on(SOCKET.SCORE_UPDATED, (data) => {
 setScore(data);
 // Derive toast from lastBallRaw
 const lb = data?.lastBallRaw;
 if (lb) {
 if (lb.isWicket) showToast({ type: 'wicket', strikerName: data?.batters?.[0]?.name });
 else if (lb.isBoundary && lb.runs===6) showToast({ type: 'six', strikerName: data?.batters?.[0]?.name });
 else if (lb.isBoundary && lb.runs===4) showToast({ type: 'four', strikerName: data?.batters?.[0]?.name });
 else if (lb.extraType==='WIDE') showToast({ type: 'wide' });
 else if (lb.extraType==='NO_BALL') showToast({ type: 'no_ball' });
 }
 });

 socket.on(SOCKET.BALL_EVENT, (ev) => showToast(ev));
 socket.on(SOCKET.MATCH_ENDED, () => setEnded(true));

 return () => {
 clearTimeout(toastTimer.current);
 socket.disconnect();
 };
 }, [matchId, fetchScore, showToast]);

 // ── Share handler ─────────────────────────────────────────────────────────────
 const handleShare = () => {
 const url = window.location.href;
 if (navigator.share) {
 navigator.share({ title: 'Live Cricket Score', url }).catch(() => {
 navigator.clipboard.writeText(url);
 toast.success('Link copied!');
 });
 } else {
 navigator.clipboard.writeText(url);
 toast.success('Link copied!');
 }
 };

 // ── Loading screen ────────────────────────────────────────────────────────────
 if (!score) return (
 <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
 <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
 <p className="text-[11px] text-gray-600 font-black uppercase tracking-widest">
 Connecting to live match…
 </p>
 </div>
 );

 if (score.status === 'NOT_STARTED') {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col font-inter">
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <Activity size={32} className="text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-2">{score.matchName}</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="text-white">{score.teamA?.name || 'Team A'}</span>
              <span className="text-primary text-[10px]">VS</span>
              <span className="text-white">{score.teamB?.name || 'Team B'}</span>
            </p>
          </div>
          <div className="mt-8 px-6 py-3 bg-white/[0.04] rounded-2xl border border-white/[0.08]">
            <p className="text-[11px] text-primary font-black uppercase tracking-widest animate-pulse">
              {score.message || "Match starts soon"}
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/15 active:bg-white/5 transition-colors rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <ChevronLeft size={14} /> Go Back
          </button>
        </div>
      </div>
    );
  }

 const striker = score.batters?.[0] || null;
 const nonStriker = score.batters?.[1] || null;
 const bowler = score.bowler || null;

 const runsNeeded = score.runsNeeded ?? (score.target ? score.target - score.totalRuns : null);
 const ballsLeft = score.ballsRemaining ?? (score.target ? (score.maxOvers || 20) * 6 - ((score.overs * 6) + score.balls) : null);
 const rrr = (runsNeeded && ballsLeft && ballsLeft > 0)
 ? ((runsNeeded / ballsLeft) * 6).toFixed(2)
 : (runsNeeded && ballsLeft === 0) ? "∞" : null;

 return (
 <div className="min-h-screen bg-[#050505] text-white font-inter">

 {/* ── Floating toast ──────────────────────────────────────────────────── */}
 <AnimatePresence>
 {toast_ && <BallToast event={toast_} />}
 </AnimatePresence>

 {/* ── Header ──────────────────────────────────────────────────────────── */}
 <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.05]">
 <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3">
 <div className="flex items-center gap-3">
 <button
 id="scoreboard-back-btn"
 onClick={() => navigate(-1)}
 className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"
 >
 <ChevronLeft size={18} />
 </button>
 <div>
 <h1 className="text-[13px] font-black uppercase tracking-tight leading-tight">
 {score.matchName || score.battingTeamName || 'Live Score'}
 </h1>
 {ended ? (
 <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Match Complete</p>
 ) : (
 <p className="text-[9px] text-primary font-black uppercase tracking-widest flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
 Live Now
 </p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {/* Connection indicator */}
 <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
 {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
 {connected ? 'Live' : 'Reconnecting…'}
 </div>
 <button
 id="scoreboard-share-btn"
 onClick={handleShare}
 className="w-8 h-8 flex items-center justify-center hover:bg-white/5 rounded-full transition-colors"
 >
 <Share2 size={16} className="text-gray-400" />
 </button>
 </div>
 </div>
 </div>

 <div className="max-w-xl mx-auto px-4 py-5 space-y-4 pb-28">

 {/* ── 1. Score Hero ──────────────────────────────────────────────────── */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.08] rounded-[2.5rem] p-8 text-center"
 >
 {/* decorative glow */}
 <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

 {score.result && (
 <div className="mb-6 py-2 px-4 bg-primary/20 border border-primary/30 rounded-2xl animate-in fade-in zoom-in duration-500">
 <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-1">Final Result</p>
 <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">
 {score.result}
 </h2>
 </div>
 )}

 <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] mb-3">
 {score.battingTeamName} — {score.result ? 'Final Score' : 'Current Score'}
 </p>

 <div className="flex items-baseline justify-center gap-2 mb-2">
 <span className="text-7xl font-black tracking-tighter italic leading-none" style={{ animation: 'none' }}>
 {score.totalRuns}
 </span>
 <span className="text-4xl font-black text-primary italic">/</span>
 <span className="text-5xl font-black tracking-tighter italic leading-none text-white/90">
 {score.totalWickets}
 </span>
 </div>

 <div className="flex items-center justify-center gap-3 flex-wrap mt-3 text-[11px] font-bold text-gray-400">
 <span className="bg-white/[0.04] px-3 py-1 rounded-full">{score.overString} OVERS</span>
 <span className="w-1 h-1 rounded-full bg-white/15" />
 <span className="bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1">
 <TrendingUp size={10} /> CRR {score.crr}
 </span>
 </div>

 {/* 2nd innings target section */}
 {score.target && (
 <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-3 gap-3">
 <div>
 <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
 <Target size={9} /> Target
 </p>
 <p className="text-2xl font-black">{score.target}</p>
 </div>
 <div>
 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Need</p>
 <p className="text-2xl font-black text-yellow-400">{runsNeeded}</p>
 <p className="text-[8px] text-gray-600 font-bold">from {ballsLeft} balls</p>
 </div>
 <div>
 <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">RRR</p>
 <p className={`text-2xl font-black ${rrr && parseFloat(rrr) > 12 ? 'text-red-400' : 'text-green-400'}`}>
 {rrr || '—'}
 </p>
 </div>
 </div>
 )}
 </motion.div>

 {/* ── 2. Batsmen ─────────────────────────────────────────────────────── */}
 <Card>
 <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-white/[0.05]">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">Batting</h3>
 <Zap size={12} className="text-primary" />
 </div>
 <div className="px-5 py-3 space-y-1">
 {/* Column headers */}
 <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 text-[8px] font-black text-gray-600 uppercase tracking-widest pb-1">
 <span>Player</span>
 <span className="text-right w-6">R</span>
 <span className="text-right w-6">B</span>
 <span className="text-right w-6">4s</span>
 <span className="text-right w-6">6s</span>
 <span className="text-right w-10">SR</span>
 </div>
 {[striker, nonStriker].filter(Boolean).map((p, i) => (
 <div
 key={i}
 className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center py-2 rounded-xl px-1 ${i === 0 ? 'bg-primary/5' : ''}`}
 >
 <div className="flex items-center gap-2 overflow-hidden">
 {i === 0 && (
 <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
 )}
 <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-primary/10' : 'bg-white/5'}`}>
 <User size={12} className={i === 0 ? 'text-primary' : 'text-gray-500'} />
 </div>
 <span className={`text-[11px] font-black uppercase truncate ${i === 0 ? 'text-white' : 'text-gray-500'}`}>
 {p.name}
 </span>
 {i === 0 && <span className="text-[8px] text-primary font-black shrink-0">*</span>}
 </div>
 <span className={`text-right text-sm font-black w-6 ${i === 0 ? 'text-white' : 'text-gray-500'}`}>{p.runs}</span>
 <span className="text-right text-[10px] font-bold text-gray-600 w-6">{p.balls}</span>
 <span className="text-right text-[10px] font-bold text-blue-400 w-6">{p.fours ?? 0}</span>
 <span className="text-right text-[10px] font-bold text-purple-400 w-6">{p.sixes ?? 0}</span>
 <span className={`text-right text-[10px] font-black w-10 ${i === 0 ? 'text-primary' : 'text-gray-600'}`}>
 {p.strikeRate ?? (p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(0) : '0.0')}
 </span>
 </div>
 ))}
 {!striker && !nonStriker && (
 <p className="text-center text-[10px] text-gray-600 py-3 font-bold">
 Players not yet selected
 </p>
 )}
 </div>
 </Card>

 {/* ── 3. Bowler ──────────────────────────────────────────────────────── */}
 {bowler && (
 <Card>
 <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-white/[0.05]">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500">Bowling</h3>
 <Radio size={12} className="text-blue-400" />
 </div>
 <div className="px-5 py-3">
 <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 text-[8px] font-black text-gray-600 uppercase tracking-widest pb-2">
 <span>Bowler</span>
 <span className="text-right w-6">O</span>
 <span className="text-right w-6">M</span>
 <span className="text-right w-6">R</span>
 <span className="text-right w-6">W</span>
 <span className="text-right w-10">Econ</span>
 </div>
 <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-x-3 items-center py-1">
 <div className="flex items-center gap-2 overflow-hidden">
 <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
 <User size={12} className="text-blue-400" />
 </div>
 <span className="text-[11px] font-black uppercase truncate text-white">{bowler.name}</span>
 </div>
 <span className="text-right text-sm font-black text-white w-6">{bowler.overs}.{bowler.balls}</span>
 <span className="text-right text-[10px] font-bold text-gray-600 w-6">{bowler.maidens ?? 0}</span>
 <span className="text-right text-[10px] font-bold text-white w-6">{bowler.runs}</span>
 <span className="text-right text-sm font-black text-red-400 w-6">{bowler.wickets}</span>
 <span className="text-right text-[10px] font-black text-primary w-10">{bowler.economy}</span>
 </div>
 </div>
 </Card>
 )}

 {/* ── 4. Last 6 Balls ────────────────────────────────────────────────── */}
 {score.last6Balls?.length > 0 && (
 <Card>
 <div className="px-5 pt-4 pb-3">
 <h3 className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">This Over</h3>
 <div className="flex gap-2 overflow-x-auto no-scrollbar">
 {score.last6Balls.slice(-6).map((b, i) => (
 <BallDot key={i} ball={b} />
 ))}
 {Array.from({ length: Math.max(0, 6 - (score.last6Balls?.length || 0)) }).map((_, i) => (
 <div key={`ph-${i}`} className="w-10 h-10 rounded-full border-2 border-dashed border-white/[0.08] shrink-0" />
 ))}
 </div>
 </div>
 </Card>
 )}

 {/* ── 5. AI Commentary ───────────────────────────────────────────────── */}
 {score.commentary?.text && (
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 className="bg-primary/[0.06] border border-primary/20 rounded-3xl p-5 flex items-start gap-4"
 >
 <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
 <Activity size={15} className="text-primary" />
 </div>
 <div>
 <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">
 AI Commentary · Over {score.commentary.ballIndex !== undefined ? Math.floor(score.commentary.ballIndex / 6) : ''}
 </p>
 <p className="text-[13px] text-gray-200 italic leading-relaxed">
 "{score.commentary.text}"
 </p>
 </div>
 </motion.div>
 )}

 {/* ── 6. YouTube Embed ──────────────────────────────────────────────── */}
 {score.youtubeVideoId && (
 <Card className="overflow-hidden">
 <div className="px-5 pt-4 pb-2 border-b border-white/[0.05]">
 <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
 <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
 Live Stream
 </p>
 </div>
 <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
 <iframe
 className="absolute top-0 left-0 w-full h-full"
 src={`https://www.youtube.com/embed/${score.youtubeVideoId}?autoplay=1&mute=0`}
 title="Live Cricket Stream"
 allow="autoplay; encrypted-media"
 allowFullScreen
 />
 </div>
 </Card>
 )}

 {/* ── 7. Match ended state ──────────────────────────────────────────── */}
 {ended && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-6 text-center"
 >
 <p className="text-2xl font-black uppercase tracking-tight">🏆 Match Complete</p>
 <p className="text-[10px] text-gray-500 font-bold mt-2">Final scores are now locked</p>
 </motion.div>
 )}
 </div>

 {/* ── Floating footer badge ──────────────────────────────────────────────── */}
 <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/[0.05] py-3 z-30">
 <div className="max-w-xl mx-auto flex items-center justify-between px-4">
 <div className="flex items-center gap-2">
 {connected ? (
 <>
 <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
 <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/50">
 Real-time sync active
 </span>
 </>
 ) : (
 <>
 <WifiOff size={12} className="text-red-400" />
 <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400/70">
 Reconnecting…
 </span>
 </>
 )}
 </div>
 <button
 id="scoreboard-share-footer-btn"
 onClick={handleShare}
 className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primary"
 >
 <Share2 size={11} /> Share
 </button>
 </div>
 </div>
 </div>
 );
};

export default LiveScoreboard;
