import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

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
 console.log("DEBUG: Fetching umpire dashboard data...");
 const response = await axiosInstance.get("/api/owner/dashboard/umpire");
 console.log("DEBUG: Umpire dashboard response:", response.data);
 setDashboardData(response.data);
 setLoading(false);
 } catch (err) {
 console.error("DEBUG: Error fetching umpire dashboard data:", err.response?.data || err.message);
 setError("Failed to fetch dashboard data");
 setLoading(false);
 }
 };

 fetchDashboardData();
 }, []);

 return { dashboardData, loading, error };
};

export default useUmpireDashboard;
