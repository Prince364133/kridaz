import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "../redux/slices/authSlice";

const registerSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .matches(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  email: yup
    .string()
    .required("Enter your email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/gm,
      "Enter a valid email"
    ),
  phone: yup
    .string()
    .required("Enter your phone number")
    .matches(/^[0-9]{10}$/, "Enter a valid 10-digit phone number"),
  gender: yup.string().required("Select your gender"),
  sportTypes: yup.array().min(1, "Select at least one sport"),
  location: yup.string().required("Enter your location"),
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Password must be at least 6 characters long"),
  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password"), null], "Passwords must match"),
  otp: yup.string().when("$showOtpInput", {
    is: true,
    then: () => yup.string().required("OTP is required").min(6, "OTP must be 6 characters"),
    otherwise: () => yup.string().notRequired(),
  }),
  role: yup.string().required("Role is required"),
  businessDetails: yup.object().shape({
    businessName: yup.string().required("Business / Professional Name is required"),
    registrationNumber: yup.string().required("Registration / Certification Number is required"),
    address: yup.string().required("Full Address is required"),
    city: yup.string().required("City is required"),
    state: yup.string().required("State is required"),
    zipCode: yup.string().required("Zip Code is required"),
    experience: yup.string().required("Experience / Years in field is required"),
    specialization: yup.string().required("Specialization / Expertise is required"),
  }),
  documents: yup.array()
    .min(3, "At least 3 verification documents are required")
    .of(
      yup.object().shape({
        name: yup.string().required(),
        url: yup.string().required(),
      })
    )
    .required("Verification documents are required"),
});

/**
 * useSignUpForm - handles form logic for role-based signup pages.
 * @param {string} predefinedRole - "user" | "owner" | "coach" | "umpire" — pre-selects the role.
 */
const useSignUpForm = (predefinedRole = "user") => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'checking', 'available', 'unavailable'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingUser, setOnboardingUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

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
    resolver: yupResolver(registerSchema),
    context: { showOtpInput },
    defaultValues: {
      role: predefinedRole,
      sportTypes: [],
      businessDetails: {},
      documents: [],
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

    setLoading(true);
    try {
      const email = getValues("email");
      const response = await axiosInstance.post(`${apiPath}/send-otp`, { email });
      toast.success(response.data.message || "OTP sent to your email");
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
    const payload = { ...data, role: predefinedRole };
    try {
      const response = await axiosInstance.post(`${apiPath}/register`, payload);
      const result = response.data;

      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      toast.success(`Welcome to Kridaz, ${data.name}!`);
      navigate("/");
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
      const payload = {
        role: predefinedRole,
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
      const isMissingDetails = !user.phone || !user.gender || !user.location;

      if (isMissingDetails && result.role === "user") {
        setOnboardingUser(user);
        setShowOnboarding(true);
        return;
      }

      navigate(result.role === "owner" ? "/partner" : result.role === "coach" ? "/coach" : result.role === "umpire" ? "/umpire" : "/");
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
    showOnboarding,
    setShowOnboarding,
    onboardingUser,
    currentStep,
    setCurrentStep
  };
};

export default useSignUpForm;

