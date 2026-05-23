import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, ChevronRight, Lock, RotateCcw } from 'lucide-react';

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
  const [winnerTeam, setWinnerTeam] = useState(null);
  const [decision, setDecision] = useState(null);
  const [password, setPassword] = useState('');

  const teams = [teamA, teamB].filter(Boolean);

  const handleFlip = () => {
    setStep('FLIPPING');
    setTimeout(() => {
      setCoinResult(Math.random() > 0.5 ? 'Heads' : 'Tails');
      setStep('FLIP_RESULT');
    }, 2000); // 2 second flip animation
  };

  const handleStartMatch = () => {
    if (hasPassword && !password) return;
    onConfirm({ winnerTeam, decision, password });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={() => step === 'FLIP_IDLE' && onCancel && onCancel()}
        />

        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative w-full max-w-md bg-[#111] rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 text-center">
            {step === 'SUMMARY' ? (
              <h2 className="text-xl font-black tracking-tight text-white mb-2">Match Summary</h2>
            ) : (
              <h2 className="text-xl font-black tracking-tight text-white mb-2">
                {step === 'WINNER_SELECT' ? 'Who won the toss?' : step === 'DECISION_SELECT' ? 'Decision' : 'Virtual Coin Toss'}
              </h2>
            )}
          </div>

          <div className="px-6 py-6 space-y-4">
            {(step === 'FLIP_IDLE' || step === 'FLIPPING' || step === 'FLIP_RESULT') && (
              <div className="flex flex-col items-center justify-center space-y-8 py-8">
                <div className="relative w-32 h-32 perspective-1000">
                  <motion.div
                    animate={
                      step === 'FLIPPING' 
                        ? { rotateY: 3600, y: [0, -100, 0] } 
                        : step === 'FLIP_RESULT' 
                          ? { rotateY: coinResult === 'Heads' ? 0 : 180, y: 0 } 
                          : { rotateY: 0, y: 0 }
                    }
                    transition={{ 
                      duration: step === 'FLIPPING' ? 2 : 0.5, 
                      ease: step === 'FLIPPING' ? "easeInOut" : "easeOut" 
                    }}
                    className="w-full h-full preserve-3d"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Heads Face */}
                    <div className="absolute inset-0 backface-hidden w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full border-4 border-yellow-700 flex items-center justify-center shadow-xl">
                      <span className="text-4xl font-black text-yellow-900">H</span>
                    </div>
                    {/* Tails Face */}
                    <div className="absolute inset-0 backface-hidden w-full h-full bg-gradient-to-br from-gray-300 to-gray-500 rounded-full border-4 border-gray-600 flex items-center justify-center shadow-xl" style={{ transform: 'rotateY(180deg)' }}>
                      <span className="text-4xl font-black text-gray-800">T</span>
                    </div>
                  </motion.div>
                </div>
                
                {step === 'FLIP_IDLE' && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleFlip}
                      className="px-8 py-4 bg-[#00C187] text-black font-black uppercase tracking-widest rounded-2xl hover:bg-[#00e39f] hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,193,135,0.4)]"
                    >
                      Flip Coin
                    </button>
                    <button
                      onClick={() => setStep('WINNER_SELECT')}
                      className="px-8 py-3 bg-white/5 border border-white/10 text-neutral-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all text-xs"
                    >
                      Skip & Enter Manually
                    </button>
                  </div>
                )}
                
                {step === 'FLIPPING' && (
                  <p className="text-neutral-400 font-bold animate-pulse uppercase tracking-widest">Flipping...</p>
                )}
                
                {step === 'FLIP_RESULT' && (
                  <div className="text-center space-y-4">
                    <p className="text-2xl font-black text-white">It's {coinResult}!</p>
                    <button
                      onClick={() => setStep('WINNER_SELECT')}
                      className="px-8 py-4 bg-[#00C187]/20 border border-[#00C187]/40 text-[#00C187] font-black uppercase tracking-widest rounded-2xl hover:bg-[#00C187]/30 transition-all"
                    >
                      Continue
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 'WINNER_SELECT' && (
              <div className="space-y-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setWinnerTeam(team.id);
                      setStep('DECISION_SELECT');
                    }}
                    className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all group text-left"
                  >
                    <span className="flex-1 font-bold text-white text-base">{team.name}</span>
                    <ChevronRight size={20} className="text-neutral-600 group-hover:text-[#00C187] transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {step === 'DECISION_SELECT' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setDecision('BAT');
                    setStep('SUMMARY');
                  }}
                  className="flex flex-col items-center justify-center py-6 rounded-2xl border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all"
                >
                  <span className="text-lg font-black text-white">BAT</span>
                </button>
                <button
                  onClick={() => {
                    setDecision('BOWL');
                    setStep('SUMMARY');
                  }}
                  className="flex flex-col items-center justify-center py-6 rounded-2xl border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all"
                >
                  <span className="text-lg font-black text-white">BOWL</span>
                </button>
              </div>
            )}

            {step === 'SUMMARY' && (
              <div className="space-y-6">
                <div className="text-center space-y-1">
                  <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Matchup</p>
                  <p className="text-lg font-black text-white">
                    {teamA?.name} <span className="text-[#00C187] mx-2">VS</span> {teamB?.name}
                  </p>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-sm font-bold text-white">
                    <span className="text-[#00C187]">{teams.find(t => t.id === winnerTeam)?.name}</span> won the toss and chose to <span className="text-[#00C187]">{decision}</span>.
                  </p>
                </div>

                {hasPassword && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2 flex items-center gap-1">
                      <Lock size={12} /> Scoring Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-4 text-sm font-bold text-white focus:outline-none focus:border-[#00C187]/50 transition-all text-center tracking-[0.2em]"
                    />
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleStartMatch}
                    disabled={hasPassword && !password}
                    className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Match (00:00)
                  </button>
                  <button
                    onClick={() => {
                      setStep('FLIP_IDLE');
                      setWinnerTeam(null);
                      setDecision(null);
                      setCoinResult(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 text-neutral-400 font-bold uppercase tracking-widest rounded-2xl hover:bg-white/10 hover:text-white transition-all text-[11px]"
                  >
                    <RotateCcw size={14} /> Re-Toss
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TossModal;
