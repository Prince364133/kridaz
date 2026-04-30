import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, addDays, isSameDay } from "date-fns";

const DateSelection = ({ selectedDate, handleDateChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-1 h-6 bg-[#84CC16] rounded-full" />
        <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">1. Select Date</h3>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:w-auto relative group">
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="dd-MM-yyyy"
            minDate={new Date()}
            className="bg-black/40 border border-white/10 text-white rounded-2xl px-6 py-4 focus:border-[#84CC16] outline-none transition-all w-full sm:w-64 font-bold text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            className="flex-1 sm:flex-none px-6 py-4 border border-white/10 text-zinc-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-[#84CC16]/30 hover:text-white transition-all disabled:opacity-10"
            onClick={() => handleDateChange(addDays(selectedDate, -1))}
            disabled={isSameDay(selectedDate, new Date())}
          >
            Previous
          </button>
          
          <div className="px-8 py-4 bg-[#84CC16]/10 border border-[#84CC16]/20 rounded-2xl text-center min-w-[120px]">
            <span className="text-xs font-bold text-[#84CC16] uppercase tracking-widest">
              {format(selectedDate, "dd MMM")}
            </span>
          </div>

          <button
            className="flex-1 sm:flex-none px-6 py-4 border border-white/10 text-zinc-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:border-[#84CC16]/30 hover:text-white transition-all"
            onClick={() => handleDateChange(addDays(selectedDate, 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};


export default DateSelection;
