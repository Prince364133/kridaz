import { z } from "zod";

export const professionalRoleSchema = z.enum(["COACH", "UMPIRE", "SCORER", "STREAMER"]);

export const professionalProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  role: professionalRoleSchema,
  bio: z.string().max(1000).optional(),
  experienceYears: z.number().nonnegative().default(0),
  specializations: z.array(z.string()).default([]),
  sessionFee: z.number().nonnegative().default(0),
  rating: z.number().min(0).max(5).default(5),
  availabilityStatus: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]).default("AVAILABLE"),
  location: z.string().optional(),
  isVerified: z.boolean().default(false)
});

export const updateProfessionalProfileSchema = z.object({
  bio: z.string().max(1000).optional(),
  experienceYears: z.number().nonnegative().optional(),
  specializations: z.array(z.string()).optional(),
  sessionFee: z.number().nonnegative().optional(),
  availabilityStatus: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]).optional(),
  location: z.string().optional()
});

export type ProfessionalRole = z.infer<typeof professionalRoleSchema>;
export type ProfessionalProfile = z.infer<typeof professionalProfileSchema>;
export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>;
export type Professional = ProfessionalProfile;

