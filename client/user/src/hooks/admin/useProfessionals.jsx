import { useState, useEffect, useCallback } from "react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const useProfessionals = (roleFilter) => {
  const [professionals, setProfessionals] = useState([]);
  const [allProfessionals, setAllProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedProfessionalDetails, setSelectedProfessionalDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = useCallback(
    (term) => {
      setSearchTerm(term);
      if (term === "") {
        setProfessionals(allProfessionals);
        return;
      }
      const filtered = allProfessionals.filter(
        (prof) =>
          prof.name.toLowerCase().includes(term.toLowerCase()) ||
          prof.email.toLowerCase().includes(term.toLowerCase())
      );
      setProfessionals(filtered);
    },
    [allProfessionals]
  );

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/admin/professionals/list");
      const data = response.data;
      // Filter by role (coach or umpire)
      const filteredProfessionals = data.professionals.filter(
        (prof) => prof.role === roleFilter
      );
      setProfessionals(filteredProfessionals);
      setAllProfessionals(filteredProfessionals);
    } catch (err) {
      console.log(err, "err");
      toast.error(err.response?.data?.message || "Failed to fetch professionals");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfessionalDetails = async (id) => {
    setDetailsLoading(true);
    setSelectedProfessionalDetails(null);
    try {
      const response = await axiosInstance.get(`/api/admin/professionals/${id}`);
      setSelectedProfessionalDetails(response.data);
      return response.data;
    } catch (err) {
      console.error("Failed to fetch professional details:", err);
      toast.error(err.response?.data?.message || "Failed to fetch professional details");
      return null;
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, [roleFilter]);

  return {
    professionals,
    loading,
    searchTerm,
    handleSearch,
    fetchProfessionalDetails,
    selectedProfessionalDetails,
    detailsLoading,
  };
};

export default useProfessionals;
