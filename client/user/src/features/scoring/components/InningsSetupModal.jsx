import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Zap, X, ChevronRight } from 'lucide-react';

/**
 * InningsSetupModal
 *
 * Shown before scoring begins (or after a new innings starts).
 * Forces the umpire to pick:
 *   1. Opening striker
 *   2. Opening non-striker
 *   3. Opening bowler
 *
 * Props:
 *   battingTeamSlots  – array of { userId, name } for batting side
 *   bowlingTeamSlots  – array of { userId, name } for bowling side
 *   inningsLabel      – "1st Innings" | "2nd Innings"
 *   onConfirm(players) – called with { strikerId, nonStrikerId, bowlerId }
 *   onClose           – called to dismiss (without confirming)
 */
const InningsSetupModal = ({
  battingTeamSlots = [],
  bowlingTeamSlots = [],
  inningsLabel = '1st Innings',
  onConfirm,
  onClose,
}) => {
  const [step, setStep] = useState(1); // 1=striker 2=nonStriker 3=bowler
  const [striker, setStriker] = useState(null);
  const [nonStriker, setNonStriker] = useState(null);
  const [bowler, setBowler] = useState(null);

  const STEPS = [
    { id: 1, label: 'Choose Opener (Striker)', icon: <Zap size={16} />, pool: battingTeamSlots, excludeId: null },
    { id: 2, label: 'Choose Opener (Non-Striker)', icon: <Users size={16} />, pool: battingTeamSlots, excludeId: striker?.userId },
    { id: 3, label: 'Choose Opening Bowler', icon: <Zap size={16} />, pool: bowlingTeamSlots, excludeId: null },
  ];

  const currentStep = STEPS[step - 1];

  const handleSelect = (player) => {
    if (step === 1) { setStriker(player); setStep(2); }
    else if (step === 2) { setNonStriker(player); setStep(3); }
    else {
      setBowler(player);
      // Auto-confirm once all three are chosen
      onConfirm({
        strikerId: striker.userId,
        nonStrikerId: nonStriker.userId,
        bowlerId: player.userId,
      });
    }
  };

  const pool = (currentStep.pool || []).filter(p => p.userId !== currentStep.excludeId);

  const stepColors = ['#EAB308', '#22D3EE', '#A78BFA'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative w-full max-w-md bg-[#111] rounded-3xl border border-white/10 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{inningsLabel}</span>
              {onClose && (
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">{currentStep.label}</h2>

            {/* Step dots */}
            <div className="flex gap-2 mt-4">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  style={{ background: step >= s.id ? stepColors[s.id - 1] : '#333' }}
                  className="h-1.5 flex-1 rounded-full transition-all duration-500"
                />
              ))}
            </div>
          </div>

          {/* Player list */}
          <div className="px-4 py-4 max-h-72 overflow-y-auto space-y-2 custom-scrollbar">
            {pool.length === 0 && (
              <p className="text-center text-neutral-500 text-sm py-8">No players available</p>
            )}
            {pool.map((player) => (
              <button
                key={player.userId}
                onClick={() => handleSelect(player)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border border-white/8 bg-white/4 hover:border-[#55DEE8]/50 hover:bg-gradient-to-r from-[#55DEE8]/8 to-[#BFF367]/8 transition-all group text-left"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] shrink-0">
                  {player.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="flex-1 font-bold text-white text-sm">{player.name || 'Unnamed'}</span>
                <ChevronRight size={16} className="text-neutral-600 group-hover:text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] transition-colors" />
              </button>
            ))}
          </div>

          {/* Footer: show selections so far */}
          {(striker || nonStriker) && (
            <div className="px-6 py-4 border-t border-white/10 flex gap-3">
              {striker && (
                <div className="flex-1 bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#55DEE8]/20 rounded-2xl px-3 py-2 text-center">
                  <p className="text-[9px] font-black text-transparent bg-clip-text bg-gradient-to-r from-[#55DEE8] to-[#BFF367] uppercase tracking-widest mb-0.5">Striker</p>
                  <p className="text-xs font-black text-white truncate">{striker.name}</p>
                </div>
              )}
              {nonStriker && (
                <div className="flex-1 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl px-3 py-2 text-center">
                  <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Non-Striker</p>
                  <p className="text-xs font-black text-white truncate">{nonStriker.name}</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InningsSetupModal;
