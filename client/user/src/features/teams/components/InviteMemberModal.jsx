/* eslint-disable react/prop-types */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Search, UserPlus, Phone, Loader2, Sparkles } from 'lucide-react';
import { useSearchPlayersQuery, useInviteMemberMutation, useAddCustomMemberMutation } from '@redux/api/teamApi';
import toast from 'react-hot-toast';

const GRAD = 'linear-gradient(90deg, #3ec6c1 0%, #8bc34a 100%)';
const HEADING_STYLE = { fontFamily: '"Open Sans", sans-serif' };
const SUBHEADING_STYLE = { fontFamily: '"Inter", sans-serif' };

const InviteMemberModal = ({ isOpen, onClose, teamId, teamName }) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'custom'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Player Fields
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  const { data: searchResults, isLoading: isSearching } = useSearchPlayersQuery(searchTerm, {
    skip: !searchTerm || activeTab !== 'search',
  });

  const [invitePlayer, { isLoading: isInviting }] = useInviteMemberMutation();
  const [addCustomPlayer, { isLoading: isAddingCustom }] = useAddCustomMemberMutation();

  const handleInvite = async (userId) => {
    try {
      const result = await invitePlayer({ teamId, userId }).unwrap();
      if (result.success) {
        toast.success('Invitation sent to player!');
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send invitation');
    }
  };

  const handleAddCustom = async (e) => {
    e.preventDefault();
    if (!customName.trim()) return toast.error('Player Name is required');

    try {
      const result = await addCustomPlayer({
        teamId,
        name: customName,
        phone: customPhone,
      }).unwrap();

      if (result.success) {
        toast.success('Custom player added to team!');
        setCustomName('');
        setCustomPhone('');
        onClose();
      }
    } catch (err) {
      toast.error(err.data?.message || 'Failed to add player');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <motion.div 
         initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/[0.06] bg-[#0d0d0d]/90 shadow-[0_0_48px_rgba(62,198,193,0.14),0_24px_80px_rgba(0,0,0,0.5)]"
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-[32px]"
          style={{
            padding: 1,
            background: GRAD,
            opacity: 0.32,
            WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude'
          }}
        />
        {/* Header */}
        <div className="relative z-10 p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight" style={HEADING_STYLE}>Add Roster</h2>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1" style={SUBHEADING_STYLE}>Grow {teamName || 'your'} team squad</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={20} className="text-white/40" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="relative z-10 p-6 pb-2">
          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
            <button 
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'search' ? 'text-black shadow-lg shadow-[#3ec6c1]/10' : 'text-white/40 hover:text-white'
              }`}
              style={activeTab === 'search' ? { background: GRAD, ...SUBHEADING_STYLE } : SUBHEADING_STYLE}
            >
              Search Players
            </button>
            <button 
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                activeTab === 'custom' ? 'text-black shadow-lg shadow-[#3ec6c1]/10' : 'text-white/40 hover:text-white'
              }`}
              style={activeTab === 'custom' ? { background: GRAD, ...SUBHEADING_STYLE } : SUBHEADING_STYLE}
            >
              Add Custom Player
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 pt-2">
          {activeTab === 'search' ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  type="text"
                  placeholder="SEARCH USERNAME OR EMAIL..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-bold placeholder-white/20 focus:outline-none focus:border-[#3ec6c1]/60 focus:shadow-[0_0_18px_rgba(62,198,193,0.12)] uppercase transition-all"
                  style={SUBHEADING_STYLE}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Results List */}
              <div className="max-h-[30vh] overflow-y-auto space-y-2 custom-scrollbar">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8 text-[#3ec6c1]">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : searchResults?.players?.length > 0 ? (
                  searchResults.players.map(player => (
                    <div key={player._id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden">
                          <img src={player.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white uppercase" style={HEADING_STYLE}>@{player.username}</p>
                          <p className="text-[9px] text-white/40 uppercase mt-0.5" style={SUBHEADING_STYLE}>{player.city || 'N/A'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleInvite(player._id)}
                        disabled={isInviting}
                        className="p-2.5 disabled:bg-white/5 disabled:text-white/20 text-black rounded-xl transition-all hover:scale-105"
                        style={!isInviting ? { background: GRAD } : {}}
                      >
                        <UserPlus size={16} />
                      </button>
                    </div>
                  ))
                ) : searchTerm && (
                  <p className="text-center py-6 text-white/30 text-xs" style={SUBHEADING_STYLE}>No active players found</p>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddCustom} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1" style={SUBHEADING_STYLE}>Player Name</label>
                <input 
                  type="text"
                  placeholder="EX: RAHUL SHARMA"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm font-bold focus:outline-none focus:border-[#3ec6c1]/60 focus:shadow-[0_0_18px_rgba(62,198,193,0.12)] uppercase transition-all"
                  style={SUBHEADING_STYLE}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1" style={SUBHEADING_STYLE}>Contact Number (Optional)</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="tel"
                    placeholder="10-digit number"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white text-sm font-bold focus:outline-none focus:border-[#3ec6c1]/60 focus:shadow-[0_0_18px_rgba(62,198,193,0.12)] transition-all"
                    style={SUBHEADING_STYLE}
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    maxLength={10}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isAddingCustom}
                className="w-full py-4 disabled:bg-white/5 disabled:text-white/20 text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-[#3ec6c1]/10 transition-all flex items-center justify-center gap-2 mt-6 hover:scale-[1.01]"
                style={!isAddingCustom ? { background: GRAD, ...SUBHEADING_STYLE } : SUBHEADING_STYLE}
              >
                {isAddingCustom ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={16} />}
                Add Player to Roster
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default InviteMemberModal;
