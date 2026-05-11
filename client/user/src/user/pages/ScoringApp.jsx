import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Settings, History, Users, Circle, Zap, CheckCircle2, AlertCircle, Filter, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import useCricketScoring from '@hooks/shared/useCricketScoring';
import BallByBallHistory from '../components/shared/BallByBallHistory';

/* ─── Helpers ─── */
const ballColor = (ball) => {
  if (ball.isWicket) return 'bg-red-600 text-white';
  if (ball.isExtra) return 'bg-yellow-500 text-black';
  if (ball.runs === 6) return 'bg-primary text-black';
  if (ball.runs === 4) return 'bg-green-500 text-black';
  if (ball.runs === 0) return 'bg-white/10 text-gray-400';
  return 'bg-white/20 text-white';
};
const ballLabel = (ball) => {
  if (ball.isWicket) return 'W';
  if (ball.extraType === 'WIDE') return 'Wd';
  if (ball.extraType === 'NO_BALL') return 'Nb';
  return String(ball.runs ?? '-');
};
const fmt = (n) => (n ?? 0);

/* ─── Members Tab ─── */
function MembersTab({ matchData }) {
  const [teamTab, setTeamTab] = useState('teamA');
  const game = matchData?.hostedGameId;
  const teamA = game?.teams?.teamA;
  const teamB = game?.teams?.teamB;
  const activeTeam = teamTab === 'teamA' ? teamA : teamB;

  const getBattingStats = (userId) =>
    matchData?.battingStats?.find(s => s.user?._id === userId || s.user === userId);
  const getBowlingStats = (userId) =>
    matchData?.bowlingStats?.find(s => s.user?._id === userId || s.user === userId);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
        {[['teamA', teamA?.name || 'Team A'], ['teamB', teamB?.name || 'Team B']].map(([key, label]) => (
          <button key={key} onClick={() => setTeamTab(key)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${teamTab === key ? 'bg-primary text-black' : 'text-gray-500'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTeam?.slots?.length > 0 ? (
        <div className="space-y-2">
          {activeTeam.slots.map((slot, i) => {
            const uid = slot.user?._id || slot.user;
            const bat = getBattingStats(uid);
            const bowl = getBowlingStats(uid);
            return (
              <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.03] rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {slot.user?.profilePicture
                    ? <img src={slot.user.profilePicture} className="w-full h-full object-cover" alt="" />
                    : <User size={16} className="text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase truncate">{slot.user?.name || `Player ${i + 1}`}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">{slot.role}</p>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {bat && <p className="text-[10px] text-primary font-bold">{bat.runs}({bat.balls}) <span className="text-gray-600">BAT</span></p>}
                  {bowl && <p className="text-[10px] text-blue-400 font-bold">{bowl.wickets}/{bowl.runs} <span className="text-gray-600">BWL</span></p>}
                  {!bat && !bowl && <p className="text-[10px] text-gray-600">No stats yet</p>}
                </div>
                {slot.status === 'JOINED' && <CheckCircle2 size={14} className="text-primary shrink-0" />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-10 text-center">
          <Users size={32} className="mx-auto mb-3 text-gray-700" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">No players joined yet</p>
        </div>
      )}
    </div>
  );
}

/* ─── History Tab Wrapper ─── */
function HistoryTab({ matchData }) {
  return <BallByBallHistory matchData={matchData} />;
}

const ScoringApp = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('scoring');
  const [showSettings, setShowSettings] = useState(false);

  const {
    matchData,
    loading,
    error,
    addBall,
    deleteLastBall,
    finishMatch,
    getLiveScore
  } = useCricketScoring(matchId);

  const score = getLiveScore();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      <AlertCircle className="text-red-500 mb-4" size={48} />
      <h2 className="text-xl font-black uppercase mb-2">Match Not Found</h2>
      <button onClick={() => navigate(-1)} className="text-primary text-xs font-bold uppercase tracking-widest">Go Back</button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members': return <MembersTab matchData={matchData} />;
      case 'history': return <HistoryTab matchData={matchData} />;
      default: return (
        <div className="space-y-6">
          {/* Main Scoring UI - existing logic but premium styled */}
          <div className="grid grid-cols-2 gap-4">
            {/* Batter 1 */}
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase truncate">{matchData?.onStrike?.name || 'Striker'}</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black">{matchData?.onStrike?.runs || 0}</p>
                <p className="text-[10px] text-gray-500 font-bold">({matchData?.onStrike?.balls || 0})</p>
              </div>
            </div>
            {/* Batter 2 */}
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 space-y-3 opacity-60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <User size={14} className="text-gray-400" />
                </div>
                <p className="text-[10px] font-black uppercase truncate">{matchData?.offStrike?.name || 'Non-Striker'}</p>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-2xl font-black">{matchData?.offStrike?.runs || 0}</p>
                <p className="text-[10px] text-gray-500 font-bold">({matchData?.offStrike?.balls || 0})</p>
              </div>
            </div>
          </div>

          {/* Bowler Card */}
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Zap size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-blue-400">Current Bowler</p>
                <p className="text-sm font-black uppercase">{matchData?.bowler?.name || 'TBD'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{matchData?.bowler?.wickets || 0} - {matchData?.bowler?.runs || 0}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{matchData?.bowler?.overs || 0}.{matchData?.bowler?.balls || 0} Ovs</p>
            </div>
          </div>

          {/* Scoring Buttons */}
          <div className="space-y-4">
             <div className="grid grid-cols-4 gap-3">
               {[0, 1, 2, 3].map(run => (
                 <button key={run} onClick={() => addBall({ runs: run })}
                  className="h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-xl font-black hover:bg-white/10 transition-all">
                   {run}
                 </button>
               ))}
               {[4, 6].map(run => (
                 <button key={run} onClick={() => addBall({ runs: run })}
                  className="h-16 bg-primary text-black rounded-2xl flex items-center justify-center text-xl font-black hover:scale-[1.02] transition-all">
                   {run}
                 </button>
               ))}
               <button onClick={() => addBall({ isExtra: true, extraType: 'WIDE' })}
                className="h-16 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest">
                 WIDE
               </button>
               <button onClick={() => addBall({ isExtra: true, extraType: 'NO_BALL' })}
                className="h-16 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center text-xs font-black uppercase tracking-widest">
                 NB
               </button>
             </div>
             
             <button onClick={() => addBall({ isWicket: true })}
              className="w-full h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(220,38,38,0.2)]">
               WICKET
             </button>
          </div>

          {/* Recent Balls */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Recent Balls</h3>
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
              {matchData?.timeline?.slice(-12).reverse().map((ball, i) => (
                <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${ballColor(ball)}`}>
                  {ballLabel(ball)}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tighter">{matchData?.hostedGameId?.name || 'Scoring App'}</h1>
              <p className="text-[8px] text-primary font-bold uppercase tracking-widest">LIVE • {matchData?.hostedGameId?.shortId}</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-white/5 rounded-full">
            <Settings size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Score Display */}
        <div className="relative overflow-hidden bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 text-center space-y-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Current Score</p>
          <div className="flex items-center justify-center gap-4">
            <h2 className="text-6xl font-black tracking-tighter italic">
              {score.totalRuns} <span className="text-primary text-4xl not-italic">/</span> {score.totalWickets}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-gray-400">
             <span>{score.overs}.{score.balls} OVERS</span>
             <span className="w-1 h-1 rounded-full bg-white/20" />
             <span>CRR: {score.crr}</span>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl">
          {[
            { id: 'scoring', icon: Zap, label: 'Score' },
            { id: 'members', icon: Users, label: 'Members' },
            { id: 'history', icon: History, label: 'History' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-white/10 text-primary' : 'text-gray-500 hover:text-white'}`}
            >
              <tab.icon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {renderContent()}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-xl mx-auto grid grid-cols-2 gap-4">
            <button 
              onClick={() => deleteLastBall()}
              className="h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              Undo Last Ball
            </button>
            <button 
              onClick={() => finishMatch()}
              className="h-14 bg-[#84CC16]/20 border border-[#84CC16]/30 text-[#84CC16] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#84CC16] hover:text-black transition-all"
            >
              Finish Match
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal - Simplified for now */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm p-6 flex items-center justify-center">
          <div className="w-full max-w-sm bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tighter">Scoring Settings</h3>
            <div className="space-y-4">
               <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-2xl">Close Settings</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringApp;
