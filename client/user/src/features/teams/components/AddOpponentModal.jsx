import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLazyFindTeamByCodeQuery, useRequestOpponentMutation } from '@redux/api/teamApi';
import toast from 'react-hot-toast';

const AddOpponentModal = ({ isOpen, onClose, myTeams }) => {
  const [teamCode, setTeamCode] = useState('');
  const [selectedMyTeam, setSelectedMyTeam] = useState('');
  const [foundTeam, setFoundTeam] = useState(null);
  
  const [findTeam, { isLoading: isFinding }] = useLazyFindTeamByCodeQuery();
  const [requestOpponent, { isLoading: isRequesting }] = useRequestOpponentMutation();

  const handleSearch = async () => {
    if (!teamCode || teamCode.length !== 10) {
      toast.error('Please enter a valid 10-character Team ID');
      return;
    }
    try {
      const result = await findTeam(teamCode).unwrap();
      if (result.success) {
        setFoundTeam(result.team);
      } else {
        toast.error('Team not found');
        setFoundTeam(null);
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to find team');
      setFoundTeam(null);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedMyTeam) {
      toast.error('Please select one of your teams first');
      return;
    }
    if (!foundTeam) return;

    try {
      const result = await requestOpponent({
        teamId: selectedMyTeam,
        targetTeamId: foundTeam._id
      }).unwrap();

      if (result.success) {
        toast.success('Opponent request sent!');
        onClose();
        resetForm();
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send request');
    }
  };

  const resetForm = () => {
    setTeamCode('');
    setSelectedMyTeam('');
    setFoundTeam(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Add Opponent</h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Search by Team ID</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-white/40" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1: Search by Code */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Unique Team ID</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text"
                  placeholder="EX: KRIDAZ1234"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-black tracking-[0.2em] focus:outline-none focus:border-[#CCFF00]/50 uppercase transition-all"
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isFinding}
                className="px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all flex items-center justify-center"
              >
                {isFinding ? <Loader2 size={18} className="animate-spin text-[#CCFF00]" /> : <Search size={18} className="text-[#CCFF00]" />}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {foundTeam ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Team Found Card */}
                <div className="bg-[#CCFF00]/5 border border-[#CCFF00]/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-black border border-white/10 flex items-center justify-center shrink-0">
                    {foundTeam.logo ? (
                      <img src={foundTeam.logo} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Users className="text-[#CCFF00]" size={24} />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-white font-black uppercase tracking-tight truncate">{foundTeam.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#CCFF00] font-black uppercase tracking-widest">{foundTeam.sportType}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] text-white/40 font-bold">{foundTeam.city}</span>
                    </div>
                  </div>
                  <div className="bg-[#CCFF00] text-black p-1.5 rounded-lg">
                    <CheckCircle2 size={16} />
                  </div>
                </div>

                {/* Select My Team */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Challenge With Your Team</label>
                  <select 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold focus:outline-none focus:border-[#CCFF00]/50 outline-none appearance-none"
                    value={selectedMyTeam}
                    onChange={(e) => setSelectedMyTeam(e.target.value)}
                  >
                    <option value="" className="bg-[#1a1a1a]">Select Your Team...</option>
                    {myTeams.map(t => (
                      <option key={t._id} value={t._id} className="bg-[#1a1a1a]">{t.name} ({t.sportType})</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleSendRequest}
                  disabled={isRequesting}
                  className="w-full py-4 bg-[#CCFF00] hover:bg-[#b8e600] disabled:bg-white/10 disabled:text-white/20 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#CCFF00]/10 transition-all flex items-center justify-center gap-3"
                >
                  {isRequesting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Send Opponent Request
                    </>
                  )}
                </button>
              </motion.div>
            ) : !isFinding && teamCode.length === 10 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="py-10 text-center space-y-3"
              >
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={20} className="text-white/20" />
                </div>
                <p className="text-white/40 text-xs font-medium tracking-wide">Enter the Team ID and click search</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default AddOpponentModal;
