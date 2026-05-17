/**
 * LiveOverlay.jsx
 * ────────────────────────────────────────────────────────────────────────────
 * Transparent OBS Browser-Source overlay for cricket live streaming.
 *
 * Usage in OBS:
 * Sources → + → Browser → URL: /live-overlay/:matchId?token=<overlayToken>
 * Width: 1920 Height: 1080 ✅ Transparent background
 *
 * Architecture:
 * • On mount → HTTP GET /api/scoring/live-score/:matchId (initial state)
 * • Then → Socket.io "joinMatch" on room matchId
 * • Listens → "scoreUpdated" (score data), "ballEvent" (animation trigger)
 * • On drop → freezes in place; auto-reconnects & re-fetches via HTTP
 * ────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { SOCKET } from '@kridaz/shared-constants/socketEvents';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6001';

// ─── Ball colour helpers ─────────────────────────────────────────────────────
const BALL_STYLES = {
 wicket: { bg: '#dc2626', color: '#fff' },
 boundary: { bg: '#22c55e', color: '#000' },
 six: { bg: '#a855f7', color: '#fff' },
 four: { bg: '#3b82f6', color: '#fff' },
 wide: { bg: '#eab308', color: '#000' },
 no_ball: { bg: '#f97316', color: '#000' },
 dot: { bg: '#374151', color: '#9ca3af' },
 run: { bg: '#1f2937', color: '#fff' },
};

function getBallStyle(ball) {
 if (!ball) return BALL_STYLES.dot;
 if (ball.isWicket || ball.type === 'wicket') return BALL_STYLES.wicket;
 const lbl = ball.label || ball.type || '';
 if (lbl === '6' || ball.type === 'six') return BALL_STYLES.six;
 if (lbl === '4' || ball.type === 'four') return BALL_STYLES.four;
 if (ball.type === 'wide' || lbl === 'wd') return BALL_STYLES.wide;
 if (ball.type === 'no_ball' || lbl === 'nb') return BALL_STYLES.no_ball;
 if (lbl === '0' || ball.type === 'dot') return BALL_STYLES.dot;
 return BALL_STYLES.run;
}

// ─── Badge config per event type ─────────────────────────────────────────────
const BADGE_CFG = {
 six: { label: '6', bg: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', dur: 2800, size: 96 },
 four: { label: '4', bg: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: '#fff', dur: 2400, size: 80 },
 wicket: { label: 'W!', bg: 'linear-gradient(135deg,#991b1b,#dc2626)', color: '#fff', dur: 3200, size: 80 },
 wide: { label: 'WD', bg: 'linear-gradient(135deg,#854d0e,#eab308)', color: '#000', dur: 1600, size: 56 },
 no_ball: { label: 'NB', bg: 'linear-gradient(135deg,#9a3412,#f97316)', color: '#fff', dur: 1600, size: 56 },
};

// ─── CSS injected once into the document head ────────────────────────────────
const GLOBAL_CSS = `
 @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

 * { box-sizing: border-box; margin: 0; padding: 0; }

 body, html {
 background: transparent !important;
 overflow: hidden;
 width: 1920px;
 height: 1080px;
 font-family: 'Inter', sans-serif;
 }

 @keyframes sixFlyIn {
 0% { transform: translateX(120px) scale(0.4) rotate(10deg); opacity: 0; }
 25% { transform: translateX(-12px) scale(1.2) rotate(-3deg); opacity: 1; }
 70% { transform: translateX(0) scale(1) rotate(0deg); opacity: 1; }
 100% { transform: translateX(0) scale(0.8); opacity: 0; }
 }
 @keyframes fourSlideUp {
 0% { transform: translateY(60px) scale(0.5); opacity: 0; }
 20% { transform: translateY(-8px) scale(1.1); opacity: 1; }
 70% { transform: translateY(0) scale(1); opacity: 1; }
 100% { transform: translateY(0) scale(0.85); opacity: 0; }
 }
 @keyframes wicketShake {
 0%,100% { transform: translateX(0) scale(1); opacity: 0; }
 5% { transform: scale(1.3); opacity: 1; }
 15%,45% { transform: translateX(-8px) scale(1); opacity: 1; }
 30%,60% { transform: translateX( 8px) scale(1); opacity: 1; }
 80% { transform: scale(1); opacity: 1; }
 95% { transform: scale(0.9); opacity: 0; }
 }
 @keyframes extraBadge {
 0% { transform: scale(0.3); opacity: 0; }
 15% { transform: scale(1.1); opacity: 1; }
 70% { transform: scale(1); opacity: 1; }
 100% { transform: scale(0.8); opacity: 0; }
 }
 @keyframes tickerIn {
 from { transform: translateY(100%); opacity: 0; }
 to { transform: translateY(0); opacity: 1; }
 }
 @keyframes pulseRed {
 0%,100% { opacity: 1; }
 50% { opacity: 0.4; }
 }
 @keyframes scoreFlash {
 0%,100% { color: #fff; }
 50% { color: #a3e635; }
 }
 @keyframes scrollText {
 0% { transform: translateX(100%); }
 100% { transform: translateX(-100%); }
 }
 .ticker-container {
 position: absolute;
 bottom: 90px; /* Above the main bar */
 left: 0;
 right: 0;
 height: 34px;
 background: rgba(163, 230, 53, 0.95);
 display: flex;
 align-items: center;
 overflow: hidden;
 white-space: nowrap;
 border-top: 1px solid rgba(0,0,0,0.1);
 box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
 z-index: 10;
 }
 .ticker-label {
 background: #000;
 color: #a3e635;
 padding: 0 16px;
 height: 100%;
 display: flex;
 align-items: center;
 font-size: 11px;
 font-weight: 900;
 text-transform: uppercase;
 letter-spacing: 2px;
 position: relative;
 z-index: 20;
 box-shadow: 10px 0 20px rgba(0,0,0,0.5);
 }
 .ticker-text {
 display: inline-block;
 padding-left: 20px;
 font-size: 14px;
 font-weight: 800;
 color: #000;
 text-transform: uppercase;
 animation: scrollText 15s linear infinite;
 }
