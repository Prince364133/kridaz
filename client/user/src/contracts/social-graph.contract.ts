import { z } from 'zod';

export const VenueFollowStatusDTOSchema = z.object({
  isFollowing: z.boolean(),
  followersCount: z.number(),
});

export type VenueFollowStatusDTO = z.infer<typeof VenueFollowStatusDTOSchema>;

export const FollowActionResponseDTOSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

export type FollowActionResponseDTO = z.infer<typeof FollowActionResponseDTOSchema>;
