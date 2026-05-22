import React, { useState, useEffect } from 'react';

const BALL_STYLES = {
  wicket: { bg: '#ff0055', color: '#fff', border: '3px double #ff0055' },
  boundary: { bg: '#00ff66', color: '#000', border: '3px double #00ff66' },
  six: { bg: '#ff00ff', color: '#fff', border: '3px double #ff00ff' },
  four: { bg: '#00ffff', color: '#000', border: '3px double #00ffff' },
  wide: { bg: '#ffff00', color: '#000', border: '3px double #ffff00' },
  no_ball: { bg: '#ff6600', color: '#fff', border: '3px double #ff6600' },
  dot: { bg: '#333333', color: '#888888', border: '3px double #555555' },
  run: { bg: '#111111', color: '#ffffff', border: '3px double #ffffff' },
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
      background: st.bg,
      color: st.color,
      border: st.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: typeof size === 'string' ? '10px' : size * 0.35,
      fontFamily: "'Press Start 2P', monospace",
      fontWeight: 'bold',
      flexShrink: 0,
      boxShadow: '4px 4px 0px rgba(0,0,0,0.5)',
    }}>
      {lbl}
    </div>
  );
}

const BADGE_CFG = {
  six: { label: '6!', bg: '#ff00ff', color: '#fff', border: '4px double #00ffff', dur: 2800, size: 70 },
  four: { label: '4!', bg: '#00ffff', color: '#000', border: '4px double #ff00ff', dur: 2400, size: 60 },
  wicket: { label: 'OUT', bg: '#ff0055', color: '#fff', border: '4px double #ffff00', dur: 3200, size: 55 },
  wide: { label: 'WD', bg: '#ffff00', color: '#000', border: '4px double #ff0055', dur: 1600, size: 45 },
  no_ball: { label: 'NB', bg: '#ff6600', color: '#fff', border: '4px double #00ff66', dur: 1600, size: 45 },
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
        width: cfg.size * 1.8, height: cfg.size * 1.8,
        background: cfg.bg,
        color: cfg.color,
        border: cfg.border,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: cfg.size, fontWeight: 900,
        boxShadow: '8px 8px 0px rgba(0,0,0,0.5)',
        animation: `${animName} ${cfg.dur}ms steps(4) forwards`,
      }}>
        {event.label || cfg.label}
      </div>
      {event.description && (
        <div style={{
          background: '#000',
          color: '#00ff66',
          border: '3px double #00ff66',
          padding: '6px 16px',
          fontSize: 10,
          fontFamily: "'Press Start 2P', monospace",
          animation: `extraBadge ${cfg.dur}ms steps(4) forwards`,
          whiteSpace: 'nowrap',
          boxShadow: '6px 6px 0px rgba(0,0,0,0.5)',
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
  const [label, setLabel] = useState('QUEST');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!score) return;

    if (score.result) {
      setLabel('GAME OVER');
      setDisplayText(score.result);
      return;
    }

    switch (activeTab) {
      case 0:
        setLabel('LOG');
        setDisplayText(score.commentary || "READY PLAYER ONE...");
        break;
      case 1:
        setLabel('CO-OP');
        setDisplayText(`PARTNERSHIP: ${score.partnership?.runs || 0} RUNS FROM ${score.partnership?.balls || 0} BALLS`);
        break;
      case 2:
        if (score.target) {
          setLabel('CHASE');
          setDisplayText(`NEED ${score.runsNeeded} RUNS FROM ${score.ballsRemaining} BALLS`);
        } else {
          setLabel('STATS');
          setDisplayText(`CRR: ${score.crr} * ${score.battingTeamName} IS PLAYING`);
        }
        break;
      default:
        break;
    }
  }, [activeTab, score]);

  if (!displayText) return null;

  return (
    <div className="retro-ticker-container">
      <div className="retro-ticker-label">{label}</div>
      <div className="retro-ticker-text" key={displayText}>
        {displayText}
      </div>
    </div>
  );
}

