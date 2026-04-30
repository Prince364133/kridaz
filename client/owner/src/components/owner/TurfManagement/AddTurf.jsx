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
    openTime,
    loading,
  } = useAddTurf();

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
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 uppercase tracking-widest text-[10px] font-bold">Facility Image (.jpg / .png)</span>
              </label>
              <input
                type="file"
                className="file-input bg-[#151515] border-gray-800 text-gray-400 w-full text-[10px] font-bold uppercase h-12 rounded-xl"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setValue("image", file);
                }}
                {...register("image", { required: true })}
              />
              {errors.image && (
                <span className="text-primary text-[10px] font-bold uppercase mt-1">{errors.image.message}</span>
              )}
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSportType}
                  onChange={(e) => setNewSportType(e.target.value)}
                  className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none text-sm flex-grow h-12 rounded-xl"
                  placeholder="E.G. FOOTBALL"
                />
                <button
                  type="button"
                  onClick={addSportType}
                  className="px-6 bg-white hover:bg-primary text-black font-bold rounded-xl transition-colors uppercase text-sm"
                >
                  ADD
                </button>
              </div>
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
