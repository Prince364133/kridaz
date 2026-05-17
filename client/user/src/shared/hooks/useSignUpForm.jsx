import { PHONE_REGEX } from '@kridaz/shared-constants/validation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../redux/slices/authSlice";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
  gender: z.string().min(1, "Select your gender").optional(),
  dob: z.string().min(1, "Date of Birth is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  state: z.string().min(1, "State is required").optional(),
  pinCode: z.string().regex(/^[0-9]{6}$/, "Enter a valid 6-digit PIN code").optional(),
  sportTypes: z.array(z.string()).min(1, "Select at least one sport expertise").optional(),
  experience: z.string().min(1, "Years of experience is required").optional(),
  coachingLevel: z.string().min(1, "Coaching level is required").optional(),
  sessionFee: z.any().optional(),
  availabilityTimings: z.string().min(1, "Availability timings are required").optional(),
  availabilityMode: z.string().min(1, "Select availability mode").optional(),
  preferredLocations: z.string().min(1, "Preferred training locations are required").optional(),
  bio: z.string().min(20, "Bio should be at least 20 characters").optional(),
  location: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z.string().min(1, "Confirm your password"),
  otp: z.string().optional(),
  phoneOtp: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  businessDetails: z.object({
    businessName: z.string().optional(),
    registrationNumber: z.string().optional(),
  }).optional(),
  documents: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().min(1),
    })
  ).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

/**
 * useSignUpForm - handles form logic for role-based signup pages.
 * @param {string} predefinedRole - "user" | "venu_owners" | "coach" | "umpire" | "streamer" | "scorer" — pre-selects the role.
 */
const useSignUpForm = (predefinedRole = "user") => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, role } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'unavailable'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [turnstileToken, setTurnstileToken] = useState(null);

  // Determine API base path based on role
  const apiPath = predefinedRole === "user" ? "/api/user/auth" : "/api/owner/auth";

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    context: { showOtpInput },
    defaultValues: {
      role: predefinedRole,
      sportTypes: [],
      businessDetails: {},
      documents: [],
      availabilityMode: "Both",
      gender: "",
      coachingLevel: "Beginner",
    },
  });

  const username = watch("username");

  // Live Username Check
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    const checkAvailability = async () => {
      setUsernameStatus('checking');
      try {
        const response = await axiosInstance.get(`${apiPath}/check-username?username=${username}`);
        if (response.data.available) {
          setUsernameStatus('available');
        } else {
          setUsernameStatus('unavailable');
        }
      } catch (error) {
        setUsernameStatus(null);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [username, apiPath]);

  const handleSendOtp = async () => {
    const fieldsToValidate = ["name", "username", "email", "phone", "gender", "location", "password", "confirmPassword"];
    const isValid = await trigger(fieldsToValidate);
    
    if (!isValid) return;
    if (usernameStatus === 'unavailable') {
      toast.error("Username is already taken");
      return;
    }

    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!turnstileToken && !isLocalhost) {
      toast.error("Please complete the bot verification");
      return;
    }

    setLoading(true);
    try {
      const { email, phone } = getValues();
      const response = await axiosInstance.post(`${apiPath}/send-otp`, { 
        email, 
        phone,
        "cf-turnstile-response": turnstileToken 
      });
      toast.success(response.data.message || "OTPs sent to your email and WhatsApp");
      setShowOtpInput(true);
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message || "Failed to send OTP");
      } else {
        toast.error("Error connecting to server");
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    // If partner role, we use ownerRequest flow
    if (predefinedRole !== "user") {
      return handlePartnerSubmission(data);
    }

    if (!showOtpInput) {
      return handleSendOtp();
    }

    setLoading(true);
    const inviteToken = localStorage.getItem("pendingInvite");
    const umpireInvite = localStorage.getItem("umpireInvite");
    const payload = { 
      ...data, 
      role: predefinedRole, 
      inviteToken, 
      umpireInvite,
      "cf-turnstile-response": turnstileToken
    };
    try {
      const response = await axiosInstance.post(`${apiPath}/register`, payload);
      const result = response.data;

      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      toast.success(`Welcome to Kridaz, ${data.name}!`);
      
      const role = result.role?.toLowerCase() || "";
      if (role.includes("umpire")) {
        navigate("/umpire");
      } else if ((role === "owner" || role === "venu_owners")) {
        navigate("/partner");
      } else if (role === "coach") {
        navigate("/coach");
      } else if (role === "streamer") {
        navigate("/streamer");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerSubmission = async (data) => {
    // For partners, we don't necessarily need OTP if it's a request flow
    // but the user might want it. Let's stick to simple request for now as requested.
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${apiPath}/ownerRequest`, data);
      toast.success("Application submitted successfully! Our team will review it shortly.");
      navigate("/partners");
    } catch (error) {
      toast.error(error.response?.data?.message || "Application failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (googleResponse) => {
    setLoading(true);
    try {
      const inviteToken = localStorage.getItem("pendingInvite");
      const umpireInvite = localStorage.getItem("umpireInvite");
      const payload = {
        role: predefinedRole,
        inviteToken,
        umpireInvite
      };

      if (googleResponse.credential) {
        payload.credential = googleResponse.credential;
      } else if (googleResponse.access_token) {
        payload.accessToken = googleResponse.access_token;
      }

      const response = await axiosInstance.post(`${apiPath}/google-auth`, payload);
      const result = await response.data;
      
      // If partner role, we might need to handle it differently 
      // but for now let's allow them to log in if they exist, 
      // or redirect to finish application if they don't.
      
      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      toast.success("Successfully logged in with Google!");

      const user = result.user;
      
      if (result.isNewUser) {
        setOnboardingUser(user);
        setShowOnboarding(true);
        return;
      }

      const role = result.role?.toLowerCase() || "";
      if (role.includes("umpire")) {
        navigate("/umpire");
      } else if ((role === "owner" || role === "venu_owners")) {
        navigate("/partner");
      } else if (role === "coach") {
        navigate("/coach");
      } else if (role === "streamer") {
        navigate("/streamer");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google authentication failed");
  };

  return { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading, 
    getValues,
    setValue,
    watch,
    trigger,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    usernameStatus,
    setTurnstileToken,
    showOnboarding,
    setShowOnboarding,
    onboardingUser,
    currentStep,
    setCurrentStep,
    user,
    role,
    navigate
  };
};

export default useSignUpForm;

