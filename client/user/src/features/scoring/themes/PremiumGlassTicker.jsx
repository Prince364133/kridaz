import React, { useState, useEffect } from 'react';

const BALL_STYLES = {
  wicket: { bg: 'linear-gradient(135deg, #f43f5e, #be123c)', color: '#fff', border: '1px solid rgba(244,63,94,0.4)' },
  boundary: { bg: 'linear-gradient(135deg, #10b981, #047857)', color: '#fff', border: '1px solid rgba(16,185,129,0.4)' },
  six: { bg: 'linear-gradient(135deg, #d946ef, #701a75)', color: '#fff', border: '1px solid rgba(217,70,239,0.4)' },
  four: { bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: '1px solid rgba(59,130,246,0.4)' },
  wide: { bg: 'linear-gradient(135deg, #fbbf24, #b45309)', color: '#000', border: '1px solid rgba(251,191,36,0.4)' },
  no_ball: { bg: 'linear-gradient(135deg, #f97316, #c2410c)', color: '#fff', border: '1px solid rgba(249,115,22,0.4)' },
  dot: { bg: 'rgba(255, 255, 255, 0.05)', color: 'rgba(255, 255, 255, 0.4)', border: '1px solid rgba(255,255,255,0.08)' },
  run: { bg: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' },
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

function BallPill({ ball, size = 34 }) {
  const st = getBallStyle(ball);
  const lbl = ball?.label ?? (ball?.runs !== undefined ? String(ball.runs) : '?');
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '35%',
      background: st.bg,
      color: st.color,
      border: st.border,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: typeof size === 'string' ? '11px' : size * 0.35,
      fontWeight: 800,
      flexShrink: 0,
      boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
    }}>
      {lbl}
    </div>
  );
}

