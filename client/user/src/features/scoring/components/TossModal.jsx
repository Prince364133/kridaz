import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, RotateCcw } from 'lucide-react';

/**
 * TossModal
 *
 * Props:
 *   teamA      - { id, name }
 *   teamB      - { id, name }
 *   hasPassword- boolean
 *   onConfirm  - called with { winnerTeam, decision, password }
 *   onCancel   - to close if needed
 */
const TossModal = ({ teamA, teamB, hasPassword, onConfirm, onCancel }) => {
  const [step, setStep] = useState('FLIP_IDLE'); // FLIP_IDLE, FLIPPING, FLIP_RESULT, WINNER_SELECT, DECISION_SELECT, SUMMARY
  const [coinResult, setCoinResult] = useState(null); // 'Heads' or 'Tails'
  const [coinRotation, setCoinRotation] = useState(0);
  const [winnerTeam, setWinnerTeam] = useState(null);
  const [decision, setDecision] = useState(null);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultOverlay, setShowResultOverlay] = useState(false);

  const teams = [teamA, teamB].filter(Boolean);

  const teamAName = teamA?.name || 'Team A';
  const teamBName = teamB?.name || 'Team B';

  const handleFlip = () => {
    setStep('FLIPPING');
    const result = Math.random() > 0.5 ? 'Heads' : 'Tails';
    // 5 full rotations + land on heads (0) or tails (180)
    const finalRotation = coinRotation + 1800 + (result === 'Tails' ? 180 : 0);
    setCoinRotation(finalRotation);

    setTimeout(() => {
      setCoinResult(result);
      setStep('FLIP_RESULT');
      setTimeout(() => {
        setStep('WINNER_SELECT');
      }, 1500);
    }, 2000);
  };

  const handleStartMatch = async () => {
    if (hasPassword && !password) return;
    setIsSubmitting(true);
    await onConfirm({ winnerTeam, decision, password });
    setIsSubmitting(false);
  };

  const handleReToss = () => {
    setStep('FLIP_IDLE');
    setWinnerTeam(null);
    setWinnerTeam(null);
    setDecision(null);
    setCoinResult(null);
    setShowResultOverlay(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-[#e5e2e1] flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* CSS for 3D coin */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
      `}</style>


      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center px-5 py-8 overflow-y-auto">

        {/* COIN FLIP STEPS */}
        {(step === 'FLIP_IDLE' || step === 'FLIPPING' || step === 'FLIP_RESULT') && (
          <div className="flex flex-col items-center w-full h-full">
            {/* 3D Coin — centered in remaining space */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-52 h-52 perspective-1000">
              <motion.div
                animate={{ rotateY: coinRotation }}
                transition={{
                  duration: step === 'FLIPPING' ? 2 : 0.5,
                  ease: step === 'FLIPPING' ? 'easeInOut' : 'easeOut',
                }}
                className="w-full h-full preserve-3d relative cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                onClick={() => {
                  if (step === 'FLIP_IDLE') {
                    setCoinRotation(prev => prev + 180);
                  }
                }}
              >
                {/* Heads Face */}
                <div
                  className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center backface-hidden"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #a8f5b0, #69de80 40%, #006d2d)',
                    border: '4px solid #7bf090',
                    boxShadow: '0 0 40px rgba(123,240,144,0.35)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[#003914] text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
                    <span className="font-black text-[#003914] text-xl uppercase tracking-widest" style={{ fontFamily: 'Anton, sans-serif' }}>HEADS</span>
                  </div>
                </div>
                {/* Tails Face */}
                <div
                  className="absolute inset-0 w-full h-full rounded-full flex items-center justify-center backface-hidden"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #a8e8e8, #45dada 40%, #004f50)',
                    border: '4px solid #45dada',
                    boxShadow: '0 0 40px rgba(69,218,218,0.35)',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-[#002020] text-7xl" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
                    <span className="font-black text-[#002020] text-xl uppercase tracking-widest" style={{ fontFamily: 'Anton, sans-serif' }}>TAILS</span>
                  </div>
                </div>
              </motion.div>
              </div>
            </div>

            {/* Buttons pinned to bottom */}
            <div className="w-full space-y-3 pb-6">
              {step === 'FLIP_IDLE' && (
                <button
                  onClick={handleFlip}
                  className="w-full py-4 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 font-bold text-[12px] uppercase tracking-[0.15em] text-[#006d2d]"
                  style={{ background: 'linear-gradient(135deg, #7bf090 0%, #45dada 100%)' }}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>cached</span>
                  FLIP COIN
                </button>
              )}

              {step === 'FLIPPING' && (
                <p className="text-[#bdcaba] font-bold animate-pulse uppercase tracking-widest text-center text-sm">Flipping...</p>
              )}

              {step === 'FLIP_RESULT' && (
                <div className="text-center space-y-3">
                  <p className="text-2xl font-black text-white">It's <span style={{ color: coinResult === 'Heads' ? '#7bf090' : '#45dada' }}>{coinResult}</span>!</p>
                </div>
              )}

              {step === 'FLIP_IDLE' && (
                <button
                  onClick={onCancel}
                  className="w-full py-4 rounded-lg border border-[#3e4a3e] bg-white/5 hover:bg-white/10 transition-all active:scale-95 font-bold text-[12px] uppercase tracking-[0.15em] text-[#bdcaba]"
                >
                  Back
                </button>
              )}
            </div>
          </div>
        )}

        {/* WINNER SELECT */}
        {step === 'WINNER_SELECT' && (
          <div className="w-full h-full flex flex-col max-w-md mx-auto">
            <div className="flex-1 pt-12">
              {/* Modal Header */}
              <div className="text-left mb-10">
                <span className="text-[12px] font-bold tracking-[0.08em] text-[#45dada] mb-2 block uppercase">MATCH PROTOCOL</span>
                <h2 className="text-[24px] font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Anton, sans-serif' }}>WHO WON THE TOSS?</h2>
              </div>

              {/* Team Selection Grid */}
              <div className="grid grid-cols-1 gap-4">
                {teams.map((team, index) => {
                  const isSelected = winnerTeam === team.id;
                  const isTeamA = index === 0;
                  
                  return (
                    <button
                      key={team.id}
                      onClick={() => setWinnerTeam(team.id)}
                      className={`group relative flex items-center justify-between p-5 bg-[#1c1b1b] border rounded-xl transition-all active:scale-[0.98] text-left overflow-hidden ${isSelected ? 'border-[#7bf090] bg-[#222222]' : 'border-[#3e4a3e]'}`}
                    >
                      {/* Animated Green Outline */}
                      {isSelected && (
                        <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-[#7bf090] animate-[pulse_1.5s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_15px_rgba(123,240,144,0.3)]" />
                      )}

                      <div className="flex items-center gap-4 relative z-10">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-normal text-[32px] tracking-[0.05em] ${isTeamA ? 'bg-[#7bf090] text-[#006d2d]' : 'bg-[#00bbbc] text-[#004545]'}`} style={{ fontFamily: 'Anton, sans-serif' }}>
                          {isTeamA ? 'A' : 'B'}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold tracking-[0.08em] text-[#bdcaba] uppercase mb-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>TEAM {isTeamA ? 'ALPHA' : 'BRAVO'}</p>
                          <p className="text-[18px] font-normal text-white uppercase tracking-[0.02em]" style={{ fontFamily: 'Anton, sans-serif' }}>{team.name}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Area - Anchored to bottom */}
            <div className="flex flex-col gap-3 pb-4 pt-6 mt-auto">
              <button
                onClick={() => {
                  if (winnerTeam) setStep('DECISION_SELECT');
                }}
                disabled={!winnerTeam}
                className={`w-full py-4 rounded-lg font-bold text-[13px] text-[#003914] uppercase tracking-widest shadow-lg transition-all ${!winnerTeam ? 'opacity-50 cursor-not-allowed bg-[#2a2a2a] text-white/50' : 'active:scale-95'}`}
                style={{ background: winnerTeam ? 'linear-gradient(135deg, #7bf090 0%, #45dada 100%)' : undefined }}
              >
                CONFIRM TOSS WINNER
              </button>
              <button
                onClick={() => {
                  onConfirm({ winnerTeam: null, decision: null, password });
                }}
                className="w-full py-4 bg-[#1c1b1b] border border-[#3e4a3e] text-[#bdcaba] rounded-lg font-bold text-[13px] uppercase tracking-widest hover:text-white hover:bg-[#2a2a2a] transition-all"
              >
                SKIP TO MATCH
              </button>
            </div>
          </div>
        )}

        {/* DECISION SELECT */}
        {step === 'DECISION_SELECT' && (
          <div className="w-full h-full flex flex-col max-w-md mx-auto">
            <div className="flex-1 pt-12">
              {/* Header */}
              <div className="text-left mb-10">
                <span className="text-[12px] font-bold tracking-[0.08em] text-[#45dada] mb-2 block uppercase">TOSS WON BY {teams.find(t => t.id === winnerTeam)?.name}</span>
                <h2 className="text-[24px] font-black text-white uppercase tracking-wider" style={{ fontFamily: 'Anton, sans-serif' }}>DECISION</h2>
              </div>

              {/* BAT OR BOWL CARDS */}
              <div className="flex flex-col gap-4">
                {/* BAT */}
                <button
                  onClick={() => setDecision('BAT')}
                  className={`group relative flex items-center justify-between p-6 rounded-xl transition-all active:scale-[0.98] text-left overflow-hidden ${decision === 'BAT' ? 'bg-[linear-gradient(135deg,#7bf090_0%,#45dada_100%)] text-[#003914] shadow-[0_0_20px_rgba(123,240,144,0.2)]' : 'bg-[#1c1b1b] border border-[#3e4a3e] text-white hover:bg-[#222]'}`}
                >
                  <div className="relative z-10">
                    <h3 className="text-[40px] uppercase leading-none" style={{ fontFamily: 'Anton, sans-serif' }}>BAT</h3>
                    <p className={`text-[12px] font-bold tracking-[0.08em] mt-2 ${decision === 'BAT' ? 'text-[#004f26]' : 'text-[#bdcaba]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>SET THE TARGET</p>
                  </div>
                  <span className={`material-symbols-outlined text-[64px] absolute right-4 -top-2 ${decision === 'BAT' ? 'text-[#004f26] opacity-20' : 'text-[#bdcaba] opacity-10'}`} style={{ fontVariationSettings: "'FILL' 1" }}>sports_cricket</span>
                </button>

                {/* BOWL */}
                <button
                  onClick={() => setDecision('BOWL')}
                  className={`group relative flex items-center justify-between p-6 rounded-xl transition-all active:scale-[0.98] text-left overflow-hidden ${decision === 'BOWL' ? 'bg-[linear-gradient(135deg,#7bf090_0%,#45dada_100%)] text-[#003914] shadow-[0_0_20px_rgba(123,240,144,0.2)]' : 'bg-[#1c1b1b] border border-[#3e4a3e] text-white hover:bg-[#222]'}`}
                >
                  <div className="relative z-10">
                    <h3 className="text-[40px] uppercase leading-none" style={{ fontFamily: 'Anton, sans-serif' }}>BOWL</h3>
                    <p className={`text-[12px] font-bold tracking-[0.08em] mt-2 ${decision === 'BOWL' ? 'text-[#004f26]' : 'text-[#bdcaba]'}`} style={{ fontFamily: 'Inter, sans-serif' }}>CHASE LATER</p>
                  </div>
                  <span className={`material-symbols-outlined text-[64px] absolute right-4 -top-2 ${decision === 'BOWL' ? 'text-[#004f26] opacity-20' : 'text-[#bdcaba] opacity-10'}`} style={{ fontVariationSettings: "'FILL' 1" }}>sports_baseball</span>
                </button>
              </div>


            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 pb-4 pt-6 mt-auto">
              <button
                onClick={() => { setDecision(null); setStep('WINNER_SELECT'); }}
                className="px-6 py-4 bg-[#1c1b1b] border border-[#3e4a3e] text-[#bdcaba] rounded-lg font-bold text-[13px] uppercase tracking-widest hover:text-white hover:bg-[#2a2a2a] transition-all"
              >
                BACK TO TOSS
              </button>
              <button
                onClick={() => setStep('SUMMARY')}
                disabled={!decision}
                className={`flex-1 py-4 rounded-lg font-bold text-[13px] text-[#003914] uppercase tracking-widest shadow-lg transition-all ${!decision ? 'opacity-50 cursor-not-allowed bg-[#2a2a2a] text-white/50' : 'active:scale-95'}`}
                style={{ background: decision ? 'linear-gradient(135deg, #7bf090 0%, #45dada 100%)' : undefined }}
              >
                PROCEED
              </button>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        {step === 'SUMMARY' && (
          <div className="w-full h-full flex flex-col max-w-md mx-auto">
            <div className="flex-1 pt-8 overflow-y-auto pb-4 scrollbar-hide flex flex-col gap-4">
              {/* Header */}
              <div className="text-left mb-2">
                <span className="text-[12px] font-bold tracking-[0.08em] text-[#45dada] mb-2 block uppercase">STEP 4 OF 4</span>
                <h2 className="text-[24px] text-white uppercase tracking-wider" style={{ fontFamily: 'Anton, sans-serif' }}>CONFIRM MATCH SETUP</h2>
              </div>

              {/* Matchup Card */}
              <div className="bg-[#1c1b1b] border border-[#3e4a3e] rounded-xl p-5 flex items-center justify-between shadow-lg">
                <div className="text-center flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#7bf090] flex items-center justify-center text-[#006d2d] font-black text-xl mb-3 shadow-[0_0_15px_rgba(123,240,144,0.2)]" style={{ fontFamily: 'Anton, sans-serif' }}>A</div>
                  <span className="font-black text-[13px] text-white uppercase tracking-widest">{teamAName}</span>
                </div>
                <div className="px-4">
                  <span className="font-black text-[24px] text-[#3e4a3e] italic" style={{ fontFamily: 'Anton, sans-serif' }}>VS</span>
                </div>
                <div className="text-center flex-1 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#00bbbc] flex items-center justify-center text-[#004545] font-black text-xl mb-3 shadow-[0_0_15px_rgba(0,187,188,0.2)]" style={{ fontFamily: 'Anton, sans-serif' }}>B</div>
                  <span className="font-black text-[13px] text-[#45dada] uppercase tracking-widest">{teamBName}</span>
                </div>
              </div>

              {/* Toss Result Status Card */}
              <div className="bg-[#1c1b1b] rounded-xl border border-[#3e4a3e] p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center border border-[#3e4a3e]">
                  <span className="material-symbols-outlined text-[#7bf090]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                </div>
                <div>
                  <h3 className="font-bold text-[10px] text-[#879485] uppercase tracking-widest mb-1">TOSS RESULT</h3>
                  <p className="text-[13px] text-white font-bold">
                    {teams.find(t => t.id === winnerTeam)?.name} won and chose to <span className="text-[#7bf090]">{decision === 'BAT' ? 'Bat' : 'Bowl'}</span>
                  </p>
                </div>
              </div>

              {/* Format & Overs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1c1b1b] border border-[#3e4a3e] p-4 rounded-xl">
                  <span className="font-bold text-[10px] text-[#879485] uppercase tracking-widest block mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">timer</span> FORMAT</span>
                  <p className="text-[18px] font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>T20 MATCH</p>
                </div>
                <div className="bg-[#1c1b1b] border border-[#3e4a3e] p-4 rounded-xl">
                  <span className="font-bold text-[10px] text-[#879485] uppercase tracking-widest block mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">tag</span> OVERS</span>
                  <p className="text-[18px] font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>20.0 OVERS</p>
                </div>
              </div>
              
              {/* Venue Background Card */}
              <div className="bg-[#1c1b1b] border border-[#3e4a3e] rounded-xl overflow-hidden relative h-[90px] flex items-end p-4">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313] to-transparent" />
                <div className="relative z-10 w-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#bdcaba]">location_on</span>
                  <div>
                    <span className="font-bold text-[9px] text-[#bdcaba] uppercase tracking-widest block mb-0.5">VENUE</span>
                    <p className="text-[16px] font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>NATIONAL ARENA, DUBAI</p>
                  </div>
                </div>
              </div>

              {/* Password */}
              {hasPassword && (
                <div className="mt-2 space-y-2">
                  <label className="text-[10px] font-black text-[#879485] uppercase tracking-widest pl-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span> MATCH PASSWORD
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full bg-[#131313] border border-[#3e4a3e] rounded-xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#7bf090]/50 transition-all text-center tracking-[0.2em]"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions - Side by Side */}
            <div className="flex gap-3 pb-4 pt-4 mt-auto border-t border-[#3e4a3e]/30">
              <button
                onClick={handleReToss}
                disabled={isSubmitting}
                className="flex-[1] py-4 bg-[#1c1b1b] border border-[#3e4a3e] text-[#bdcaba] rounded-lg font-bold text-[13px] uppercase tracking-widest hover:text-white hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-2"
              >
                RE-TOSS
              </button>

              <button
                onClick={handleStartMatch}
                disabled={(hasPassword && !password) || isSubmitting}
                className={`flex-[1.5] py-4 font-black text-[15px] uppercase tracking-[0.1em] rounded-lg text-[#003914] shadow-[0_4px_20px_rgba(123,240,144,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                style={{ background: 'linear-gradient(135deg, #7bf090 0%, #45dada 100%)' }}
              >
                {isSubmitting ? 'STARTING...' : 'START MATCH'}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default TossModal;
