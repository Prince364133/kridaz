import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';

export default function PenaltyModal({ matchData, onClose, onConfirm }) {
  const teamA = matchData?.teamA || matchData?.hostedGameId?.teamA || (Array.isArray(matchData?.hostedGameId?.teams) ? matchData.hostedGameId.teams.find(t => t.teamKey === 'teamA') : null);
  const teamB = matchData?.teamB || matchData?.hostedGameId?.teamB || (Array.isArray(matchData?.hostedGameId?.teams) ? matchData.hostedGameId.teams.find(t => t.teamKey === 'teamB') : null);

  const [selectedTeam, setSelectedTeam] = useState(teamA?.id || teamA?._id);
  const [runs, setRuns] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTeam || !runs || isNaN(runs) || Number(runs) <= 0) return;
    onConfirm(selectedTeam, Number(runs));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
              <ShieldAlert size={20} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Add Penalty</h3>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Award extra runs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Select Team to Receive Runs</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedTeam(teamA?.id || teamA?._id)}
                className={`flex-1 py-3 px-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedTeam === (teamA?.id || teamA?._id) ? 'bg-[#00C187]/20 border border-[#00C187]/50 text-[#00C187]' : 'bg-white/5 border border-white/5 text-neutral-400 hover:text-white'}`}
              >
                {teamA?.name || 'Team A'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeam(teamB?.id || teamB?._id)}
                className={`flex-1 py-3 px-2 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedTeam === (teamB?.id || teamB?._id) ? 'bg-[#00C187]/20 border border-[#00C187]/50 text-[#00C187]' : 'bg-white/5 border border-white/5 text-neutral-400 hover:text-white'}`}
              >
                {teamB?.name || 'Team B'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest pl-2">Penalty Runs</label>
            <input
              type="number"
              min="1"
              value={runs}
              onChange={(e) => setRuns(e.target.value)}
              placeholder="e.g. 5"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black text-white focus:outline-none focus:border-[#00C187]/50 transition-all placeholder:text-neutral-700"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!runs || !selectedTeam}
            className="w-full h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center text-[12px] font-black uppercase tracking-[0.3em] hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            Apply Penalty
          </button>
        </form>
      </div>
    </div>
  );
}
