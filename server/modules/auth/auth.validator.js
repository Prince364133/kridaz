import { z } from "zod";

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email("Email is invalid"),
  }),
});

export const userRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    phone: z.string().min(1, "Phone number is required"),
    gender: z.string().min(1, "Gender is required"),
    location: z.string().min(1, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    otp: z.string().min(6, "OTP must be 6 characters"),
    sportTypes: z.array(z.string()).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export const loginStep1Schema = z.object({
  body: z.object({
    email: z.string().email("Email is invalid"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const userLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Email is invalid"),
    password: z.string().min(1, "Password is required"),
    otp: z.string().min(6, "OTP must be 6 characters").optional(),
  }),
});

export const ownerRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    phone: z.string().min(1, "Phone number is required"),
    gender: z.string().min(1, "Gender is required"),
    location: z.string().min(1, "Location is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
    otp: z.string().min(6, "OTP must be 6 characters"),
    role: z.enum(["owner", "coach", "umpire"]).optional(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export const ownerRequestSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    role: z.string().optional(),
    businessDetails: z.object({}).passthrough().optional(),
    documents: z.array(z.any()).optional(),
    username: z.string().optional(),
    gender: z.string().optional(),
    location: z.string().optional(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  }),
});
