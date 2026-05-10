import HostedGame from "../../models/hostedGame.model.js";
import CricketScoring from "../../models/cricketScoring.model.js";
import User from "../../models/user.model.js";
import { generateShortId } from "./scoring.utils.js";
import { aggregatePlayerStats } from "./scoring.service.js";

/**
 * Complete a match and aggregate stats
 */
export const completeMatch = async (req, res) => {
  try {
    const { scoringId } = req.body;
    const scoring = await CricketScoring.findById(scoringId);
    
    if (!scoring) {
      return res.status(404).json({ success: false, message: "Scoring session not found" });
    }

    scoring.status = "COMPLETED";
    await scoring.save();

    const match = await HostedGame.findById(scoring.matchId);
    if (match) {
      match.scoringStatus = "COMPLETED";
      match.status = "COMPLETED";
      await match.save();
    }

    // Trigger aggregation
    const earnedBadges = await aggregatePlayerStats(scoring);

    res.status(200).json({ 
      success: true, 
      message: "Match completed and stats aggregated",
      earnedBadges
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Find a match by its short ID
 */
export const searchMatch = async (req, res) => {
  try {
    const { shortId } = req.params;
    const match = await HostedGame.findOne({ shortId })
      .populate("host", "name profilePicture")
      .populate("ground", "name location city");

    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    res.status(200).json({ success: true, match });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Initialize a scoring session
 */
export const startScoring = async (req, res) => {
  try {
    const { matchId } = req.body;
    const umpireId = req.user._id;

    const match = await HostedGame.findById(matchId);
    if (!match) {
      return res.status(404).json({ success: false, message: "Match not found" });
    }

    // Check if scoring already exists
    let scoring = await CricketScoring.findOne({ matchId });
    if (!scoring) {
      scoring = new CricketScoring({
        matchId,
        umpire: umpireId,
        innings: [
          { battingTeam: "teamA", totalRuns: 0, totalWickets: 0, totalBalls: 0 },
          { battingTeam: "teamB", totalRuns: 0, totalWickets: 0, totalBalls: 0 }
        ]
      });
      await scoring.save();
      
      match.scoringStatus = "IN_PROGRESS";
      await match.save();
    }

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update score (Ball-by-ball)
 */
export const updateScore = async (req, res) => {
  try {
    const { scoringId, ballData } = req.body;
    
    const scoring = await CricketScoring.findById(scoringId);
    if (!scoring) {
      return res.status(404).json({ success: false, message: "Scoring session not found" });
    }

    // Add ball to timeline
    scoring.timeline.push(ballData);
    
    // Update basic stats (simplified for now, full logic will be in Phase 2/3)
    const currentInnings = scoring.innings[scoring.currentInningsIndex];
    if (!ballData.isExtra || ballData.extraType !== "WIDE") {
       currentInnings.totalBalls += 1;
    }
    
    currentInnings.totalRuns += ballData.runs;
    if (ballData.isWicket) {
      currentInnings.totalWickets += 1;
    }

    await scoring.save();
    res.status(200).json({ success: true, scoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current match status
 */
export const getMatchStatus = async (req, res) => {
  try {
    const { matchId } = req.params;
    const scoring = await CricketScoring.findOne({ matchId })
      .populate("matchId")
      .populate("umpire", "name")
      .populate("battingStats.user", "name profilePicture")
      .populate("bowlingStats.user", "name profilePicture");

    if (!scoring) {
      return res.status(404).json({ success: false, message: "No active scoring for this match" });
    }

    res.status(200).json({ success: true, scoring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get detailed post-match analytics
 */
export const getMatchAnalytics = async (req, res) => {
  try {
    const { matchId } = req.params;
    const scoring = await CricketScoring.findOne({ matchId })
      .populate("matchId")
      .populate("umpire", "name")
      .populate("battingStats.user", "name profilePicture")
      .populate("bowlingStats.user", "name profilePicture")
      .populate("timeline.batter", "name")
      .populate("timeline.bowler", "name")
      .populate("timeline.fielder", "name");

    if (!scoring) {
      return res.status(404).json({ success: false, message: "Match data not found" });
    }

    // Calculate MVP based on simple point system
    // Runs: 1pt, Wicket: 25pts, Catch: 10pts, 6s: 2pts extra
    const playerPoints = new Map();

    scoring.battingStats.forEach(s => {
      const userId = s.user?._id?.toString();
      if (!userId) return;
      const pts = (s.runs || 0) + (s.sixes * 2) + (s.fours * 1);
      const current = playerPoints.get(userId) || { name: s.user.name, points: 0, profilePicture: s.user.profilePicture };
      current.points += pts;
      playerPoints.set(userId, current);
    });

    scoring.bowlingStats.forEach(s => {
      const userId = s.user?._id?.toString();
      if (!userId) return;
      const pts = (s.wickets || 0) * 25;
      const current = playerPoints.get(userId) || { name: s.user.name, points: 0, profilePicture: s.user.profilePicture };
      current.points += pts;
      playerPoints.set(userId, current);
    });

    // Add fielding points from timeline
    scoring.timeline.forEach(ball => {
      if (ball.isWicket && ball.fielder) {
        const userId = ball.fielder._id?.toString();
        if (!userId) return;
        const current = playerPoints.get(userId) || { name: ball.fielder.name, points: 0 };
        current.points += 10;
        playerPoints.set(userId, current);
      }
    });

    const sortedPlayers = Array.from(playerPoints.values()).sort((a, b) => b.points - a.points);
    const mvp = sortedPlayers[0];

    res.status(200).json({ 
      success: true, 
      scoring,
      analytics: {
        mvp,
        topPerformers: sortedPlayers.slice(0, 3),
        totalFours: scoring.battingStats.reduce((acc, curr) => acc + (curr.fours || 0), 0),
        totalSixes: scoring.battingStats.reduce((acc, curr) => acc + (curr.sixes || 0), 0),
        runRate: scoring.innings[0]?.totalBalls > 0 
          ? (scoring.innings[0].totalRuns / (scoring.innings[0].totalBalls / 6)).toFixed(2) 
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
