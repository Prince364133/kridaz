import { PHONE_REGEX } from '@kridaz/shared-constants/validation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosInstance from "@hooks/useAxiosInstance";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const becomeOwnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .email("Enter a valid email")
    .min(1, "Enter your email"),
  phone: z
    .string()
    .regex(PHONE_REGEX, "Enter a valid 10-digit phone number")
    .length(10, "Phone number must be exactly 10 digits long"),
});port { PHONE_REGEX } from '@kridaz/shared-constants/validation';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axiosInstance from "@hooks/useAxiosInstance";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const becomeOwnerSchema = yup.object().shape({
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
    .matches(PHONE_REGEX, "Enter a valid 10-digit phone number")
    .min(10, "Phone number must be at least 10 digits long")
    .max(10, "Phone number must be at most 10 digits long"),
});

const useBecomeOwner = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
     const {
       register,
       handleSubmit,
       formState: { errors },
     } = useForm({
       resolver: zodResolver(becomeOwnerSchema),
     });
       const onSubmit = async (data) => {
         setLoading(true);
         try {
            const response = await axiosInstance.post(
              "/api/owner/auth/ownerRequest", data
            );
            const result = await response.data;
             toast.success(result.message);
             navigate("/")
         } catch (error) {
           if(error.response){
             toast.error(error.response?.data?.message);
           }
         }finally{
           setLoading(false);
         }
       };

       return { register, handleSubmit, errors, onSubmit, loading };
}

export default useBecomeOwner;