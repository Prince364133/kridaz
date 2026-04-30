import { parse, isAfter, addHours } from "date-fns";

const TimeSelection = ({
  availableTimes,
  selectedStartTime,
  handleTimeSelection,
  isTimeSlotBooked,
  timeSlots,
  duration,
}) => {
  const isTimeSlotSelected = (time) => {
    if (!selectedStartTime || !duration) return false;
    const start = parse(selectedStartTime, "hh:mm a", new Date());
    const end = addHours(start, duration);
    const current = parse(time, "hh:mm a", new Date());
    return current >= start && current < end;
  };

  const isTimeSlotDisabled = (time) => {
    const closeTime = parse(timeSlots.closeTime, "hh:mm a", new Date());
    const currentTime = parse(time, "hh:mm a", new Date());
    return isAfter(currentTime, closeTime) || isTimeSlotBooked(time);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-1 h-6 bg-[#84CC16] rounded-full" />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">2. Choose Your Slot</h3>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {availableTimes.map((time) => {
          const selected = isTimeSlotSelected(time);
          const disabled = isTimeSlotDisabled(time);
          
          return (
            <button
              key={time}
              className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                selected
                  ? "bg-[#84CC16] text-black shadow-lg shadow-[#84CC16]/20"
                  : disabled
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed opacity-50"
                  : "bg-black/40 border border-white/5 text-zinc-400 hover:border-[#84CC16]/30 hover:text-white"
              }`}
              onClick={() => handleTimeSelection(time)}
              disabled={disabled}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default TimeSelection;