export default function RetroArcadeTicker({ score, connected, badge }) {
  const striker = score.batters?.[0] || null;
  const nonStriker = score.batters?.[1] || null;
  const bowler = score.bowler || null;
  const strikerSR = striker ? `SR:${striker.strikeRate || ((striker.balls ? ((striker.runs / striker.balls) * 100).toFixed(0) : 0))}` : '';

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      
      {/* Dynamic Keyframes for Retro Arcade */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
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
        .retro-theme-wrapper {
          font-family: 'Press Start 2P', monospace !important;
          color: #fff;
        }

        @keyframes retroTickerIn {
          0% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
          100% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
        }
        @keyframes retroScrollText {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes retroBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .retro-ticker-container {
          position: absolute;
          bottom: clamp(62px, 10vh, 102px);
          left: 0; right: 0;
          height: clamp(24px, 3.4vh, 38px);
          background: #000;
          display: flex; alignItems: center; overflow: hidden;
          white-space: nowrap; 
          border-top: 4px solid #ffff00;
          border-bottom: 4px solid #ffff00;
          box-shadow: 0 -4px 15px rgba(0,0,0,0.5); z-index: 10;
        }
        .retro-ticker-label {
          background: #ff00ff; color: #fff;
          padding: 0 clamp(8px, 1.2vw, 16px); height: 100%;
          display: flex; alignItems: center;
          font-size: 8px; font-weight: bold;
          text-transform: uppercase; letter-spacing: 1px;
          position: relative; z-index: 20;
          border-right: 4px solid #ffff00;
        }
        .retro-ticker-text {
          display: inline-block; padding-left: 20px;
          font-size: 10px; color: #00ff66;
          animation: retroScrollText 20s linear infinite;
        }
      `}} />

      {/* Theme Wrapper to enforce font */}
      <div className="retro-theme-wrapper">
        {/* Scrolling Ticker */}
        <ScrollingTicker score={score} />

        {/* Ticker bar (fixed bottom) */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 'clamp(62px, 10vh, 98px)',
          background: '#000000',
          borderTop: '6px solid #00ffff',
          display: 'flex', alignItems: 'stretch',
          animation: 'retroTickerIn 0.4s steps(4) both',
          overflow: 'hidden',
          boxShadow: '0 -8px 0px rgba(0, 0, 0, 0.4)',
        }}>

          {/* TEAM + SCORE (left) */}
          <div style={{
            minWidth: 'clamp(110px, 16vw, 240px)',
            background: '#111111',
            borderRight: '4px solid #00ffff',
            padding: '0 clamp(8px, 1vw, 16px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            gap: 4
          }}>
            <div style={{ fontSize: '6px', color: '#ff00ff', animation: 'retroBlink 1.5s step-end infinite' }}>
              1UP * LIVE
            </div>
            <div style={{ fontSize: '9px', color: '#ffffff', textTransform: 'uppercase', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {score.battingTeamName}
            </div>
          </div>

          {/* SCORE / OVERS */}
          <div style={{
            padding: '0 clamp(8px, 1.5vw, 24px)',
            display: 'flex', alignItems: 'center', gap: 'clamp(10px, 1.5vw, 24px)',
            borderRight: '4px solid #00ffff',
            flexShrink: 0,
            background: '#000',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '18px', color: '#00ff66' }}>
                {score.totalRuns}
              </span>
              <span style={{ fontSize: '12px', color: '#ff00ff' }}>-</span>
              <span style={{ fontSize: '16px', color: '#ff0055' }}>
                {score.totalWickets}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ fontSize: '6px', color: '#888' }}>OVR</div>
              <div style={{ fontSize: '10px', color: '#ffff00' }}>{score.overString}</div>
            </div>
            {score.target && (
              <div style={{
                padding: '4px 8px',
                background: '#111',
                border: '2px solid #ff00ff',
              }}>
                <div style={{ fontSize: '5px', color: '#ff00ff', marginBottom: 2 }}>TARGET</div>
                <div style={{ fontSize: '10px', color: '#00ffff' }}>{score.target}</div>
              </div>
            )}
          </div>

          {/* BATSMEN */}
          <div style={{
            padding: '0 clamp(8px, 1.5vw, 24px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6,
            borderRight: '4px solid #00ffff',
            minWidth: 'clamp(120px, 18vw, 280px)',
            overflow: 'hidden',
          }}>
            {striker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#00ffff', fontSize: '9px', flexShrink: 0 }}>&gt;</span>
                <span style={{ fontSize: '8px', color: '#fff', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {striker.name}
                </span>
                <span style={{ fontSize: '8px', color: '#00ff66', flexShrink: 0 }}>{striker.runs}</span>
                <span style={{ fontSize: '6px', color: '#888', flexShrink: 0 }}>({striker.balls})</span>
              </div>
            )}
            {nonStriker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6 }}>
                <span style={{ color: 'transparent', fontSize: '9px', flexShrink: 0 }}>&gt;</span>
                <span style={{ fontSize: '8px', color: '#aaa', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {nonStriker.name}
                </span>
                <span style={{ fontSize: '8px', color: '#aaa', flexShrink: 0 }}>{nonStriker.runs}</span>
                <span style={{ fontSize: '6px', color: '#666', flexShrink: 0 }}>({nonStriker.balls})</span>
              </div>
            )}
          </div>

          {/* BOWLER */}
          {bowler && (
            <div style={{
              padding: '0 clamp(8px, 1.5vw, 24px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderRight: '4px solid #00ffff',
              minWidth: 'clamp(90px, 14vw, 200px)',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: '5px', color: '#ff00ff', marginBottom: 4 }}>BOWL</div>
              <div style={{ fontSize: '8px', color: '#ffffff', textTransform: 'uppercase', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {bowler.name}
              </div>
              <div style={{ fontSize: '7px', color: '#00ffff', whiteSpace: 'nowrap' }}>
                {bowler.overs}.{bowler.balls} OVR * {bowler.wickets}W/{bowler.runs}R
              </div>
            </div>
          )}

          {/* LAST 6 BALLS */}
          <div style={{
            padding: '0 clamp(8px, 1vw, 16px)',
            display: 'flex', alignItems: 'center', gap: 8,
            flex: 1,
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: '6px', color: '#ff00ff', marginRight: 4, whiteSpace: 'nowrap' }}>OVER</div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
              {(score.last6Balls || []).slice(-6).map((b, i) => (
                <BallPill key={i} ball={b} size={28} />
              ))}
              {Array.from({ length: Math.max(0, 6 - (score.last6Balls?.length || 0)) }).map((_, i) => (
                <div key={`ph-${i}`} style={{
                  width: 28, height: 28,
                  border: '3px double #333',
                  background: '#000',
                  flexShrink: 0,
                }} />
              ))}
            </div>
          </div>

          {/* CONNECTION STATUS */}
          <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <span style={{
              fontSize: '8px',
              color: connected ? '#00ff66' : '#ff0055',
              animation: connected ? 'none' : 'retroBlink 0.5s step-end infinite'
            }}>
              {connected ? 'OK' : 'ERR'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
