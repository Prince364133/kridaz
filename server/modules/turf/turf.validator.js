import { z } from "zod";

export const turfRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    sportTypes: z.union([z.string(), z.array(z.string())]),
    pricePerHour: z.string().refine((val) => !isNaN(Number(val)), {
      message: "Price per hour must be a number",
    }),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    facilities: z.union([z.string(), z.array(z.string())]).optional(),
  }),
});

export const turfUpdateSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    sportTypes: z.union([z.string(), z.array(z.string())]).optional(),
    pricePerHour: z.string().refine((val) => !isNaN(Number(val)), {
      message: "Price per hour must be a number",
    }).optional(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    facilities: z.union([z.string(), z.array(z.string())]).optional(),
  }),
});
