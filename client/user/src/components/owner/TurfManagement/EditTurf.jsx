import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller } from "react-hook-form";
import { setHours, setMinutes } from "date-fns";
import { FormField, Button } from "@components/common";
import useEditTurf from "@hooks/owner/useEditTurf";
import DashboardSkeleton from "../Dashboard/DashboardSkeleton";
import { ArrowLeft, MapPin, Map, LocateFixed } from "lucide-react";

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
    managerContacts,
    newManagerName,
    setNewManagerName,
    newManagerPhone,
    setNewManagerPhone,
    addManagerContact,
    removeManagerContact
  } = useEditTurf(id);

  const sportsOptions = ["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"];
  const groundTypeOptions = ["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"];
  const facilitiesOptions = ["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"];

  if (fetching) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-l-8 border-primary pl-6 flex justify-between items-end">
          <div>
             <button 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold uppercase text-[10px] tracking-widest mb-4"
             >
                <ArrowLeft size={14} />
                Cancel Edit
             </button>
             <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white uppercase">
                EDIT <span className="text-primary">ARENA</span>
             </h1>
             <p className="text-gray-500 uppercase tracking-widest mt-2 text-sm">
                Update Facility Intelligence | BookMySportz
             </p>
          </div>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#111] p-8 md:p-12 rounded-2xl border border-gray-800 shadow-2xl"
        >
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-8 uppercase tracking-widest">General Information</h3>
            
            <FormField
              label="Turf Name"
              name="name"
              type="text"
              register={register}
              error={errors.name}
            />
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Facility Description</span>
              </label>
              <textarea
                {...register("description")}
                className="textarea bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm h-32 rounded-xl"
                placeholder="Describe your facility's features and amenities..."
              ></textarea>
              {errors.description && (
                <span className="text-primary text-[10px] font-bold uppercase mt-1">
                  {errors.description.message}
                </span>
              )}
            </div>
            
            {/* Location Section */}
            <div className="space-y-4 pt-4 border-t border-gray-800/50">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={16} className="text-primary" /> Location Details
              </h4>
              <FormField
                label="Full Address (Street, Area)"
                name="location"
                type="text"
                register={register}
                error={errors.location}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="City"
                  name="city"
                  type="text"
                  register={register}
                  error={errors.city}
                />
                <FormField
                  label="State"
                  name="state"
                  type="text"
                  register={register}
                  error={errors.state}
                />
              </div>

              {/* Coordinates & Map Integration */}
              <div className="p-4 bg-black/40 border border-gray-800 rounded-xl space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Map size={14} className="text-primary" /> Map Coordinates
                  </h4>
                  <button
                    type="button"
                    onClick={getMyLocation}
                    disabled={isLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-black border border-primary/20 hover:border-primary transition-all rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    <LocateFixed size={12} className={isLocating ? "animate-spin" : ""} />
                    {isLocating ? "Locating..." : "Get My Location"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Latitude (e.g., 28.7041)"
                    name="latitude"
                    type="text"
                    register={register}
                    error={errors.latitude}
                  />
                  <FormField
                    label="Longitude (e.g., 77.1025)"
                    name="longitude"
                    type="text"
                    register={register}
                    error={errors.longitude}
                  />
                </div>

                {/* Live Map Preview */}
                {(watch("latitude") && watch("longitude")) || watch("location") ? (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-800 h-48 relative group bg-[#111]">
                    {watch("latitude") && watch("longitude") ? (
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(100%)" }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${watch("latitude")},${watch("longitude")}&z=15&output=embed`}
                      ></iframe>
                    ) : watch("location") && watch("city") ? (
                       <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(100%)" }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(`${watch("location")}, ${watch("city")}`)}&z=15&output=embed`}
                      ></iframe>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs uppercase tracking-widest font-bold">
                         <MapPin size={16} className="mr-2" /> Map Preview (Enter Address)
                       </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/80 text-primary text-[9px] font-bold px-2 py-1 rounded backdrop-blur-sm border border-primary/20 uppercase">
                      Live Preview
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            
            <FormField
              label="Hourly Rate (INR)"
              name="pricePerHour"
              type="number"
              register={register}
              error={errors.pricePerHour}
            />
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-8 uppercase tracking-widest">Operational Details</h3>
            
            <FormField
              label="YouTube Video URL"
              name="youtubeUrl"
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              register={register}
              error={errors.youtubeUrl}
            />

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold text-primary">Update Images (Optional)</span>
              </label>
              <div className="relative group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="file-input bg-[#151515] border-gray-800 text-gray-400 w-full text-[10px] font-bold uppercase h-12 rounded-xl focus:border-primary focus:outline-none transition-all"
                  onChange={(e) => {
                    const files = e.target.files;
                    setValue("images", files);
                  }}
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 group-hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
              </div>
              {errors.images && (
                <span className="text-primary text-[10px] font-bold uppercase mt-1">{errors.images.message}</span>
              )}
              <p className="text-[9px] text-gray-500 mt-2 uppercase tracking-tighter italic">Leave empty to keep existing images. Max 10 allowed.</p>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Sport Arsenal</span>
              </label>
              <select
                className="select bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm h-12 rounded-xl w-full"
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
                  <span key={index} className="px-3 py-1 bg-primary text-black font-bold rounded-lg text-xs flex items-center gap-2 uppercase">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeSportType(type)}
                      className="hover:text-white transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Ground Composition</span>
              </label>
              <select
                className="select bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm h-12 rounded-xl w-full"
                onChange={(e) => addGroundType(e.target.value)}
                value=""
              >
                <option value="" disabled>Select Ground Types</option>
                {groundTypeOptions.map(option => (
                  <option key={option} value={option} disabled={groundTypes.includes(option)}>{option}</option>
                ))}
              </select>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {groundTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1 bg-white text-black font-bold rounded-lg text-xs flex items-center gap-2 uppercase">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeGroundType(type)}
                      className="hover:text-primary transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Ground Facilities</span>
              </label>
              <select
                className="select bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm h-12 rounded-xl w-full"
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
                  <span key={index} className="px-3 py-1 bg-[#222] border border-gray-700 text-primary font-bold rounded-lg text-xs flex items-center gap-2 uppercase">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeFacility(type)}
                      className="hover:text-white transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-8 uppercase tracking-widest mt-12">Support & Navigation</h3>
            
            <FormField
              label="Direct Google Maps URL"
              name="mapUrl"
              type="text"
              placeholder="https://maps.app.goo.gl/..."
              register={register}
              error={errors.mapUrl}
            />
            <p className="text-[9px] text-gray-500 uppercase tracking-tighter italic">Provide a direct navigation link for customers to reach your venue easily.</p>

            <div className="form-control space-y-4">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Venue Managers (Contacts)</span>
              </label>
              
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  className="input bg-[#151515] border-gray-800 text-white text-xs w-full h-12 rounded-xl focus:outline-none focus:border-primary transition-colors"
                />
                <input
                  type="text"
                  placeholder="Manager Phone (10 digits)"
                  value={newManagerPhone}
                  onChange={(e) => setNewManagerPhone(e.target.value)}
                  className="input bg-[#151515] border-gray-800 text-white text-xs w-full h-12 rounded-xl focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={addManagerContact}
                  className="shrink-0 px-6 rounded-xl bg-white text-black hover:bg-primary transition-all text-xs font-bold uppercase"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                {managerContacts.map((manager, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#1a1a1a] p-3 rounded-xl border border-gray-800 group">
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-bold uppercase tracking-wider">{manager.name}</span>
                      <span className="text-gray-500 text-[10px] font-mono">{manager.phone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeManagerContact(index)}
                      className="text-gray-500 hover:text-primary transition-colors uppercase text-[10px] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {managerContacts.length === 0 && (
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest text-center py-4 border border-dashed border-gray-800 rounded-xl italic">
                    No Managers Added Yet
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-12 pt-8 border-t border-gray-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-2 mb-4 uppercase tracking-widest">Slot Architecture</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Slot Duration (Min)</span>
                    </label>
                    <select
                      {...register("slotDuration")}
                      className="select bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm h-12 rounded-xl w-full"
                    >
                      <option value={30}>30 Minutes</option>
                      <option value={60}>60 Minutes</option>
                      <option value={90}>90 Minutes</option>
                      <option value={120}>120 Minutes (2 hrs)</option>
                      <option value={180}>180 Minutes (3 hrs)</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Break Time (Min)</span>
                    </label>
                    <select
                      {...register("breakTime")}
                      className="select bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm h-12 rounded-xl w-full"
                    >
                      <option value={0}>No Break</option>
                      <option value={10}>10 Minutes</option>
                      <option value={15}>15 Minutes</option>
                      <option value={20}>20 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Opening Time</span>
                    </label>
                    <Controller
                      name="openTime"
                      control={control}
                      rules={{ required: "Opening time is required" }}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => {
                            field.onChange(date);
                            setValue("closeTime", null);
                          }}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={60}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm w-full h-12 rounded-xl"
                        />
                      )}
                    />
                    {errors.openTime && (
                      <span className="text-primary text-[10px] font-bold uppercase mt-1">
                        {errors.openTime.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Closing Time</span>
                    </label>
                    <Controller
                      name="closeTime"
                      control={control}
                      rules={{ required: "Closing time is required" }}
                      render={({ field }) => (
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={60}
                          timeCaption="Time"
                          dateFormat="h:mm aa"
                          className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm w-full h-12 rounded-xl"
                          disabled={!openTime}
                          minTime={openTime || setHours(setMinutes(new Date(), 0), 0)}
                          maxTime={setHours(setMinutes(new Date(), 30), 23)}
                        />
                      )}
                    />
                    {errors.closeTime && (
                      <span className="text-primary text-[10px] font-bold uppercase mt-1">
                        {errors.closeTime.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="label">
                    <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Weekly Schedule</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                      const isActive = availableDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            isActive 
                            ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(132,204,22,0.3)]" 
                            : "bg-[#151515] text-gray-500 border-gray-800 hover:border-gray-600"
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-gray-500 italic uppercase">Toggle days to mark as operational or facility closed.</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-4">
                  <h3 className="text-xl font-bold text-white uppercase tracking-widest">Generated Slots Preview</h3>
                  <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                    {generatedSlots.length} Slots Total
                  </span>
                </div>
                
                {generatedSlots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {generatedSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleSlotActive(index)}
                        className={`p-3 rounded-xl text-[10px] font-bold border transition-all flex flex-col items-center gap-1 ${
                          slot.isActive
                          ? "bg-[#1a1a1a] border-primary/30 text-white hover:border-primary"
                          : "bg-black/50 border-gray-800 text-gray-600 opacity-50 line-through"
                        }`}
                      >
                        <span className="tracking-tighter">{slot.startTime}</span>
                        <span className="text-[8px] opacity-40">to</span>
                        <span className="tracking-tighter">{slot.endTime}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] bg-[#151515] rounded-2xl border border-dashed border-gray-800">
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Set times to view slots</p>
                  </div>
                )}
                <p className="text-[9px] text-gray-500 italic uppercase">Click a slot to enable or disable it for listing.</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 pt-8 border-t border-gray-800">
            <button 
              type="submit" 
              className={`w-full py-4 bg-primary text-black font-bold text-xl uppercase tracking-widest hover:bg-white transition-all transform hover:scale-[1.01] active:scale-[0.99] rounded-xl shadow-[0_0_30px_rgba(113,179,0,0.3)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "SAVING CHANGES..." : "UPDATE FACILITY INTELLIGENCE"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default EditTurf;
