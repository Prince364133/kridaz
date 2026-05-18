/**
 * @file professional.mapper.ts
 * @description Adapts raw backend professional profile responses and payloads to standard Professional contract models.
 * Ensures consistent usage of data fields across the application.
 */

import { Professional } from "../../../contracts/professional.contract";

export class ProfessionalMapper {
  /**
   * Adapts raw professional data from backend schema/API response to client-side Professional model.
   * Handles string conversions, enum check logic, and default numeric values.
   */
  public static toClientModel(raw: any): Professional {
    if (!raw) {
      throw new Error("ProfessionalMapper: Raw professional payload is required");
    }

    return {
      id: raw.id || raw._id || "",
      userId: raw.userId || raw.user?.id || raw.user || "",
      role: ["COACH", "UMPIRE", "SCORER", "STREAMER"].includes(raw.role?.toUpperCase())
        ? (raw.role.toUpperCase() as any)
        : "COACH",
      bio: raw.bio || undefined,
      experienceYears: typeof raw.experienceYears === "number" ? raw.experienceYears : Number(raw.experienceYears || raw.experience || 0),
      specializations: Array.isArray(raw.specializations) ? raw.specializations : (raw.specialization ? [raw.specialization] : []),
      sessionFee: typeof raw.sessionFee === "number" ? raw.sessionFee : parseFloat(raw.sessionFee || raw.fee || 0),
      rating: typeof raw.rating === "number" ? raw.rating : (raw.rating !== undefined ? Number(raw.rating) : 5),
      availabilityStatus: ["AVAILABLE", "BUSY", "UNAVAILABLE"].includes(raw.availabilityStatus?.toUpperCase())
        ? (raw.availabilityStatus.toUpperCase() as any)
        : "AVAILABLE",
      location: raw.location || raw.address || undefined,
      isVerified: raw.isVerified !== undefined ? Boolean(raw.isVerified) : Boolean(raw.verified || false),
    };
  }

  /**
   * Adapts an array of raw professional responses.
   */
  public static toClientList(rawArray: any[]): Professional[] {
    if (!Array.isArray(rawArray)) {
      return [];
    }
    return rawArray.map(raw => this.toClientModel(raw));
  }
}
