import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Shield, Video, Users, Trophy, Search, Check } from 'lucide-react';
import { useSetupScoringMatchMutation } from '@redux/api/scoringApi';
import { useGetMyTeamsQuery, useGetOpponentTeamsQuery, useLazyFindTeamByCodeQuery } from '@redux/api/teamApi';

const StartScoringModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    matchName: '',
    format: 'T20',
    ballType: 'TENNIS',
    groundType: 'OPEN_GROUND',
    teamAId: '',
    teamBId: '',
    tossWinner: '',
    tossDecision: 'BAT',
    scoringPassword: '',
    youtubeLiveUrl: ''
  });

  const [selectingTeam, setSelectingTeam] = useState(null); // 'A' or 'B'
  const [teamTab, setTeamTab] = useState('myTeams');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  const [setupMatch, { isLoading }] = useSetupScoringMatchMutation();
  const { data: myData } = useGetMyTeamsQuery(undefined, { skip: !isOpen });
  const { data: oppData } = useGetOpponentTeamsQuery(undefined, { skip: !isOpen });
  const [findTeamByCode, { data: searchedTeam, isFetching: isSearching }] = useLazyFindTeamByCodeQuery();

  const myTeams = myData?.teams || [];
  const oppTeams = oppData?.teams || [];
  const allTeams = [...myTeams, ...oppTeams];

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleTeamSearch = async () => {
    if (teamSearchQuery.trim()) {
      await findTeamByCode(teamSearchQuery);
    }
  };

  const selectTeam = (teamId) => {
    if (selectingTeam === 'A') setFormData(f => ({ ...f, teamAId: teamId }));
    if (selectingTeam === 'B') setFormData(f => ({ ...f, teamBId: teamId }));
    setSelectingTeam(null);
  };

  const handleSubmit = async () => {
    try {
      await setupMatch(formData).unwrap();
      onClose();
      setStep(1);
      // Optional: Redirect or notify success
    } catch (err) {
      console.error('Failed to setup match:', err);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Match Details</h3>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Match Name</label>
              <input 
                type="text"
                value={formData.matchName}
                onChange={e => setFormData({...formData, matchName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#55DEE8]/50 outline-none transition-colors"
                placeholder="e.g. Weekend Championship Final"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Format</label>
                <select 
                  value={formData.format}
                  onChange={e => setFormData({...formData, format: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none"
                >
                  <option value="T20">T20 (20 Overs)</option>
                  <option value="T10">T10 (10 Overs)</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Ball Type</label>
                <select 
                  value={formData.ballType}
                  onChange={e => setFormData({...formData, ballType: e.target.value})}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none"
                >
                  <option value="TENNIS">Tennis Ball</option>
                  <option value="LEATHER">Leather Ball</option>
                  <option value="RUBBER">Rubber Ball</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Select Teams</h3>
            <div>
              <label className="text-xs text-[#55DEE8] mb-1 block">Team A (Your Team)</label>
              <button 
                onClick={() => setSelectingTeam('A')}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none flex justify-between items-center hover:bg-white/10 transition-colors"
              >
                <span>{formData.teamAId ? myTeams.find(t => t._id === formData.teamAId)?.name || 'Team Selected' : 'Select Team A'}</span>
                <ChevronRight size={16} className="text-white/40" />
              </button>
            </div>
            <div>
              <label className="text-xs text-[#BFF367] mb-1 block">Team B (Opponent / Other Team)</label>
              <button 
                onClick={() => setSelectingTeam('B')}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none flex justify-between items-center hover:bg-white/10 transition-colors"
              >
                <span>{formData.teamBId ? allTeams.find(t => t._id === formData.teamBId)?.name || (searchedTeam?.team?._id === formData.teamBId ? searchedTeam.team.name : 'Team Selected') : 'Select Team B'}</span>
                <ChevronRight size={16} className="text-white/40" />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Toss Result</h3>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Who won the toss?</label>
              <select 
                value={formData.tossWinner}
                onChange={e => setFormData({...formData, tossWinner: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none"
              >
                <option value="">Select Winner</option>
                {formData.teamAId && <option value={formData.teamAId}>Team A</option>}
                {formData.teamBId && <option value={formData.teamBId}>Team B</option>}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Decision</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tossDecision: 'BAT'})}
                  className={`flex-1 py-3 rounded-xl border ${formData.tossDecision === 'BAT' ? 'bg-[#55DEE8] text-black font-bold border-[#55DEE8]' : 'bg-transparent text-white border-white/20'}`}
                >
                  BAT
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, tossDecision: 'BOWL'})}
                  className={`flex-1 py-3 rounded-xl border ${formData.tossDecision === 'BOWL' ? 'bg-[#BFF367] text-black font-bold border-[#BFF367]' : 'bg-transparent text-white border-white/20'}`}
                >
                  BOWL
                </button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Security & Live Stream</h3>
            <div>
              <label className="text-xs text-white/60 mb-1 block flex items-center gap-1">
                <Shield size={14} /> Scoring App Password
              </label>
              <input 
                type="password"
                value={formData.scoringPassword}
                onChange={e => setFormData({...formData, scoringPassword: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#55DEE8]/50 outline-none transition-colors"
                placeholder="Required for scoring access"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block flex items-center gap-1">
                <Video size={14} /> YouTube Live URL (Optional)
              </label>
              <input 
                type="url"
                value={formData.youtubeLiveUrl}
                onChange={e => setFormData({...formData, youtubeLiveUrl: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#55DEE8]/50 outline-none transition-colors"
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-[#0F0F0F] border border-white/10 rounded-[20px] shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">
            {selectingTeam ? `Select Team ${selectingTeam}` : 'Start Scoring Game'}
          </h2>
          <button 
            onClick={() => selectingTeam ? setSelectingTeam(null) : onClose()} 
            className="p-2 text-white/40 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {selectingTeam ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/5">
                <button 
                  onClick={() => setTeamTab('myTeams')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    teamTab === 'myTeams' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/40 hover:text-white'
                  }`}
                >
                  My Teams
                </button>
                <button 
                  onClick={() => setTeamTab('opponentTeams')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    teamTab === 'opponentTeams' ? 'bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black shadow-lg' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Opponents
                </button>
              </div>

              {teamTab === 'opponentTeams' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={teamSearchQuery}
                    onChange={(e) => setTeamSearchQuery(e.target.value)}
                    placeholder="Search by Team Code..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#55DEE8]/50 outline-none"
                  />
                  <button 
                    onClick={handleTeamSearch}
                    disabled={isSearching}
                    className="px-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                  >
                    <Search size={18} />
                  </button>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-2 mt-4">
                {teamTab === 'myTeams' && myTeams.map(t => (
                  <button 
                    key={t._id}
                    onClick={() => selectTeam(t._id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
                  >
                    <span className="font-bold text-white text-sm">{t.name}</span>
                    {(formData.teamAId === t._id || formData.teamBId === t._id) && <Check size={16} className="text-[#BFF367]" />}
                  </button>
                ))}

                {teamTab === 'opponentTeams' && !searchedTeam && oppTeams.map(t => (
                  <button 
                    key={t._id}
                    onClick={() => selectTeam(t._id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-left"
                  >
                    <span className="font-bold text-white text-sm">{t.name}</span>
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">{t.teamCode}</span>
                    {(formData.teamAId === t._id || formData.teamBId === t._id) && <Check size={16} className="text-[#BFF367]" />}
                  </button>
                ))}

                {teamTab === 'opponentTeams' && searchedTeam?.team && (
                  <button 
                    onClick={() => selectTeam(searchedTeam.team._id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#55DEE8]/10 to-[#BFF367]/10 border border-[#55DEE8]/30 hover:border-[#55DEE8] transition-all text-left mt-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{searchedTeam.team.name}</span>
                      <span className="text-[10px] text-[#55DEE8]">Search Result</span>
                    </div>
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">{searchedTeam.team.teamCode}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= i ? 'bg-[#55DEE8]' : 'bg-white/10'}`} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button 
                    onClick={handlePrev}
                    className="flex-1 py-3.5 px-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-wider"
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                )}
                
                {step < 4 ? (
                  <button 
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !formData.matchName) ||
                      (step === 2 && (!formData.teamAId || !formData.teamBId))
                    }
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-wider disabled:opacity-50"
                  >
                    Next Step <ChevronRight size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading || !formData.scoringPassword}
                    className="flex-[2] py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase text-sm tracking-wider disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Match...' : 'Start Game'} 
                    {!isLoading && <Trophy size={16} />}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StartScoringModal;
