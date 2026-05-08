import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse, isValid } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useNavigate } from "react-router-dom";

const editTurfSchema = yup.object().shape({
  name: yup
    .string()
    .required("Enter the name of the turf")
    .min(3, "Name must be at least 3 characters long"),
  description: yup
    .string()
    .required("Enter the description of the turf")
    .min(3, "Description must be at least 3 characters long"),
  location: yup
    .string()
    .required("Enter the location of the turf")
    .min(3, "Location must be at least 3 characters long"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  latitude: yup.string().optional(),
  longitude: yup.string().optional(),
  pricePerHour: yup
    .number()
    .required("Enter the price per hour of the turf")
    .min(500, "Price per hour must be at least 500 rupees")
    .max(3000, "Price per hour must be at most 3000 rupees"),
  images: yup
    .mixed()
    .nullable()
    .test(
      "images",
      "Max 10 images allowed (PNG, JPEG, or WebP).",
      function (value) {
        if (!value || value.length === 0) return true; // Optional on edit
        if (value.length > 10) return false;
        const acceptedFormats = ["image/png", "image/jpeg", "image/webp"];
        return Array.from(value).every(file => acceptedFormats.includes(file.type));
      }
    ),
  youtubeUrl: yup.string().url("Invalid YouTube URL").nullable(),
  openTime: yup.date().required("Open time is required"),
  closeTime: yup
    .date()
    .required("Close time is required")
    .min(yup.ref("openTime"), "Close time must be after open time"),
  sportTypes: yup
    .array()
    .of(yup.string())
    .min(1, "At least one sport type is required"),
  groundTypes: yup
    .array()
    .of(yup.string())
    .min(1, "At least one ground type is required"),
  facilities: yup
    .array()
    .of(yup.string())
    .min(1, "At least one facility is required"),
  slotDuration: yup.number().required("Slot duration is required").min(30).max(240),
  breakTime: yup.number().min(0).max(60),
});

export default function useEditTurf(turfId) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(editTurfSchema),
    defaultValues: {
      sportTypes: [],
      groundTypes: [],
      facilities: [],
      openTime: null,
      closeTime: null,
      youtubeUrl: "",
      slotDuration: 60,
      breakTime: 0,
      city: "",
      state: "",
      latitude: "",
      longitude: "",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      offDays: [],
    },
  });

  const [sportTypes, setSportTypes] = useState([]);
  const [groundTypes, setGroundTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [generatedSlots, setGeneratedSlots] = useState([]);
  
  const openTime = watch("openTime");
  const closeTime = watch("closeTime");
  const slotDuration = watch("slotDuration");
  const breakTime = watch("breakTime");
  const availableDays = watch("availableDays");
  const offDays = watch("offDays");

  const [pendingUpdates, setPendingUpdates] = useState({});

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const response = await axiosInstance.get(`/api/owner/turf/${turfId}/details`);
        const { turf } = response.data;
        
        setPendingUpdates(turf.pendingUpdates || {});

        // Populate form
        setValue("name", turf.name);
        setValue("description", turf.description);
        setValue("location", turf.location);
        setValue("city", turf.city || "");
        setValue("state", turf.state || "");
        
        if (turf.locationData && turf.locationData.coordinates && turf.locationData.coordinates.length === 2) {
          // MongoDB GeoJSON is [longitude, latitude]
          setValue("longitude", turf.locationData.coordinates[0]?.toString() || "");
          setValue("latitude", turf.locationData.coordinates[1]?.toString() || "");
        }
        
        setValue("pricePerHour", turf.pricePerHour);
        setValue("youtubeUrl", turf.youtubeUrl || "");
        
        setSportTypes(turf.sportTypes || []);
        setGroundTypes(turf.groundTypes || []);
        setFacilities(turf.facilities || []);

        if (turf.openTime) {
            try {
                const parsedOpen = parse(turf.openTime, "hh:mm aa", new Date());
                if (isValid(parsedOpen)) {
                    setValue("openTime", parsedOpen);
                } else {
                    console.warn("Invalid openTime from DB:", turf.openTime);
                }
            } catch (e) {
                console.error("Error parsing openTime:", e);
            }
        }
        if (turf.closeTime) {
            try {
                const parsedClose = parse(turf.closeTime, "hh:mm aa", new Date());
                if (isValid(parsedClose)) {
                    setValue("closeTime", parsedClose);
                } else {
                    console.warn("Invalid closeTime from DB:", turf.closeTime);
                }
            } catch (e) {
                console.error("Error parsing closeTime:", e);
            }
        }

        if (turf.slotDuration) setValue("slotDuration", turf.slotDuration);
        if (turf.breakTime !== undefined) setValue("breakTime", turf.breakTime);
        if (turf.availableDays) setValue("availableDays", turf.availableDays);
        if (turf.offDays) setValue("offDays", turf.offDays);
        if (turf.generatedSlots) setGeneratedSlots(turf.generatedSlots);

      } catch (err) {
        toast.error("Failed to fetch turf details");
        navigate("/partner/turfs");
      } finally {
        setFetching(false);
      }
    };
    if (turfId) fetchTurf();
  }, [turfId, setValue, navigate]);

  useEffect(() => {
    setValue("sportTypes", sportTypes);
  }, [sportTypes, setValue]);

  useEffect(() => {
    setValue("groundTypes", groundTypes);
  }, [groundTypes, setValue]);

  useEffect(() => {
    setValue("facilities", facilities);
  }, [facilities, setValue]);

  const addSportType = (type) => {
    if (type && !sportTypes.includes(type)) {
      setSportTypes([...sportTypes, type]);
    }
  };

  const removeSportType = (type) => {
    setSportTypes(sportTypes.filter((sport) => sport !== type));
  };

  const addGroundType = (type) => {
    if (type && !groundTypes.includes(type)) {
      setGroundTypes([...groundTypes, type]);
    }
  };

  const removeGroundType = (type) => {
    setGroundTypes(groundTypes.filter((ground) => ground !== type));
  };

  const addFacility = (item) => {
    if (item && !facilities.includes(item)) {
      setFacilities([...facilities, item]);
    }
  };

  const removeFacility = (item) => {
    setFacilities(facilities.filter((f) => f !== item));
  };

  const toggleDay = (day) => {
    const currentDays = watch("availableDays");
    const currentOff = watch("offDays");
    
    if (currentDays.includes(day)) {
      setValue("availableDays", currentDays.filter(d => d !== day));
      if (!currentOff.includes(day)) {
        setValue("offDays", [...currentOff, day]);
      }
    } else {
      setValue("availableDays", [...currentDays, day]);
      setValue("offDays", currentOff.filter(d => d !== day));
    }
  };

  useEffect(() => {
    if (openTime && isValid(openTime) && closeTime && isValid(closeTime) && slotDuration) {
      const slots = [];
      let current = new Date(openTime);
      let end = new Date(closeTime);
      
      // Handle case where closeTime is on the next day (e.g. 12:00 AM)
      if (end <= current) {
        end.setDate(end.getDate() + 1);
      }
      
      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);
        
        if (slotEnd <= end) {
          const sTime = format(slotStart, "hh:mm aa");
          const eTime = format(slotEnd, "hh:mm aa");
          
          const existing = generatedSlots.find(s => s.startTime === sTime && s.endTime === eTime);
          
          slots.push({
            startTime: sTime,
            endTime: eTime,
            isActive: existing ? existing.isActive : true
          });
        }
        
        current = new Date(slotEnd.getTime() + (breakTime || 0) * 60000);
      }
      setGeneratedSlots(slots);
    }
  }, [openTime, closeTime, slotDuration, breakTime]);

  const toggleSlotActive = (index) => {
    const newSlots = [...generatedSlots];
    newSlots[index].isActive = !newSlots[index].isActive;
    setGeneratedSlots(newSlots);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "images") {
        if (data[key] && data[key].length > 0) {
          Array.from(data[key]).forEach((file) => {
            formData.append("images", file);
          });
        }
      } else if (key === "openTime" || key === "closeTime") {
        if (data[key] instanceof Date) {
          formData.append(key, format(data[key], "hh:mm aa"));
        }
      } else if (key === "sportTypes" || key === "groundTypes" || key === "facilities") {
        if (Array.isArray(data[key])) {
          data[key].forEach((item) => {
            formData.append(key, item);
          });
        }
      } else if (key === "availableDays" || key === "offDays") {
        data[key].forEach(day => formData.append(key, day));
      } else {
        formData.append(key, data[key]);
      }
    });

    // Append generated slots
    formData.append("generatedSlots", JSON.stringify(generatedSlots));

    try {
      const response = await axiosInstance.put(
        `/api/owner/turf/${turfId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast.success(response.data.message);
      navigate(`/partner/turf/${turfId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("latitude", position.coords.latitude.toString());
        setValue("longitude", position.coords.longitude.toString());
        setIsLocating(false);
        toast.success("Coordinates captured successfully!");
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        toast.error("Unable to retrieve your location. Please check permissions.");
      }
    );
  };

  return {
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
  };
}
