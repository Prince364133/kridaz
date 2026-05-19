import React, { useState, useEffect } from "react";
import {
  LifeBuoy, MessageSquare, ChevronRight, Clock, AlertCircle, Zap,
  HelpCircle, Landmark, Shield, X, Plus
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

import { useSelector } from "react-redux";

const PartnerSupport = () => {
  const { role } = useSelector((state) => state.auth);
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#55DEE8";
  const portalTitle = isScorer ? "Scorer Help Center" : "Help & Support";

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "OTHER",
    message: "",
    images: []
  });
  const [uploading, setUploading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  // Update selected ticket data when tickets list changes
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find(t => t._id === selectedTicket._id);
      if (updated) setSelectedTicket(updated);
    }
  }, [tickets]);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setLoading(true);
    try {
      const res = await axiosInstance.post(`/api/owner/support/tickets/${selectedTicket._id}/reply`, {
        message: replyText
      });
      setReplyText("");
      toast.success("Message sent");
      fetchTickets();
    } catch (err) {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setFetching(true);
    try {
      const res = await axiosInstance.get("/api/owner/support/tickets");
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      return toast.error("Maximum 5 images allowed");
    }

    setUploading(true);
    try {
      console.log("PartnerSupport.jsx: Starting image upload for", files.length, "files");
      const uploadPromises = files.map(async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("folder", "kridaz/support");
        
        console.log(`PartnerSupport.jsx: Uploading ${file.name} (${file.size} bytes)...`);
        const res = await axiosInstance.post("/api/upload", data, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        
        if (res.data.success) {
          console.log(`PartnerSupport.jsx: Successfully uploaded ${file.name}. URL:`, res.data.url);
          return res.data.url;
        } else {
          throw new Error(res.data.message || "Upload failed");
        }
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      toast.success(`Successfully uploaded ${urls.length} image(s)`);
    } catch (err) {
      console.error("PartnerSupport.jsx: Upload error details:", err);
      toast.error(err.response?.data?.message || err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/owner/support/create", formData);
      toast.success("Ticket raised successfully!");
      setFormData({ subject: "", category: "OTHER", message: "", images: [] });
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full custom-scrollbar bg-[#000000] text-white font-inter">
      <div className="p-4 lg:px-10 lg:pt-8 lg:pb-12 space-y-8 animate-fade-in pt-0 pb-24 h-full relative">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-white/5 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: themeColor }} />
              <h1 className="text-[28px] lg:text-[32px] font-bold font-inter text-white tracking-tight leading-none uppercase">
                {portalTitle.split(' ')[0]} {portalTitle.split(' ')[1]} <span style={{ color: themeColor }}>{portalTitle.split(' ').slice(2).join(' ')}</span>
              </h1>
            </div>
            <p className="text-[#878C9F] font-inter text-[14px] mt-2 ml-4 uppercase tracking-widest font-semibold">
              Get assistance from the Kridaz Admin Team
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#000000] px-5 py-2.5 rounded-[4px] border border-white/5 flex items-center gap-3 shadow-2xl">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Support Line Active</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Ticket Form / Chat Box */}
          <div className="lg:col-span-5 bg-[#000000] border border-white/5 rounded-[8px] p-8 shadow-2xl relative overflow-hidden h-fit">
            <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />

            {selectedTicket ? (
              <div className="relative z-10 flex flex-col h-full min-h-[500px]">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <h3 className="text-[12px] font-bold uppercase tracking-[2px] font-inter" style={{ color: themeColor }}>
                    Ticket: {selectedTicket.subject}
                  </h3>
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="text-[10px] font-bold uppercase tracking-widest hover:underline font-inter"
                    style={{ color: themeColor }}
                  >
                    Close Chat
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2 no-scrollbar max-h-[400px]">
                  {/* Initial Message */}
                  <div className="flex flex-col items-start max-w-[90%]">
                    <div className="bg-[#111] p-4 rounded-[4px] border border-white/5">
                      <p className="text-[10px] font-bold mb-2 uppercase tracking-widest font-inter" style={{ color: themeColor }}>YOU (Initial Request)</p>
                      <p className="text-[13px] text-white/90 font-inter">{selectedTicket.message}</p>
                      {selectedTicket.images?.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {selectedTicket.images.map((img, i) => (
                            <img key={i} src={img} alt="" className="rounded-[2px] border border-white/5 w-full h-24 object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[8px] text-[#555] mt-2 font-bold uppercase font-inter">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Replies */}
                  {selectedTicket.replies?.map((reply, idx) => (
                    <div key={idx} className={`flex flex-col ${reply.sender === 'OWNER' ? 'items-start' : 'items-end'} max-w-full`}>
                      <div className={`p-4 rounded-[4px] border ${reply.sender === 'OWNER' 
                        ? 'bg-[#111] border-white/5 max-w-[90%]' 
                        : 'border-white/10 max-w-[90%]'}`}
                        style={{ backgroundColor: reply.sender !== 'OWNER' ? `${themeColor}0D` : undefined, borderColor: reply.sender !== 'OWNER' ? `${themeColor}33` : undefined }}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 font-inter ${reply.sender === 'OWNER' ? 'text-[#555]' : ''}`}
                           style={{ color: reply.sender !== 'OWNER' ? themeColor : undefined }}>
                          {reply.sender === 'OWNER' ? 'YOU' : 'SUPPORT AGENT'}
                        </p>
                        <p className="text-[13px] text-white/90 font-inter">{reply.message}</p>
                      </div>
                      <span className="text-[8px] text-[#555] mt-2 font-bold uppercase font-inter">{new Date(reply.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-[#2D2D2D] pt-6">
                  {selectedTicket.status === 'CLOSED' ? (
                    <div className="p-4 text-center bg-red-500/10 border border-red-500/20 rounded-[8px]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">This ticket has been closed</p>
                    </div>
                  ) : !selectedTicket.isAgentOnline ? (
                    <div className="p-4 text-center bg-orange-500/10 border border-orange-500/20 rounded-[8px] mb-4">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Clock size={14} className="text-orange-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500">Support Agent is Offline</p>
                      </div>
                      <p className="text-[9px] text-[#555] uppercase font-bold tracking-widest">Response times may be longer.</p>
                    </div>
                  ) : null}

                  {selectedTicket.status !== 'CLOSED' && (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 bg-[#111] border border-white/5 rounded-[4px] px-4 py-3 text-sm text-white focus:outline-none transition-all font-inter"
                        onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                      />
                      <button 
                        onClick={handleReply}
                        disabled={!replyText.trim() || loading}
                        className="text-black px-8 rounded-[4px] font-bold uppercase tracking-widest text-[11px] transition-all disabled:opacity-50 font-inter shadow-lg"
                        style={{ backgroundColor: themeColor, boxShadow: `0 5px 15px ${themeColor}33` }}
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-[13px] font-bold border-b border-white/5 pb-4 mb-8 uppercase tracking-[3px] flex items-center gap-2 font-inter" style={{ color: themeColor }}>
                  <MessageSquare size={18} />
                  Raise a New Ticket
                </h2>

                <form onSubmit={handleSubmitTicket} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Category</label>
                    <select
                      className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none transition-all appearance-none text-sm"
                      style={{ borderColor: themeColor }}
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
                      className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none transition-all text-sm"
                      style={{ focusBorderColor: themeColor }}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Brief summary of the issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Message</label>
                    <textarea
                      required rows="5"
                      className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none transition-all text-sm custom-scrollbar"
                      style={{ focusBorderColor: themeColor }}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your problem in detail..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Attachments (Max 5)</label>
                    <div className="grid grid-cols-5 gap-2">
                      {formData.images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-[4px] overflow-hidden border border-[#2D2D2D]">
                          <img src={img} alt="support" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                            className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {formData.images.length < 5 && (
                        <label 
                          className="aspect-square rounded-[4px] border border-dashed border-[#2D2D2D] flex items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-all"
                          style={{ borderColor: uploading ? themeColor : '#2D2D2D' }}
                        >
                          {uploading ? <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: themeColor }} /> : <Plus size={18} className="text-[#555]" />}
                          <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || uploading}
                    className="w-full py-4 text-black rounded-[4px] font-bold uppercase tracking-[2px] transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg disabled:opacity-50 mt-4 font-inter"
                    style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
                  >
                    {loading ? 'SYNCHRONIZING...' : 'Initialize Ticket'}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Ticket History */}
          <div className="lg:col-span-7 bg-[#000000] border border-white/5 rounded-[8px] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 blur-[60px] pointer-events-none" style={{ backgroundColor: `${themeColor}0D` }} />

            <h2 className="text-[13px] font-bold border-b border-white/5 pb-4 mb-8 uppercase tracking-[3px] flex items-center gap-2 font-inter" style={{ color: themeColor }}>
              <Clock size={18} />
              Ticket History
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2 relative z-10">
              {fetching ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: themeColor }}></div>
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
                  <div 
                    key={ticket._id} 
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-5 bg-[#111111] border border-[#2D2D2D] rounded-[8px] transition-all group cursor-pointer"
                    style={{ '--hover-border': themeColor }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-[4px] uppercase tracking-widest border ${ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            ticket.status === 'IN_PROGRESS' || ticket.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                          {ticket.status}
                        </span>
                        {ticket.isAgentOnline ? (
                          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: themeColor }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                            Agent Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[9px] font-bold text-orange-500 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                            Agent Offline
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#555] font-bold uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <h3 className="font-bold text-white text-[15px] mb-2 uppercase tracking-tight transition-colors" style={{ color: selectedTicket?._id === ticket._id ? themeColor : 'white' }}>{ticket.subject}</h3>
                    <p className="text-[13px] text-[#878C9F] leading-relaxed line-clamp-1">{ticket.message}</p>

                    <div className="mt-4 pt-4 border-t border-[#2D2D2D] flex items-center justify-between">
                      <div className="flex items-center gap-4 text-[9px] font-bold text-[#555] uppercase tracking-widest">
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {ticket.replies?.length || 0} Replies</span>
                        {ticket.images?.length > 0 && <span className="flex items-center gap-1"><Shield size={12} /> {ticket.images.length} Attachments</span>}
                      </div>
                      <button className="text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors" style={{ color: themeColor }}>Enter Chat Γåù</button>
                    </div>
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
