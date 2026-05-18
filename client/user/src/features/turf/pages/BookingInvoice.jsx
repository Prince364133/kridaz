import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, Download, Loader2, ShieldCheck } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";

const BookingInvoice = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const invoiceDownloadUrl = `${import.meta.env.VITE_API_URL}/api/user/booking/invoice/${id}`;

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axiosInstance.get(`/api/user/booking/${id}`);
        setBooking(response.data);
      } catch (err) {
        console.error("Error fetching invoice data:", err);
        setError(err.response?.data?.message || "Failed to load invoice details");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center gap-4">
        <Loader2 size={40} className="text-[#CCFF00] animate-spin" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Preparing your invoice...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldCheck size={40} className="text-red-500" />
        </div>
        <h1 className="text-xl font-black text-white uppercase tracking-tight mb-2">Access Denied</h1>
        <p className="text-zinc-500 text-sm max-w-xs mb-8">{error || "Invoice not found"}</p>
        <Link to="/" className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
          Go Back Home
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#000] py-8 sm:py-12 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 sm:mb-12">
          <Link to={`/booking-pass/${id}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Pass</span>
          </Link>

          <a 
            href={invoiceDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] rounded-xl px-6 py-3 text-black text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(204,255,0,0.1)]"
          >
            <Download size={16} />
            Download PDF
          </a>
        </div>

        {/* Invoice PDF Viewer */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl relative h-[75vh] w-full">
          <iframe 
            src={invoiceDownloadUrl} 
            className="w-full h-full border-0" 
            title={`Invoice ${id}`}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingInvoice;
