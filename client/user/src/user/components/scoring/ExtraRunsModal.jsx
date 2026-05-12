import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * ExtraRunsModal — P1.4 & P1.5
 *
 * Shown when Wide, No-Ball, Bye, or Leg Bye is pressed.
 * Lets the umpire specify how many runs were scored off the delivery.
 *
 * Props:
 *   extraType   – "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE"
 *   onConfirm(runs: number) – called with total runs (includes the extra penalty)
 *   onClose()
 */

const EXTRA_META = {
  WIDE:    { label: 'Wide',     color: '#60A5FA', note: '1 wide penalty already included' },
  NO_BALL: { label: 'No-Ball',  color: '#F59E0B', note: '1 no-ball penalty already included' },
  BYE:     { label: 'Bye',      color: '#34D399', note: 'Runs scored — not credited to batsman' },
  LEG_BYE: { label: 'Leg Bye',  color: '#A78BFA', note: 'Runs scored — not credited to batsman' },
};

const QUICK_RUNS = [0, 1, 2, 3, 4];

const ExtraRunsModal = ({ extraType = 'WIDE', onConfirm, onClose }) => {
  const [runs, setRuns] = useState(0);
  const meta = EXTRA_META[extraType] || EXTRA_META.WIDE;

  // For WIDE / NO_BALL the "penalty 1 run" is always added automatically by the server.
  // Here we just capture additional runs scored off the delivery.
  const totalDisplay = extraType === 'WIDE' || extraType === 'NO_BALL'
    ? `${runs + 1} (${runs} runs + 1 penalty)`
    : `${runs} runs`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 24 }}
          className="relative w-full max-w-sm bg-[#111] rounded-3xl border border-white/10 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-white/10">
            <div>
              <span
                className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest mb-1"
                style={{ background: `${meta.color}20`, color: meta.color }}
              >
                {meta.label}
              </span>
              <h2 className="text-lg font-black text-white leading-tight">Runs off this delivery?</h2>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">{meta.note}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-neutral-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Quick-select buttons */}
          <div className="px-5 py-5 space-y-5">
            <div className="flex gap-2 justify-between">
              {QUICK_RUNS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRuns(r)}
                  style={runs === r ? { background: meta.color, color: '#000' } : {}}
                  className={`flex-1 h-14 rounded-2xl text-xl font-black transition-all ${
                    runs === r
                      ? 'shadow-[0_0_20px_rgba(0,0,0,0.4)]'
                      : 'bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Manual input for overthrows (5, 6, 7…) */}
            <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 focus-within:border-neutral-600 transition-colors">
              <span className="text-neutral-500 text-sm font-bold">Other:</span>
              <input
                type="number"
                min={0}
                max={9}
                value={runs}
                onChange={(e) => setRuns(Math.max(0, parseInt(e.target.value) || 0))}
                className="flex-1 bg-transparent text-white font-black text-lg outline-none text-right"
              />
            </div>

            {/* Total display */}
            <div className="bg-white/5 rounded-2xl px-4 py-3 flex justify-between items-center">
              <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Total extras</span>
              <span className="font-black text-white text-base" style={{ color: meta.color }}>{totalDisplay}</span>
            </div>

            {/* Confirm */}
            <button
              onClick={() => onConfirm(runs)}
              style={{ background: meta.color }}
              className="w-full py-4 rounded-2xl font-black text-black text-sm uppercase tracking-widest hover:opacity-90 transition-opacity shadow-lg"
            >
              Confirm {meta.label}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ExtraRunsModal;
