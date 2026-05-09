import React, { useState, useEffect } from "react";
import {
  LifeBuoy, MessageSquare, ChevronRight, Clock, AlertCircle, Zap
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const PartnerSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "OTHER",
    message: ""
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/owner/support/tickets");
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/owner/support/create", formData);
      toast.success("Ticket raised successfully!");
      setFormData({ subject: "", category: "OTHER", message: "" });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-[#2D2D2D] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-[#CCFF00] rounded-full" />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-['Open_Sans'] text-white tracking-tight leading-none uppercase">
                Help & <span className="text-[#CCFF00]">Support</span>
              </h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[20px] mt-2 ml-4">
              Get assistance from the BMS Admin Team
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#000000] px-5 py-2.5 rounded-[8px] border border-[#2D2D2D] flex items-center gap-3 shadow-[var(--shadow-2)]">
              <div className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-[12px] font-bold text-white uppercase tracking-widest">Support Line Active</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Ticket Form */}
          <div className="lg:col-span-5 bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 shadow-[var(--shadow-2)] relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px] pointer-events-none" />

            <h2 className="text-[14px] font-bold text-[#CCFF00] border-b border-[#2D2D2D] pb-4 mb-8 uppercase tracking-[3px] flex items-center gap-2">
              <MessageSquare size={18} />
              Raise a New Ticket
            </h2>

            <form onSubmit={handleSubmitTicket} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Category</label>
                <select
                  className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-all appearance-none text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="BILLING">Billing / Payouts</option>
                  <option value="TECHNICAL">Technical Issues</option>
                  <option value="BOOKING">Booking Related</option>
                  <option value="ACCOUNT">Account Management</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Subject</label>
                <input
                  type="text" required
                  className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-all text-sm"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Message</label>
                <textarea
                  required rows="5"
                  className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-all text-sm custom-scrollbar"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your problem in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#CCFF00] hover:bg-white text-black rounded-[8px] font-bold uppercase tracking-[2px] transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_rgba(204,255,0,0.15)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'SYNCHRONIZING...' : 'Initialize Ticket'}
              </button>
            </form>
          </div>

          {/* Ticket History */}
          <div className="lg:col-span-7 bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 shadow-[var(--shadow-2)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px] pointer-events-none" />

            <h2 className="text-[14px] font-bold text-[#CCFF00] border-b border-[#2D2D2D] pb-4 mb-8 uppercase tracking-[3px] flex items-center gap-2">
              <Clock size={18} />
              Ticket History
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2 relative z-10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-10 h-10 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Decrypting Records...</p>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-[#2D2D2D] rounded-[8px] bg-black/40">
                  <AlertCircle className="mx-auto text-[#222] mb-4" size={32} />
                  <p className="text-[12px] font-normal text-[#878C9F] uppercase tracking-[0.5px]">No active telemetry records.</p>
                  <p className="text-[11px] text-[#333] mt-2 font-medium tracking-wide uppercase italic">Initialize a ticket to begin data stream.</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket._id} className="p-5 bg-[#111111] border border-[#2D2D2D] rounded-[8px] hover:border-[#CCFF00]/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-[4px] uppercase tracking-widest border ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                        {ticket.status}
                      </span>
                      <span className="text-[10px] text-[#555] font-bold uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h3 className="font-bold text-white text-[15px] mb-2 uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{ticket.subject}</h3>
                    <p className="text-[13px] text-[#878C9F] leading-relaxed line-clamp-2">{ticket.message}</p>

                    {(ticket.replies?.length > 0 || ticket.status === 'RESOLVED') && (
                      <div className="mt-4 pt-4 border-t border-[#2D2D2D] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-pulse"></div>
                          <p className="text-[10px] text-[#CCFF00] font-bold uppercase tracking-widest">Response Stream Active</p>
                        </div>
                        <button className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest hover:text-white transition-colors">View Logs ↗</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-8 border-t border-[#2D2D2D] flex justify-between items-center opacity-40">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#999999]">
            Secure Communication Tunnel | End-to-End Encrypted
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-medium uppercase tracking-widest">Support Node v2.0.4</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerSupport;
