import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Users, Trophy, MapPin, Calendar, Shield, ChevronLeft,
  UserPlus, Sword, MessageCircle, Share2, Copy,
  CheckCircle2, AlertCircle, Loader2, Info, Zap, QrCode, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetTeamByIdQuery,
  useRequestToJoinMutation,
  useGetMyTeamsQuery,
  useRequestOpponentMutation
} from '../../redux/api/teamApi';
import toast from 'react-hot-toast';
import useLoginOnDemand from '@hooks/useLoginOnDemand';

const TeamProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isLoggedIn } = useSelector((state) => state.auth);
  const { gateInteraction } = useLoginOnDemand();

  const { data: teamData, isLoading, error } = useGetTeamByIdQuery(id);
  const { data: myTeamsData } = useGetMyTeamsQuery(undefined, { skip: !isLoggedIn });
  const [requestJoin, { isLoading: isJoining }] = useRequestToJoinMutation();
  const [requestOpponent, { isLoading: isChallenging }] = useRequestOpponentMutation();

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedMyTeam, setSelectedMyTeam] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#CCFF00] animate-spin" />
          <p className="text-white/40 font-black uppercase tracking-[0.3em] animate-pulse">Loading Team Squad...</p>
        </div>
      </div>
    );
  }

  if (error || !teamData?.team) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-6" />
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Team Not Found</h2>
        <p className="text-white/40 mb-8 max-w-md">The team you are looking for might have been disbanded or the link is invalid.</p>
        <button
          onClick={() => navigate('/players')}
          className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
        >
          Back to Discovery
        </button>
      </div>
    );
  }

  const team = teamData.team;
  const isOwner = currentUser?._id === team.owner?._id;
  const isMember = team.members?.some(m => m.user?._id === currentUser?._id && m.status === 'JOINED');
  const isPendingMember = team.members?.some(m => m.user?._id === currentUser?._id && m.status === 'PENDING');

  const handleJoinRequest = async () => {
    gateInteraction(async () => {
      try {
        await requestJoin(id).unwrap();
        toast.success('Join request sent to captain!');
      } catch (err) {
        toast.error(err.data?.message || 'Failed to send join request');
      }
    }, {
      title: "Join the Squad",
      message: "Sign in to request to join this team and start playing matches together."
    });
  };

  const handleChallenge = async () => {
    if (!selectedMyTeam) {
      toast.error('Select one of your teams first');
      return;
    }
    try {
      await requestOpponent({ teamId: selectedMyTeam, targetTeamId: id }).unwrap();
      toast.success('Challenge request sent!');
      setShowChallengeModal(false);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send challenge');
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(team.teamCode);
    toast.success('Team ID copied!');
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-24">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#CCFF00]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-[#CCFF00] transition-colors mb-8 group"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back</span>
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-[40px] bg-white/[0.03] border-2 border-white/10 p-2 shadow-2xl relative group">
                <div className="absolute inset-0 bg-[#CCFF00]/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-full h-full rounded-[32px] bg-[#1a1a1a] flex items-center justify-center overflow-hidden relative z-10 border border-white/5">
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users size={64} className="text-[#CCFF00]/20" />
                  )}
                </div>
              </div>

              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="px-3 py-1 bg-[#CCFF00]/10 text-[#CCFF00] text-[10px] font-black uppercase tracking-widest rounded-full border border-[#CCFF00]/20">
                    {team.sportType}
                  </span>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10">
                    <MapPin size={10} />
                    {team.city}
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                  {team.name}
                </h1>

                <p className="text-white/40 text-sm md:text-base font-medium max-w-xl">
                  {team.description || "Representing the best of their city. This squad is built on passion and strategy."}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Team ID</span>
                    <button
                      onClick={copyId}
                      className="flex items-center gap-2 text-[#CCFF00] font-black tracking-widest hover:brightness-110 transition-all"
                    >
                      {team.teamCode}
                      <Copy size={12} className="text-white/20" />
                    </button>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Captain</span>
                    <span className="text-white font-black tracking-tight">@{team.owner?.username || 'Captain'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 space-y-6 sticky top-24 shadow-2xl backdrop-blur-xl">
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tight">Squad Status</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Available for matches</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black text-[#CCFF00]">{team.members?.length || 0}</p>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Active Players</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-2xl font-black text-blue-500">0</p>
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Match Wins</p>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                {!isOwner && !isMember && (
                  <button
                    onClick={handleJoinRequest}
                    disabled={isJoining || isPendingMember}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${isPendingMember
                        ? 'bg-white/5 text-white/20 border border-white/10'
                        : 'bg-[#CCFF00] text-black hover:bg-[#a3e635] shadow-[0_10px_30px_rgba(204,255,0,0.1)] hover:-translate-y-1'
                      }`}
                  >
                    {isJoining ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        <UserPlus size={18} />
                        {isPendingMember ? 'Request Pending' : 'Join Team'}
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 hover:-translate-y-1"
                >
                  <Sword size={18} className="text-red-500" />
                  Challenge Team
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => navigate(`/messages?teamId=${id}`)}
                    className="py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={14} />
                    <span className="text-[10px] font-black uppercase">Chat</span>
                  </button>
                  <button 
                    onClick={() => setShowPassModal(true)}
                    className="py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-[#CCFF00] hover:border-[#CCFF00]/50 transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode size={14} />
                    <span className="text-[10px] font-black uppercase">View Pass</span>
                  </button>
                </div>

                <button 
                  onClick={() => {
                    navigator.share({
                      title: `Join ${team.name} on Kridaz`,
                      text: `Check out ${team.name} team profile and join the squad!`,
                      url: window.location.href
                    }).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link copied to clipboard!');
                    });
                  }}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={14} />
                  <span className="text-[10px] font-black uppercase">Share Team</span>
                </button>
              </div>

              {isOwner && (
                <Link
                  to="/my-teams"
                  className="block text-center text-[#CCFF00] text-[10px] font-black uppercase tracking-widest hover:underline pt-2"
                >
                  Manage Your Team In Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Squad & Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            {/* Members Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                  <Users className="text-[#CCFF00]" size={24} />
                  Active Squad
                </h2>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{team.members?.length || 0} MEMBERS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.members?.map((member, idx) => (
                  <Link
                    to={`/profile/${member.user?._id}`}
                    key={idx}
                    className="bg-white/[0.02] border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:border-[#CCFF00]/20 hover:bg-white/[0.04] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {member.user?.profilePicture ? (
                        <img src={member.user.profilePicture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20 font-black">
                          {member.user?.name?.charAt(0) || 'P'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-black truncate uppercase tracking-tight">
                          {member.user?.name || member.user?.username || 'Player'}
                        </h4>
                        {member.role === 'CAPTAIN' && (
                          <Shield size={12} className="text-[#CCFF00]" />
                        )}
                      </div>
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{member.role}</p>
                    </div>
                    <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest group-hover:text-[#CCFF00] group-hover:bg-[#CCFF00]/10 transition-colors">
                      VIEW PROFILE
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Match History / Stats Placeholder */}
            <section className="space-y-6">
              <h2 className="text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                <Trophy className="text-blue-500" size={24} />
                Match History
              </h2>
              <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[32px] py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Info className="text-white/10" size={24} />
                </div>
                <h4 className="text-white font-black uppercase tracking-tight">No Match Data Yet</h4>
                <p className="text-white/20 text-xs mt-2 max-w-xs">Match records will appear here once the team starts competing in official tournaments or friendly games.</p>
              </div>
            </section>
          </div>

          {/* Opponents Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            <h2 className="text-xl font-black italic uppercase tracking-tight flex items-center gap-3">
              <Sword className="text-red-500" size={20} />
              Rivals
            </h2>

            <div className="space-y-4">
              {team.opponents?.map((opp, idx) => (
                <Link
                  to={`/team/${opp._id}`}
                  key={idx}
                  className="block bg-white/[0.02] border border-white/5 p-4 rounded-2xl hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {opp.logo ? <img src={opp.logo} alt="" className="w-full h-full object-cover" /> : <Users size={16} className="text-red-500/40" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-white font-black truncate uppercase italic tracking-tight">{opp.name}</p>
                      <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest">{opp.sportType} · {opp.city}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {(!team.opponents || team.opponents.length === 0) && (
                <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 text-center">
                  <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No Linked Rivals</p>
                </div>
              )}
            </div>

            {/* Quick Promo / AD */}
            <div className="bg-gradient-to-br from-[#CCFF00]/10 to-blue-500/10 border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
              <div className="relative z-10 space-y-4">
                <Zap className="text-[#CCFF00]" size={32} />
                <h4 className="text-lg font-black uppercase italic tracking-tighter leading-none">Elevate Your Squad</h4>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Schedule professional matches, hire officials, and stream your glory live on Kridaz.</p>
                <button className="w-full py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-transform">
                  Upgrade Team
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/20 blur-[60px] translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-1000" />
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      <AnimatePresence>
        {showChallengeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChallengeModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#1a1a1a] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Challenge Squad</h2>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Select your team to compete</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <Sword size={24} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest px-1">Your Eligible Teams</label>
                  <div className="space-y-3 max-h-[240px] overflow-y-auto no-scrollbar">
                    {myTeamsData?.teams?.filter(t => t.sportType === team.sportType)?.map(t => (
                      <button
                        key={t._id}
                        onClick={() => setSelectedMyTeam(t._id)}
                        className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${selectedMyTeam === t._id
                            ? 'bg-[#CCFF00]/10 border-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.1)]'
                            : 'bg-white/5 border-white/5 hover:border-white/20'
                          }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover" /> : <Users size={16} />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`font-black uppercase italic tracking-tight truncate ${selectedMyTeam === t._id ? 'text-[#CCFF00]' : 'text-white'}`}>
                            {t.name}
                          </p>
                          <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{t.city}</p>
                        </div>
                        {selectedMyTeam === t._id && <CheckCircle2 size={18} className="text-[#CCFF00]" />}
                      </button>
                    ))}
                    {myTeamsData?.teams?.filter(t => t.sportType === team.sportType).length === 0 && (
                      <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">No {team.sportType} Teams Found</p>
                        <Link to="/my-teams" className="text-[#CCFF00] text-[9px] font-black uppercase hover:underline mt-2 inline-block">Create One Now</Link>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setShowChallengeModal(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChallenge}
                    disabled={isChallenging || !selectedMyTeam}
                    className="flex-1 py-4 bg-[#CCFF00] hover:bg-[#a3e635] disabled:bg-white/10 disabled:text-white/20 rounded-2xl text-black font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-[#CCFF00]/10"
                  >
                    {isChallenging ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Send Challenge'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Team Pass Modal */}
      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPassModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-sm overflow-hidden"
            >
              {/* Ticket UI */}
              <div className="bg-[#111] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                {/* Top Section */}
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#CCFF00] italic uppercase tracking-tighter">KRIDAZ</h2>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Team Official Pass</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#CCFF00]/10 flex items-center justify-center text-[#CCFF00]">
                      <Trophy size={24} />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-6 border-y border-white/5">
                    <div className="w-20 h-20 rounded-2xl bg-black border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-cover" /> : <Users size={32} className="text-[#CCFF00]/20" />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight truncate">{team.name}</h3>
                      <p className="text-[#CCFF00] text-[10px] font-black uppercase tracking-widest mt-1">{team.sportType} · {team.city}</p>
                    </div>
                  </div>

                  {/* QR Section */}
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="p-4 bg-white rounded-2xl shadow-[0_0_50px_rgba(204,255,0,0.15)]">
                      {team.qrCode ? (
                        <img src={team.qrCode} alt="Team QR" className="w-48 h-48" />
                      ) : (
                        <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded-xl">
                          <Loader2 className="animate-spin text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-white font-black uppercase tracking-widest text-[10px]">Scan to Join Squad</p>
                      <p className="text-white/20 text-[8px] font-bold uppercase mt-1">Validated Team Profile</p>
                    </div>
                  </div>
                </div>

                {/* Dashed Separator */}
                <div className="relative h-px bg-white/10 mx-8">
                  <div className="absolute -left-12 -top-3 w-6 h-6 bg-black rounded-full" />
                  <div className="absolute -right-12 -top-3 w-6 h-6 bg-black rounded-full" />
                </div>

                {/* Bottom Section */}
                <div className="p-8 bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <p className="text-white/20 text-[8px] font-black uppercase tracking-widest">Captain Handle</p>
                    <p className="text-white font-black text-xs uppercase mt-1">@{team.owner?.username || 'Captain'}</p>
                  </div>
                  <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = team.qrCode;
                      link.download = `team-pass-${team.name}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="p-3 bg-white/5 hover:bg-[#CCFF00] hover:text-black rounded-xl text-white/40 transition-all group"
                  >
                    <Download size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={() => setShowPassModal(false)}
                className="mt-6 w-full py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all"
              >
                Close Pass
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamProfile;
