import { useState, useEffect } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useBanking = () => {
  const [bankingDetails, setBankingDetails] = useState(null);
  const [payoutSettings, setPayoutSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPayoutDay, setIsPayoutDay] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bankingRes, settingsRes] = await Promise.all([
        axiosInstance.get("/api/owner/banking"),
        axiosInstance.get("/api/owner/banking/config")
      ]);

      setBankingDetails(bankingRes.data.bankingDetails);
      setPayoutSettings(settingsRes.data.settings);

      // Check if today is payout day
      const today = new Date().getDay();
      if (today === settingsRes.data.settings.payoutDay) {
        setIsPayoutDay(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load banking info");
    } finally {
      setLoading(false);
    }
  };

  const updateBanking = async (data) => {
    try {
      const res = await axiosInstance.put("/api/owner/banking", data);
      setBankingDetails(res.data.bankingDetails);
      toast.success("Banking details updated");
      return true;
    } catch (err) {
      toast.error("Update failed");
      return false;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { bankingDetails, payoutSettings, loading, isPayoutDay, updateBanking, refresh: fetchData };
};

export default useBanking;
