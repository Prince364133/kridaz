import { format } from "date-fns";
import { getEndTime } from "../../utils/dateUtils";

const ReservationSummary = ({
  selectedDate,
  selectedStartTime,
  duration,
  pricePerHour,
}) => {
  return (
    <div className="bg-black/40 border border-[#84CC16]/20 rounded-[2rem] p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-1 h-6 bg-[#84CC16] rounded-full" />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">4. Reservation Summary</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Date</p>
          <p className="text-white font-bold">{format(selectedDate, "dd MMM yyyy")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Duration</p>
          <p className="text-white font-bold">{duration} Hour{duration > 1 ? "s" : ""}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Time Slot</p>
          <p className="text-white font-bold">{selectedStartTime} - {getEndTime(selectedStartTime, duration)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Amount</p>
          <p className="text-[#84CC16] text-xl font-bold">₹{pricePerHour * duration}</p>
        </div>
      </div>
    </div>
  );
};


export default ReservationSummary;
