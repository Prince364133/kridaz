import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller } from "react-hook-form";
import { setHours, setMinutes } from "date-fns";
import { FormField, Button } from "@components/common";
import useEditTurf from "@hooks/owner/useEditTurf";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import { ArrowLeft, MapPin, Map, LocateFixed, X } from "lucide-react";

const EditTurf = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    watch,
    onSubmit,
    sportTypes,
    addSportType,
    removeSportType,
    groundTypes,
    addGroundType,
    removeGroundType,
    facilities,
    addFacility,
    removeFacility,
    openTime,
    closeTime,
    slotDuration,
    breakTime,
    availableDays,
    offDays,
    generatedSlots,
    toggleDay,
    toggleSlotActive,
    loading,
    fetching,
    getMyLocation,
    isLocating,
    pendingUpdates,
  } = useEditTurf(id);

  const sportsOptions = ["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"];
  const groundTypeOptions = ["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"];
  const facilitiesOptions = ["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"];

  const [previews, setPreviews] = React.useState([]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setValue("images", e.target.files);
    
    // Cleanup old previews
    previews.forEach(url => URL.revokeObjectURL(url));
    
    // Generate new previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  React.useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  if (fetching) return <DashboardSkeleton />;

  const FieldStatus = ({ isPending }) => isPending ? (
    <span className="ml-2 px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[7px] font-bold uppercase tracking-widest rounded-[2px] animate-pulse">
      Pending Review
    </span>
  ) : null;

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen text-white font-inter">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center bg-[#111] border border-[#2D2D2D] text-[#878C9F] hover:text-[#CCFF00] hover:border-[#CCFF00]/40 rounded-full transition-all group"
              title="Cancel Changes"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="h-px flex-1 bg-[#2D2D2D]/50" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-[#CCFF00] rounded-full" />
               <h1 className="text-3xl font-semibold uppercase tracking-tight text-white font-outfit">Facility Configurator</h1>
            </div>
            <p className="text-[#878C9F] text-[10px] font-bold uppercase tracking-[3px] ml-4.5 opacity-60">Fine-tune your arena telemetry and operational rules.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: General Info */}
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-8">
              <div className="flex items-center gap-2 border-b border-[#2D2D2D] pb-4">
                <p className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-[3px]">General Information</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">Turf Name <FieldStatus isPending={!!pendingUpdates?.name} /></label>
                  <input
                    {...register("name")}
                    type="text"
                    className={`w-full bg-[#111111] border ${pendingUpdates?.name ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none transition-all text-sm font-medium placeholder-[#333]`}
                    placeholder="Enter arena identity..."
                  />
                  {errors.name && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">Facility Description <FieldStatus isPending={!!pendingUpdates?.description} /></label>
                  <textarea
                    {...register("description")}
                    className={`w-full bg-[#111111] border ${pendingUpdates?.description ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none transition-all text-sm font-medium h-32 resize-none placeholder-[#333]`}
                    placeholder="Describe your facility's features and amenities..."
                  ></textarea>
                  {errors.description && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.description.message}</p>}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-[#CCFF00]/60" /> Location Details <FieldStatus isPending={!!pendingUpdates?.location} />
                    </p>
                    <button
                      type="button"
                      onClick={getMyLocation}
                      disabled={isLocating}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#111] text-[#CCFF00] border border-[#CCFF00]/20 hover:border-[#CCFF00] transition-all rounded-[6px] text-[9px] font-bold uppercase tracking-widest disabled:opacity-50"
                    >
                      <LocateFixed size={12} className={isLocating ? "animate-spin" : ""} />
                      {isLocating ? "Locating..." : "Auto-Detect"}
                    </button>
                  </div>

                  <input
                    {...register("location")}
                    type="text"
                    placeholder="Full Street Address..."
                    className={`w-full bg-[#111111] border ${pendingUpdates?.location ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium placeholder-[#333]`}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      {...register("city")}
                      type="text"
                      placeholder="City"
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium placeholder-[#333]"
                    />
                    <input
                      {...register("state")}
                      type="text"
                      placeholder="State"
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium placeholder-[#333]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-[#444] uppercase tracking-widest ml-1">Latitude</label>
                      <input
                        {...register("latitude")}
                        type="text"
                        className="w-full bg-[#050505] border border-[#2D2D2D] text-[#878C9F] px-4 py-2 rounded-[6px] focus:border-[#CCFF00]/40 focus:outline-none text-[11px] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-[#444] uppercase tracking-widest ml-1">Longitude</label>
                      <input
                        {...register("longitude")}
                        type="text"
                        className="w-full bg-[#050505] border border-[#2D2D2D] text-[#878C9F] px-4 py-2 rounded-[6px] focus:border-[#CCFF00]/40 focus:outline-none text-[11px] font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">Hourly Rate (INR) <FieldStatus isPending={!!pendingUpdates?.pricePerHour} /></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#CCFF00] font-bold text-sm">₹</span>
                    <input
                      {...register("pricePerHour")}
                      type="number"
                      className={`w-full bg-[#111111] border ${pendingUpdates?.pricePerHour ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white pl-10 pr-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium`}
                    />
                  </div>
                  {errors.pricePerHour && <p className="text-red-500 text-[10px] font-bold uppercase mt-1 ml-1">{errors.pricePerHour.message}</p>}
                </div>
              </div>
            </div>

            {/* Right Column: Operational Details */}
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-8">
              <div className="flex items-center gap-2 border-b border-[#2D2D2D] pb-4">
                <p className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-[3px]">Operational Intelligence</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">YouTube Telemetry (URL) <FieldStatus isPending={!!pendingUpdates?.youtubeUrl} /></label>
                  <input
                    {...register("youtubeUrl")}
                    type="text"
                    className={`w-full bg-[#111111] border ${pendingUpdates?.youtubeUrl ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium placeholder-[#333]`}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-4">
                  <div className={`relative group ${pendingUpdates?.images ? 'border border-amber-500/40 p-1 rounded-[10px]' : ''}`}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-[#444] file:bg-[#2D2D2D] file:text-white file:border-none file:px-4 file:h-12 file:mr-4 file:font-bold file:uppercase file:text-[10px] rounded-[8px] h-12 flex items-center focus:outline-none transition-all cursor-pointer"
                      onChange={handleImageChange}
                    />
                  </div>
                  
                  {previews.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[8px] font-bold text-[#444] uppercase tracking-[2px] ml-1">Operational Asset Roster ({previews.length} Files)</p>
                      <div className="grid grid-cols-5 gap-2">
                        {previews.map((url, i) => (
                          <div key={i} className="aspect-square rounded-[6px] border border-[#2D2D2D] overflow-hidden bg-[#050505] relative group/item">
                            <img src={url} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] text-[#444] mt-2 uppercase tracking-tight italic">Leave empty to retain existing facility imagery.</p>
                </div>

                <div className={`space-y-4 ${pendingUpdates?.sportTypes ? 'border border-amber-500/40 p-4 rounded-[10px]' : ''}`}>
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">Sport Arsenal <FieldStatus isPending={!!pendingUpdates?.sportTypes} /></label>
                  <select
                    className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium appearance-none"
                    onChange={(e) => addSportType(e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Select Disciplines</option>
                    {sportsOptions.map(option => (
                      <option key={option} value={option} disabled={sportTypes.includes(option)}>{option}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {sportTypes.map((type, index) => (
                      <span key={index} className="px-3 py-1 bg-[#111] border border-[#2D2D2D] text-[#CCFF00] font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-wider">
                        {type}
                        <button type="button" onClick={() => removeSportType(type)} className="hover:text-white transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className={`space-y-4 ${pendingUpdates?.groundTypes ? 'border border-amber-500/40 p-4 rounded-[10px]' : ''}`}>
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">Ground Composition <FieldStatus isPending={!!pendingUpdates?.groundTypes} /></label>
                  <select
                    className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium appearance-none"
                    onChange={(e) => addGroundType(e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Select Surface Types</option>
                    {groundTypeOptions.map(option => (
                      <option key={option} value={option} disabled={groundTypes.includes(option)}>{option}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {groundTypes.map((type, index) => (
                      <span key={index} className="px-3 py-1 bg-[#111] border border-[#2D2D2D] text-white font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-wider">
                        {type}
                        <button type="button" onClick={() => removeGroundType(type)} className="hover:text-[#CCFF00] transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Integrated Facilities</label>
                  <select
                    className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium appearance-none"
                    onChange={(e) => addFacility(e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Select Amenities</option>
                    {facilitiesOptions.map(option => (
                      <option key={option} value={option} disabled={facilities.includes(option)}>{option}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {facilities.map((type, index) => (
                      <span key={index} className="px-3 py-1 bg-[#CCFF00] text-black font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-wider">
                        {type}
                        <button type="button" onClick={() => removeFacility(type)} className="hover:text-white transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slot Architecture Section */}
          <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-10">
            <div className="flex items-center gap-2 border-b border-[#2D2D2D] pb-4">
               <p className="text-[11px] font-bold text-[#CCFF00] uppercase tracking-[3px]">Slot Architecture & Scheduling</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Session Duration</label>
                    <select
                      {...register("slotDuration")}
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium appearance-none"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes (2 hrs)</option>
                      <option value={180}>180 Minutes (3 hrs)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Transition Break</label>
                    <select
                      {...register("breakTime")}
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium appearance-none"
                    >
                      <option value={0}>No Break</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Opening Threshold</label>
                    <Controller
                      name="openTime"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => { field.onChange(date); setValue("closeTime", null); }}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={60}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium"
                        />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Closing Threshold</label>
                    <Controller
                      name="closeTime"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={60}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#CCFF00]/60 focus:outline-none text-sm font-medium disabled:opacity-30"
                          disabled={!openTime}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Weekly Operational Sequence</label>
                  <div className="flex flex-wrap gap-2">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const isActive = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-4 py-3 rounded-[8px] text-[10px] font-bold uppercase tracking-widest transition-all border ${
                            isActive 
                            ? "bg-[#CCFF00] text-black border-[#CCFF00] shadow-[0_5px_15px_rgba(204,255,0,0.1)]" 
                            : "bg-[#111] text-[#444] border-[#2D2D2D] hover:border-[#CCFF00]/40"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-bold text-[#878C9F] uppercase tracking-[2px]">Matrix Projection</h3>
                  <span className="text-[9px] font-bold text-[#CCFF00] uppercase bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-3 py-1 rounded-full">
                    {generatedSlots.length} Active Slots
                  </span>
                </div>
                
                {generatedSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleSlotActive(index)}
                        className={`p-3 rounded-[8px] text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${
                          slot.isActive
                          ? "bg-[#111] border-[#2D2D2D] text-white hover:border-[#CCFF00]/40"
                          : "bg-[#050505] border-[#1A1A1A] text-[#222] line-through opacity-40"
                        }`}
                      >
                        <span className="tracking-tighter font-outfit">{slot.startTime}</span>
                        <div className="w-1 h-px bg-[#2D2D2D]" />
                        <span className="tracking-tighter font-outfit opacity-60">{slot.endTime}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] bg-[#050505] rounded-[8px] border border-dashed border-[#2D2D2D]">
                    <p className="text-[#333] text-[10px] font-bold uppercase tracking-widest">Adjust thresholds to project slots</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 pb-12">
            <button 
              type="submit" 
              className={`w-full py-4 bg-[#CCFF00] text-black font-bold text-[14px] uppercase tracking-[4px] hover:bg-[#B3FF00] transition-all rounded-[8px] shadow-[0_10px_30px_rgba(204,255,0,0.15)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "Synchronizing Configuration..." : "Commit Operational Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTurf;