const BADGE_CFG = {
  six: { label: '6', bg: 'linear-gradient(135deg, rgba(168,85,247,0.85), rgba(99,102,241,0.85))', color: '#fff', dur: 2800, size: 96 },
  four: { label: '4', bg: 'linear-gradient(135deg, rgba(59,130,246,0.85), rgba(99,102,241,0.85))', color: '#fff', dur: 2400, size: 80 },
  wicket: { label: 'W!', bg: 'linear-gradient(135deg, rgba(244,63,94,0.85), rgba(190,18,60,0.85))', color: '#fff', dur: 3200, size: 80 },
  wide: { label: 'WD', bg: 'linear-gradient(135deg, rgba(251,191,36,0.85), rgba(180,83,9,0.85))', color: '#000', dur: 1600, size: 56 },
  no_ball: { label: 'NB', bg: 'linear-gradient(135deg, rgba(249,115,22,0.85), rgba(194,65,12,0.85))', color: '#fff', dur: 1600, size: 56 },
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
        width: cfg.size * 1.6, height: cfg.size * 1.6,
        borderRadius: '50%',
        background: cfg.bg,
        color: cfg.color,
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: cfg.size, fontWeight: 900,
        boxShadow: '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
        animation: `${animName} ${cfg.dur}ms ease-in-out forwards`,
      }}>
        {event.label || cfg.label}
      </div>
      {event.description && (
        <div style={{
          background: 'rgba(15, 15, 25, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '6px 16px',
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

function ScrollingTicker({ score }) {
  const [activeTab, setActiveTab] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [label, setLabel] = useState('Commentary');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!score) return;

    if (score.result) {
      setLabel('MATCH OVER');
      setDisplayText(score.result);
      return;
    }

    switch (activeTab) {
      case 0:
        setLabel('Live Update');
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
    <div className="glass-ticker-container">
      <div className="glass-ticker-label">{label}</div>
      <div className="glass-ticker-text" key={displayText}>
        {displayText}
      </div>
    </div>
  );
}

export default function PremiumGlassTicker({ score, connected, badge }) {
  const striker = score.batters?.[0] || null;
  const nonStriker = score.batters?.[1] || null;
  const bowler = score.bowler || null;
  const strikerSR = striker ? `SR ${striker.strikeRate || ((striker.balls ? ((striker.runs / striker.balls) * 100).toFixed(0) : 0))}` : '';

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative', overflow: 'hidden' }}>
      
      {/* Dynamic Keyframes for Premium Glass */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&display=swap');
        
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
        @keyframes glassTickerIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes glassScrollText {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes shine {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
        
        .glass-ticker-container {
          position: absolute;
          bottom: clamp(52px, 9vh, 98px);
          left: 12px; right: 12px;
          height: clamp(24px, 3.4vh, 40px);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex; alignItems: center; overflow: hidden;
          white-space: nowrap; 
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.25); z-index: 10;
        }
        .glass-ticker-label {
          background: linear-gradient(135deg, #6366f1, #a855f7); color: #fff;
          padding: 0 clamp(10px, 1.5vw, 20px); height: 100%;
          display: flex; alignItems: center;
          font-size: clamp(8px, 0.75vw, 12px); font-weight: 800;
          text-transform: uppercase; letter-spacing: 1.5px;
          position: relative; z-index: 20;
          box-shadow: 4px 0 15px rgba(0,0,0,0.2);
          border-right: 1px solid rgba(255,255,255,0.1);
        }
        .glass-ticker-text {
          display: inline-block; padding-left: 24px;
          font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9);
          letter-spacing: 0.5px;
          animation: glassScrollText 18s linear infinite;
        }
      `}} />

      {/* Theme Wrapper to enforce font */}
      <div className="glass-theme-wrapper">
        {/* Scrolling Ticker */}
        <ScrollingTicker score={score} />

        {/* Ticker bar (fixed bottom) */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12, right: 12,
          height: 'clamp(52px, 8.4vh, 86px)',
          background: 'rgba(15, 15, 25, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          display: 'flex', alignItems: 'stretch',
          animation: 'glassTickerIn 0.8s cubic-bezier(0.16,1,0.3,1) both',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>

          {/* TEAM + SCORE (left) */}
          <div style={{
            minWidth: 'clamp(100px, 14vw, 240px)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.05))',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            padding: '0 clamp(10px, 1.5vw, 24px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 'clamp(6px, 0.6vw, 9px)', fontWeight: 800, color: '#a855f7', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 2 }}>
              LIVE STREAM
            </div>
            <div style={{ fontSize: 'clamp(10px, 1.1vw, 17px)', fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {score.battingTeamName}
            </div>
          </div>

          {/* SCORE / OVERS */}
          <div style={{
            padding: '0 clamp(10px, 1.8vw, 28px)',
            display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.2vw, 20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 'clamp(22px, 3.6vw, 48px)', fontWeight: 900, lineHeight: 1, color: '#fff', letterSpacing: -1, textShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                {score.totalRuns}
              </span>
              <span style={{ fontSize: 'clamp(14px, 2.2vw, 30px)', fontWeight: 700, color: 'rgba(255,255,255,0.3)', margin: '0 2px' }}>/</span>
              <span style={{ fontSize: 'clamp(18px, 2.8vw, 36px)', fontWeight: 800, color: '#be123c' }}>
                {score.totalWickets}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={{ fontSize: 'clamp(6px, 0.55vw, 9px)', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>OVERS</div>
              <div style={{ fontSize: 'clamp(11px, 1.3vw, 20px)', fontWeight: 700, color: '#e5e7eb' }}>{score.overString}</div>
              {score.crr && (
                <div style={{ fontSize: 'clamp(7px, 0.6vw, 11px)', color: '#6366f1', fontWeight: 700 }}>CRR {score.crr}</div>
              )}
            </div>
            {score.target && (
              <div style={{
                padding: 'clamp(3px, 0.5vh, 6px) clamp(6px, 0.8vw, 14px)',
                background: 'rgba(255,255,255,0.05)', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: 'clamp(6px, 0.55vw, 9px)', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>TARGET</div>
                <div style={{ fontSize: 'clamp(11px, 1.4vw, 22px)', fontWeight: 800, color: '#fbbf24' }}>{score.target}</div>
              </div>
            )}
          </div>

          {/* BATSMEN */}
          <div style={{
            padding: '0 clamp(10px, 1.5vw, 24px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
            borderRight: '1px solid rgba(255,255,255,0.06)',
            minWidth: 'clamp(110px, 16vw, 280px)',
            overflow: 'hidden',
          }}>
            {striker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 0.6vw, 12px)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0, boxShadow: '0 0 8px #6366f1' }} />
                <span style={{ fontSize: 'clamp(8px, 0.85vw, 13px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {striker.name}
                </span>
                <span style={{ fontSize: 'clamp(11px, 1vw, 16px)', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{striker.runs}</span>
                <span style={{ fontSize: 'clamp(8px, 0.65vw, 11px)', color: 'rgba(255,255,255,0.4)', fontWeight: 600, flexShrink: 0 }}>({striker.balls})</span>
                <span style={{ fontSize: 'clamp(8px, 0.6vw, 10px)', color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>{strikerSR}</span>
              </div>
            )}
            {nonStriker && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 0.6vw, 12px)', opacity: 0.55 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                <span style={{ fontSize: 'clamp(8px, 0.8vw, 13px)', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {nonStriker.name}
                </span>
                <span style={{ fontSize: 'clamp(10px, 0.9vw, 14px)', fontWeight: 700, color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>{nonStriker.runs}</span>
                <span style={{ fontSize: 'clamp(8px, 0.6vw, 10px)', color: 'rgba(255,255,255,0.3)', fontWeight: 600, flexShrink: 0 }}>({nonStriker.balls})</span>
              </div>
            )}
          </div>

          {/* BOWLER */}
          {bowler && (
            <div style={{
              padding: '0 clamp(10px, 1.5vw, 24px)',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              minWidth: 'clamp(80px, 12vw, 200px)',
              overflow: 'hidden',
            }}>
              <div style={{ fontSize: 'clamp(6px, 0.55vw, 9px)', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>CURRENT BOWLER</div>
              <div style={{ fontSize: 'clamp(8px, 0.85vw, 13px)', fontWeight: 700, color: '#fff', textTransform: 'uppercase', marginBottom: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {bowler.name}
              </div>
              <div style={{ fontSize: 'clamp(8px, 0.75vw, 12px)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {bowler.overs}.{bowler.balls} – {bowler.wickets}/{bowler.runs}
                {bowler.economy > 0 && <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>Eco {bowler.economy}</span>}
              </div>
            </div>
          )}

          {/* LAST 6 BALLS */}
          <div style={{
            padding: '0 clamp(10px, 1.2vw, 20px)',
            display: 'flex', alignItems: 'center', gap: 'clamp(6px, 0.6vw, 12px)',
            flex: 1,
            overflow: 'hidden',
          }}>
            <div style={{ fontSize: 'clamp(6px, 0.55vw, 9px)', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', marginRight: 4, whiteSpace: 'nowrap' }}>THIS OVER</div>
            <div style={{ display: 'flex', gap: 'clamp(4px, 0.5vw, 8px)', alignItems: 'center', flexWrap: 'nowrap' }}>
              {(score.last6Balls || []).slice(-6).map((b, i) => (
                <BallPill key={i} ball={b} size='clamp(22px, 2.6vw, 34px)' />
              ))}
              {Array.from({ length: Math.max(0, 6 - (score.last6Balls?.length || 0)) }).map((_, i) => (
                <div key={`ph-${i}`} style={{
                  width: 'clamp(22px, 2.6vw, 34px)', height: 'clamp(22px, 2.6vw, 34px)', borderRadius: '35%',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.02)',
                  flexShrink: 0,
                }} />
              ))}
            </div>
          </div>

          {/* CONNECTION DOT */}
          <div style={{ padding: '0 clamp(10px, 1vw, 20px)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? '#10b981' : '#f43f5e',
              boxShadow: connected ? '0 0 10px #10b981' : '0 0 10px #f43f5e',
              opacity: connected ? 0.9 : 0.4,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}
