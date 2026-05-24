import React, { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { FormField } from "@components/common";
import useAddTurf from "@hooks/owner/useAddTurf";
import { Button } from "@components/common";
import { fetchStates, fetchCities } from "@utils/locationService";
import { Search, Plus } from "lucide-react";
import ClockPicker from "@components/common/ClockPicker";

const AddTurf = () => {
  const {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    watch,
    onSubmit,
    sportTypes,
    newSportType,
    setNewSportType,
    addSportType,
    removeSportType,
    groundTypes,
    newGroundType,
    setNewGroundType,
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
    updateSlotPrice,
    loading,
    getMyLocation,
    isLocating,
    managerContacts,
    newManagerName,
    setNewManagerName,
    newManagerPhone,
    setNewManagerPhone,
    addManagerContact,
    removeManagerContact
  } = useAddTurf();

  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const selectedState = watch("state");
  const watchedLat = watch("latitude");
  const watchedLng = watch("longitude");
  const watchedLocation = watch("location");
  const watchedCity = watch("city");
  const watchedPricePerHour = watch("pricePerHour");
  const watchedSlotDuration = watch("slotDuration") || 60;
  const watchedFacilityCategory = watch("facilityCategory") || "Turf";

  // Calculate projected earnings
  const activeSlotsCount = generatedSlots.filter(s => s.isActive).length;
  const perSlotPrice = (Number(watchedPricePerHour) || 0) * (Number(watchedSlotDuration) / 60);
  const totalDailyEarnings = activeSlotsCount * perSlotPrice;

  // Load states on mount
  useEffect(() => {
    fetchStates().then(setStatesList);
  }, []);

  // Load cities when state changes
  useEffect(() => {
    if (selectedState) {
      fetchCities(selectedState).then(setCitiesList);
    } else {
      setCitiesList([]);
    }
  }, [selectedState]);

  // Build live map preview URL from coords or address
  const mapPreviewUrl = React.useMemo(() => {
    if (watchedLat && watchedLng && !isNaN(Number(watchedLat)) && !isNaN(Number(watchedLng))) {
      return `https://maps.google.com/maps?q=${watchedLat},${watchedLng}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
    }
    const q = [watchedLocation, watchedCity, selectedState].filter(Boolean).join(", ");
    if (q.length > 3) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    return null;
  }, [watchedLat, watchedLng, watchedLocation, watchedCity, selectedState]);

  const sportsOptions = ["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"];
  const groundTypeOptions = ["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"];
  const facilitiesOptions = ["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"];

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#55DEE8] rounded-full" />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase">
                ADD NEW <span className="text-[#55DEE8]">{watchedFacilityCategory.toUpperCase()}</span>
              </h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">
              Register a New Facility | Kridaz
            </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#000000] p-8 md:p-12 rounded-[8px] border border-[#2D2D2D] shadow-[var(--shadow-2)] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#55DEE8]/5 blur-[100px] pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <h3 className="text-[14px] font-bold text-[#55DEE8] border-b border-[#2D2D2D] pb-3 mb-8 uppercase tracking-[3px]">General Information</h3>
            
            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Facility Category</span>
              </label>
              <select
                {...register("facilityCategory", { required: "Please select a facility category" })}
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
              >
                <option value="">Select Category (e.g. Venue, Ground)</option>
                <option value="Turf">Venue</option>
                <option value="Ground">Ground</option>
                <option value="Court">Court</option>
                <option value="Stadium">Stadium</option>
                <option value="Arena">Arena</option>
                <option value="Studio">Studio</option>
              </select>
              {errors.facilityCategory && <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.facilityCategory.message}</span>}
            </div>

            <FormField
              label={`${watchedFacilityCategory} Name`}
              name="name"
              type="text"
              register={register}
              error={errors.name}
              className="bg-[#111111] border-[#2D2D2D] text-white focus:border-[#55DEE8]/60"
            />
            
            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Facility Description</span>
              </label>
              <textarea
                {...register("description")}
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-32 rounded-[8px] p-4 transition-all"
                placeholder="Describe your facility's features and amenities..."
              ></textarea>
              {errors.description && (
                <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">
                  {errors.description.message}
                </span>
              )}
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Venue Policies and Rules</span>
              </label>
              <textarea
                {...register("policies")}
                maxLength={1000}
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-48 rounded-[8px] p-4 transition-all"
                placeholder="Define your facility's rules, cancellation policies, and safety guidelines (Minimum 200 characters)..."
              ></textarea>
              <div className="flex justify-between mt-2 ml-1">
                {errors.policies ? (
                  <span className="text-[#55DEE8] text-[10px] font-bold uppercase">
                    {errors.policies.message}
                  </span>
                ) : (
                  <span className="text-[#444] text-[10px] font-bold uppercase tracking-widest">
                    {watch("policies")?.length || 0} / 1000 max characters (200 min)
                  </span>
                )}
              </div>
            </div>
            
            <FormField
              label="Location (Address Line)"
              name="location"
              type="text"
              register={register}
              error={errors.location}
              className="bg-[#111111] border-[#2D2D2D] text-white focus:border-[#55DEE8]/60"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label mb-2">
                  <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">State</span>
                </label>
                <select
                  {...register("state")}
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                  onChange={(e) => {
                    setValue("state", e.target.value);
                    setValue("city", ""); // Reset city on state change
                  }}
                >
                  <option value="">Select State</option>
                  {statesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.state.message}</span>}
              </div>

              <div className="form-control">
                <label className="label mb-2">
                  <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">City</span>
                </label>
                <select
                  {...register("city")}
                  disabled={!selectedState}
                  className={`w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none ${!selectedState ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select City</option>
                  {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.city.message}</span>}
              </div>
            </div>

            <div className="form-control">
              <label className="label mb-4">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1 flex items-center gap-2">
                   =��� Venue Coordinates & Map Preview
                </span>
              </label>

              {/* Coordinate inputs row */}
              <div className="flex gap-4 mb-4">
                <input
                  {...register("latitude")}
                  placeholder="Latitude (e.g. 17.3850)"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-xs h-12 rounded-[8px] px-4 focus:outline-none focus:border-[#55DEE8]/60 transition-all font-mono"
                />
                <input
                  {...register("longitude")}
                  placeholder="Longitude (e.g. 78.4867)"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-xs h-12 rounded-[8px] px-4 focus:outline-none focus:border-[#55DEE8]/60 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={getMyLocation}
                  className={`shrink-0 px-6 rounded-[8px] bg-[#55DEE8]/10 text-[#55DEE8] border border-[#55DEE8]/20 hover:bg-[#55DEE8] hover:text-black transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${isLocating ? 'animate-pulse' : ''}`}
                  title="Capture Current Location"
                >
                  {isLocating ? "LocatingGǪ" : "=��� GPS"}
                </button>
              </div>
              <p className="text-[10px] text-[#444] mb-4 uppercase tracking-widest italic ml-1">
                Click GPS to auto-capture your device location, or type coordinates manually.
              </p>

              {/* Live Map Preview */}
              {mapPreviewUrl ? (
                <div className="relative w-full rounded-[8px] overflow-hidden border border-[#2D2D2D] shadow-[var(--shadow-1)]" style={{ height: 220 }}>
                  <iframe
                    title="Location Preview"
                    src={mapPreviewUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) saturate(0.7) brightness(0.9)" }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-black/80 backdrop-blur-sm flex items-center justify-between border-t border-[#2D2D2D]">
                    <span className="text-[10px] font-bold text-[#55DEE8] uppercase tracking-[2px]">
                      {watchedLat && watchedLng ? `=��� GPS: ${Number(watchedLat).toFixed(5)}, ${Number(watchedLng).toFixed(5)}` : "=��� Address-based preview"}
                    </span>
                    {watchedLat && watchedLng && (
                      <a
                        href={`https://www.google.com/maps?q=${watchedLat},${watchedLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-[#878C9F] hover:text-[#55DEE8] uppercase tracking-widest transition-colors"
                      >
                        Open in Maps Rs �
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-[8px] border border-dashed border-[#2D2D2D] bg-[#000000] flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#111] flex items-center justify-center border border-[#2D2D2D]">
                     <Search size={20} className="text-[#333]" />
                  </div>
                  <p className="text-[10px] font-bold text-[#333] uppercase tracking-[4px]">
                    Map preview will appear here
                  </p>
                </div>
              )}
            </div>

            <FormField
              label="Hourly Rate (INR)"
              name="pricePerHour"
              type="number"
              register={register}
              error={errors.pricePerHour}
              className="bg-[#111111] border-[#2D2D2D] text-white focus:border-[#55DEE8]/60"
            />
          </div>

          <div className="space-y-8 relative z-10">
            <h3 className="text-[14px] font-bold text-[#55DEE8] border-b border-[#2D2D2D] pb-3 mb-8 uppercase tracking-[3px]">Operational Details</h3>
            
            <FormField
              label="YouTube Video URL"
              name="youtubeUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              register={register}
              error={errors.youtubeUrl}
              className="bg-[#111111] border-[#2D2D2D] text-white focus:border-[#55DEE8]/60"
            />

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Facility Images (Up to 10)</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-[#878C9F] file:bg-[#2D2D2D] file:text-white file:border-none file:px-6 file:h-12 file:mr-4 file:font-bold file:uppercase file:text-[10px] file:tracking-widest rounded-[8px] h-12 flex items-center focus:outline-none transition-all cursor-pointer"
                  onChange={(e) => {
                    const files = e.target.files;
                    setValue("images", files);
                  }}
                />
              </div>
              {errors.images && (
                <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.images.message}</span>
              )}
              <p className="text-[10px] text-[#444] mt-3 uppercase tracking-widest italic ml-1">Select multiple files at once. Max 10 images allowed.</p>
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Sport Arsenal</span>
              </label>
              <select
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                onChange={(e) => addSportType(e.target.value)}
                value=""
              >
                <option value="" disabled>Select Sports</option>
                {sportsOptions.map(option => (
                  <option key={option} value={option} disabled={sportTypes.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {sportTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1.5 bg-[#55DEE8] text-black font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeSportType(type)}
                      className="hover:text-white transition-colors"
                    >
                      <Plus size={12} className="rotate-45" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">{watchedFacilityCategory} Composition</span>
              </label>
              <select
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                onChange={(e) => addGroundType(e.target.value)}
                value=""
              >
                <option value="" disabled>Select {watchedFacilityCategory} Types</option>
                {groundTypeOptions.map(option => (
                  <option key={option} value={option} disabled={groundTypes.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {groundTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2D2D2D] text-white font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeGroundType(type)}
                      className="hover:text-[#55DEE8] transition-colors"
                    >
                      <Plus size={12} className="rotate-45" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label mb-2">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">{watchedFacilityCategory} Facilities</span>
              </label>
              <select
                className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
                onChange={(e) => addFacility(e.target.value)}
                value=""
              >
                <option value="" disabled>Select Facilities</option>
                {facilitiesOptions.map(option => (
                  <option key={option} value={option} disabled={facilities.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {facilities.map((type, index) => (
                  <span key={index} className="px-3 py-1.5 bg-[#1A1A1A] border border-[#2D2D2D] text-[#55DEE8] font-bold rounded-[4px] text-[10px] flex items-center gap-2 uppercase tracking-widest">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeFacility(type)}
                      className="hover:text-white transition-colors"
                    >
                      <Plus size={12} className="rotate-45" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-[14px] font-bold text-[#55DEE8] border-b border-[#2D2D2D] pb-3 mb-8 uppercase tracking-[3px] mt-12">Support & Navigation</h3>
            
            <FormField
              label="Direct Google Maps URL"
              name="mapUrl"
              type="text"
              placeholder="https://maps.app.goo.gl/..."
              register={register}
              error={errors.mapUrl}
              className="bg-[#111111] border-[#2D2D2D] text-white focus:border-[#55DEE8]/60"
            />

            <div className="form-control space-y-4">
              <label className="label">
                <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Venue Managers (Contacts)</span>
              </label>
              
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-sm h-12 rounded-[8px] px-4 focus:outline-none focus:border-[#55DEE8]/60 transition-all"
                />
                <input
                  type="text"
                  placeholder="Manager Phone (10 digits)"
                  value={newManagerPhone}
                  onChange={(e) => setNewManagerPhone(e.target.value)}
                  className="w-full bg-[#111111] border border-[#2D2D2D] text-white text-sm h-12 rounded-[8px] px-4 focus:outline-none focus:border-[#55DEE8]/60 transition-all"
                />
                <button
                  type="button"
                  onClick={addManagerContact}
                  className="shrink-0 px-8 rounded-[8px] bg-white text-black hover:bg-[#55DEE8] transition-all text-[11px] font-bold uppercase tracking-widest"
                >
                  Add
                </button>
              </div>

              <div className="space-y-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                {managerContacts.map((manager, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#111111] p-4 rounded-[8px] border border-[#2D2D2D] group hover:border-[#55DEE8]/30 transition-all">
                    <div className="flex flex-col">
                      <span className="text-white text-[13px] font-bold uppercase tracking-tight">{manager.name}</span>
                      <span className="text-[#878C9F] text-[11px] font-mono mt-0.5">{manager.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeManagerContact(index)}
                      className="text-[#444] hover:text-[#55DEE8] transition-colors uppercase text-[10px] font-bold tracking-widest"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {managerContacts.length === 0 && (
                  <p className="text-[#333] text-[10px] font-bold uppercase tracking-[4px] text-center py-6 border border-dashed border-[#2D2D2D] rounded-[8px] italic">
                    No Managers Added Yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-12 pt-12 border-t border-[#2D2D2D] relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-10">
                <h3 className="text-[14px] font-bold text-[#55DEE8] border-b border-[#2D2D2D] pb-3 mb-6 uppercase tracking-[3px]">Slot Architecture</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Slot Duration</span>
                    </label>
                    <select
                      {...register("slotDuration")}
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
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
                      className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-sm h-12 rounded-[8px] px-4 transition-all appearance-none"
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
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Opening Time</span>
                    </label>
                    <Controller
                      name="openTime"
                      control={control}
                      rules={{ required: "Opening time is required" }}
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
                    {errors.openTime && <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.openTime.message}</span>}
                  </div>

                  <div className="form-control">
                    <label className="label mb-2">
                      <span className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Closing Time</span>
                    </label>
                    <Controller
                      name="closeTime"
                      control={control}
                      rules={{ required: "Closing time is required" }}
                      render={({ field }) => (
                        <ClockPicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="12:00 AM"
                          disabled={!openTime}
                        />
                      )}
                    />
                    {errors.closeTime && <span className="text-[#55DEE8] text-[10px] font-bold uppercase mt-2 block ml-1">{errors.closeTime.message}</span>}
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
                          className={`px-5 py-3 rounded-[8px] text-[11px] font-black uppercase tracking-widest transition-all border ${
                            isActive 
                            ? "bg-[#55DEE8] text-black border-[#55DEE8] shadow-[0_5px_15px_rgba(204,255,0,0.2)]" 
                            : "bg-[#111111] text-[#444] border-[#2D2D2D] hover:border-[#55DEE8]/40"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="space-y-6 pt-6 border-t border-[#2D2D2D]">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-4 bg-[#55DEE8] rounded-full" />
                    <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">Configuration Lifespan</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label mb-2">
                        <span className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Duration Strategy</span>
                      </label>
                      <select
                        {...register("slotsConfigDuration")}
                        className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-xs h-11 rounded-[6px] px-4 transition-all appearance-none"
                      >
                        <option value="Until Changed">Infinite (Until Manual Change)</option>
                        <option value="Fixed Weeks">Fixed Duration (Weekly Basis)</option>
                      </select>
                    </div>

                    {watch("slotsConfigDuration") === "Fixed Weeks" && (
                      <div className="form-control animate-fade-in">
                        <label className="label mb-2">
                          <span className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Active Duration (Weeks)</span>
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            {...register("slotsConfigWeeks")}
                            className="w-full bg-[#111111] border border-[#2D2D2D] text-white focus:border-[#55DEE8]/60 focus:outline-none text-xs h-11 rounded-[6px] px-4 transition-all"
                            placeholder="e.g. 4"
                          />
                          <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Weeks</span>
                        </div>
                        {errors.slotsConfigWeeks && <span className="text-[#55DEE8] text-[9px] font-bold uppercase mt-2 block">{errors.slotsConfigWeeks.message}</span>}
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-[#444] uppercase tracking-widest italic ml-1 leading-relaxed">
                    * After the selected duration, slots will be marked as "Needs Update" and booking will be blocked until pricing/timing is reviewed.
                  </p>
                </div>

                <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3 mb-6">
                  <div className="space-y-1">
                    <h3 className="text-[14px] font-bold text-[#55DEE8] uppercase tracking-[3px]">Matrix Projection</h3>
                    <p className="text-[9px] text-[#878C9F] font-bold uppercase tracking-widest italic">Set individual slot pricing below</p>
                    <p className="text-[8px] text-[#444] uppercase tracking-widest font-medium mt-1">
                      * After 5% service charge (Includes payment gateway charges and GST)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold text-[#878C9F] uppercase tracking-widest mb-1">Max Daily Revenue</span>
                      <span className="text-[11px] font-bold text-black uppercase bg-[#55DEE8] px-4 py-1.5 rounded-[4px] shadow-[0_2px_10px_rgba(204,255,0,0.2)]">
                        Rs {generatedSlots.reduce((acc, s) => acc + (s.isActive ? Number(s.price) : 0), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {generatedSlots.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedSlots.map((slot, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-4 p-3 rounded-[8px] border transition-all ${
                          slot.isActive
                          ? "bg-[#111111] border-[#2D2D2D] group hover:border-[#55DEE8]/30"
                          : "bg-black/50 border-[#1A1A1A] opacity-40 grayscale"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSlotActive(index)}
                          className={`w-10 h-10 shrink-0 rounded-[6px] border flex items-center justify-center transition-all ${
                            slot.isActive 
                            ? "bg-[#55DEE8]/10 border-[#55DEE8]/20 text-[#55DEE8]" 
                            : "bg-[#1A1A1A] border-[#2D2D2D] text-[#444]"
                          }`}
                        >
                          <span className="text-[10px] font-black">{index + 1}</span>
                        </button>

                        <div className="flex flex-col shrink-0 min-w-[120px]">
                          <span className="text-[13px] font-bold text-white tracking-tighter">{slot.startTime} - {slot.endTime}</span>
                          <span className="text-[9px] font-black text-[#878C9F] uppercase tracking-widest mt-0.5">
                            {slot.isActive ? "Operational" : "Inactive"}
                          </span>
                        </div>

                        <div className="flex-1 flex items-center gap-3 justify-end">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-[#878C9F] uppercase tracking-[2px] mb-1">Slot Price (INR)</span>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#444]">Rs</span>
                              <input 
                                type="number"
                                value={slot.price}
                                onChange={(e) => updateSlotPrice(index, e.target.value)}
                                disabled={!slot.isActive}
                                className="w-24 bg-black/50 border border-[#2D2D2D] text-white text-[11px] font-bold h-9 pl-6 pr-3 rounded-[4px] focus:outline-none focus:border-[#55DEE8]/60 transition-all disabled:opacity-30"
                              />
                            </div>
                          </div>

                          <div className="w-px h-8 bg-[#2D2D2D] mx-1" />

                          <div className="flex flex-col items-end min-w-[80px]">
                            <span className="text-[8px] font-black text-[#55DEE8] uppercase tracking-[2px] mb-1">Your Net</span>
                            <span className="text-[13px] font-black text-[#55DEE8] font-mono tracking-tight italic">
                              Rs {(slot.price * 0.95).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] bg-[#050505] rounded-[8px] border border-dashed border-[#2D2D2D]">
                    <p className="text-[#333] text-[10px] font-bold uppercase tracking-[4px]">Set thresholds to view slots</p>
                  </div>
                )}
                <p className="text-[10px] text-[#444] italic uppercase tracking-widest text-center">Click a slot to toggle its operational availability.</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-12 border-t border-[#2D2D2D] relative z-10 pb-12">
            <button 
              type="submit" 
              className={`w-full py-5 bg-[#55DEE8] text-black font-bold text-[16px] uppercase tracking-[6px] hover:bg-white transition-all transform hover:scale-[1.01] active:scale-[0.99] rounded-[8px] shadow-[0_10px_30px_rgba(204,255,0,0.15)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "SYNCHRONIZING..." : `INITIALIZE ${watchedFacilityCategory.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default AddTurf;
