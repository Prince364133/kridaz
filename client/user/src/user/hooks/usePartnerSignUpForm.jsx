import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useState } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { login } from "@redux/slices/authSlice";

const registerSchema = yup.object().shape({
  name: yup.string().required("Name is required"),
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
    .matches(/^[0-9]{10}$/, "Enter a valid 10-digit phone number")
    .min(10, "Phone number must be at least 10 digits long")
    .max(10, "Phone number must be at most 10 digits long"),
  password: yup
    .string()
    .required("Enter your password")
    .min(6, "Password must be at least 6 characters long"),
  confirmPassword: yup
    .string()
    .required("Confirm your password")
    .oneOf([yup.ref("password"), null], "Passwords must match"),
  role: yup.string().required("Role is required"),
});

const usePartnerSignUpForm = (predefinedRole = "owner") => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      role: predefinedRole,
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const payload = { ...data, role: predefinedRole };
    try {
      const response = await axiosInstance.post("/api/owner/auth/register", payload);
      const result = response.data;

      if (predefinedRole === "owner") {
        dispatch(login({ token: result.token, role: result.role }));
        toast.success("Welcome to Kridaz!");
        window.location.href = "/partner";
      } else {
        const waitlistNumber = result.waitlistNumber || Math.floor(Math.random() * 50) + 1;
        toast.success("You're on the waitlist!");
        navigate("/waitlist-success", {
          state: {
            waitlistNumber,
            role: predefinedRole,
            name: data.name,
          },
        });
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

  return { register, handleSubmit, errors, onSubmit, loading, getValues };
};

export default usePartnerSignUpForm;
