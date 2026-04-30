import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "../useAxiosInstance";
import { useNavigate } from "react-router-dom";

const addTurfSchema = yup.object().shape({
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
    .test(
      "images",
      "Please upload at least one valid image (PNG, JPEG, or WebP). Max 10 images.",
      function (value) {
        if (!value || value.length === 0) return false;
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
});

export default function useAddTurf() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(addTurfSchema),
    defaultValues: {
      sportTypes: [],
      groundTypes: [],
      facilities: [],
      openTime: null,
      closeTime: null,
      youtubeUrl: "",
    },
  });

  const [sportTypes, setSportTypes] = useState([]);
  const [groundTypes, setGroundTypes] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [newSportType, setNewSportType] = useState("");
  const [newGroundType, setNewGroundType] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const openTime = watch("openTime");

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
    const sport = typeof type === 'string' ? type : newSportType;
    if (sport && !sportTypes.includes(sport)) {
      setSportTypes([...sportTypes, sport]);
      setNewSportType("");
    }
  };

  const removeSportType = (type) => {
    setSportTypes(sportTypes.filter((sport) => sport !== type));
  };

  const addGroundType = (type) => {
    const ground = typeof type === 'string' ? type : newGroundType;
    if (ground && !groundTypes.includes(ground)) {
      setGroundTypes([...groundTypes, ground]);
      setNewGroundType("");
    }
  };

  const removeGroundType = (type) => {
    setGroundTypes(groundTypes.filter((ground) => ground !== type));
  };

  const addFacility = (item) => {
    const facility = typeof item === 'string' ? item : newFacility;
    if (facility && !facilities.includes(facility)) {
      setFacilities([...facilities, facility]);
      setNewFacility("");
    }
  };

  const removeFacility = (item) => {
    setFacilities(facilities.filter((f) => f !== item));
  };

  const onSubmit = async (data) => {
    setLoading(true);

    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      if (key === "images") {
        if (data[key]) {
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
      } else {
        formData.append(key, data[key]);
      }
    });

    for (let [key, value] of formData.entries()) {
     }
    try {
      const response = await axiosInstance.post(
        "/api/owner/turf/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
       const result = response.data;
      toast.success(result.message);
      navigate("/partner/turfs");
     } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message);
      } else if (error.request) {
        toast.error("No response from server. Please try again later.");
      } else {
        toast.error(error.message);
      }
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
    newFacility,
    setNewFacility,
    addFacility,
    removeFacility,
    openTime,
    loading,
  };
}
