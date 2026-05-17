import { z } from 'zod';

export const startScoringSchema = z.object({
  body: z.object({
    gameId: z.string().min(1, "Game ID is required"),
  }),
});

export const updateScoreSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    ballData: z.object({
      runs: z.number().int().min(0).max(7),
      isExtra: z.boolean().optional(),
      extraType: z.string().optional(),
      isWicket: z.boolean().optional(),
      wicketType: z.string().optional(),
      batsmanId: z.string().min(1, "Batsman ID is required"),
      bowlerId: z.string().min(1, "Bowler ID is required"),
    }),
  }),
});

export const tossSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    wonByTeamId: z.string().min(1, "Winning team ID is required"),
    decision: z.enum(["BAT", "BOWL"]),
  }),
});
