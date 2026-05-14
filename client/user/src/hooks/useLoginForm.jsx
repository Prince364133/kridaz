import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import {login} from "../redux/slices/authSlice";
import { useNavigate } from "react-router-dom";

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Enter your email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Enter a valid email"
    ),
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Password must be at least 6 characters long"),
});

const useLoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const handleRoleRedirect = (role) => {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === "bmsp_admin" || normalizedRole === "admin") {
      navigate("/admin");
    } else if (normalizedRole === "owner") {
      navigate("/partner");
    } else if (normalizedRole === "coach") {
      navigate("/coach");
    } else if (normalizedRole === "umpire") {
      navigate("/umpire");
    } else if (normalizedRole === "scorer") {
      navigate("/scorer");
    } else if (normalizedRole === "streamer") {
      navigate("/streamer");
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
        localStorage.setItem("token", result.token);
        toast.success("Logged in successfully!");
        navigate(result.user.role === "admin" ? "/admin/dashboard" : "/");
        return;
      }

      if (result.requiresOtp) {
        setShowOtpInput(true);
        setLoading(false);
        toast.success("OTP sent to your email and WhatsApp");
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
    try {
      const { email } = getValues();
      const response = await axiosInstance.post("/api/user/auth/login", { email, otp: data.otp, password: data.password });
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
    setLoading(true);
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
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    accountNotFound,
    setAccountNotFound
  };
};

export default useLoginForm;
