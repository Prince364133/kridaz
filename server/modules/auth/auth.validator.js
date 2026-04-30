import { z } from "zod";

export const userRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

export const userLoginSchema = z.object({
  body: z.object({
    email: z.string().email("Email is invalid"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const ownerRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Email is invalid"),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm Password is required"),
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
  }),
});
