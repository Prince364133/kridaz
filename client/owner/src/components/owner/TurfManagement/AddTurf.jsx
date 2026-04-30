import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Controller } from "react-hook-form";
import { setHours, setMinutes } from "date-fns";
import { FormField } from "@components/common";
import useAddTurf from "@hooks/owner/useAddTurf";
import { Button } from "@components/common";
const AddTurf = () => {
  const {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
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
    loading,
  } = useAddTurf();

  const sportsOptions = ["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"];
  const groundTypeOptions = ["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"];
  const facilitiesOptions = ["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"];

  return (
    <div className="p-4 md:p-8 bg-[#0a0a0a] min-h-screen text-white">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 border-l-8 border-primary pl-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white uppercase">
            ADD NEW <span className="text-primary">TURF</span>
          </h1>
          <p className="text-gray-500 uppercase tracking-widest mt-2 text-sm">
            Register a New Facility | BookMySportz
          </p>
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
            
            <FormField
              label="Location"
              name="location"
              type="text"
              register={register}
              error={errors.location}
            />
            
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
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Facility Images (Up to 10)</span>
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
              <p className="text-[9px] text-gray-500 mt-2 uppercase tracking-tighter italic">Select multiple files at once. Max 10 images allowed.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Available Sports</span>
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
              {errors.sportTypes && (
                <span className="text-primary text-[10px] font-bold uppercase mt-1">
                  {errors.sportTypes.message}
                </span>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Ground Types</span>
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
              {errors.groundTypes && (
                <span className="text-primary text-[10px] font-bold uppercase mt-1">
                  {errors.groundTypes.message}
                </span>
              )}
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
              {errors.facilities && (
                <span className="text-primary text-[10px] font-bold uppercase mt-1">
                  {errors.facilities.message}
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-2 pt-8 border-t border-gray-800">
            <button 
              type="submit" 
              className={`w-full py-4 bg-primary text-black font-bold text-xl uppercase tracking-widest hover:bg-white transition-all transform hover:scale-[1.01] active:scale-[0.99] rounded-xl shadow-[0_0_30px_rgba(113,179,0,0.3)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "SAVING..." : "REGISTER FACILITY"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default AddTurf;
