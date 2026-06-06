import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {login} from "@redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { auth } from "../../../config/firebase";
import { signInWithPhoneNumber } from "firebase/auth";

const loginSchema = z.object({
  email: z.string().min(1, "Enter your email or phone number").refine((value) => {
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    const isPhone = /^[0-9]{10}$/.test(value);
    return isEmail || isPhone;
  }, { message: "Enter a valid email or 10-digit phone number" }),
  password: z.string().min(1, "Enter your password").min(6, "Password must be at least 6 characters long"),
});

const useLoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sentOtp, setSentOtp] = useState("");
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let timer;
    if (showOtpInput && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpInput, timeLeft]);

  const handleRoleRedirect = (role) => {
    const normalizedRole = role?.toLowerCase();
    const professionalRoles = ["coach", "umpire", "streamer", "scorer", "cheerleader", "commentator"];
    
    if (normalizedRole === "admin" || normalizedRole === "bmsp_admin") {
      dispatch(logout());
      toast.error("Administrators must log in via the Platform Admin Console.");
      navigate("/login");
    } else if (normalizedRole === "owner" || normalizedRole === "venue_owner" || normalizedRole === "venu_owners") {
      navigate("/venue-owner");
    } else if (professionalRoles.includes(normalizedRole)) {
      navigate(`/professional/${normalizedRole}`);
    } else {
      navigate("/");
    }
  };

  const handleLoginStep1 = async () => {
    const isValid = await trigger(["email", "password"]);
    if (!isValid) return;

    setLoading(true);
    setAccountNotFound(false); // Reset on new attempt
    try {
      const { email, password } = getValues();
      const response = await axiosInstance.post("/api/user/auth/login-step1", { email, password });
      const result = response.data;

      if (result.token) {
        dispatch(login({ token: result.token, role: result.role, user: result.user }));
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
        toast.success("Logged in successfully!");
        handleRoleRedirect(result.role);
        return;
      }

      if (result.requiresOtp) {
        // Handle Phone OTP with Firebase
        const isPhone = /^[0-9]{10}$/.test(email) || email.startsWith('+');
        if (isPhone) {
          const phoneNum = email.startsWith('+') ? email : `+91${email}`;
          if (window.recaptchaVerifier) {
            try {
              const confirmationResult = await signInWithPhoneNumber(auth, phoneNum, window.recaptchaVerifier);
              window.confirmationResult = confirmationResult;
              toast.success("OTP sent to your phone");
            } catch (fbError) {
              console.error("Firebase send error:", fbError);
              toast.error(fbError.message || "Failed to send SMS via Firebase");
              setLoading(false);
              return;
            }
          } else {
            toast.error("Recaptcha not initialized");
            setLoading(false);
            return;
          }
        } else {
          // Email OTP
          if (result.otp) {
            setSentOtp(result.otp);
            if (Capacitor.isNativePlatform()) {
              toast((t) => (
                <div className="flex flex-col gap-1 p-1">
                  <div className="font-bold text-sm text-black flex items-center gap-1">
                    🔔 Kridaz Notification
                  </div>
                  <div className="text-xs text-gray-600">
                    Your verification code is: <strong className="text-black text-sm">{result.otp}</strong>
                  </div>
                </div>
              ), { position: 'top-center', duration: 8000 });
            }
          }
          toast.success("OTP sent to your email");
        }

        setShowOtpInput(true);
        setLoading(false);
        setTimeLeft(60);
        return;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed";
      
      if (errorMessage.toLowerCase().includes("account not found")) {
        setAccountNotFound(true);
        toast.error("Account not found. Please sign up!");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (data) => {
    setLoading(true);
    let firebaseIdToken = null;
    try {
      const { email } = getValues();
      const isPhone = /^[0-9]{10}$/.test(email) || email.startsWith('+');

      if (isPhone && window.confirmationResult) {
        try {
          const result = await window.confirmationResult.confirm(data.otp);
          firebaseIdToken = await result.user.getIdToken();
        } catch (err) {
          console.error("Firebase OTP confirmation error:", err);
          toast.error("Invalid verification code");
          setLoading(false);
          return;
        }
      }

      const payload = { 
        email, 
        otp: firebaseIdToken || data.otp, 
        password: data.password 
      };

      const response = await axiosInstance.post("/api/user/auth/login", payload);
      const result = response.data;
      
      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
      toast.success(result.message);
      
      handleRoleRedirect(result.role);
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!showOtpInput) {
      return handleLoginStep1();
    }
    return handleVerifyOtp(data);
  };

  const handleGoogleSuccess = async (googleResponse) => {
    setGoogleLoading(true);
    try {
      const payload = {
        role: "user",
      };

      if (googleResponse.credential) {
        payload.credential = googleResponse.credential;
      } else if (googleResponse.access_token) {
        payload.accessToken = googleResponse.access_token;
      }

      const response = await axiosInstance.post("/api/user/auth/google-auth", payload);
      const result = response.data;
      
      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
      toast.success("Logged in with Google!");
      
      handleRoleRedirect(result.role);
    } catch (error) {
      toast.error(error.response?.data?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
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
    googleLoading,
    showOtpInput,
    sentOtp,
    handleGoogleSuccess,
    handleGoogleError,
    accountNotFound,
    setAccountNotFound,
    timeLeft,
    handleSendOtp: handleLoginStep1
  };
};

export default useLoginForm;

