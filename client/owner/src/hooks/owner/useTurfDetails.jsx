import { useState, useEffect } from "react";
import axios from "axios";
import axiosInstance from "../useAxiosInstance";

const useTurfDetails = (turfId) => {
  const [turfData, setTurfData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTurfDetails = async () => {
    if (!turfId) return;
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/api/owner/turf/${turfId}/details`);
      setTurfData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching turf details:", err);
      const msg = err.response?.data ? JSON.stringify(err.response.data) : (err.response?.data?.message || err.message || "Failed to fetch turf details");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfDetails();
  }, [turfId]);

  return { turfData, isLoading, error, refetch: fetchTurfDetails };
};

export default useTurfDetails;
