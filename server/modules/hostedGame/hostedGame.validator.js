import { z } from "zod";

export const createHostedGameSchema = z.object({
  body: z.object({
    gameType: z.string().min(1, "Game type is required"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    perPlayerCharge: z.number().min(0, "Charge must be non-negative"),
    playerCount: z.number().int().min(2, "Player count must be at least 2").optional(),
    gameMode: z.enum(["PROFESSIONAL", "FRIENDLY"]).optional(),
    groundId: z.string().optional(),
    umpireId: z.string().optional(),
    streamerId: z.string().optional(),
  }),
});

export const joinGameRequestSchema = z.object({
  params: z.object({
    gameId: z.string().min(1, "Game ID is required"),
  }),
  body: z.object({
    role: z.string().min(1, "Role is required"),
  }),
});
