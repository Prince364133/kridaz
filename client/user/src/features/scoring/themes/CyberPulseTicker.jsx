import React, { useState, useEffect } from 'react';

const BALL_STYLES = {
  wicket: { bg: '#ff0055', color: '#fff', border: '1px solid #ff0055', glow: '0 0 10px #ff0055' },
  boundary: { bg: '#00ffcc', color: '#000', border: '1px solid #00ffcc', glow: '0 0 10px #00ffcc' },
  six: { bg: '#bc00dd', color: '#fff', border: '1px solid #bc00dd', glow: '0 0 10px #bc00dd' },
  four: { bg: '#00aaff', color: '#fff', border: '1px solid #00aaff', glow: '0 0 10px #00aaff' },
  wide: { bg: '#ffff00', color: '#000', border: '1px solid #ffff00', glow: '0 0 8px #ffff00' },
  no_ball: { bg: '#ff7700', color: '#fff', border: '1px solid #ff7700', glow: '0 0 8px #ff7700' },
  dot: { bg: 'rgba(0, 255, 255, 0.05)', color: '#00ffcc', border: '1px solid rgba(0, 255, 255, 0.2)', glow: 'none' },
  run: { bg: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', glow: 'none' },
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

function BallPill({ ball, size = 32 }) {
  const st = getBallStyle(ball);
  const lbl = ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : '?');
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '2px', // Squared tech-style
      background: st.bg,
      color: st.color,
      border: st.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: typeof size === 'string' ? '10px' : size * 0.35,
      fontWeight: 'bold',
      flexShrink: 0,
      fontFamily: "'Courier New', Courier, monospace",
      boxShadow: st.glow,
    }}>
      {lbl}
    </div>
  );
}

const BADGE_CFG = {
  six: { label: '6_RUNS', bg: 'rgba(188,0,221,0.2)', color: '#bc00dd', border: '1px solid #bc00dd', dur: 2800, size: 70 },
  four: { label: '4_RUNS', bg: 'rgba(0,170,255,0.2)', color: '#00aaff', border: '1px solid #00aaff', dur: 2400, size: 60 },
  wicket: { label: 'OUT_SYS', bg: 'rgba(255,0,85,0.2)', color: '#ff0055', border: '1px solid #ff0055', dur: 3200, size: 55 },
  wide: { label: 'WD_EXT', bg: 'rgba(255,255,0,0.2)', color: '#ffff00', border: '1px solid #ffff00', dur: 1600, size: 45 },
  no_ball: { label: 'NB_EXT', bg: 'rgba(255,119,0,0.2)', color: '#ff7700', border: '1px solid #ff7700', dur: 1600, size: 45 },
};

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
      zIndex: 99,
    }}>
      <div style={{
        width: cfg.size * 2.2, height: cfg.size * 1.4,
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: cfg.size * 0.5, fontWeight: 900,
        boxShadow: `0 0 20px ${cfg.color}`,
        animation: `${animName} ${cfg.dur}ms ease-in-out forwards, cyberFlicker 2s infinite`,
        textShadow: `0 0 8px ${cfg.color}`,
      }}>
        {event.label || cfg.label}
      </div>
      {event.description && (
        <div style={{
          background: 'rgba(5,10,10,0.95)',
          color: '#00ffcc',
          border: '1px solid #00ffcc',
          padding: '6px 16px',
          fontSize: 10,
          fontFamily: "'Share Tech Mono', monospace",
          animation: `extraBadge ${cfg.dur}ms ease-in-out forwards`,
          whiteSpace: 'nowrap',
          boxShadow: '0 0 10px rgba(0, 255, 204, 0.4)',
        }}>
          {event.description.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function ScrollingTicker({ score }) {
  const [activeTab, setActiveTab] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [label, setLabel] = useState('SYS_LOG');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!score) return;

    if (score.result) {
      setLabel('SYS_HALT');
      setDisplayText(`CRITICAL: ${score.result}`);
      return;
    }

    switch (activeTab) {
      case 0:
        setLabel('LIVE_DATA');
        setDisplayText(score.commentary ? `COMM: ${score.commentary}` : "ESTABLISHING CORE LINK...");
        break;
      case 1:
        setLabel('NET_SYNC');
        setDisplayText(`PARTNERSHIP MODULE: [${score.partnership?.runs || 0} RUNS // ${score.partnership?.balls || 0} BALLS]`);
        break;
      case 2:
        if (score.target) {
          setLabel('OBJ_EVAL');
          setDisplayText(`REQ: ${score.runsNeeded} RUNS // REM: ${score.ballsRemaining} BALLS // RRR: ${score.rrr}`);
        } else {
          setLabel('SYS_METRIC');
          setDisplayText(`CRR: ${score.crr} // ACTIVE_NODE: ${score.battingTeamName}`);
        }
        break;
      default:
        break;
    }
  }, [activeTab, score]);

  if (!displayText) return null;

  return (
    <div className="cyber-ticker-container">
      <div className="cyber-ticker-label">
        <span style={{ animation: 'cyberFlicker 2s infinite' }}>{label}</span>
      </div>
      <div className="cyber-ticker-text" key={displayText}>
        {displayText}
      </div>
    </div>
  );
}

