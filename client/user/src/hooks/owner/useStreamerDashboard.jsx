import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useStreamerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    matchesStreamed: 0,
    upcomingStreams: 0,
    officialRating: 0,
    earnings: 0,
    matchEngagement: [],
    upcomingAssignments: [],
    matches: [],
    upgradeRequested: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("DEBUG: Fetching streamer dashboard data...");
      const response = await axiosInstance.get("/api/owner/dashboard/streamer");
      console.log("DEBUG: Streamer dashboard response:", response.data);
      setDashboardData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("DEBUG: Error fetching streamer dashboard data:", err.response?.data || err.message);
      setError("Failed to fetch dashboard data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error, refreshData: fetchDashboardData };
};

export default useStreamerDashboard;
