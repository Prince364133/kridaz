import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Coins, 
  TrendingUp, 
  ShieldCheck
} from 'lucide-react';

const GameCard = ({ game, onSelect, actionButton }) => {
  // Calculate slots progress
  let totalSlots = 0;
  let filledSlots = 0;
  let teamATotal = 0;
  let teamAFilled = 0;
  let teamBTotal = 0;
  let teamBFilled = 0;

  if (game.gameMode === 'QUICK') {
    totalSlots = game.quickSlotsData?.length || 0;
    filledSlots = game.quickSlotsData?.filter(s => s.status === 'JOINED' || s.status === 'HELD').length || 0;
  } else {
    const teamA = game.teams?.teamA;
    const teamB = game.teams?.teamB;
    const slotsA = teamA?.slots || [];
    const slotsB = teamB?.slots || [];
    teamATotal = slotsA.length;
    teamBTotal = slotsB.length;
    teamAFilled = slotsA.filter(s => s.status === 'JOINED' || s.status === 'HELD').length;
    teamBFilled = slotsB.filter(s => s.status === 'JOINED' || s.status === 'HELD').length;
    totalSlots = teamATotal + teamBTotal;
    filledSlots = teamAFilled + teamBFilled;
  }

  const fillPercentage = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

  return (
    <div className="flex flex-col bg-[#121212] border border-white/[0.08] hover:border-[#55DEE8]/50 p-4 rounded-[16px] transition-all duration-300 group cursor-pointer hover:shadow-[0px_8px_24px_rgba(85,222,232,0.10)]" onClick={() => onSelect && onSelect(game)}>
      {/* Top bar with tags */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#BFF367]/10 text-[#BFF367] border border-[#BFF367]/20">
            {game.sport || (game.gameType === 'SCORING_MATCH' ? 'LIVE MATCH' : game.gameType?.replace('_', ' '))}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-white/70 border border-white/10">
            {game.gameMode}
          </span>
        </div>

        {(game.scoringStatus === 'IN_PROGRESS' || game.isLive) && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            Live
          </span>
        )}
      </div>

      {/* Venue & Host */}
      <div className="mb-4">
        <h3 className="text-[14px] font-bold text-white group-hover:text-[#BFF367] transition-colors line-clamp-1">
          {game.name || game.customVenue || game.turf?.name || `${game.sport || 'Match'} Event`}
        </h3>
        <p className="text-[11px] font-medium text-white/40 mt-0.5">
          Hosted by <span className="text-white/70">{game.host?.name || game.creator?.name || 'Player'}</span>
        </p>
      </div>

      {/* Date, Time, Charge */}
      <div className="grid grid-cols-2 gap-y-2 gap-x-4 py-3 border-y border-white/5 text-[12px] text-white/70">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-white/40" />
          <span className="truncate">
            {game.date ? new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-white/40" />
          <span>{game.time || 'TBD'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-white/40" />
          <span className="truncate">{game.city || 'Any City'}</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-[#BFF367]">
          <Coins className="h-3.5 w-3.5 shrink-0" />
          <span>{game.perPlayerCharge || 'Free'}</span>
        </div>
      </div>

      {/* Roster & Slot Progress or Teams */}
      {game.gameMode === 'PROFESSIONAL' ? (
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-col items-start gap-1 max-w-[40%]">
            <div className="flex items-center gap-2">
              {game.teams?.teamA?.image ? (
                <img src={game.teams.teamA.image} className="w-7 h-7 rounded-full border border-white/10 shrink-0 object-cover bg-[#111]" alt={game.teams.teamA?.name || 'Team A'} />
              ) : (
                <div className="w-7 h-7 rounded-full border border-white/10 shrink-0 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white/50 uppercase">
                  {(game.teams?.teamA?.name || 'A').charAt(0)}
                </div>
              )}
              <span className="text-[11px] font-bold text-white truncate">{game.teams?.teamA?.name || 'Team A'}</span>
            </div>
            <span className="text-[10px] text-white/50">{teamAFilled}/{teamATotal} Filled</span>
          </div>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest shrink-0 px-2">VS</span>
          <div className="flex flex-col items-end gap-1 max-w-[40%]">
            <div className="flex items-center gap-2 flex-row-reverse">
              {game.teams?.teamB?.image ? (
                <img src={game.teams.teamB.image} className="w-7 h-7 rounded-full border border-white/10 shrink-0 object-cover bg-[#111]" alt={game.teams.teamB?.name || 'Team B'} />
              ) : (
                <div className="w-7 h-7 rounded-full border border-white/10 shrink-0 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white/50 uppercase">
                  {(game.teams?.teamB?.name || 'B').charAt(0)}
                </div>
              )}
              <span className="text-[11px] font-bold text-white truncate text-right">{game.teams?.teamB?.name || 'Team B'}</span>
            </div>
            <span className="text-[10px] text-white/50">{teamBFilled}/{teamBTotal} Filled</span>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 mt-3">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/50 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Roster Spots
            </span>
            <span className="font-bold text-white/80">
              {filledSlots} / {totalSlots} Filled
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#111] rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-[#BFF367] transition-all duration-500"
              style={{ width: `${fillPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Professional Assets requested */}
      {(game.umpireId || game.streamerId) && (
        <div className="flex gap-2 mt-3">
          {game.umpireId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
              <ShieldCheck className="h-3 w-3" />
              Umpire
            </span>
          )}
          {game.streamerId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px]">
              <TrendingUp className="h-3 w-3" />
              Streamer
            </span>
          )}
        </div>
      )}

      {/* Action button layer */}
      {actionButton && (
        <div className="mt-3 flex gap-2">
          <div className="flex-1">
            {actionButton}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCard;
