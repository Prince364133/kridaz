import { useGetTurfsQuery } from "@redux/api/turfApi";

const useTurfData = (filters = {}) => {
  const { data, isLoading, error, refetch } = useGetTurfsQuery(filters, {
    skip: !!filters._skip,
  });

  // Extract error message string
  let errorMessage = null;
  if (error) {
    errorMessage = error.data?.message || error.message || "Failed to connect to server";
  }

  return {
    turfs: data?.turfs || [],
    loading: isLoading,
    error: errorMessage,
    refetch,
  };
};

export default useTurfData;
