import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse } from 'date-fns';
import { Save, X, Clock, MapPin, Tag, Activity, ShieldCheck } from "lucide-react";

const EditTurfForm = ({ turf, onSave, onCancel, turfId }) => {
 const validationSchema = Yup.object().shape({
 name: Yup.string().required("Name is required"),
 description: Yup.string(),
 policies: Yup.string()
 .required("Policies are required")
 .min(200, "Policies must be at least 200 characters long"),
 pricePerHour: Yup.number()
 .required("Price per Hour is required")
 .positive("Price per Hour must be a positive number")
 .min(500, "Price per Hour must be greater than 500")
 .max(10000, "Price per Hour must be less than 10000"),
 location: Yup.string().required("Location is required"),
 openTime: Yup.date().required("Open Time is required"),
 closeTime: Yup.date()
 .required("Close Time is required")
 .min(Yup.ref("openTime"), "Close Time must be after Open Time"),
 });

 const {
 register,
 handleSubmit,
 control,
 setValue,
 getValues,
 watch,
 formState: { errors },
 } = useForm({
 resolver: yupResolver(validationSchema),
 defaultValues: {
 ...turf,
 openTime: turf.openTime ? parse(turf.openTime, 'hh:mm a', new Date()) : null,
 closeTime: turf.closeTime ? parse(turf.closeTime, 'hh:mm a', new Date()) : null,
 },
 });

 const onSubmit = (data) => {
 onSave(
 {
 ...data,
 openTime: data.openTime ? format(data.openTime, 'hh:mm a') : null,
 closeTime: data.closeTime ? format(data.closeTime, 'hh:mm a') : null,
 },
 turfId
 );
 };

 const filterPassedTime = (time) => {
 const currentDate = new Date();
 const selectedDate = new Date(time);
 const isTurfExisting = !!turf._id;

 return currentDate.getTime() < selectedDate.getTime() || isTurfExisting;
 };

 const filterCloseTime = (time) => {
 const openTime = getValues('openTime');
 return openTime?.getTime() < time.getTime();
 }

 const InputWrapper = ({ label, icon: Icon, children, error }) => (
 <div className="space-y-2">
 <label className="flex items-center gap-2 text-[10px] font-bold text-[#878C9F] uppercase tracking-[2px] ml-1">
 {Icon && <Icon size={12} className="text-[#CCFF00]/60" />}
 {label}
 </label>
 {children}
 {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider ml-1 mt-1 animate-shake">{error}</p>}
 </div>
 );

 return (
 <form onSubmit={handleSubmit(onSubmit)} className="bg-[#000000] border border-[#2D2D2D] rounded-[12px] overflow-hidden shadow-2xl animate-fade-in">
 <div className="p-6 lg:p-8 space-y-8">
 <header className="flex items-center justify-between border-b border-[#2D2D2D] pb-6">
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-6 bg-[#CCFF00] rounded-full" />
 <h2 className="text-2xl font-bold font-['Open_Sans'] text-white uppercase tracking-tight">Edit Arena Identity</h2>
 </div>
 <div className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-3 py-1 rounded-[4px] flex items-center gap-2">
 <ShieldCheck size={12} className="text-[#CCFF00]" />
 <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest">Admin Control</span>
 </div>
 </header>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-6">
 <InputWrapper label="Arena Name" error={errors.name?.message}>
 <input
 type="text"
 {...register('name')}
 placeholder="E.g. Wembley Pro"
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none transition-all ${
 errors.name ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 />
 </InputWrapper>

 <InputWrapper label="Arena Biography" error={errors.description?.message}>
 <textarea
 {...register('description')}
 placeholder="Describe the atmosphere and facilities..."
 rows={4}
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none transition-all resize-none ${
 errors.description ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 ></textarea>
 </InputWrapper>

 <InputWrapper label="Venue Policies & Rules" error={errors.policies?.message}>
 <textarea
 {...register('policies')}
 maxLength={1000}
 placeholder="Rules, cancellation terms, safety... (Min 200 chars)"
 rows={6}
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none transition-all resize-none ${
 errors.policies ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 ></textarea>
 {!errors.policies && (
 <p className="text-[9px] font-bold text-[#444] uppercase tracking-widest ml-1 mt-1">
 {watch('policies')?.length || 0} / 1000 max characters (200 min)
 </p>
 )}
 </InputWrapper>

 <div className="grid grid-cols-2 gap-4">
 <InputWrapper label="Hourly Rate (Rs)" error={errors.pricePerHour?.message}>
 <input
 type="number"
 {...register('pricePerHour', { valueAsNumber: true })}
 placeholder="2500"
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none transition-all ${
 errors.pricePerHour ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 />
 </InputWrapper>

 <InputWrapper label="Location Index" error={errors.location?.message} icon={MapPin}>
 <input
 type="text"
 {...register('location')}
 placeholder="City, State"
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white placeholder-[#333] focus:outline-none transition-all ${
 errors.location ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 />
 </InputWrapper>
 </div>
 </div>

 <div className="space-y-6">
 {/* Dynamic Attributes */}
 <div className="grid grid-cols-1 gap-6">
 <InputWrapper label="Sport Arsenal" icon={Activity}>
 <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-[#050505] border border-[#2D2D2D] rounded-[8px]">
 {watch('sportTypes')?.length > 0 ? (
 watch('sportTypes').map((sport) => (
 <span key={sport} className="px-3 py-1 bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/20 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/tag animate-scale-in">
 {sport}
 <button type="button" onClick={() => setValue('sportTypes', watch('sportTypes').filter(s => s !== sport))} className="hover:text-white transition-colors">
 <X size={10} />
 </button>
 </span>
 ))
 ) : (
 <span className="text-[#333] text-[10px] font-bold uppercase tracking-widest px-1">Unassigned</span>
 )}
 </div>
 <select 
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-xs text-[#878C9F] focus:outline-none focus:border-[#CCFF00]/50 transition-all appearance-none cursor-pointer"
 onChange={(e) => {
 const val = e.target.value;
 const current = watch('sportTypes') || [];
 if (val && !current.includes(val)) setValue('sportTypes', [...current, val]);
 e.target.value = "";
 }}
 >
 <option value="" className="bg-[#000]">Add Sport...</option>
 {["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"].map(s => (
 <option key={s} value={s} className="bg-[#000]">{s}</option>
 ))}
 </select>
 </InputWrapper>

 <div className="grid grid-cols-2 gap-6">
 <InputWrapper label="Ground DNA" icon={Tag}>
 <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-[#050505] border border-[#2D2D2D] rounded-[8px]">
 {watch('groundTypes')?.length > 0 ? (
 watch('groundTypes').map((ground) => (
 <span key={ground} className="px-3 py-1 bg-white/5 text-white border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/tag animate-scale-in">
 {ground}
 <button type="button" onClick={() => setValue('groundTypes', watch('groundTypes').filter(g => g !== ground))} className="hover:text-[#CCFF00] transition-colors">
 <X size={10} />
 </button>
 </span>
 ))
 ) : (
 <span className="text-[#333] text-[10px] font-bold uppercase tracking-widest px-1">Generic</span>
 )}
 </div>
 <select 
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-xs text-[#878C9F] focus:outline-none focus:border-[#CCFF00]/50 transition-all appearance-none cursor-pointer"
 onChange={(e) => {
 const val = e.target.value;
 const current = watch('groundTypes') || [];
 if (val && !current.includes(val)) setValue('groundTypes', [...current, val]);
 e.target.value = "";
 }}
 >
 <option value="" className="bg-[#000]">Add Type...</option>
 {["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"].map(g => (
 <option key={g} value={g} className="bg-[#000]">{g}</option>
 ))}
 </select>
 </InputWrapper>

 <InputWrapper label="Amenities" icon={Activity}>
 <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-3 bg-[#050505] border border-[#2D2D2D] rounded-[8px]">
 {watch('facilities')?.length > 0 ? (
 watch('facilities').map((facility) => (
 <span key={facility} className="px-3 py-1 bg-[#1A1A1A] text-[#878C9F] border border-[#2D2D2D] rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 group/tag animate-scale-in">
 {facility}
 <button type="button" onClick={() => setValue('facilities', watch('facilities').filter(f => f !== facility))} className="hover:text-white transition-colors">
 <X size={10} />
 </button>
 </span>
 ))
 ) : (
 <span className="text-[#333] text-[10px] font-bold uppercase tracking-widest px-1">None</span>
 )}
 </div>
 <select 
 className="w-full bg-[#050505] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-xs text-[#878C9F] focus:outline-none focus:border-[#CCFF00]/50 transition-all appearance-none cursor-pointer"
 onChange={(e) => {
 const val = e.target.value;
 const current = watch('facilities') || [];
 if (val && !current.includes(val)) setValue('facilities', [...current, val]);
 e.target.value = "";
 }}
 >
 <option value="" className="bg-[#000]">Add Amenity...</option>
 {["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"].map(f => (
 <option key={f} value={f} className="bg-[#000]">{f}</option>
 ))}
 </select>
 </InputWrapper>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <InputWrapper label="Open Time" icon={Clock} error={errors.openTime?.message}>
 <Controller
 control={control}
 name="openTime"
 render={({ field }) => (
 <DatePicker
 {...field}
 selected={field.value}
 onChange={(date) => field.onChange(date)}
 showTimeSelect
 showTimeSelectOnly
 timeIntervals={60}
 timeCaption="Time"
 dateFormat="h:mm aa"
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white focus:outline-none transition-all ${
 errors.openTime ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 filterTime={filterPassedTime}
 />
 )}
 />
 </InputWrapper>
 <InputWrapper label="Close Time" icon={Clock} error={errors.closeTime?.message}>
 <Controller
 control={control}
 name="closeTime"
 render={({ field }) => (
 <DatePicker
 {...field}
 selected={field.value}
 onChange={(date) => field.onChange(date)}
 showTimeSelect
 showTimeSelectOnly
 timeIntervals={60}
 timeCaption="Time"
 dateFormat="h:mm aa"
 className={`w-full bg-[#050505] border rounded-[8px] px-4 py-3 text-sm text-white focus:outline-none transition-all ${
 errors.closeTime ? 'border-red-500/50 bg-red-500/5' : 'border-[#2D2D2D] focus:border-[#CCFF00]/50'
 }`}
 filterTime={filterCloseTime}
 disabled={!getValues('openTime')}
 />
 )}
 />
 </InputWrapper>
 </div>
 </div>
 </div>

 <footer className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-8 border-t border-[#2D2D2D]">
 <button 
 type="button" 
 onClick={onCancel}
 className="w-full sm:w-auto px-8 py-3 bg-[#111] border border-[#2D2D2D] text-[#878C9F] font-bold uppercase text-[11px] tracking-widest rounded-[8px] hover:text-white transition-all flex items-center justify-center gap-2"
 >
 <X size={14} />
 Discard Changes
 </button>
 <button 
 type="submit" 
 className="w-full sm:w-auto px-10 py-3 bg-[#CCFF00] text-black font-bold uppercase text-[11px] tracking-widest rounded-[8px] hover:bg-[#B3FF00] transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(204,255,0,0.1)]"
 >
 <Save size={14} />
 Commit Deployment
 </button>
 </footer>
 </div>
 </form>
 );
};

export default EditTurfForm;