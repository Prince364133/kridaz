import { useState, useEffect, useCallback } from 'react';
import useAxiosInstance from '@hooks/useAxiosInstance';

/**
 * Central hook for all cricket scoring operations.
 * Exposes: matchData, recordBall, setPlayers, setToss, undoBall,
 *          startInnings, completeMatch, fetchAnalytics, refresh
 */
const useCricketScoring = (matchId) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxiosInstance;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const normalise = (scoring) => {
    if (!scoring) return null;
    return { ...scoring, hostedGameId: scoring.matchId };
  };

  const updateMatchData = (scoringResponseData) => {
    setMatchData(prev => {
      const data = normalise(scoringResponseData);
      if (data && prev && typeof prev.hostedGameId === 'object') {
        data.hostedGameId = prev.hostedGameId;
      }
      cache(data);
      return data;
    });
  };

  const cache = (data) => {
    if (data) localStorage.setItem(`scoring_${matchId}`, JSON.stringify(data));
  };

  const getHeaders = () => {
    const scorerToken = localStorage.getItem(`scorer_token_${matchId}`);
    return scorerToken ? { Authorization: `Bearer ${scorerToken}` } : {};
  };

  // ── Status fetch ─────────────────────────────────────────────────────────────
  const fetchMatchStatus = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/scoring/status/${matchId}`, { headers: getHeaders() });
      let data = normalise(response.data.scoring);

      if (data) {
        if (response.data.hostedGame) {
          data.hostedGameId = response.data.hostedGame;
        }
      } else if (response.data.hostedGame) {
        data = { hostedGameId: response.data.hostedGame, innings: [] };
      }

      setMatchData(data);
      setError(null);
      cache(data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('UNAUTHORIZED');
      } else {
        setError(err.message || 'Failed to fetch match status');
      }
      const cached = localStorage.getItem(`scoring_${matchId}`);
      if (cached) setMatchData(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (matchId) fetchMatchStatus();
  }, [matchId, fetchMatchStatus]);

  // ── Analytics ────────────────────────────────────────────────────────────────
  const fetchAnalytics = async () => {
    try {
      const response = await axiosInstance.get(`/api/scoring/analytics/${matchId}`, { headers: getHeaders() });
      return response.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ── Record ball (P1.3, P1.4, P1.5 aware) ────────────────────────────────────
  /**
   * @param {Object} ballData
   * ballData shape: {
   *   runs: number,
   *   isExtra: boolean,
   *   extraType: "NONE"|"WIDE"|"NO_BALL"|"BYE"|"LEG_BYE",
   *   isBoundary: boolean,           // true = hit 4 or 6 (not running)
   *   isWicket: boolean,
   *   wicketType: string|null,       // BOWLED|CAUGHT|LBW|... (P1.1)
   *   fielderId: string|null,        // for CAUGHT/STUMPED/RUN_OUT
   *   nextBatterId: string|null,     // next batsman after wicket
   * }
   * Returns { success, overComplete, commentary, liveData }
   */
  const recordBall = async (ballData) => {
    if (!matchData) return { success: false, error: "No match data loaded" };

    const previousData = matchData;

    // 1. Create optimistic clone of matchData
    try {
      const cloned = JSON.parse(JSON.stringify(matchData));
      const inningsIndex = cloned.currentInningsIndex ?? 0;
      const innings = cloned.innings || [];
      const current = innings[inningsIndex];

      if (current) {
        const runs = ballData.runs ?? 0;
        const isWide = ballData.extraType === 'WIDE';
        const isNoBall = ballData.extraType === 'NO_BALL';
        const isBye = ballData.extraType === 'BYE';
        const isLegBye = ballData.extraType === 'LEG_BYE';
        const isLegalBall = !isWide && !isNoBall;

        // Update innings runs & wickets
        current.totalRuns = (current.totalRuns ?? 0) + runs;
        if (isLegalBall) {
          current.totalBalls = (current.totalBalls ?? 0) + 1;
        }
        if (ballData.isWicket) {
          current.totalWickets = (current.totalWickets ?? 0) + 1;
        }

        // Update extras object
        if (!current.extras) {
          current.extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
        }
        if (isWide) current.extras.wides = (current.extras.wides ?? 0) + runs;
        else if (isNoBall) current.extras.noBalls = (current.extras.noBalls ?? 0) + 1;
        else if (isBye) current.extras.byes = (current.extras.byes ?? 0) + runs;
        else if (isLegBye) current.extras.legByes = (current.extras.legByes ?? 0) + runs;

        // Player statistics update
        const strikerId = cloned.strikerId;
        const bowlerId = cloned.bowlerId;

        if (cloned.playerStats) {
          // Striker stats
          if (strikerId) {
            let sStat = cloned.playerStats.find(s => s.userId === strikerId || s.userId?.toString() === strikerId?.toString());
            if (!sStat) {
              sStat = { userId: strikerId, battingRuns: 0, battingBalls: 0, battingFours: 0, battingSixes: 0 };
              cloned.playerStats.push(sStat);
            }
            sStat.battingRuns = (sStat.battingRuns ?? 0) + ((!isWide && !isBye && !isLegBye) ? runs : 0);
            sStat.battingBalls = (sStat.battingBalls ?? 0) + (!isWide ? 1 : 0);
            if (ballData.isBoundary && runs === 4) sStat.battingFours = (sStat.battingFours ?? 0) + 1;
            if (ballData.isBoundary && runs === 6) sStat.battingSixes = (sStat.battingSixes ?? 0) + 1;
          }

          // Bowler stats
          if (bowlerId) {
            let bStat = cloned.playerStats.find(s => s.userId === bowlerId || s.userId?.toString() === bowlerId?.toString());
            if (!bStat) {
              bStat = { userId: bowlerId, bowlingRuns: 0, bowlingBalls: 0, bowlingWickets: 0 };
              cloned.playerStats.push(bStat);
            }
            bStat.bowlingRuns = (bStat.bowlingRuns ?? 0) + ((!isBye && !isLegBye) ? runs : 0);
            if (isLegalBall) bStat.bowlingBalls = (bStat.bowlingBalls ?? 0) + 1;
            if (ballData.isWicket && !["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING", "TIMED_OUT"].includes(ballData.wicketType)) {
              bStat.bowlingWickets = (bStat.bowlingWickets ?? 0) + 1;
            }
          }
        }

        // Strike rotation projection
        let newStrikerId = cloned.strikerId;
        let newNonStrikerId = cloned.nonStrikerId;
        const ballInOver = (current.totalBalls - 1) % 6; // current.totalBalls is already incremented
        const isOverComplete = isLegalBall && (ballInOver === 5);

        if (!ballData.isWicket && !isWide) {
          if (runs % 2 !== 0) {
            [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
          }
        }
        if (isOverComplete && !ballData.isWicket) {
          [newStrikerId, newNonStrikerId] = [newNonStrikerId, newStrikerId];
        }
        if (ballData.isWicket && ballData.nextBatterId) {
          newStrikerId = ballData.nextBatterId;
        }

        cloned.strikerId = newStrikerId;
        cloned.nonStrikerId = newNonStrikerId;

        // Push temporary ball to timeline if it exists
        if (cloned.timeline) {
          cloned.timeline.unshift({
            id: 'temp-' + Date.now(),
            runs,
            isExtra: ballData.isExtra || false,
            extraType: ballData.extraType || "NONE",
            isBoundary: ballData.isBoundary || false,
            isWicket: ballData.isWicket || false,
            wicketType: ballData.wicketType || null,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Update state optimistically
      setMatchData(cloned);
    } catch (e) {
      console.warn("Optimistic state projection failed:", e);
    }

    // 2. Perform background HTTP request
    try {
      const response = await axiosInstance.put('/api/scoring/update', {
        scoringId: matchData?.id || matchData?._id,
        ballData,
      }, { headers: getHeaders() });
      
      updateMatchData(response.data.scoring);
      
      return {
        success: true,
        overComplete: response.data.overComplete,
        commentary: response.data.commentary,
        liveData: response.data.liveData,
      };
    } catch (err) {
      // 3. Rollback on failure
      setMatchData(previousData);
      const errMsg = err.response?.data?.message || err.message || 'Scoring sync failed';
      return { success: false, error: errMsg };
    }
  };

  // ── Set players (P1.2 — opening batsmen + bowler, or swap after wicket/over) ──
  /**
   * @param {{ strikerId?, nonStrikerId?, bowlerId? }} players
   */
  const setPlayers = async (players) => {
    try {
      const response = await axiosInstance.post('/api/scoring/set-players', {
        scoringId: matchData?.id || matchData?._id,
        ...players,
      }, { headers: getHeaders() });
      updateMatchData(response.data.scoring);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // ── Set toss (P2.1) ───────────────────────────────────────────────────────────
  const setToss = async ({ winnerTeam, decision }) => {
    try {
      const response = await axiosInstance.post('/api/scoring/toss', {
        scoringId: matchData?.id || matchData?._id,
        wonByTeamId: winnerTeam,
        decision,
      }, { headers: getHeaders() });
      setMatchData(prev => ({ ...prev, toss: response.data.toss }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // ── Undo last ball (P1.6) ────────────────────────────────────────────────────
  const undoBall = async () => {
    try {
      const response = await axiosInstance.post('/api/scoring/undo', {
        scoringId: matchData?.id || matchData?._id
      }, {
        headers: getHeaders(),
      });
      updateMatchData(response.data.scoring);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  // ── Start innings ─────────────────────────────────────────────────────────────
  const startInnings = async (teamId) => {
    try {
      const response = await axiosInstance.post('/api/scoring/start', {
        matchId,
        battingTeamId: teamId,
      }, { headers: getHeaders() });
      updateMatchData(response.data.scoring);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to start innings';
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // ── Complete match ────────────────────────────────────────────────────────────
  const completeMatch = async () => {
    try {
      const response = await axiosInstance.post('/api/scoring/complete', {
        scoringId: matchData?.id || matchData?._id,
      }, { headers: getHeaders() });
      if (response.data.success) {
        setMatchData(prev => ({ ...prev, status: 'COMPLETED' }));
        return { success: true, data: response.data };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return {
    matchData,
    loading,
    error,
    recordBall,
    setPlayers,
    setToss,
    undoBall,
    startInnings,
    completeMatch,
    fetchAnalytics,
    refresh: fetchMatchStatus,
  };
};

export default useCricketScoring;
