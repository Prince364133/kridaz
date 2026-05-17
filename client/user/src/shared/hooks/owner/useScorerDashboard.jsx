import React, { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useScorerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    activeMatches: 0,
    matchesScored: 0,
    upcomingMatches: 0,
    officialRating: 0,
    earnings: 0,
    totalRevenue: 0,
    revenueOverTimeRaw: [],
    matchEngagement: [],
    matches: [],
    upcomingAssignments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/owner/dashboard/scorer");
        setDashboardData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching scorer dashboard:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error };
}

export default useScorerDashboard;
