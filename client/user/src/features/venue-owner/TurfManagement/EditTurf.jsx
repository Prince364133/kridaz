import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Controller } from "react-hook-form";
import ClockPicker from "@components/common/ClockPicker";
import useEditTurf from "@hooks/owner/useEditTurf";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import { ArrowLeft, X } from "lucide-react";

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
    managerContacts,
    newManagerName,
    setNewManagerName,
    newManagerPhone,
    setNewManagerPhone,
    addManagerContact,
    removeManagerContact,
    updateSlotPrice,
    turf,
    settings
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
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center bg-[#111] border border-[#2D2D2D] text-[#878C9F] hover:text-[#BFF367] hover:border-[#BFF367]/40 rounded-full transition-all group"
                title="Cancel Changes"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                
                <h1 className="text-[28px] lg:text-[32px] font-bold font-open-sans text-white tracking-tight leading-none uppercase">
                  EDIT <span className="text-[#BFF367]">FACILITY</span>
                </h1>
              </div>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-14">
              Update Facility Parameters | {turf?.name || "Kridaz"}
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#000000] p-8 md:p-12 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFF367]/5 blur-[100px] pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <h3 className="text-[14px] font-bold text-[#BFF367] border-b border-[#2D2D2D] pb-3 mb-8 uppercase tracking-[3px] font-open-sans">General Information</h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                Turf Name <FieldStatus isPending={!!pendingUpdates?.name} />
              </label>
              <input
                {...register("name")}
                type="text"
                className={`w-full bg-[#111111] border ${pendingUpdates?.name ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none transition-all text-sm font-medium placeholder-[#333]`}
                placeholder="Enter arena identity..."
              />
              {errors.name && <p className="text-[#BFF367] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.name.message}</p>}
            </div>
            
            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                  Facility Description <FieldStatus isPending={!!pendingUpdates?.description} />
                </span>
              </label>
              <textarea
                {...register("description")}
                className={`w-full bg-[#111111] border ${pendingUpdates?.description ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-32 rounded-[8px] p-4 transition-all resize-none`}
                placeholder="Describe your facility's features and amenities..."
              ></textarea>
              {errors.description && (
                <span className="text-[#BFF367] text-[10px] font-bold uppercase mt-2 block ml-1">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                  Venue Policies and Rules <FieldStatus isPending={!!pendingUpdates?.policies} />
                </span>
              </label>
              <textarea
                {...register("policies")}
                maxLength={1000}
                className={`w-full bg-[#111111] border ${pendingUpdates?.policies ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-48 rounded-[8px] p-4 transition-all resize-none`}
                placeholder="Define your facility's rules, cancellation policies, and safety guidelines (Minimum 200 characters)..."
              ></textarea>
              <div className="flex justify-between mt-2 ml-1">
                {errors.policies ? (
                  <span className="text-[#BFF367] text-[10px] font-bold uppercase">
                    {errors.policies.message}
                  </span>
                ) : (
                  <span className="text-[#444] text-[10px] font-bold uppercase tracking-widest">
                    {watch("policies")?.length || 0} / 1000 max characters (200 min)
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                Location (Address Line) <FieldStatus isPending={!!pendingUpdates?.location} />
              </label>
              <input
                {...register("location")}
                type="text"
                placeholder="Full Street Address..."
                className={`w-full bg-[#111111] border ${pendingUpdates?.location ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium placeholder-[#333]`}
              />
              {errors.location && <p className="text-[#BFF367] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.location.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label mb-2">
                  <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">City</span>
                </label>
                <input
                  {...register("city")}
                  type="text"
                  placeholder="City"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium placeholder-[#333]"
                />
              </div>

              <div className="form-control">
                <label className="label mb-2">
                  <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">State</span>
                </label>
                <input
                  {...register("state")}
                  type="text"
                  placeholder="State"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium placeholder-[#333]"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label mb-4">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center gap-2">
                   =��� Venue Coordinates & Map Preview
                </span>
              </label>

              <div className="flex gap-4 mb-4">
                <input
                  {...register("latitude")}
                  placeholder="Latitude"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-xs h-12 rounded-[8px] px-4 focus:outline-none focus:border-[#BFF367]/60 transition-all font-mono"
                />
                <input
                  {...register("longitude")}
                  placeholder="Longitude"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-xs h-12 rounded-[8px] px-4 focus:outline-none focus:border-[#BFF367]/60 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={getMyLocation}
                  className={`shrink-0 px-6 rounded-[8px] bg-[#BFF367]/10 text-[#BFF367] border border-[#BFF367]/20 hover:bg-[#BFF367] hover:text-black transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${isLocating ? 'animate-pulse' : ''}`}
                >
                  {isLocating ? "LocatingGǪ" : "=��� GPS"}
                </button>
              </div>

              <div className="w-full rounded-[8px] border border-[#2D2D2D] bg-[#050505] flex flex-col items-center justify-center py-10 gap-3 border-dashed">
                <p className="text-[10px] font-bold text-[#333] uppercase tracking-[4px]">Map telemetry active</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                Hourly Rate (INR) <FieldStatus isPending={!!pendingUpdates?.pricePerHour} />
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#BFF367] font-bold text-sm">G�</span>
                <input
                  {...register("pricePerHour")}
                  type="number"
                  className={`w-full bg-[#111111] border ${pendingUpdates?.pricePerHour ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white pl-10 pr-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium`}
                />
              </div>
              {errors.pricePerHour && <p className="text-[#BFF367] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.pricePerHour.message}</p>}
            </div>
          </div>

          <div className="space-y-8 relative z-10">
            <h3 className="text-[14px] font-bold text-[#BFF367] border-b border-[#2D2D2D] pb-3 mb-8 uppercase tracking-[3px] font-open-sans">Operational Details</h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                YouTube Telemetry (URL) <FieldStatus isPending={!!pendingUpdates?.youtubeUrl} />
              </label>
              <input
                {...register("youtubeUrl")}
                type="text"
                className={`w-full bg-[#111111] border ${pendingUpdates?.youtubeUrl ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium placeholder-[#333]`}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Facility Images</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-[#878C9F] file:bg-[#2D2D2D] file:text-white file:border-none file:px-6 file:h-12 file:mr-4 file:font-bold file:uppercase file:text-[10px] file:tracking-widest rounded-[8px] h-12 flex items-center focus:outline-none transition-all cursor-pointer"
                  onChange={handleImageChange}
                />
              </div>
              
              {previews.length > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {previews.map((url, i) => (
                    <div key={i} className="aspect-square rounded-[6px] border border-[#2D2D2D] overflow-hidden bg-[#050505] relative group/item">
                      <img src={url} className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[#444] mt-3 uppercase tracking-widest italic ml-1">Leave empty to retain current imagery.</p>
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                  Sport Arsenal <FieldStatus isPending={!!pendingUpdates?.sportTypes} />
                </span>
              </label>
              <select
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                onChange={(e) => addSportType(e.target.value)}
                value=""
              >
                <option value="" disabled>Add Sport</option>
                {sportsOptions.map(option => (
                  <option key={option} value={option} disabled={sportTypes.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {sportTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1.5 bg-[#BFF367] text-black font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                    {type}
                    <button type="button" onClick={() => removeSportType(type)} className="hover:text-white transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                  Ground Composition <FieldStatus isPending={!!pendingUpdates?.groundTypes} />
                </span>
              </label>
              <select
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                onChange={(e) => addGroundType(e.target.value)}
                value=""
              >
                <option value="" disabled>Add Ground Type</option>
                {groundTypeOptions.map(option => (
                  <option key={option} value={option} disabled={groundTypes.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {groundTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2D2D2D] text-white font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                    {type}
                    <button type="button" onClick={() => removeGroundType(type)} className="hover:text-[#BFF367] transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Integrated Facilities</span>
              </label>
              <select
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                onChange={(e) => addFacility(e.target.value)}
                value=""
              >
                <option value="" disabled>Add Facility</option>
                {facilitiesOptions.map(option => (
                  <option key={option} value={option} disabled={facilities.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {facilities.map((type, index) => (
                  <span key={index} className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2D2D2D] text-[#BFF367] font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                    {type}
                    <button type="button" onClick={() => removeFacility(type)} className="hover:text-white transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-[14px] font-bold text-[#BFF367] border-b border-[#2D2D2D] pb-3 mb-8 uppercase tracking-[3px] font-open-sans mt-12">Support & Navigation</h3>
            
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center">
                Direct Google Maps URL <FieldStatus isPending={!!pendingUpdates?.mapUrl} />
              </label>
              <input
                {...register("mapUrl")}
                type="text"
                placeholder="https://maps.app.goo.gl/..."
                className={`w-full bg-[#111111] border ${pendingUpdates?.mapUrl ? 'border-amber-500/40' : 'border-[#2D2D2D]'} text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium`}
              />
            </div>

            <div className="form-control space-y-4">
              <label className="label">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Venue Managers</span>
              </label>
              
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-sm h-12 rounded-[8px] px-4 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newManagerPhone}
                  onChange={(e) => setNewManagerPhone(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-sm h-12 rounded-[8px] px-4 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addManagerContact}
                  className="shrink-0 px-8 rounded-[8px] bg-white text-black hover:bg-[#BFF367] transition-all text-[11px] font-bold uppercase tracking-widest"
                >
                  Add
                </button>
              </div>

              <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                {managerContacts.map((manager, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#111111] p-4 rounded-[8px] border border-[#2D2D2D] hover:border-[#BFF367]/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-white text-[13px] font-bold uppercase tracking-tight">{manager.name}</span>
                      <span className="text-[#878C9F] text-[11px] font-mono mt-0.5">{manager.phone}</span>
                    </div>
                    <button type="button" onClick={() => removeManagerContact(index)} className="text-[#444] hover:text-[#BFF367] transition-colors uppercase text-[10px] font-bold tracking-widest">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-12 pt-12 border-t border-[#2D2D2D] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-10">
                <h3 className="text-[14px] font-bold text-[#BFF367] border-b border-[#2D2D2D] pb-3 mb-6 uppercase tracking-[3px] font-open-sans">Slot Architecture</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Slot Duration</span>
                    </label>
                    <select
                      {...register("slotDuration")}
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 appearance-none"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes</option>
                      <option value={180}>180 Minutes</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Break Time</span>
                    </label>
                    <select
                      {...register("breakTime")}
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 appearance-none"
                    >
                      <option value={0}>No Break</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Opening Threshold</span>
                    </label>
                    <Controller
                      name="openTime"
                      control={control}
                      render={({ field }) => (
                        <ClockPicker
                          value={field.value}
                          onChange={(date) => {
                            field.onChange(date);
                            setValue("closeTime", null);
                          }}
                          placeholder="12:00 AM"
                        />
                      )}
                    />
                    {errors.openTime && <p className="text-[#BFF367] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.openTime.message}</p>}
                  </div>

                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Closing Threshold</span>
                    </label>
                    <Controller
                      name="closeTime"
                      control={control}
                      render={({ field }) => (
                        <ClockPicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="12:00 AM"
                          disabled={!openTime}
                        />
                      )}
                    />
                    {errors.closeTime && <p className="text-[#BFF367] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.closeTime.message}</p>}
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="label">
                    <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Weekly Operational Sequence</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const isActive = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-5 py-3 rounded-[8px] text-[11px] font-black uppercase tracking-widest transition-all border ${ isActive ? "bg-[#BFF367] text-black border-[#BFF367] shadow-[0_5px_15px_rgba(204,255,0,0.2)]" : "bg-[#111111] text-[#444] border-[#2D2D2D] hover:border-[#BFF367]/40" }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3 mb-6">
                  <h3 className="text-[14px] font-bold text-[#BFF367] uppercase tracking-[3px] font-open-sans">Configuration Lifespan</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Update Frequency</span>
                    </label>
                    <select
                      {...register("slotsConfigDuration")}
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#BFF367]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 appearance-none"
                    >
                      <option value="Until Changed">Until Manual Update</option>
                      <option value="Fixed Weeks">Fixed Duration (Weekly)</option>
                    </select>
                  </div>

                  {watch("slotsConfigDuration") === "Fixed Weeks" && (
                    <>
                      <div className="form-control">
                        <label className="label mb-2">
                          <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Active Duration (Weeks)</span>
                        </label>
                        <input
                          {...register("slotsConfigWeeks")}
                          type="number"
                          min="1"
                          max="52"
                          className="w-full bg-[#111111] border border-[#2D2D2D] text-white px-4 py-3 rounded-[8px] focus:border-[#BFF367]/60 focus:outline-none text-sm font-medium"
                        />
                      </div>
                      
                      <div className="md:col-span-2 mt-4 p-4 bg-[#BFF367]/5 border border-[#BFF367]/20 rounded-[8px] space-y-2">
                        <div className="flex items-center gap-2 text-[#BFF367]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#BFF367] animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Availability Expiry Preview</span>
                        </div>
                        <p className="text-[13px] text-white/90 font-medium">
                          Your venue slots will be bookable until <span className="text-[#BFF367] font-bold underline decoration-wavy underline-offset-4">
                            {(() => {
                              const weeks = watch("slotsConfigWeeks") || 1;
                              const date = new Date();
                              date.setDate(date.getDate() + (weeks * 7));
                              return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                            })()}
                          </span>
                        </p>
                        <p className="text-[9px] text-[#878C9F] uppercase tracking-wider leading-relaxed">
                          After this date, all slots will be automatically blocked to prevent overbooking beyond your planned schedule.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3 mb-6 mt-12">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-bold text-[#BFF367] uppercase tracking-[3px] font-open-sans">Matrix Projection</h3>
                    <p className="text-[9px] text-[#444] uppercase tracking-widest font-bold">Override individual slot pricing below</p>
                    <p className="text-[8px] text-[#878C9F] uppercase tracking-widest font-medium mt-1">
                      * After 5% service charge (Includes payment gateway charges and GST)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-[#BFF367] uppercase bg-[#BFF367]/10 border border-[#BFF367]/20 px-4 py-1 rounded-full">
                    {generatedSlots.length} Active Slots
                  </span>
                </div>
                
                {generatedSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedSlots.map((slot, index) => {
                      const platformFeePercent = settings?.platformFeePercentage || 5;
                      const platformFee = platformFeePercent / 100;
                      const netRevenue = (slot.price * (1 - platformFee)).toFixed(2);

                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-[8px] border transition-all flex flex-col gap-4 ${ slot.isActive ? "bg-[#111111] border-[#2D2D2D] hover:border-[#BFF367]/20" : "bg-black/50 border-[#1A1A1A] opacity-40" }`}
                        >
                          <div className="flex justify-between items-center">
                            <button
                              type="button"
                              onClick={() => toggleSlotActive(index)}
                              className="flex items-center gap-2 group"
                            >
                              <div className={`w-3 h-3 rounded-full border border-[#2D2D2D] ${slot.isActive ? 'bg-[#BFF367]' : 'bg-[#111]'}`} />
                              <span className={`text-[11px] font-bold tracking-widest uppercase ${slot.isActive ? 'text-white' : 'text-[#444] line-through'}`}>
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </button>
                            {slot.isActive && (
                              <span className="text-[9px] font-black text-[#BFF367] uppercase tracking-tighter bg-[#BFF367]/5 px-2 py-0.5 rounded">Active</span>
                            )}
                          </div>

                          {slot.isActive && (
                            <div className="space-y-3 pt-2 border-t border-[#1A1A1A]">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BFF367] font-bold text-[10px]">G�</span>
                                <input
                                  type="number"
                                  value={slot.price}
                                  onChange={(e) => updateSlotPrice(index, e.target.value)}
                                  className="w-full bg-black border border-[#1A1A1A] text-white text-xs py-2 pl-7 pr-3 rounded focus:outline-none focus:border-[#BFF367]/40 transition-all font-mono"
                                  placeholder="Slot Price"
                                />
                              </div>
                              <div className="flex flex-col items-end px-1">
                                <span className="text-[8px] font-black text-[#BFF367] uppercase tracking-[2px] mb-1">Your Net</span>
                                <span className="text-[10px] font-bold text-[#BFF367] font-mono">Rs {netRevenue}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] bg-[#050505] rounded-[8px] border border-dashed border-[#2D2D2D]">
                    <p className="text-[#333] text-[10px] font-bold uppercase tracking-[4px]">Adjust thresholds to view slots</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-12 border-t border-[#2D2D2D] relative z-10 pb-12">
            <button 
              type="submit" 
              className={`w-full py-5 bg-[#BFF367] text-black font-bold text-[16px] uppercase tracking-[6px] font-open-sans hover:bg-white transition-all transform hover:scale-[1.01] active:scale-[0.99] rounded-[8px] shadow-[0_10px_30px_rgba(204,255,0,0.15)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "SYNCHRONIZING..." : "COMMIT OPERATIONAL CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTurf;
