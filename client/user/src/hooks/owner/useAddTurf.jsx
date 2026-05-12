import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { format, isValid } from "date-fns";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
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
 policies: yup
 .string()
 .required("Venue policies and rules are required")
 .min(200, "Policies must be at least 200 characters long")
 .max(10000, "Policies must be at most 10,000 characters long"),
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
 slotDuration: yup.number().required("Slot duration is required").min(30).max(240),
 breakTime: yup.number().min(0).max(60),
 slotsConfigDuration: yup.string().oneOf(["Until Changed", "Fixed Weeks"]).required("Configuration duration is required"),
 slotsConfigWeeks: yup.number().when("slotsConfigDuration", {
 is: "Fixed Weeks",
 then: (schema) => schema.required("Number of weeks is required").min(1).max(52),
 otherwise: (schema) => schema.optional(),
 }),
 mapUrl: yup.string().url("Invalid Google Maps URL").nullable(),
 managerContacts: yup.array().of(
 yup.object().shape({
 name: yup.string().required("Manager name is required"),
 phone: yup.string().required("Manager phone is required").matches(/^\d{10}$/, "Phone must be 10 digits"),
 })
 ).optional(),
});

export default function useAddTurf() {
 const [loading, setLoading] = useState(false);
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
 resolver: yupResolver(addTurfSchema),
 defaultValues: {
 sportTypes: [],
 groundTypes: [],
 facilities: [],
 openTime: null,
 closeTime: null,
 youtubeUrl: "",
 policies: "",
 slotDuration: 60,
 breakTime: 0,
 city: "",
 state: "",
 latitude: "",
 longitude: "",
 mapUrl: "",
 managerContacts: [],
 availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
 offDays: [],
 slotsConfigDuration: "Until Changed",
 slotsConfigWeeks: 1,
 },
 });

 const [managerContacts, setManagerContacts] = useState([]);
 const [newManagerName, setNewManagerName] = useState("");
 const [newManagerPhone, setNewManagerPhone] = useState("");

 const [sportTypes, setSportTypes] = useState([]);
 const [groundTypes, setGroundTypes] = useState([]);
 const [facilities, setFacilities] = useState([]);
 const [newSportType, setNewSportType] = useState("");
 const [newGroundType, setNewGroundType] = useState("");
 const [newFacility, setNewFacility] = useState("");
 const [generatedSlots, setGeneratedSlots] = useState([]);
 
 const openTime = watch("openTime");
 const closeTime = watch("closeTime");
 const slotDuration = watch("slotDuration");
 const breakTime = watch("breakTime");
 const availableDays = watch("availableDays");
 const offDays = watch("offDays");

 useEffect(() => {
 setValue("sportTypes", sportTypes);
 }, [sportTypes, setValue]);

 useEffect(() => {
 setValue("groundTypes", groundTypes);
 }, [groundTypes, setValue]);

 useEffect(() => {
 setValue("facilities", facilities);
 }, [facilities, setValue]);

 useEffect(() => {
 setValue("managerContacts", managerContacts);
 }, [managerContacts, setValue]);

 const addManagerContact = () => {
 if (newManagerName && newManagerPhone) {
 if (!/^\d{10}$/.test(newManagerPhone)) {
 toast.error("Phone number must be 10 digits");
 return;
 }
 setManagerContacts([...managerContacts, { name: newManagerName, phone: newManagerPhone }]);
 setNewManagerName("");
 setNewManagerPhone("");
 } else {
 toast.error("Please enter both manager name and phone");
 }
 };

 const removeManagerContact = (index) => {
 setManagerContacts(managerContacts.filter((_, i) => i !== index));
 };

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

 const pricePerHour = watch("pricePerHour") || 0;

 useEffect(() => {
 if (openTime && isValid(openTime) && closeTime && isValid(closeTime) && slotDuration) {
 const slots = [];
 let current = new Date(openTime);
 let end = new Date(closeTime);
 
 if (end <= current) {
 end.setDate(end.getDate() + 1);
 }
 
 const defaultSlotPrice = (Number(pricePerHour) * (Number(slotDuration) / 60)).toFixed(2);

 while (current < end) {
 const slotStart = new Date(current);
 const slotEnd = new Date(current.getTime() + slotDuration * 60000);
 
 if (slotEnd <= end) {
 slots.push({
 startTime: format(slotStart, "hh:mm aa"),
 endTime: format(slotEnd, "hh:mm aa"),
 isActive: true,
 price: Number(defaultSlotPrice)
 });
 }
 
 current = new Date(slotEnd.getTime() + (breakTime || 0) * 60000);
 }
 setGeneratedSlots(slots);
 }
 }, [openTime, closeTime, slotDuration, breakTime, pricePerHour]);

 const updateSlotPrice = (index, price) => {
 const newSlots = [...generatedSlots];
 newSlots[index].price = Number(price);
 setGeneratedSlots(newSlots);
 };

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
 } else if (key === "availableDays" || key === "offDays") {
 data[key].forEach(day => formData.append(key, day));
 } else if (key === "managerContacts") {
 formData.append(key, JSON.stringify(data[key]));
 } else {
 formData.append(key, data[key]);
 }
 });

 // Append generated slots
 formData.append("generatedSlots", JSON.stringify(generatedSlots));

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
 closeTime,
 slotDuration,
 breakTime,
 availableDays,
 offDays,
 generatedSlots,
 toggleDay,
 toggleSlotActive,
 loading,
 getMyLocation,
 isLocating,
 managerContacts,
 newManagerName,
 setNewManagerName,
 newManagerPhone,
 setNewManagerPhone,
 addManagerContact,
 removeManagerContact,
 updateSlotPrice
 };
}
