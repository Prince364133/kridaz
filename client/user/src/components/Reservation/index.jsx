import DateSelection from "./DateSelection";
import TimeSelection from "./TimeSelection";
import DurationSelection from "./DurationSelection";
import ReservationSummary from "./ReservationSummary";
import useReservation from "../../hooks/useReservation";
import ReservationSkeleton from "../ui/ReservationSkeleton";

const Reservation = () => {
  const {
    selectedDate,
    selectedStartTime,
    duration,
    availableTimes,
    timeSlots,
    pricePerHour,
    handleDateChange,
    handleTimeSelection,
    handleDurationChange,
    isTimeSlotBooked,
    isDurationAvailable,
    confirmReservation,
    loading,
  } = useReservation();

  if (loading) return <ReservationSkeleton />;

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold uppercase tracking-tight mb-12 text-center md:text-left">
          Complete Your <span className="text-[#84CC16]">Reservation</span>
        </h2>
        
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl space-y-12">
          <DateSelection
            selectedDate={selectedDate}
            handleDateChange={handleDateChange}
          />
          
          <TimeSelection
            availableTimes={availableTimes}
            selectedStartTime={selectedStartTime}
            handleTimeSelection={handleTimeSelection}
            isTimeSlotBooked={isTimeSlotBooked}
            timeSlots={timeSlots}
            duration={duration}
          />
          
          {selectedStartTime && (
            <DurationSelection
              selectedStartTime={selectedStartTime}
              duration={duration}
              handleDurationChange={handleDurationChange}
              isDurationAvailable={isDurationAvailable}
            />
          )}
          
          {selectedStartTime && duration > 0 && (
            <ReservationSummary
              selectedDate={selectedDate}
              selectedStartTime={selectedStartTime}
              duration={duration}
              pricePerHour={pricePerHour}
            />
          )}
          
          <div className="pt-8">
            <button
              className="w-full bg-[#84CC16] hover:bg-[#A3E635] text-black h-16 rounded-2xl font-bold uppercase tracking-widest transition-all disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-95"
              disabled={
                !selectedStartTime ||
                !isDurationAvailable(selectedStartTime, duration) ||
                loading
              }
              onClick={confirmReservation}
            >
              {loading ? (
                <span className="loading loading-spinner loading-md"></span>
              ) : (
                "Confirm Booking"
              )}
            </button>
            <p className="text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-4">
              Secure Enterprise Transaction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Reservation;
