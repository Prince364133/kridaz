import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ChevronRight, Users } from 'lucide-react';

/**
 * WicketModal — P1.1
 *
 * Shown when the umpire presses WICKET.
 * Collects: wicketType, fielderId (if applicable), nextBatterId, extraRuns (run out).
 *
 * Props:
 *   fieldingTeamSlots  – [{ userId, name }]
 *   battingTeamSlots   – [{ userId, name }] (remaining batters, excluding current striker)
 *   onConfirm({ wicketType, fielderId, nextBatterId, runs }) – called after confirmation
 *   onClose()
 */

const WICKET_TYPES = [
  { key: 'BOWLED',      label: 'Bowled',           needsFielder: false },
  { key: 'CAUGHT',      label: 'Caught',            needsFielder: true  },
  { key: 'LBW',         label: 'LBW',               needsFielder: false },
  { key: 'RUN_OUT',     label: 'Run Out',            needsFielder: true, needsWhoOut: true, needsRuns: true  },
  { key: 'STUMPED',     label: 'Stumped',            needsFielder: true  },
  { key: 'HIT_WICKET',  label: 'Hit Wicket',         needsFielder: false },
  { key: 'OBSTRUCTING', label: 'Obstructing Field',  needsFielder: false, needsWhoOut: true },
  { key: 'RETIRED_HURT',label: 'Retired Hurt',       needsFielder: false, needsWhoOut: true },
  { key: 'RETIRED_OUT', label: 'Retired Out',        needsFielder: false, needsWhoOut: true },
  { key: 'TIMED_OUT',   label: 'Timed Out',          needsFielder: false },
];