export default function CyberPulseTicker({ score, connected, badge }) {
  const striker = score.batters?.[0] || null;
  const nonStriker = score.batters?.[1] || null;
  const bowler = score.bowler || null;
  const strikerSR = striker ? `SR[${striker.strikeRate || ((striker.balls ? ((striker.runs / striker.balls) * 100).toFixed(0) : 0))}]` : '';

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      
      {/* Dynamic Keyframes for Cyber Pulse */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap');
        
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
        .cyber-theme-wrapper {
          font-family: 'Share Tech Mono', monospace !important;
          color: #00ffff;
          text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
        }

        @keyframes cyberTickerIn {
          0% { clip-path: inset(0 50% 0 50%); opacity: 0; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        @keyframes cyberScrollText {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes cyberFlicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.99; filter: none; }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; filter: blur(1px); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        .cyber-ticker-container {
          position: absolute;
          bottom: clamp(52px, 8.4vh, 90px);
          left: 12px; right: 12px;
          height: clamp(24px, 3.4vh, 38px);
          background: rgba(0, 15, 15, 0.85);
          display: flex; alignItems: center; overflow: hidden;
          white-space: nowrap; 
          border: 1px solid #00ffcc;
          border-radius: 2px;
          box-shadow: 0 0 15px rgba(0, 255, 204, 0.2); z-index: 10;
        }
        .cyber-ticker-label {
          background: #ff0055; color: #fff;
          padding: 0 clamp(8px, 1.2vw, 16px); height: 100%;
          display: flex; alignItems: center;
          font-size: clamp(8px, 0.7vw, 11px); font-weight: bold;
          text-transform: uppercase; letter-spacing: 1px;
          position: relative; z-index: 20;
          border-right: 1px solid #ff0055;
          text-shadow: 0 0 5px #fff;
        }
        .cyber-ticker-text {
          display: inline-block; padding-left: 20px;
          font-size: 14px; color: #00ffcc;
          animation: cyberScrollText 17s linear infinite;
        }
      `}} />

      {/* Futuristic Scanline Effect */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
        backgroundSize: '100% 4px, 6px 100%',
        pointerEvents: 'none',
        zIndex: 99
      }} />

      {/* Theme Wrapper to enforce font */}
      <div className="cyber-theme-wrapper">
        {/* Scrolling Ticker */}
        <ScrollingTicker score={score} />

        {/* Ticker bar (fixed bottom) */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          height: 'clamp(52px, 8.4vh, 90px)',
          background: 'rgba(5, 10, 10, 0.9)',
          border: '1px solid #00ffcc',
          boxShadow: '0 0 20px rgba(0, 255, 204, 0.15)',
          borderRadius: 2,
          display: 'flex', alignItems: 'stretch',
          animation: 'cyberTickerIn 0.8s cubic-bezier(0.075, 0.82, 0.165, 1) both',
          overflow: 'hidden',
        }}>

          {/* TEAM + SCORE (left) */}
          <div style={{
            minWidth: 'clamp(100px, 14vw, 240px)',
            background: 'rgba(0, 255, 204, 0.05)',
            borderRight: '1px solid rgba(0, 255, 204, 0.3)',
            padding: '0 clamp(10px, 1.5vw, 24px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ fontSize: '7px', color: '#ff0055', letterSpacing: '2px', animation: 'cyberFlicker 3s infinite' }}>
              SYS_ACTIVE
            </div>
            <div style={{ fontSize: 'clamp(10px, 1.1vw, 17px)', fontWeight: 'bold', color: '#00ffcc', textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {score.battingTeamName}
            </div>
          </div>

          {/* SCORE / OVERS */}
          <div style={{
            padding: '0 clamp(10px, 1.8vw, 28px)',
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 20px)',
            borderRight: '1px solid rgba(0, 255, 204, 0.3)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: 'clamp(24px, 3.8vw, 48px)', fontWeight: 'bold', color: '#ffffff', textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>
                {score.totalRuns}
              </span>
              <span style={{ fontSize: 'clamp(14px, 2.2vw, 30px)', color: '#ff0055' }}>/</span>
              <span style={{ fontSize: 'clamp(18px, 2.8vw, 36px)', fontWeight: 'bold', color: '#ff0055', textShadow: '0 0 8px rgba(255,0,85,0.4)' }}>
                {score.totalWickets}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: '7px', color: 'rgba(0, 255, 204, 0.5)' }}>OVERS_VAL</div>
              <div style={{ fontSize: 'clamp(11px, 1.3vw, 20px)', fontWeight: 'bold', color: '#ffffff' }}>{score.overString}</div>
              {score.crr && (
                <div style={{ fontSize: 'clamp(7px, 0.6vw, 11px)', color: '#00ffcc' }}>CRR::{score.crr}</div>
              )}
            </div>
            {score.target && (
              <div style={{
                padding: '4px 10px',
                background: 'rgba(255, 0, 85, 0.1)',
                border: '1px solid #ff0055',
                borderRadius: 2
              }}>
                <div style={{ fontSize: '6px', color: '#ff0055' }}>TARGET_OBJ</div>
                <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold' }}>{score.target}</div>
              </div>
            )}
          </div>

          {/* BATSMEN */}
          <div style={{
            padding: '0 clamp(10px, 1.5vw, 24px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
            borderRight: '1px solid rgba(0, 255, 204, 0.3)',
            minWidth: 'clamp(110px, 16vw, 280px)',
            overflow: 'hidden',
          }}>
            {striker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#ff0055', fontSize: '10px' }}>»</span>
                <span style={{ fontSize: '9px', color: '#fff', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {striker.name}
                </span>
                <span style={{ fontSize: '11px', color: '#00ffcc', fontWeight: 'bold' }}>{striker.runs}</span>
                <span style={{ fontSize: '8px', color: 'rgba(0, 255, 204, 0.5)' }}>({striker.balls})</span>
                <span style={{ fontSize: '8px', color: '#ff0055' }}>{strikerSR}</span>
              </div>
            )}
            {nonStriker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.6 }}>
                <span style={{ color: 'transparent', fontSize: '10px' }}>»</span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {nonStriker.name}
                </span>
                <span style={{ fontSize: '10px', color: '#00ffcc' }}>{nonStriker.runs}</span>
                <span style={{ fontSize: '8px', color: 'rgba(0, 255, 204, 0.3)' }}>({nonStriker.balls})</span>
              </div>
            )}
          </div>

          {/* BOWLER */}
          {bowler && (
            <div style={{
              padding: '0 clamp(10px, 1.5vw, 24px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderRight: '1px solid rgba(0, 255, 204, 0.3)',
              minWidth: 'clamp(80px, 12vw, 200px)',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: '6px', color: 'rgba(0, 255, 204, 0.5)', marginBottom: 2 }}>UNIT_BOWLING</div>
              <div style={{ fontSize: '9px', color: '#fff', textTransform: 'uppercase', marginBottom: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {bowler.name}
              </div>
              <div style={{ fontSize: '9px', color: '#00ffcc', whiteSpace: 'nowrap' }}>
                {bowler.overs}.{bowler.balls} OVR * {bowler.wickets}W/{bowler.runs}R
              </div>
            </div>
          )}

          {/* LAST 6 BALLS */}
          <div style={{
            padding: '0 clamp(10px, 1.2vw, 20px)',
            display: 'flex', alignItems: 'center', gap: 10,
            flex: 1,
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: '7px', color: 'rgba(0, 255, 204, 0.5)', marginRight: 4, whiteSpace: 'nowrap' }}>QUEUE</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
              {(score.last6Balls || []).slice(-6).map((b, i) => (
                <BallPill key={i} ball={b} size={26} />
              ))}
              {Array.from({ length: Math.max(0, 6 - (score.last6Balls?.length || 0)) }).map((_, i) => (
                <div key={`ph-${i}`} style={{
                  width: 26, height: 26, borderRadius: '2px',
                  border: '1px dashed rgba(0, 255, 254, 0.25)',
                  background: 'rgba(0, 255, 204, 0.02)',
                  flexShrink: 0,
                }} />
              ))}
            </div>
          </div>

          {/* SYNC METRIC */}
          <div style={{ padding: '0 clamp(10px, 1vw, 20px)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              fontSize: '9px',
              color: connected ? '#00ffcc' : '#ff0055',
              textShadow: connected ? '0 0 5px #00ffcc' : '0 0 5px #ff0055',
              animation: 'cyberFlicker 1.5s infinite'
            }}>
              {connected ? 'LINK::100%' : 'LINK::DROP'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