`;

function injectCSS(css) {
 if (document.getElementById('overlay-css')) return;
 const style = document.createElement('style');
 style.id = 'overlay-css';
 style.textContent = css;
 document.head.appendChild(style);
}

// ─── Ball dot pill ───────────────────────────────────────────────────────────
function BallPill({ ball, size = 36 }) {
 const st = getBallStyle(ball);
 const lbl = ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : '?');
 return (
 <div style={{
 width: size, height: size,
 borderRadius: '50%',
 background: st.bg,
 color: st.color,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: size * 0.33, fontWeight: 900,
 flexShrink: 0,
 boxShadow: `0 2px 8px rgba(0,0,0,0.5)`,
 }}>
 {lbl}
 </div>
 );
}

// ─── Animated event badge ─────────────────────────────────────────────────────

function EventBadge({ event }) {
 const cfg = BADGE_CFG[event?.type];
 if (!cfg) return null;

 const animName =
 event.type === 'six' ? 'sixFlyIn' :
 event.type === 'four' ? 'fourSlideUp' :
 event.type === 'wicket' ? 'wicketShake' : 'extraBadge';

 return (
 <div style={{
 position: 'fixed',
 bottom: 120,
 right: 60,
 display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
 pointerEvents: 'none',
 }}>
 <div style={{
 width: cfg.size * 1.6, height: cfg.size * 1.6,
 borderRadius: 24,
 background: cfg.bg,
 color: cfg.color,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 fontSize: cfg.size, fontWeight: 900,
 fontStyle: '',
 letterSpacing: '-2px',
 boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
 animation: `${animName} ${cfg.dur}ms ease-in-out forwards`,
 }}>
 {event.label || cfg.label}
 </div>
 {event.description && (
 <div style={{
 background: 'rgba(0,0,0,0.8)',
 color: '#fff',
 padding: '4px 14px',
 borderRadius: 99,
 fontSize: 13, fontWeight: 700,
 animation: `extraBadge ${cfg.dur}ms ease-in-out forwards`,
 whiteSpace: 'nowrap',
 }}>
 {event.description}
 </div>
 )}
 </div>
 );
}

// ─── Scrolling Ticker ────────────────────────────────────────────────────────
function ScrollingTicker({ score }) {
 const [activeTab, setActiveTab] = useState(0);
 const [displayText, setDisplayText] = useState('');
 const [label, setLabel] = useState('Commentary');

 useEffect(() => {
 const timer = setInterval(() => {
 setActiveTab(prev => (prev + 1) % 3);
 }, 8000); // Rotate every 8 seconds

 return () => clearInterval(timer);
 }, []);

 useEffect(() => {
 if (!score) return;

 if (score.result) {
 setLabel('RESULT');
 setDisplayText(score.result);
 return;
 }

 switch (activeTab) {
 case 0:
 setLabel('Commentary');
 setDisplayText(score.commentary || "Waiting for next ball...");
 break;
 case 1:
 setLabel('Partnership');
 setDisplayText(`${score.partnership?.runs || 0} runs from ${score.partnership?.balls || 0} balls`);
 break;
 case 2:
 if (score.target) {
 setLabel('The Chase');
 setDisplayText(`Need ${score.runsNeeded} from ${score.ballsRemaining} balls (RRR ${score.rrr})`);
 } else {
 setLabel('Match Info');
 setDisplayText(`CRR: ${score.crr} • ${score.battingTeamName} is batting`);
 }
 break;
 default:
 break;
 }
 }, [activeTab, score]);

 if (!displayText) return null;

 return (
 <div className="ticker-container">
 <div className="ticker-label">{label}</div>
 <div className="ticker-text" key={displayText}>
 {displayText}
 </div>
 </div>
 );
}

// ─── Main overlay ─────────────────────────────────────────────────────────────
const LiveOverlay = () => {
 const { matchId } = useParams();
 const [searchParams] = useSearchParams();
 const token = searchParams.get('token');

 const [score, setScore] = useState(null);
 const [badge, setBadge] = useState(null); // current animated badge
 const [connected, setConnected] = useState(false);
 const badgeTimer = useRef(null);
 const socketRef = useRef(null);

 injectCSS(GLOBAL_CSS);

 // ── HTTP fallback ────────────────────────────────────────────────────────────
 const fetchScore = useCallback(async () => {
 try {
 const r = await fetch(`${API_BASE}/api/scoring/live-score/${matchId}`);
 if (!r.ok) return;
 const d = await r.json();
 if (d.success && d.data) setScore(d.data);
 } catch (_) { /* silent */ }
 }, [matchId]);

 // ── Show badge ───────────────────────────────────────────────────────────────
 const showBadge = useCallback((type, data) => {
 clearTimeout(badgeTimer.current);
 const cfg = BADGE_CFG[type];
 if (!cfg) return;
 setBadge({ type, label: cfg.label, description: buildDesc(type, data), ...data });
 badgeTimer.current = setTimeout(() => setBadge(null), cfg.dur + 200);
 }, []);

 function buildDesc(type, data) {
 if (type === 'six') return `${data.strikerName || ''} hits a MAXIMUM!`.trim();
 if (type === 'four') return `${data.strikerName || ''} finds the boundary!`.trim();
 if (type === 'wicket') return `OUT! ${data.wicketType?.replace(/_/g,' ') || ''}`.trim();
 if (type === 'wide') return 'Wide ball';
 if (type === 'no_ball')return 'No Ball!';
 return '';
 }

 // ── Socket.io ────────────────────────────────────────────────────────────────
 useEffect(() => {
 fetchScore();

 const socket = io(API_BASE, {
 reconnection: true,
 reconnectionAttempts: Infinity,
 reconnectionDelay: 1000,
 reconnectionDelayMax: 5000,
 });
 socketRef.current = socket;

 const joinRoom = () => {
 socket.emit(SOCKET.JOIN_MATCH, matchId);
 if (token) socket.emit(SOCKET.OVERLAY_JOIN, { matchId, token });
 };

 socket.on('connect', () => {
 setConnected(true);
 joinRoom();
 fetchScore(); // re-sync on reconnect
 });
 socket.on('disconnect', () => setConnected(false));
 socket.on('reconnect', () => { setConnected(true); joinRoom(); fetchScore(); });

 // Primary score update ────────────────────────────────────────────────────
 socket.on(SOCKET.SCORE_UPDATED, (data) => {
 setScore(data);
 // Derive badge from lastBallRaw if no explicit ballEvent follows
 const lb = data?.lastBallRaw;
 if (lb) {
 if (lb.isWicket) showBadge('wicket', { wicketType: lb.wicketType });
 else if (lb.isBoundary && lb.runs===6) showBadge('six', { strikerName: data?.batters?.[0]?.name });
 else if (lb.isBoundary && lb.runs===4) showBadge('four', { strikerName: data?.batters?.[0]?.name });
 else if (lb.extraType==='WIDE') showBadge('wide', {});
 else if (lb.extraType==='NO_BALL') showBadge('no_ball',{});
 }
 });

 // Explicit ball event (emitted separately by controller)
 socket.on(SOCKET.BALL_EVENT, (ev) => {
 if (ev.type) showBadge(ev.type, ev);
 });

 socket.on(SOCKET.MATCH_ENDED, () => {
 setScore(prev => prev ? { ...prev, _ended: true } : prev);
 });

 return () => {
 clearTimeout(badgeTimer.current);
 socket.disconnect();
 };
 }, [matchId, token, fetchScore, showBadge]);

 // ─── Nothing to render until first data ─────────────────────────────────────
 if (!score) return null;

 const striker = score.batters?.[0] || null;
 const nonStriker = score.batters?.[1] || null;
 const bowler = score.bowler || null;

 // Decide strikeRate display
 const strikerSR = striker ? `SR ${striker.strikeRate || ((striker.balls ? ((striker.runs /striker.balls)*100).toFixed(0) : 0))}` : '';

 return (
 <div style={{ width: 1920, height: 1080, background: 'transparent', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

 {/* ── Event badge ─────────────────────────────────────────────────────── */}
 {badge && <EventBadge event={badge} />}

 {/* ── Scrolling Ticker ────────────────────────────────────────────────── */}
 <ScrollingTicker score={score} />

 {/* ── Match-ended banner ──────────────────────────────────────────────── */}
 {score._ended && (
 <div style={{
 position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 pointerEvents: 'none',
 }}>
 <div style={{
 background: 'rgba(0,0,0,0.9)',
 color: '#fff', fontSize: 56, fontWeight: 900, fontStyle: '',
 padding: '24px 64px', borderRadius: 24,
 letterSpacing: -2,
 }}>
 MATCH COMPLETE
 </div>
 </div>
 )}

 {/* ── Ticker bar (fixed bottom) ───────────────────────────────────────── */}
 <div style={{
 position: 'absolute', bottom: 0, left: 0, right: 0,
 height: 90,
 background: 'rgba(5,5,5,0.88)',
 backdropFilter: 'blur(20px)',
 borderTop: '2px solid #a3e635',
 display: 'flex', alignItems: 'stretch',
 animation: 'tickerIn 0.6s cubic-bezier(0.16,1,0.3,1) both',
 }}>

 {/* ── TEAM + SCORE (left) ─────────────────────────────────────────── */}
 <div style={{
 minWidth: 260,
 background: 'rgba(163,230,53,0.08)',
 borderRight: '1px solid rgba(255,255,255,0.06)',
 padding: '0 24px',
 display: 'flex', flexDirection: 'column', justifyContent: 'center',
 }}>
 <div style={{ fontSize: 9, fontWeight: 900, color: '#a3e635', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 4 }}>
 LIVE MATCH
 </div>
 <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
 {score.battingTeamName}
 </div>
 </div>

 {/* ── SCORE / OVERS ───────────────────────────────────────────────── */}
 <div style={{
 padding: '0 28px',
 display: 'flex', alignItems: 'center', gap: 20,
 borderRight: '1px solid rgba(255,255,255,0.06)',
 }}>
 <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
 <span style={{ fontSize: 46, fontWeight: 900, fontStyle: '', lineHeight: 1, color: '#fff', letterSpacing: -2 }}>
 {score.totalRuns}
 </span>
 <span style={{ fontSize: 30, fontWeight: 900, color: '#a3e635', fontStyle: '' }}>/</span>
 <span style={{ fontSize: 38, fontWeight: 900, fontStyle: '', color: '#fff', letterSpacing: -1 }}>
 {score.totalWickets}
 </span>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
 <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em' }}>OVERS</div>
 <div style={{ fontSize: 20, fontWeight: 900, color: '#e5e7eb' }}>{score.overString}</div>
 {score.crr && (
 <div style={{ fontSize: 11, color: '#a3e635', fontWeight: 700 }}>CRR {score.crr}</div>
 )}
 </div>
 {score.target && (
 <div style={{
 padding: '6px 14px', background: 'rgba(163,230,53,0.12)', borderRadius: 8,
 border: '1px solid rgba(163,230,53,0.25)',
 }}>
 <div style={{ fontSize: 9, color: '#a3e635', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>TARGET</div>
 <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{score.target}</div>
 </div>
 )}
 </div>

 {/* ── BATSMEN ─────────────────────────────────────────────────────── */}
 <div style={{
 padding: '0 24px',
 display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
 borderRight: '1px solid rgba(255,255,255,0.06)',
 minWidth: 280,
 }}>
 {striker && (
 <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a3e635', flexShrink: 0 }} />
 <span style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: -0.3, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
 {striker.name}
 </span>
 <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>{striker.runs}</span>
 <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 700 }}>({striker.balls})</span>
 <span style={{ fontSize: 10, color: '#a3e635', fontWeight: 700 }}>{strikerSR}</span>
 </div>
 )}
 {nonStriker && (
 <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
 <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'transparent', flexShrink: 0 }} />
 <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
 {nonStriker.name}
 </span>
 <span style={{ fontSize: 14, fontWeight: 900, color: '#9ca3af' }}>{nonStriker.runs}</span>
 <span style={{ fontSize: 10, color: '#4b5563', fontWeight: 700 }}>({nonStriker.balls})</span>
 </div>
 )}
 </div>

 {/* ── BOWLER ──────────────────────────────────────────────────────── */}
 {bowler && (
 <div style={{
 padding: '0 24px',
 display: 'flex', flexDirection: 'column', justifyContent: 'center',
 borderRight: '1px solid rgba(255,255,255,0.06)',
 minWidth: 200,
 }}>
 <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', marginBottom: 4 }}>BOWLING</div>
 <div style={{ fontSize: 13, fontWeight: 900, color: '#fff', textTransform: 'uppercase', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 160 }}>
 {bowler.name}
 </div>
 <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 700 }}>
 {bowler.overs}.{bowler.balls} – {bowler.wickets}/{bowler.runs}
 {bowler.economy > 0 && <span style={{ color: '#6b7280', marginLeft: 6 }}>Eco {bowler.economy}</span>}
 </div>
 </div>
 )}

 {/* ── LAST 6 BALLS ────────────────────────────────────────────────── */}
 <div style={{
 padding: '0 20px',
 display: 'flex', alignItems: 'center', gap: 10,
 flex: 1,
 }}>
 <div style={{ fontSize: 9, color: '#4b5563', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', marginRight: 4, whiteSpace: 'nowrap' }}>THIS OVER</div>
 <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
 {(score.last6Balls || []).slice(-6).map((b, i) => (
 <BallPill key={i} ball={b} size={36} />
 ))}
 {/* Placeholder dots for unfilled balls */}
 {Array.from({ length: Math.max(0, 6 - (score.last6Balls?.length || 0)) }).map((_, i) => (
 <div key={`ph-${i}`} style={{
 width: 36, height: 36, borderRadius: '50%',
 border: '2px dashed rgba(255,255,255,0.08)',
 flexShrink: 0,
 }} />
 ))}
 </div>
 </div>

 {/* ── CONNECTION DOT ──────────────────────────────────────────────── */}
 <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center' }}>
 <div style={{
 width: 8, height: 8, borderRadius: '50%',
 background: connected ? '#22c55e' : '#ef4444',
 animation: connected ? 'pulseRed 2s infinite' : 'none',
 }} />
 </div>
 </div>
 </div>
 );
};

export default LiveOverlay;
