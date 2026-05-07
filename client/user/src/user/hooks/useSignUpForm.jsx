import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axiosInstance from "@hooks/useAxiosInstance";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "@redux/slices/authSlice";

const registerSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
  username: yup
    .string()
    .matches(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores")
    .min(3, "Username must be at least 3 characters"),
  email: yup
    .string()
    .required("Enter your email")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/gm,
      "Enter a valid email"
    ),
  phone: yup.string().required("Enter your phone number"),
  gender: yup.string().required("Select your gender"),
  location: yup.string().required("Enter your location"),
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Password must be at least 6 characters long"),
  confirmPassword: yup
    .string()
    .required("Enter your password")
    .oneOf([yup.ref("password"), null], "Passwords must match"),
  otp: yup.string().when("$showOtpInput", {
    is: true,
    then: () => yup.string().required("OTP is required").min(6, "OTP must be 6 characters"),
    otherwise: () => yup.string().notRequired(),
  }),
  sportTypes: yup.array().of(yup.string()).min(1, "Select at least one sport"),
});

const useSignUpForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    context: { showOtpInput },
    defaultValues: {
      sportTypes: []
    }
  });

  const handleSendOtp = async () => {
    const isValid = await trigger(["name", "username", "email", "phone", "gender", "location", "password", "confirmPassword", "sportTypes"]);
    if (!isValid) return;

    setLoading(true);
    try {
      const email = getValues("email");
      const response = await axiosInstance.post("/api/user/auth/send-otp", { email });
      toast.success(response.data.message);
      setShowOtpInput(true);
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
      return handleSendOtp();
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/register", {
        ...data,
        role: "user",
      });
      const result = await response.data;
      toast.success(result.message);
      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
      navigate("/", { replace: true });
    } catch (error) {
      if (error.response) {
        toast.error(error.response?.data?.message);
      }
    } finally {
      setLoading(false);
    }
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
      const result = await response.data;
      toast.success("Successfully logged in with Google!");
      dispatch(login({ token: result.token, role: result.role, user: result.user }));
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${result.token}`;
      navigate("/", { replace: true });
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
    setValue,
    watch,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
  };
};

export default useSignUpForm;
