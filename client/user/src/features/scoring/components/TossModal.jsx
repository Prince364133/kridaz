import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, ChevronRight } from 'lucide-react';

/**
 * TossModal
 *
 * Shown when the match is just starting to record toss winner and decision.
 *
 * Props:
 *   teamA      - { id, name }
 *   teamB      - { id, name }
 *   onConfirm  - called with { winnerTeam, decision }
 */
const TossModal = ({ teamA, teamB, onConfirm }) => {
  const [winnerTeam, setWinnerTeam] = useState(null);

  const teams = [teamA, teamB].filter(Boolean);

  const handleDecision = (decision) => {
    onConfirm({ winnerTeam, decision });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative w-full max-w-md bg-[#111] rounded-3xl border border-white/10 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 text-center">
            <div className="mx-auto bg-[#00C187]/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Coins size={32} className="text-[#00C187]" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mb-2">
              {!winnerTeam ? 'Who won the toss?' : 'Decision'}
            </h2>
          </div>

          <div className="px-4 py-4 space-y-3">
            {!winnerTeam ? (
              // Step 1: Pick toss winner
              teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setWinnerTeam(team.id)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all group text-left"
                >
                  <span className="flex-1 font-bold text-white text-base">{team.name}</span>
                  <ChevronRight size={20} className="text-neutral-600 group-hover:text-[#00C187] transition-colors" />
                </button>
              ))
            ) : (
              // Step 2: Pick decision
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDecision('BAT')}
                  className="flex flex-col items-center justify-center py-6 rounded-2xl border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all"
                >
                  <span className="text-lg font-black text-white">BAT</span>
                </button>
                <button
                  onClick={() => handleDecision('BOWL')}
                  className="flex flex-col items-center justify-center py-6 rounded-2xl border border-white/8 bg-white/4 hover:border-[#00C187]/50 hover:bg-[#00C187]/8 transition-all"
                >
                  <span className="text-lg font-black text-white">BOWL</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TossModal;
