import React, { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useCoachDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    activeTrainees: 0,
    totalSessions: 0,
    liveStreamMins: 0,
    performanceIndex: 0,
    studentProgress: [],
    upcomingSessions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log("DEBUG: Fetching coach dashboard data...");
        const response = await axiosInstance.get("/api/owner/dashboard/coach");
        console.log("DEBUG: Coach dashboard response:", response.data);
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("DEBUG: Error fetching coach dashboard data:", err.response?.data || err.message);
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error };
};

export default useCoachDashboard;
