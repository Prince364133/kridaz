import { useEffect, useState } from "react";
import axiosInstance from "../useAxiosInstance";
 
const useTurfData = () => {
  const [turfData, setTurfData] = useState(null);
  const [loading, setLoading] = useState(true);


 
  const fetchTurfData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/api/admin/turfs/all`
      );
      const result = await response.data;
       setTurfData(result.turfs);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTurfData();
  }, []);

  const approveTurf = async (id) => {
    try {
      await axiosInstance.put(`/api/admin/turf/${id}/approve`);
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const rejectTurf = async (id) => {
    try {
      await axiosInstance.put(`/api/admin/turf/${id}/reject`);
      await fetchTurfData();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  return { turfData, loading, approveTurf, rejectTurf, refetch: fetchTurfData };
};

export default useTurfData;
