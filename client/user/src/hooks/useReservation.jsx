import { useParams, useLocation } from "react-router-dom";
import useDateSelection from "./useDateSelection";
import useTimeSelection from "./useTimeSelection";
import useDurationSelection from "./useDurationSelection";
import useBookingConfirmation from "./useBookingConfirmation";
import { useState, useEffect } from "react";

const useReservation = () => {
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date()
  );
  const [selectedStartTime, setSelectedStartTime] = useState(
    location.state?.selectedSlot?.startTime || null
  );
  const [bookedTime, setBookedTime] = useState([]);
  const [timeSlots, setTimeSlots] = useState({ openTime: "", closeTime: "", generatedSlots: [] });
  const [pricePerHour, setPricePerHour] = useState(0);
  const [duration, setDuration] = useState(1);



  const { handleDateChange } = useDateSelection(
    setSelectedDate,
    setSelectedStartTime,
    setDuration
  );

  const { availableTimes, handleTimeSelection, isTimeSlotBooked } =
    useTimeSelection(
      selectedDate,
      id,
      setSelectedStartTime,
      setBookedTime,
      setTimeSlots,
      setPricePerHour,
      bookedTime,
      timeSlots,
      setDuration
    );

  const { handleDurationChange, isDurationAvailable } = useDurationSelection(
    selectedStartTime,
    timeSlots,
    isTimeSlotBooked,
    setDuration
  );

  const { confirmReservation } = useBookingConfirmation(
    id,
    selectedDate,
    selectedStartTime,
    duration,
    pricePerHour,
    setLoading
  );

  return {
    selectedDate,
    selectedStartTime,
    duration,
    availableTimes,
    timeSlots,
    handleDateChange,
    handleTimeSelection,
    handleDurationChange,
    isTimeSlotBooked,
    isDurationAvailable,
    confirmReservation,
    pricePerHour,
    loading,
  };
};

export default useReservation;
