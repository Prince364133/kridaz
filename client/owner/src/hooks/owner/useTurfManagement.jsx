import { useState } from "react";
import axiosInstance from "../useAxiosInstance";

const useTurfManagement = () => {
  const [turfs, setTurfs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTurfs = async () => {
    setIsLoading(true);
    try {
      // Replace this with your actual API call
      const response = await axiosInstance.get("/api/owner/turf/all");
      setTurfs(response.data);
    } catch (err) {
      setError("Failed to fetch turfs");
    } finally {
      setIsLoading(false);
    }
  };

  const addTurf = async (newTurf) => {
    try {
      const response = await axiosInstance.post("/api/owner/turf/register", newTurf);
      setTurfs((prev) => [...prev, response.data]);
    } catch (err) {
      setError("Failed to add turf");
    }
  };

  const editTurf = async (updatedTurf, turfId) => {
    try {
      const response = await axiosInstance.put(
        `/api/owner/turf/${turfId}`,
        updatedTurf
      );
      setTurfs(response.data.allTurfs);
    } catch (error) {
      console.log(error, "error in edit turf");
    }
  };

  const deleteTurf = async (id) => {
    try {
      await axiosInstance.delete(`/api/owner/turf/${id}`);
      setTurfs((prev) => prev.filter((turf) => turf._id !== id));
    } catch (err) {
      setError("Failed to delete turf");
    }
  };

  return {
    turfs,
    isLoading,
    error,
    fetchTurfs,
    addTurf,
    editTurf,
    deleteTurf,
  };
};

export default useTurfManagement;
