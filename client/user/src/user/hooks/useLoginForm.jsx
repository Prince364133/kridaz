import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axiosInstance from "./useAxiosInstance";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { login } from "@redux/slices/authSlice";
import { useDispatch } from "react-redux";

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Enter your email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/gm,
      "Enter a valid email"
    ),
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Password must be at least 6 characters long"),
  otp: yup.string().when("$showOtpInput", {
    is: true,
    then: () => yup.string().required("OTP is required").min(6, "OTP must be 6 characters"),
    otherwise: () => yup.string().notRequired(),
  }),
});

const useLoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    context: { showOtpInput },
  });

  const handleRoleRedirect = (role) => {
    const searchParams = new URLSearchParams(window.location.search);
    const redirectUrl = searchParams.get("redirect");

    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    switch (role) {
      case "BMSP_ADMIN":
        window.location.href = "/admin";
        break;
      case "VERIFIED_VENUE_OWNER":
      case "VENUE_OWNER":
      case "owner":
        window.location.href = "/partner";
        break;
      case "COACH":
        window.location.href = "/coach";
        break;
      case "UMPIRE":
        window.location.href = "/umpire";
        break;
      default:
        navigate("/", { replace: true });
    }
  };

  const handleLoginStep1 = async () => {
    const isValid = await trigger(["email", "password"]);
    if (!isValid) return;

    setLoading(true);
    try {
      const email = getValues("email");
      const password = getValues("password");
      const response = await axiosInstance.post("/api/user/auth/login-step1", { email, password });
      const result = response.data;

      if (result.token) {
        toast.success(result.message);
        const { token, role } = result;
        dispatch(login({ token, role, user: result.user }));
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        handleRoleRedirect(role);
      } else {
        toast.success(result.message);
        setShowOtpInput(true);
      }
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!showOtpInput) {
      return handleLoginStep1();
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/login", data);
      const result = await response.data;
      toast.success(result.message);
      
      const { token, role } = result;
      dispatch(login({ token, role, user: result.user }));
      
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      handleRoleRedirect(role);
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/google-auth", {
        credential: credentialResponse.credential,
        role: "user",
      });
      const result = await response.data;
      toast.success("Successfully logged in with Google!");
      
      const { token, role } = result;
      dispatch(login({ token, role, user: result.user }));
      
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      handleRoleRedirect(role);
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message);
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
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
  };
};

export default useLoginForm;
