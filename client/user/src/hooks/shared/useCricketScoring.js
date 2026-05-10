import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAxiosInstance from '../useAxiosInstance';

const useCricketScoring = (matchId) => {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const axiosInstance = useAxiosInstance();

  const fetchMatchStatus = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/scoring/status/${matchId}`);
      setMatchData(response.data.scoring);
      // Persist to local storage for offline recovery
      localStorage.setItem(`scoring_${matchId}`, JSON.stringify(response.data.scoring));
      setLoading(false);
    } catch (err) {
      setError(err.message);
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
      const response = await axiosInstance.get(`/scoring/analytics/${matchId}`);
      return response.data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const recordBall = async (ballData) => {
    try {
      const response = await axiosInstance.put('/scoring/update', {
        scoringId: matchData?._id,
        ballData
      });
      
      setMatchData(response.data.scoring);
      localStorage.setItem(`scoring_${matchId}`, JSON.stringify(response.data.scoring));
      return { success: true };
    } catch (err) {
      console.error("Failed to update score:", err);
      return { success: false, error: err.message };
    }
  };

  const startInnings = async (teamId) => {
    try {
      const response = await axiosInstance.post('/scoring/start', {
        matchId: matchId,
        battingTeam: teamId
      });
      setMatchData(response.data.scoring);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const completeMatch = async () => {
    try {
      const response = await axiosInstance.post('/scoring/complete', {
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
