import { useEffect, useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

export default function useBookingHistory() {
 
 const [bookings, setBookings] = useState([]);
 const [loading, setLoading] = useState(false);

 const formatBookingsData = (bookings) => {
 return bookings.map((booking) => {
 const adjustedStartTime = parseISO(booking.timeSlot.startTime);
 const adjustedEndTime = parseISO(booking.timeSlot.endTime);

 return {
 ...booking,
 timeSlot: {
 ...booking.timeSlot,
 formattedStartTime: format(adjustedStartTime, "hh:mm a"),
 formattedEndTime: format(adjustedEndTime, "hh:mm a"),
 date: format(adjustedStartTime, "dd MMM yyyy"),
 },
 };
 });
 };

 const fetchBookings = async () => {
 setLoading(true);
 try {
 const response = await axiosInstance.get(
 "/api/user/booking/get-bookings"
 );
 const result = response.data;
 const formattedBookings = formatBookingsData(result);
 setBookings(formattedBookings);
 } catch (error) {
 console.error(error, "error");
 toast.error(error.response?.data?.message);
 } finally {
 setLoading(false);
 }
 };

 const cancelBooking = async (booking) => {
 const playTime = new Date(booking.playStartTime);
 const now = new Date();
 const hoursRemaining = (playTime - now) / (1000 * 60 * 60);
 
 let confirmMsg = "Are you sure you want to cancel this booking? No refund will be issued as it's within 24 hours of the slot.";
 if (hoursRemaining >= 24) {
 confirmMsg = "Are you sure you want to cancel? Since you are cancelling more than 24 hours before the slot, you will receive a 30% refund in your wallet. The remaining 70% is non-refundable.";
 }

 if (!window.confirm(confirmMsg)) return;
 
 try {
 const response = await axiosInstance.post(`/api/booking/user/cancel/${booking.id || booking._id}`);
 if (response.data.success) {
 toast.success(response.data.message || "Booking cancelled successfully.");
 fetchBookings();
 return true;
 }
 } catch (error) {
 console.error("Cancel booking error:", error);
 toast.error(error.response?.data?.message || "Failed to cancel booking.");
 }
 return false;
 };

 useEffect(() => {

 fetchBookings();
 }, []);

 return { bookings, loading, cancelBooking };
}

