import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState, useEffect } from "react";
import axiosInstance from "./useAxiosInstance";
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
    const fieldsToValidate = ["name", "username", "email", "phone", "gender", "location", "password", "confirmPassword", "sportTypes"];
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
    if (!showOtpInput) {
      return handleSendOtp();
    }

    setLoading(true);
    // Always use the predefined role, ignoring any form tampering
    const payload = { ...data, role: predefinedRole };
    try {
      const response = await axiosInstance.post(`${apiPath}/register`, payload);
      const result = response.data;

      // Log in the user after successful registration
      dispatch(login({ token: result.token, role: result.role }));
      toast.success(`Welcome to TurfSpot, ${data.name}!`);
      
      const normalizedRole = result.role?.toLowerCase();
      if (normalizedRole === "owner") {
        navigate("/partner");
      } else if (normalizedRole === "coach") {
        navigate("/coach");
      } else if (normalizedRole === "umpire") {
        navigate("/umpire");
      } else {
        navigate("/");
      }
    } catch (error) {
      if (error.response) {
        toast.error(`${error.response.data.message || "Registration failed"}`);
      } else {
        toast.error(`Error: ${error.message}`);
      }
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
      toast.success("Successfully logged in with Google!");
      dispatch(login({ token: result.token, role: result.role }));
      
      if (result.role === "owner") {
        navigate("/partner");
      } else if (result.role === "coach") {
        navigate("/coach");
      } else if (result.role === "umpire") {
        navigate("/umpire");
      } else {
        navigate("/");
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message || "Google authentication failed");
      } else {
        toast.error("Google authentication failed");
      }
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
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    usernameStatus
  };
};

export default useSignUpForm;

