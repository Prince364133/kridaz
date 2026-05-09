import React, { useState } from "react";
import { MessageSquare, Send, Clock, CheckCircle, HelpCircle, AlertCircle } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const PartnerSupport = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchMyTickets = async () => {
    try {
      const response = await axiosInstance.get("/api/owner/support/tickets");
      setTickets(response.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/owner/support/create", { subject, message, category });
      toast.success("Ticket raised successfully");
      setSubject("");
      setMessage("");
      fetchMyTickets();
    } catch (err) {
      toast.error("Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMyTickets();
  }, []);

  return (
    <div className="p-6 md:p-10 space-y-8 animate-fade-in text-white bg-[#050505] min-h-screen pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-3">
              <HelpCircle className="text-[#CCFF00]" size={28} />
              <h1 className="text-2xl md:text-3xl font-bold font-outfit tracking-tight">Help & Support</h1>
           </div>
           <p className="text-[#878C9F] text-sm mt-1 uppercase tracking-widest text-[10px] font-bold">Get assistance from the BMS Admin Team</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* New Ticket Form */}
         <div className="bg-[#111] border border-[#2D2D2D] rounded-2xl p-6 h-fit">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
               <MessageSquare className="text-[#CCFF00]" size={20} />
               Raise a New Ticket
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Category</label>
                  <select 
                    className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#CCFF00]"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                     <option value="BILLING">Billing / Payouts</option>
                     <option value="TECHNICAL">Technical Issues</option>
                     <option value="BOOKING">Booking Related</option>
                     <option value="ACCOUNT">Account Management</option>
                     <option value="OTHER">Other</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Subject</label>
                  <input 
                    type="text" required
                    className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#CCFF00]"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of the issue"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Message</label>
                  <textarea 
                    required rows="5"
                    className="w-full bg-[#050505] border border-[#2D2D2D] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#CCFF00]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your problem in detail..."
                  />
               </div>
               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full py-3 bg-[#CCFF00] hover:bg-[#b3ff00] text-black rounded-lg font-bold uppercase tracking-widest transition-all disabled:opacity-50"
               >
                  {loading ? 'Submitting...' : 'Raise Ticket'}
               </button>
            </form>
         </div>

         {/* Ticket History */}
         <div className="bg-[#111] border border-[#2D2D2D] rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
               <Clock className="text-[#CCFF00]" size={20} />
               Ticket History
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
               {fetching ? (
                 <p className="text-center text-gray-500 py-10">Loading history...</p>
               ) : tickets.length === 0 ? (
                 <div className="text-center py-10 border border-dashed border-[#2D2D2D] rounded-xl">
                    <AlertCircle className="mx-auto text-[#444] mb-2" size={24} />
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">No tickets raised yet</p>
                 </div>
               ) : (
                 tickets.map(ticket => (
                   <div key={ticket._id} className="p-4 bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl hover:border-[#CCFF00]/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                         <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            ticket.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500' :
                            ticket.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-yellow-500/10 text-yellow-500'
                         }`}>
                            {ticket.status}
                         </span>
                         <span className="text-[10px] text-[#555] font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm mb-1">{ticket.subject}</h3>
                      <p className="text-xs text-[#878C9F] truncate">{ticket.message}</p>
                      {ticket.replies.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#2D2D2D] flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full animate-pulse"></div>
                           <p className="text-[10px] text-[#CCFF00] font-bold uppercase tracking-widest">Admin Replied</p>
                        </div>
                      )}
                   </div>
                 ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default PartnerSupport;
