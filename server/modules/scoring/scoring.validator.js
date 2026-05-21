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

export const setupScoringGameSchema = z.object({
  body: z.object({
    matchName: z.string().min(1, "Match Name is required"),
    format: z.string().optional(),
    ballType: z.string().optional(),
    groundType: z.string().optional(),
    maxMembers: z.number().int().positive().optional(),
    teamAId: z.string().optional(),
    teamBId: z.string().optional(),
    teamAData: z.any().optional(),
    teamBData: z.any().optional(),
    teamAPlayers: z.array(z.any()).optional(),
    teamBPlayers: z.array(z.any()).optional(),
    venueId: z.string().optional(),
    tossWinner: z.string().optional(),
    tossDecision: z.string().optional(),
    scoringPassword: z.string().min(4, "Password must be at least 4 characters").optional(),
    youtubeLiveUrl: z.string().url().optional().or(z.literal('')),
  })
});
