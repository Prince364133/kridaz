import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { Calendar, Clock, Plus, Trash2, Save, Loader2, CalendarDays, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { format, addDays, startOfToday, parse } from "date-fns";
import ClockPicker from "../common/ClockPicker";

export default function ProfessionalAvailability() {
 const { user } = useSelector((state) => state.auth);
 const [loading, setLoading] = useState(false);
 const [fetching, setFetching] = useState(false);
 const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
 const [slots, setSlots] = useState([]);
 const [newSlot, setNewSlot] = useState({ startTime: "09:00", endTime: "10:00" });
 const [hasAvailability, setHasAvailability] = useState({}); // To track which dates have slots

 const timeToDate = (timeStr) => {
 if (!timeStr) return new Date();
 return parse(timeStr, 'HH:mm', new Date());
 };

 const dateToTime = (date) => {
 return format(date, 'HH:mm');
 };

 const dates = Array.from({ length: 28 }, (_, i) => addDays(startOfToday(), i));

 useEffect(() => {
 fetchAvailability();
 }, [selectedDate]);

 const fetchAvailability = async () => {
 try {
 setFetching(true);
 const professionalId = user._id || user.id || user.user;
 const res = await axiosInstance.get(`/api/professional/details/${professionalId}?date=${selectedDate}`);
 if (res.data.availability) {
 setSlots(res.data.availability.slots);
 } else {
 setSlots([]);
 }
 } catch (error) {
 console.error("Error fetching availability:", error);
 setSlots([]); // Ensure slots are cleared on error to prevent stale data
 } finally {
 setFetching(false);
 }
 };

 const handleAddSlot = async () => {
 if (slots.some(s => s.startTime === newSlot.startTime)) {
 toast.error("Slot already exists");
 return;
 }
 const updatedSlots = [...slots, { ...newSlot, isAvailable: true }].sort((a, b) => a.startTime.localeCompare(b.startTime));
 setSlots(updatedSlots);

 try {
 setLoading(true);
 const promises = [];
 for (let i = 0; i < 28; i++) {
 const targetDate = format(addDays(startOfToday(), i), 'yyyy-MM-dd');
 promises.push(axiosInstance.put("/api/professional/availability", {
 date: targetDate,
 slots: updatedSlots
 }));
 }
 await Promise.all(promises);
 
 const newHasAvailability = {};
 for (let i = 0; i < 28; i++) {
 const d = format(addDays(startOfToday(), i), 'yyyy-MM-dd');
 newHasAvailability[d] = true;
 }
 setHasAvailability(prev => ({...prev, ...newHasAvailability}));
 
 toast.success("Slot added to all 28 days!");
 } catch (error) {
 toast.error("Failed to add slot to all days");
 } finally {
 setLoading(false);
 }
 };

 const handleRemoveSlot = async (startTime) => {
 const updatedSlots = slots.filter(s => s.startTime !== startTime);
 setSlots(updatedSlots);
 await handleSave(updatedSlots, selectedDate);
 };

 const handleSave = async (customSlots = null, customDate = null) => {
 try {
 setLoading(true);
 // Check if customDate is a string (not an Event)
 const targetDate = typeof customDate === 'string' ? customDate : selectedDate;
 // Check if customSlots is an array (not an Event)
 const targetSlots = Array.isArray(customSlots) ? customSlots : slots;
 
 await axiosInstance.put("/api/professional/availability", {
 date: targetDate,
 slots: targetSlots
 });
 
 if (!customDate) {
 toast.success("Availability updated successfully");
 }
 
 // Update local cache of which dates have slots
 setHasAvailability(prev => ({
 ...prev,
 [targetDate]: targetSlots.length > 0
 }));
 } catch (error) {
 console.error("Error saving availability:", error);
 toast.error("Failed to save availability");
 } finally {
 setLoading(false);
 }
 };




 return (
 <div className="space-y-8 animate-fade-in">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/5">
 <div className="space-y-1">
 <h1 className="text-5xl font-black uppercase tracking-tight text-white">
 Manage <span className="text-primary">Availability</span>
 </h1>
 <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Configure your daily working hours</p>
 </div>
 <button 
 onClick={handleSave}
 disabled={loading}
 className="px-8 py-3 bg-primary text-black rounded-xl font-bold uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-[0.98] transition-all disabled:opacity-50"
 >
 {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Schedule
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
 <div className="lg:col-span-4 space-y-6">
 <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8">
 <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2">
 <CalendarDays size={16} className="text-primary" /> Select Date
 </h3>
 <div className="grid grid-cols-4 gap-2">
 {dates.map((date) => {
 const dateStr = format(date, 'yyyy-MM-dd');
 const isSelected = selectedDate === dateStr;
 const hasSlots = hasAvailability[dateStr];
 return (
 <button 
 key={dateStr}
 onClick={() => setSelectedDate(dateStr)}
 className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
 isSelected 
 ? "bg-primary border-primary text-black" 
 : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
 }`}
 >
 <span className="text-[8px] font-black uppercase tracking-tighter mb-1">{format(date, 'EEE')}</span>
 <span className="text-lg font-black leading-none">{format(date, 'dd')}</span>
 <span className="text-[7px] font-bold uppercase tracking-widest mt-1 opacity-60">{format(date, 'MMM')}</span>
 {hasSlots && !isSelected && (
 <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
 )}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 <div className="lg:col-span-8 space-y-6">
 <div className="bg-[#0A0A0A] border border-white/5 rounded-[32px] p-8">
 <div className="flex flex-col md:flex-row items-end gap-4 mb-10 pb-8 border-b border-white/5">
 <div className="flex-1 space-y-2">
 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Start Time</label>
 <ClockPicker 
 value={timeToDate(newSlot.startTime)}
 onChange={(date) => setNewSlot({...newSlot, startTime: dateToTime(date)})}
 />
 </div>
 <div className="flex-1 space-y-2">
 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">End Time</label>
 <ClockPicker 
 value={timeToDate(newSlot.endTime)}
 onChange={(date) => setNewSlot({...newSlot, endTime: dateToTime(date)})}
 />
 </div>
 <button 
 onClick={handleAddSlot}
 className="h-14 px-8 bg-white/5 text-white border border-white/10 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
 >
 <Plus size={16} /> Add Slot
 </button>
 </div>

 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
 <h3 className="text-sm font-black uppercase tracking-widest text-white">Active Slots for {format(new Date(selectedDate), 'MMMM dd, yyyy')}</h3>
 

 </div>
 
 {fetching ? (
 <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
 ) : slots.length === 0 ? (
 <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
 <Clock size={40} className="mx-auto text-white/10 mb-4" />
 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">No slots defined for this date</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {slots.map((slot, index) => (
 <div key={index} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-primary/20 transition-all">
 <div className="flex items-center gap-4">
 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
 <Clock size={16} className="text-primary" />
 </div>
 <div>
 <p className="text-xs font-black text-white">{slot.startTime} - {slot.endTime}</p>
 <p className={`text-[8px] font-bold uppercase tracking-widest ${slot.isAvailable ? "text-primary" : "text-red-500"}`}>
 {slot.isAvailable ? "Available" : "Booked"}
 </p>
 </div>
 </div>
 {slot.isAvailable && (
 <button 
 onClick={() => handleRemoveSlot(slot.startTime)}
 className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
 >
 <Trash2 size={16} />
 </button>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 );
}
