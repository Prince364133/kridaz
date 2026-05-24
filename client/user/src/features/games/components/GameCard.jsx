import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck
} from 'lucide-react';

const SPORT_COLORS = {
  Cricket: 'from-amber-500 to-orange-600',
  Football: 'from-emerald-500 to-teal-600',
  Basketball: 'from-orange-500 to-red-600',
  Volleyball: 'from-blue-500 to-indigo-600',
  Badminton: 'from-yellow-400 to-amber-500',
  Tennis: 'from-lime-500 to-emerald-600',
  'Table Tennis': 'from-rose-500 to-pink-600',
  Pickleball: 'from-violet-500 to-purple-600',
  default: 'from-slate-500 to-slate-700'
};

const GameCard = ({ game, onSelect, actionButton }) => {
  const getSportColor = (sport) => SPORT_COLORS[sport] || SPORT_COLORS.default;

  // Calculate slots progress
  let totalSlots = 0;
  let filledSlots = 0;

  if (game.gameMode === 'QUICK') {
    totalSlots = game.quickSlotsData?.length || 0;
    filledSlots = game.quickSlotsData?.filter(s => s.status === 'JOINED' || s.status === 'HELD').length || 0;
  } else {
    const slotsA = game.teamA?.slots || [];
    const slotsB = game.teamB?.slots || [];
    totalSlots = slotsA.length + slotsB.length;
    filledSlots = [...slotsA, ...slotsB].filter(s => s.status === 'JOINED' || s.status === 'HELD').length || 0;
  }

  const fillPercentage = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
      {/* Decorative gradient header based on sport */}
      <div className={`h-2 bg-gradient-to-r ${getSportColor(game.gameType)}`} />

      <div className="p-6">
        {/* Top bar with tags */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getSportColor(game.gameType)} text-white shadow-sm`}>
              {game.gameType}
            </span>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
              game.gameMode === 'QUICK' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
            }`}>
              {game.gameMode}
            </span>
          </div>

          {game.isLive && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] uppercase font-bold animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Live
            </span>
          )}
        </div>

        {/* Info Grid */}
        <div className="space-y-4">
          {/* Venue & Host */}
          <div>
            <h3 className="font-bold text-lg text-slate-100 group-hover:text-violet-400 transition-colors line-clamp-1">
              {game.ground?.name || 'Street Ground / Local Match'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>Hosted by</span>
              <span className="font-medium text-slate-300">{game.host?.name || 'Community Member'}</span>
            </p>
          </div>

          {/* Date, Time, Charge */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="truncate">
                {game.date ? new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-400 shrink-0" />
              <span>{game.time || 'TBD'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-400 shrink-0" />
              <span className="truncate">{game.city || 'Any City'}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <DollarSign className="h-4 w-4 shrink-0" />
              <span>{game.perPlayerCharge || 'Free'}</span>
            </div>
          </div>

          {/* Roster & Slot Progress or Teams */}
          {game.gameMode === 'PROFESSIONAL' ? (
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2 max-w-[40%]">
                <img src={game.teamA?.image || "https://ui-avatars.com/api/?name=A&background=random"} className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover" alt="Team A" />
                <span className="text-xs font-bold text-white truncate">{game.teamA?.name || 'TBD'}</span>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0 px-2">VS</span>
              <div className="flex items-center gap-2 max-w-[40%] flex-row-reverse">
                <img src={game.teamB?.image || "https://ui-avatars.com/api/?name=B&background=random"} className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover" alt="Team B" />
                <span className="text-xs font-bold text-white truncate text-right">{game.teamB?.name || 'TBD'}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 mt-2 pt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Roster Spots
                </span>
                <span className="font-semibold text-slate-200">
                  {filledSlots} / {totalSlots} Filled
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getSportColor(game.gameType)} transition-all duration-500`}
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Professional Assets requested */}
          <div className="flex gap-2">
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

          {/* Action button layer */}
          <div className="pt-2 flex gap-3">
            {onSelect && (
              <button 
                onClick={() => onSelect(game)}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 hover:border-white/10 transition-all text-center"
              >
                Inspect Match
              </button>
            )}
            {actionButton && (
              <div className="flex-1">
                {actionButton}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
