import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAxiosInstance from '../useAxiosInstance';

const useCricketScoring = (matchId) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxiosInstance;

  const fetchMatchStatus = useCallback(async () => {
    try {
      console.log("useCricketScoring: Fetching status for matchId:", matchId);
      const response = await axiosInstance.get(`/api/scoring/status/${matchId}`);
      console.log("useCricketScoring: API Response:", response.data);
      
      let data = response.data.scoring;
      
      // Handle the case where scoring hasn't started yet
      if (!data && response.data.hostedGame) {
        console.log("useCricketScoring: Scoring not started, using hostedGame fallback");
        data = {
          hostedGameId: response.data.hostedGame,
          innings: []
        };
      } else if (data) {
        console.log("useCricketScoring: Scoring session found");
        // Normalize matchId to hostedGameId for UI consistency if needed
        data.hostedGameId = data.matchId;
      }

      setMatchData(data);
      setError(null);
      setLoading(false);
      
      if (data) {
        localStorage.setItem(`scoring_${matchId}`, JSON.stringify(data));
      }
    } catch (err) {
      console.error("useCricketScoring: Error fetching match status:", err);
      console.error("useCricketScoring: Error Response Data:", err.response?.data);
      setError(err.message || 'Failed to fetch match status');
      // Load from local storage if network fails
      const cached = localStorage.getItem(`scoring_${matchId}`);
      if (cached) {
        setMatchData(JSON.parse(cached));
      }
      setLoading(false);
    }
  }, [matchId, axiosInstance]);

  useEffect(() => {
    if (matchId) {
      fetchMatchStatus();
    }
  }, [matchId, fetchMatchStatus]);

  const fetchAnalytics = async () => {
    try {
      const response = await axiosInstance.get(`/api/scoring/analytics/${matchId}`);
      return response.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const recordBall = async (ballData) => {
    try {
      const response = await axiosInstance.put('/api/scoring/update', {
        scoringId: matchData?._id,
        ballData
      });
      
      const data = response.data.scoring;
      if (data) data.hostedGameId = data.matchId;
      setMatchData(data);
      localStorage.setItem(`scoring_${matchId}`, JSON.stringify(data));
      return { success: true };
    } catch (err) {
      console.error("Failed to update score:", err);
      return { success: false, error: err.message };
    }
  };

  const startInnings = async (teamId) => {
    try {
      const response = await axiosInstance.post('/api/scoring/start', {
        matchId: matchId,
        battingTeamId: teamId // Keep as passed (e.g. 'teamA', 'teamB')
      });
      const data = response.data.scoring;
      if (data) data.hostedGameId = data.matchId;
      setMatchData(data);
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to start innings';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const completeMatch = async () => {
    try {
      const response = await axiosInstance.post('/api/scoring/complete', {
        scoringId: matchData?._id
      });
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
    startInnings,
    completeMatch,
    fetchAnalytics,
    refresh: fetchMatchStatus
  };
};

export default useCricketScoring;