const WicketModal = ({
  fieldingTeamSlots = [],
  battingTeamSlots = [],
  activeBatters = [],
  onConfirm,
  onClose,
}) => {
  const [step, setStep] = useState('type');   // 'type' | 'whoOut' | 'runs' | 'fielder' | 'nextBatter'
  const [wicketType, setWicketType] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [playerOutId, setPlayerOutId] = useState(null);
  const [runsCompleted, setRunsCompleted] = useState(0);

  const selectedMeta = WICKET_TYPES.find(w => w.key === wicketType);

  const goToNextFromType = (wt) => {
    if (wt.needsWhoOut && activeBatters.length > 0) {
      setStep('whoOut');
    } else {
      goToNextFromWhoOut(wt);
    }
  };

  const goToNextFromWhoOut = (wt) => {
    if (wt.needsRuns) {
      setStep('runs');
    } else {
      goToNextFromRuns(wt);
    }
  };

  const goToNextFromRuns = (wt) => {
    if (wt.needsFielder && fieldingTeamSlots.length > 0) {
      setStep('fielder');
    } else {
      setStep('nextBatter');
    }
  };

  const handleTypeSelect = (wt) => {
    setWicketType(wt.key);
    goToNextFromType(wt);
  };

  const handleWhoOutSelect = (playerId) => {
    setPlayerOutId(playerId);
    goToNextFromWhoOut(selectedMeta);
  };

  const handleRunsSelect = (runs) => {
    setRunsCompleted(runs);
    goToNextFromRuns(selectedMeta);
  };

  const handleFielderSelect = (playerId) => {
    setFielderId(playerId);
    setStep('nextBatter');
  };

  const handleNextBatterSelect = (nextId) => {
    onConfirm({ wicketType, fielderId, nextBatterId: nextId, runs: runsCompleted, playerOutId });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22 }}
          className="relative w-full max-w-md bg-[#111] rounded-3xl border border-red-500/20 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-black text-white leading-tight">
                  {step === 'type' && 'How was the wicket?'}
                  {step === 'whoOut' && 'Who got out?'}
                  {step === 'runs' && 'Runs completed before run out?'}
                  {step === 'fielder' && `Who ${selectedMeta?.key === 'STUMPED' ? 'stumped' : selectedMeta?.key === 'RUN_OUT' ? 'ran them out' : 'caught it'}?`}
                  {step === 'nextBatter' && 'Who bats next?'}
                </h2>
                {wicketType && <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">{selectedMeta?.label}</p>}
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 py-4 max-h-80 overflow-y-auto space-y-2 custom-scrollbar">

            {/* Step 1: Wicket type */}
            {step === 'type' && (
              <div className="grid grid-cols-2 gap-2">
                {WICKET_TYPES.map((wt) => (
                  <button
                    key={wt.key}
                    onClick={() => handleTypeSelect(wt)}
                    className="p-4 rounded-2xl border border-white/8 bg-white/4 hover:border-red-500/50 hover:bg-red-500/8 transition-all text-left group"
                  >
                    <span className="text-sm font-black text-white group-hover:text-red-400 transition-colors">{wt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 1.5: Who got out? */}
            {step === 'whoOut' && (
              <>
                {activeBatters.map((player) => (
                  <button
                    key={player.userId}
                    onClick={() => handleWhoOutSelect(player.userId)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/8 bg-white/4 hover:border-red-500/40 hover:bg-red-500/8 transition-all group mb-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-black text-red-400 shrink-0">
                      {player.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="block font-bold text-white text-sm">{player.name}</span>
                      <span className="block text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{player.role}</span>
                    </div>
                    <ChevronRight size={14} className="text-neutral-600 group-hover:text-red-400 transition-colors" />
                  </button>
                ))}
              </>
            )}

            {/* Step 1.75: Runs completed */}
            {step === 'runs' && (
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                  <button
                    key={run}
                    onClick={() => handleRunsSelect(run)}
                    className="p-4 rounded-2xl border border-white/8 bg-white/4 hover:border-red-500/50 hover:bg-red-500/8 transition-all text-center group"
                  >
                    <span className="text-xl font-black text-white group-hover:text-red-400 transition-colors">{run}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Fielder selection */}
            {step === 'fielder' && (
              <>
                {fieldingTeamSlots.map((player) => (
                  <button
                    key={player.userId}
                    onClick={() => handleFielderSelect(player.userId)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/8 bg-white/4 hover:border-red-500/40 hover:bg-red-500/8 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-black text-red-400 shrink-0">
                      {player.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <span className="flex-1 font-bold text-white text-sm">{player.name}</span>
                    <ChevronRight size={14} className="text-neutral-600 group-hover:text-red-400 transition-colors" />
                  </button>
                ))}
                <button
                  onClick={() => setStep('nextBatter')}
                  className="w-full py-3 rounded-2xl border border-dashed border-white/15 text-neutral-500 text-sm font-bold hover:border-white/30 transition-colors"
                >
                  Skip (fielder unknown)
                </button>
              </>
            )}

            {/* Step 3: Next batsman */}
            {step === 'nextBatter' && (
              <>
                {battingTeamSlots.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="text-neutral-600 mx-auto mb-3" size={32} />
                    <p className="text-neutral-500 text-sm font-medium">All wickets fallen — innings over!</p>
                    <button
                      onClick={() => onConfirm({ wicketType, fielderId, nextBatterId: null, runs: runsCompleted, playerOutId })}
                      className="mt-4 px-6 py-3 bg-red-500 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                      End Innings
                    </button>
                  </div>
                ) : (
                  battingTeamSlots.map((player) => (
                    <button
                      key={player.userId}
                      onClick={() => handleNextBatterSelect(player.userId)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/8 bg-white/4 hover:border-yellow-500/40 hover:bg-yellow-500/8 transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-black text-yellow-400 shrink-0">
                        {player.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="flex-1 font-bold text-white text-sm">{player.name}</span>
                      <ChevronRight size={14} className="text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                    </button>
                  ))
                )}
              </>
            )}
          </div>

          {/* Back button for steps > 1 */}
          {step !== 'type' && (
            <div className="px-6 pb-5 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  if (step === 'nextBatter') {
                    if (selectedMeta?.needsFielder) setStep('fielder');
                    else if (selectedMeta?.needsRuns) setStep('runs');
                    else if (selectedMeta?.needsWhoOut) setStep('whoOut');
                    else setStep('type');
                  } else if (step === 'fielder') {
                    if (selectedMeta?.needsRuns) setStep('runs');
                    else if (selectedMeta?.needsWhoOut) setStep('whoOut');
                    else setStep('type');
                  } else if (step === 'runs') {
                    if (selectedMeta?.needsWhoOut) setStep('whoOut');
                    else setStep('type');
                  } else if (step === 'whoOut') {
                    setStep('type');
                  }
                }}
                className="text-xs text-neutral-500 hover:text-white font-bold uppercase tracking-widest transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WicketModal;
