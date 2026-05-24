import { z } from 'zod';

export const startScoringSchema = z.object({
  body: z.object({
    gameId: z.string().min(1).optional(),
    matchId: z.string().min(1).optional(),
    battingTeamId: z.string().min(1).optional(),
    battingTeam: z.string().min(1).optional(),
  }).refine((data) => data.gameId || data.matchId, {
    message: "Either gameId or matchId is required",
    path: ["gameId"],
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
    venueId: z.string().optional().nullable(),
    customVenue: z.string().optional().nullable(),
    sportType: z.string().optional(),
    professionals: z.array(z.any()).optional(),
    customProfessionals: z.array(z.any()).optional(),
    tossWinner: z.string().optional(),
    tossDecision: z.string().optional(),
    scoringPassword: z.string().min(4, "Password must be at least 4 characters").optional().nullable().or(z.literal('')),
    youtubeLiveUrl: z.string().url().optional().nullable().or(z.literal('')),
    customDays: z.number().int().min(1).max(10).optional(),
    customOversPerDay: z.number().int().min(1).max(100).optional(),
  })
});

export const undoLastBallSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
  }),
});

export const completeMatchSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
  }),
});

export const startNextInningsSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    battingTeamId: z.string().min(1, "Batting Team ID is required"),
  }),
});

export const setPlayersSchema = z.object({
  body: z.object({
    scoringId: z.string().min(1, "Scoring ID is required"),
    strikerId: z.string().min(1).optional().nullable(),
    nonStrikerId: z.string().min(1).optional().nullable(),
    bowlerId: z.string().min(1).optional().nullable(),
    wicketKeeperId: z.string().min(1).optional().nullable(),
  }),
});
