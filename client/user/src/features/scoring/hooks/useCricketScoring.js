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
      return { success: false, error: err.response?.data?.message || err.message };
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
