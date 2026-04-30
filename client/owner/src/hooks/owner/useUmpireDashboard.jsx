import { useState, useEffect } from "react";
import axiosInstance from "../useAxiosInstance";

const useUmpireDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    matchesOfficiated: 0,
    upcomingMatches: 0,
    officialRating: 0,
    earnings: 0,
    matchEngagement: [],
    upcomingAssignments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/api/owner/dashboard/umpire");
        setDashboardData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching umpire dashboard data:", err);
        setError("Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error };
};

export default useUmpireDashboard;
