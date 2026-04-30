import { getEndTime } from "../../utils/dateUtils";

const DurationSelection = ({
  selectedStartTime,
  duration,
  handleDurationChange,
  isDurationAvailable,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-1 h-6 bg-[#84CC16] rounded-full" />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">3. Select Duration</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((hours) => {
          const selected = duration === hours;
          const available = isDurationAvailable(selectedStartTime, hours);
          
          return (
            <button
              key={hours}
              className={`p-6 rounded-2xl border transition-all text-left ${
                selected
                  ? "bg-[#84CC16] border-[#84CC16] text-black shadow-lg shadow-[#84CC16]/20"
                  : !available
                  ? "bg-zinc-800 border-transparent text-zinc-600 cursor-not-allowed opacity-50"
                  : "bg-black/40 border-white/5 text-zinc-400 hover:border-[#84CC16]/30 hover:text-white"
              }`}
              onClick={() => handleDurationChange(hours)}
              disabled={!available}
            >
              <div className="space-y-1">
                <p className="text-lg font-bold uppercase tracking-tight">
                  {hours} Hour{hours > 1 ? "s" : ""}
                </p>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${selected ? "text-black/60" : "text-zinc-500"}`}>
                  Ends at {getEndTime(selectedStartTime, hours)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default DurationSelection;
