import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";

const useTurfDetails = (turfId) => {
  const [turf, setTurf] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetailsAndReviews = async () => {
    if (!turfId) return;
    setLoading(true);
    setError(null);
    try {
      const [turfRes, reviewsRes] = await Promise.allSettled([
        axiosInstance.get(`/api/user/turf/details/${turfId}`),
        axiosInstance.get(`/api/user/review/${turfId}`)
      ]);

      if (turfRes.status === "fulfilled") {
        setTurf(turfRes.value.data.turf);
      } else {
        console.error("Error fetching turf details:", turfRes.reason);
        setError("Failed to fetch turf details.");
      }

      if (reviewsRes.status === "fulfilled") {
        setReviews(reviewsRes.value.data.reviews || []);
      } else {
        console.error("Error fetching reviews:", reviewsRes.reason);
      }
    } catch (err) {
      console.error("Error in useTurfDetails:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailsAndReviews();
  }, [turfId]);

  return { turf, reviews, loading, error, refetch: fetchDetailsAndReviews };
};

export default useTurfDetails;
