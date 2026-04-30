import { useState, useEffect } from "react";
import axiosInstance from "../useAxiosInstance";

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
        const response = await axiosInstance.get("/api/owner/dashboard/coach");
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching coach dashboard data:", err);
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error };
};

export default useCoachDashboard;
