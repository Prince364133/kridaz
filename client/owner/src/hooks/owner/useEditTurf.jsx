import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, parse } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "../useAxiosInstance";
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

  useEffect(() => {
    const fetchTurf = async () => {
      try {
        const response = await axiosInstance.get(`/api/owner/turf/${turfId}/details`);
        const { turf } = response.data;
        
        // Populate form
        setValue("name", turf.name);
        setValue("description", turf.description);
        setValue("location", turf.location);
        setValue("pricePerHour", turf.pricePerHour);
        setValue("youtubeUrl", turf.youtubeUrl || "");
        
        setSportTypes(turf.sportTypes || []);
        setGroundTypes(turf.groundTypes || []);
        setFacilities(turf.facilities || []);

        if (turf.openTime) {
            const parsedOpen = parse(turf.openTime, "hh:mm aa", new Date());
            setValue("openTime", parsedOpen);
        }
        if (turf.closeTime) {
            const parsedClose = parse(turf.closeTime, "hh:mm aa", new Date());
            setValue("closeTime", parsedClose);
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
    if (openTime && closeTime && slotDuration) {
      // If we already have generatedSlots from DB, and times haven't changed much, 
      // we might want to preserve isActive status. But for simplicity, let's regenerate.
      // A better way is to only regenerate if critical fields change.
      
      const slots = [];
      let current = new Date(openTime);
      const end = new Date(closeTime);
      
      while (current < end) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotDuration * 60000);
        
        if (slotEnd <= end) {
          const sTime = format(slotStart, "hh:mm aa");
          const eTime = format(slotEnd, "hh:mm aa");
          
          // Try to preserve isActive from previous state if times match
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

  return {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
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
  };
}
