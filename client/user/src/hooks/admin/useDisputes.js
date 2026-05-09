import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/support/disputes");
      setDisputes(response.data.disputes);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch disputes");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id, action, message) => {
    setProcessingId(id);
    try {
      await axiosInstance.put(`/api/admin/support/disputes/${id}/resolve`, { action, message });
      toast.success("Dispute resolved");
      fetchDisputes();
    } catch (err) {
      toast.error("Resolution failed");
    } finally {
      setProcessingId("");
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  return {
    disputes,
    loading,
    processingId,
    handleResolve,
    refresh: fetchDisputes
  };
};

export default useDisputes;
