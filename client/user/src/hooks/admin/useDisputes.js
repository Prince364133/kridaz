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
 const response = await axiosInstance.get("/api/admin/dispute/get-all");
 setDisputes(response.data.disputes);
 } catch (err) {
 console.error(err);
 toast.error("Failed to fetch disputes");
 } finally {
 setLoading(false);
 }
 };

 const handleResolve = async (id, action, message, partialAmount = 0) => {
 setProcessingId(id);
 try {
 await axiosInstance.post(`/api/admin/dispute/${id}/resolve`, { 
 resolutionAction: action, 
 resolutionNotes: message,
 partialAmount 
 });
 toast.success("Dispute resolved");
 fetchDisputes();
 } catch (err) {
 toast.error("Resolution failed");
 } finally {
 setProcessingId("");
 }
 };

 const handleReply = async (id, message) => {
 try {
 await axiosInstance.post(`/api/admin/dispute/${id}/reply`, { message });
 toast.success("Reply sent");
 fetchDisputes();
 } catch (err) {
 toast.error("Failed to send reply");
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
 handleReply,

 refresh: fetchDisputes
 };
};

export default useDisputes;
