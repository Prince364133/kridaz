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
import {
  NeonClassicTicker,
  PremiumGlassTicker,
  RetroArcadeTicker,
  SportsNetworkTicker,
  CyberPulseTicker
} from '../themes';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:6001';

const THEME_MAP = {
  neon_classic: NeonClassicTicker,
  classic: NeonClassicTicker, // legacy alias for old DB records
  premium_glass: PremiumGlassTicker,
  retro_arcade: RetroArcadeTicker,
  sports_network: SportsNetworkTicker,
  cyber_pulse: CyberPulseTicker,
};

// ─── Badge duration config per event type for state timings ──────────────────
const BADGE_CFG = {
  six: { dur: 2800 },
  four: { dur: 2400 },
  wicket: { dur: 3200 },
  wide: { dur: 1600 },
  no_ball: { dur: 1600 },
};

// ─── CSS injected once into the document head ────────────────────────────────
const GLOBAL_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html {
    background: transparent !important;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
  }
  @keyframes tickerIn {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

function injectCSS(css) {
  if (document.getElementById('overlay-css')) return;
  const style = document.createElement('style');
  style.id = 'overlay-css';
  style.textContent = css;
  document.head.appendChild(style);
}

// ─── Main overlay ─────────────────────────────────────────────────────────────
const LiveOverlay = () => {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [score, setScore] = useState(null);
  const [badge, setBadge] = useState(null); // current animated badge
  const [aiCommentary, setAiCommentary] = useState(null);
  const [connected, setConnected] = useState(false);
  const badgeTimer = useRef(null);
  const commentaryTimer = useRef(null);
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
    setBadge({ type, description: buildDesc(type, data), ...data });
    badgeTimer.current = setTimeout(() => setBadge(null), cfg.dur + 200);
  }, []);

  function buildDesc(type, data) {
    if (type === 'six') return `${data.strikerName || ''} hits a MAXIMUM!`.trim();
    if (type === 'four') return `${data.strikerName || ''} finds the boundary!`.trim();
    if (type === 'wicket') return `OUT! ${data.wicketType?.replace(/_/g,' ') || ''}`.trim();
    if (type === 'wide') return 'Wide ball';
    if (type === 'no_ball') return 'No Ball!';
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
      socket.emit('joinMatch', matchId);
      if (token) socket.emit('overlayJoin', { matchId, token });
    };

    socket.on('connect', () => {
      setConnected(true);
      joinRoom();
      fetchScore(); // re-sync on reconnect
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('reconnect', () => { setConnected(true); joinRoom(); fetchScore(); });

    // Primary score update ────────────────────────────────────────────────────
    socket.on('scoreUpdated', (data) => {
      setScore(data);
      // Derive badge from lastBallRaw if no explicit ballEvent follows
      const lb = data?.lastBallRaw;
      if (lb) {
        if (lb.isWicket) showBadge('wicket', { wicketType: lb.wicketType });
        else if (lb.isBoundary && lb.runs === 6) showBadge('six', { strikerName: data?.batters?.[0]?.name });
        else if (lb.isBoundary && lb.runs === 4) showBadge('four', { strikerName: data?.batters?.[0]?.name });
        else if (lb.extraType === 'WIDE') showBadge('wide', {});
        else if (lb.extraType === 'NO_BALL') showBadge('no_ball', {});
      }
    });

    // Explicit ball event (emitted separately by controller)
    socket.on('ballEvent', (ev) => {
      if (ev.type) showBadge(ev.type, ev);
    });

    socket.on('matchEnded', () => {
      setScore(prev => prev ? { ...prev, _ended: true } : prev);
    });

    // Theme-only update (fired when no cached score exists on backend)
    socket.on('themeUpdated', (newTheme) => {
      setScore(prev => prev ? { ...prev, tickerTheme: newTheme } : prev);
    });

    socket.on('COMMENTARY_GENERATED', (data) => {
      clearTimeout(commentaryTimer.current);
      setAiCommentary(data);
      
      // Auto-hide after 15 seconds
      commentaryTimer.current = setTimeout(() => {
        setAiCommentary(null);
      }, 15000);

      if (data.audioUrl) {
        const audio = new Audio(`${API_BASE}${data.audioUrl}`);
        audio.play().catch(e => console.warn('Overlay audio play failed:', e));
      } else {
        const utterance = new SpeechSynthesisUtterance(data.text);
        utterance.lang = data.language === 'hi' ? 'hi-IN' : 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    });

    return () => {
      clearTimeout(badgeTimer.current);
      clearTimeout(commentaryTimer.current);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [matchId, token, fetchScore, showBadge]);

  // ─── Nothing to render until first data ─────────────────────────────────────
  if (!score) return null;

  if (score.status === 'NOT_STARTED' || !score.isLive) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
          background: 'rgba(5,5,5,0.88)', backdropFilter: 'blur(20px)',
          borderTop: '2px solid #a3e635', display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'tickerIn 0.6s cubic-bezier(0.16,1,0.3,1) both'
        }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <span style={{ color: '#a3e635' }}>{score.teamA?.name}</span> <span style={{ opacity: 0.5, margin: '0 16px' }}>VS</span> <span style={{ color: '#a3e635' }}>{score.teamB?.name}</span>
            <span style={{ marginLeft: 32, fontSize: 20, color: '#9ca3af' }}>MATCH STARTS SOON</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to neon_classic theme
  const ActiveTicker = THEME_MAP[score.tickerTheme] || NeonClassicTicker;

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      
      {/* Dynamic Animated Ticker Component */}
      <ActiveTicker score={score} connected={connected} badge={badge} />

      {/* AI Commentary Overlay Toast */}
      {aiCommentary?.text && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          maxWidth: '400px',
          background: 'rgba(5, 5, 5, 0.9)',
          border: '1px solid rgba(163, 230, 53, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          color: 'white',
          fontFamily: "'Inter', sans-serif",
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          animation: 'tickerIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
          zIndex: 1000,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a3e635', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '12px', fontWeight: 900, color: '#a3e635', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Commentary</span>
          </div>
          <p style={{ fontSize: '15px', lineHeight: '1.5', fontStyle: 'italic', color: '#e5e7eb', margin: 0 }}>
            "{aiCommentary.text}"
          </p>
        </div>
      )}

      {/* Match-ended banner overlay */}
      {(score._ended || score.status === 'COMPLETED') && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.9)',
            color: '#fff', fontSize: 56, fontWeight: 900,
            padding: '24px 64px', borderRadius: 24,
            letterSpacing: -2,
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          }}>
            MATCH COMPLETE
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveOverlay;
