import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/audit/logs");
      setLogs(response.data.logs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return { logs, loading, refresh: fetchLogs };
};

export default useAuditLogs;
