import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parse } from 'date-fns';

const EditTurfForm = ({ turf, onSave, onCancel, turfId }) => {
 const validationSchema = Yup.object().shape({
   name: Yup.string().required("Name is required"),
   description: Yup.string(),
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
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card bg-base-100 shadow-xl h-full">
      <div className="card-body p-4">
        <h2 className="card-title text-lg mb-4">Edit Turf</h2>
        <input
          type="text"
          {...register('name')}
          placeholder="Turf Name"
          className={`input input-bordered w-full mt-2 text-sm ${errors.name ? 'input-error' : ''}`}
        />
        {errors.name && <p className="text-error text-sm">{errors.name.message}</p>}
        <textarea
          {...register('description')}
          placeholder="Description"
          className={`textarea textarea-bordered w-full mt-2 text-sm ${errors.description ? 'textarea-error' : ''}`}
        ></textarea>
        {errors.description && <p className="text-error text-sm">{errors.description.message}</p>}
        <input
          type="number"
          {...register('pricePerHour', { valueAsNumber: true })}
          placeholder="Price per Hour"
          className={`input input-bordered w-full mt-2 text-sm ${errors.pricePerHour ? 'input-error' : ''}`}
        />
        {errors.pricePerHour && <p className="text-error text-sm">{errors.pricePerHour.message}</p>}
        <input
          type="text"
          {...register('location')}
          placeholder="Location"
          className={`input input-bordered w-full mt-2 text-sm ${errors.location ? 'input-error' : ''}`}
        />
        {errors.location && <p className="text-error text-sm">{errors.location.message}</p>}

        <div className="mt-4 space-y-4">
          {/* Sport Arsenal */}
          <div>
            <label className="label py-1">
              <span className="label-text text-[10px] font-bold uppercase tracking-widest opacity-60">Sport Arsenal</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watch('sportTypes')?.map((sport) => (
                <span key={sport} className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-bold flex items-center gap-2">
                  {sport}
                  <button type="button" onClick={() => setValue('sportTypes', watch('sportTypes').filter(s => s !== sport))} className="hover:text-white">×</button>
                </span>
              ))}
            </div>
            <select 
              className="select select-bordered select-sm w-full text-xs"
              onChange={(e) => {
                const val = e.target.value;
                const current = watch('sportTypes') || [];
                if (val && !current.includes(val)) setValue('sportTypes', [...current, val]);
                e.target.value = "";
              }}
            >
              <option value="">Add Sport...</option>
              {["Football", "Cricket", "Tennis", "Badminton", "Table Tennis", "Basketball", "Volleyball", "Hockey"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Ground Composition */}
          <div>
            <label className="label py-1">
              <span className="label-text text-[10px] font-bold uppercase tracking-widest opacity-60">Ground Composition</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watch('groundTypes')?.map((ground) => (
                <span key={ground} className="px-3 py-1 bg-white/10 text-white border border-white/20 rounded-lg text-[10px] font-bold flex items-center gap-2">
                  {ground}
                  <button type="button" onClick={() => setValue('groundTypes', watch('groundTypes').filter(g => g !== ground))} className="hover:text-primary">×</button>
                </span>
              ))}
            </div>
            <select 
              className="select select-bordered select-sm w-full text-xs"
              onChange={(e) => {
                const val = e.target.value;
                const current = watch('groundTypes') || [];
                if (val && !current.includes(val)) setValue('groundTypes', [...current, val]);
                e.target.value = "";
              }}
            >
              <option value="">Add Ground Type...</option>
              {["Natural Grass", "Artificial Turf", "Clay", "Hard Court", "Small Turf", "Indoor Court"].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Facilities */}
          <div>
            <label className="label py-1">
              <span className="label-text text-[10px] font-bold uppercase tracking-widest opacity-60">Facility Amenities</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watch('facilities')?.map((facility) => (
                <span key={facility} className="px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-[10px] font-bold flex items-center gap-2">
                  {facility}
                  <button type="button" onClick={() => setValue('facilities', watch('facilities').filter(f => f !== facility))} className="hover:text-primary">×</button>
                </span>
              ))}
            </div>
            <select 
              className="select select-bordered select-sm w-full text-xs"
              onChange={(e) => {
                const val = e.target.value;
                const current = watch('facilities') || [];
                if (val && !current.includes(val)) setValue('facilities', [...current, val]);
                e.target.value = "";
              }}
            >
              <option value="">Add Amenity...</option>
              {["Parking", "Washroom", "Drinking Water", "Changing Room", "First Aid", "Locker Room", "Cafeteria", "WiFi", "Lighting", "Sitting Area"].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <div className="flex-1">
          <label className="label py-1">
            <span className="label-text text-[10px] font-bold uppercase tracking-widest opacity-60">Open Time</span>
          </label>
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
                className={`input input-bordered w-full text-sm h-10 ${errors.openTime ? 'input-error' : ''}`}
                filterTime={filterPassedTime}
              />
            )}
          />
          {errors.openTime && <p className="text-error text-[10px] uppercase font-bold">{errors.openTime.message}</p>}
        </div>
        <div className="flex-1">
          <label className="label py-1">
            <span className="label-text text-[10px] font-bold uppercase tracking-widest opacity-60">Close Time</span>
          </label>
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
                className={`input input-bordered w-full text-sm h-10 ${errors.closeTime ? 'input-error' : ''}`}
                filterTime={filterCloseTime}
                disabled={!getValues('openTime')}
              />
            )}
          />
          {errors.closeTime && <p className="text-error text-[10px] uppercase font-bold">{errors.closeTime.message}</p>}
        </div>
      </div>

        <div className="card-actions justify-end mt-4">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm">
            Save Changes
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditTurfForm;