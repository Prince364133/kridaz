import React, { useState } from 'react';
import { useInviteMembersMutation, useGetNetworkQuery } from '../../../redux/api/teamApi';
import { 
  X, QrCode, Link2, Users, UserPlus, 
  Share2, Copy, Check, Loader2, Search 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';

const InviteMemberModal = ({ isOpen, onClose, teamId, teamName }) => {
  const { user } = useSelector(state => state.auth);
  const [inviteMembers, { isLoading }] = useInviteMembersMutation();
  const { data: networkData, isLoading: isLoadingNetwork } = useGetNetworkQuery();
  const [activeTab, setActiveTab] = useState('link'); // 'qr', 'link', 'followers', 'following', 'custom'
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Custom member state
  const [customMember, setCustomMember] = useState({ name: '', contact: '' });
  
  const inviteLink = `${window.location.origin}/signup?teamInvite=${teamId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvitePlayer = async (player) => {
    try {
      await inviteMembers({
        id: teamId,
        memberIds: [player._id]
      }).unwrap();
      toast.success(`Invite sent to ${player.name}`);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send invite');
    }
  };

  const handleInviteCustom = async (e) => {
    e.preventDefault();
    if (!customMember.name || !customMember.contact) return toast.error('Name and Contact are required');
    
    try {
      const isEmail = customMember.contact.includes('@');
      const body = {
        customMembers: [{
          name: customMember.name,
          [isEmail ? 'email' : 'phone']: customMember.contact
        }]
      };
      
      const response = await inviteMembers({ id: teamId, ...body }).unwrap();
      toast.success(`Invite sent to ${customMember.name}`);
      setCustomMember({ name: '', contact: '' });
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send invite');
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'link', label: 'Link', icon: <Link2 size={16} /> },
    { id: 'qr', label: 'QR Code', icon: <QrCode size={16} /> },
    { id: 'followers', label: 'Followers', icon: <Users size={16} /> },
    { id: 'following', label: 'Following', icon: <Users size={16} /> },
    { id: 'custom', label: 'Custom', icon: <UserPlus size={16} /> },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Add Team Members</h3>
            <p className="text-white/40 text-xs mt-1">Invite players to join <span className="text-primary font-bold">{teamName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto custom-scrollbar border-b border-white/5 px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-4 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap relative ${
                activeTab === tab.id ? 'text-primary' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.icon} {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 min-h-[300px] flex flex-col items-center justify-center text-center">
          <AnimatePresence mode="wait">
            {activeTab === 'link' && (
              <motion.div 
                key="link"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-2xl mx-auto">
                  <Link2 />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2">Share Invitation Link</h4>
                  <p className="text-white/40 text-sm">Anyone with this link can join your team instantly after signing up.</p>
                </div>
                <div className="flex items-center gap-2 p-2 bg-white/5 rounded-2xl border border-white/10">
                  <input 
                    readOnly 
                    value={inviteLink}
                    className="bg-transparent border-none text-white text-xs flex-1 px-2 focus:outline-none truncate"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="p-3 bg-primary text-black rounded-xl hover:bg-primary-hover transition-all"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'qr' && (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-6"
              >
                <div className="p-4 bg-white rounded-3xl mx-auto w-48 h-48 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                  {/* Real QR would go here */}
                  <div className="w-full h-full border-4 border-black/5 flex flex-col items-center justify-center">
                    <QrCode className="text-black text-6xl" />
                    <p className="text-[10px] text-black/50 font-bold mt-2">SCAN TO JOIN</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2">Scan QR Code</h4>
                  <p className="text-white/40 text-sm">Players can scan this code with their camera to join your team.</p>
                </div>
                <button className="flex items-center gap-2 text-primary font-bold text-sm mx-auto hover:underline">
                  <Share2 size={16} /> Share Image
                </button>
              </motion.div>
            )}

            {(activeTab === 'followers' || activeTab === 'following') && (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full h-full flex flex-col gap-4"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                  <input 
                    type="text" 
                    placeholder={`Search ${activeTab}...`} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="flex-1 max-h-64 overflow-y-auto custom-scrollbar space-y-2 text-left">
                  {isLoadingNetwork ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="animate-spin text-primary" />
                    </div>
                  ) : (networkData?.[activeTab] || [])
                    .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .length > 0 ? (
                      (networkData?.[activeTab] || [])
                        .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(person => (
                          <div key={person._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3">
                              <img src={person.profilePicture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`} alt={person.name} className="w-10 h-10 rounded-lg object-cover" />
                              <div>
                                <h5 className="text-white text-xs font-bold">{person.name}</h5>
                                <p className="text-[10px] text-white/30">@{person.username}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleInvitePlayer(person)}
                              className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-black transition-all"
                            >
                              <UserPlus size={16} />
                            </button>
                          </div>
                        ))
                    ) : (
                    <p className="text-white/20 text-center py-10 italic">No {activeTab} found.</p>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'custom' && (
              <motion.div 
                key="custom"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-4"
              >
                <div className="text-left space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Player Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50"
                      value={customMember.name}
                      onChange={(e) => setCustomMember({...customMember, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Email or Phone</label>
                    <input 
                      type="text" 
                      placeholder="e.g. john@example.com or +91..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50"
                      value={customMember.contact}
                      onChange={(e) => setCustomMember({...customMember, contact: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={handleInviteCustom}
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary-hover text-black font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Send Invite'}
                </button>
                <p className="text-[10px] text-white/30 italic">An invitation link will be sent to the player.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default InviteMemberModal;
