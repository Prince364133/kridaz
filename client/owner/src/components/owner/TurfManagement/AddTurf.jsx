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
          <h1 className="text-4xl md:text-6xl font-display font-black italic tracking-tighter text-white uppercase">
            RECRUIT <span className="text-primary">ARENA</span>
          </h1>
          <p className="text-gray-500 font-secondary uppercase tracking-widest mt-2">
            Establish a New Territory | BookMySportz
          </p>
        </header>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#111] p-8 md:p-12 rounded-xl border border-gray-800 shadow-2xl"
        >
          <div className="space-y-6">
            <h3 className="text-xl font-display italic font-black text-white border-b border-gray-800 pb-2 mb-8 uppercase">Vital Intel</h3>
            
            <FormField
              label="Arena Name"
              name="name"
              type="text"
              register={register}
              error={errors.name}
            />
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-secondary uppercase tracking-widest text-[10px]">Strategic Description</span>
              </label>
              <textarea
                {...register("description")}
                className="textarea bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none font-secondary text-sm h-32"
                placeholder="Detail the arena's advantages..."
              ></textarea>
              {errors.description && (
                <span className="text-primary font-mono text-[10px] uppercase mt-1">
                  {errors.description.message}
                </span>
              )}
            </div>
            
            <FormField
              label="Geo Location"
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
            <h3 className="text-xl font-display italic font-black text-white border-b border-gray-800 pb-2 mb-8 uppercase">Operation Specs</h3>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-secondary uppercase tracking-widest text-[10px]">Arena Visual (.jpg / .png)</span>
              </label>
              <input
                type="file"
                className="file-input bg-[#151515] border-gray-800 text-gray-400 w-full font-mono text-[10px] uppercase h-12"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setValue("image", file);
                }}
                {...register("image", { required: true })}
              />
              {errors.image && (
                <span className="text-primary font-mono text-[10px] uppercase mt-1">{errors.image.message}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-400 font-secondary uppercase tracking-widest text-[10px]">Drills Start</span>
                </label>
                <Controller
                  name="openTime"
                  control={control}
                  rules={{ required: "Open time is required" }}
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
                      className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none font-secondary text-sm w-full h-12"
                    />
                  )}
                />
                {errors.openTime && (
                  <span className="text-primary font-mono text-[10px] uppercase mt-1">
                    {errors.openTime.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-gray-400 font-secondary uppercase tracking-widest text-[10px]">Drills End</span>
                </label>
                <Controller
                  name="closeTime"
                  control={control}
                  rules={{ required: "Close time is required" }}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={60}
                      timeCaption="Time"
                      dateFormat="h:mm aa"
                      className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none font-secondary text-sm w-full h-12"
                      disabled={!openTime}
                      minTime={openTime || setHours(setMinutes(new Date(), 0), 0)}
                      maxTime={setHours(setMinutes(new Date(), 30), 23)}
                    />
                  )}
                />
                {errors.closeTime && (
                  <span className="text-primary font-mono text-[10px] uppercase mt-1">
                    {errors.closeTime.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-400 font-secondary uppercase tracking-widest text-[10px]">Combat Sports Categories</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSportType}
                  onChange={(e) => setNewSportType(e.target.value)}
                  className="input bg-[#151515] border-gray-800 text-white focus:border-primary focus:outline-none font-secondary text-sm flex-grow h-12"
                  placeholder="EX: FOOTBALL"
                />
                <button
                  type="button"
                  onClick={addSportType}
                  className="px-6 bg-white hover:bg-primary text-black font-display font-bold italic rounded transition-colors uppercase text-sm"
                >
                  ADD
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 min-h-[40px]">
                {sportTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1 bg-primary text-black font-display italic font-bold rounded text-xs flex items-center gap-2">
                    {type.toUpperCase()}
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
                <span className="text-primary font-mono text-[10px] uppercase mt-1">
                  {errors.sportTypes.message}
                </span>
              )}
            </div>
          </div>

          <div className="md:col-span-2 pt-8 border-t border-gray-800">
            <button 
              type="submit" 
              className={`w-full py-4 bg-primary text-black font-display font-black italic text-2xl uppercase tracking-tighter hover:bg-white transition-all transform hover:scale-[1.01] active:scale-[0.99] rounded-lg shadow-[0_0_30px_rgba(113,179,0,0.3)] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? "INITIALIZING..." : "DEPLOY ARENA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTurf;
