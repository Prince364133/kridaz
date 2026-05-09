import React, { useState, useEffect } from "react";
import {
  MessageSquare, Clock, AlertCircle,
  HelpCircle, ChevronRight, Landmark, Shield, X, Plus
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const PartnerSupport = () => {
  const [activeTab, setActiveTab] = useState("docs");
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
        data.append("folder", "turfspot/support");
        
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
    if (formData.message.length > 10000) return toast.error("Message too long (max 10,000 chars)");

    setLoading(true);
    try {
      await axiosInstance.post("/api/owner/support/create", formData);
      toast.success("Ticket raised successfully!");
      setFormData({ subject: "", category: "OTHER", message: "", images: [] });
      fetchTickets();
      setActiveTab("tickets");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to raise ticket");
    } finally {
      setLoading(false);
    }
  };

  const docs = [
    {
      title: "Getting Started",
      items: [
        { q: "How to set up my dashboard?", a: "Complete your profile, verify your KYC in Banking section, and start adding your services/grounds." },
        { q: "Adding your first ground/service", a: "Use the 'Add' button in your respective management section. Fill in pricing, slots, and photos." },
        { q: "Understanding the commission model", a: "We charge a standard 10% commission on every successful booking processed through our platform." }
      ]
    },
    {
      title: "Payouts & Settlement",
      items: [
        { q: "When do I get my money?", a: "Settlements are processed weekly. Admin decides the payout day (Default: Saturday). Money hits your account in 24-48 hours." },
        { q: "How are earnings calculated?", a: "Earnings = (Booking Amount - 10% Commission). All taxes are handled as per government norms." },
        { q: "KYC Verification Requirements", a: "You need a valid PAN, GST (optional for small partners), and a clear photo of a cancelled check." }
      ]
    },
    {
      title: "Operation Policies",
      items: [
        { q: "Cancellation Policy", a: "Full refund if cancelled 24h before. 50% refund if cancelled between 12-24h. No refund for < 12h." },
        { q: "Platform Standards", a: "Maintain high service quality. Consistently low ratings may lead to temporary suspension." }
      ]
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white bg-[#050505] min-h-screen pb-20 custom-scrollbar">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <HelpCircle className="text-[#CCFF00]" size={32} />
            <h1 className="text-3xl font-black uppercase tracking-tighter">Support <span className="text-[#CCFF00]">& Docs</span></h1>
          </div>
          <p className="text-[#878C9F] text-[10px] font-bold uppercase tracking-widest mt-1">Official Resource Center for BMS Partners</p>
        </div>

        <div className="flex gap-2 bg-[#111] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("docs")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "docs" ? "bg-[#CCFF00] text-black" : "text-gray-500 hover:text-white"}`}
          >
            Documentation
          </button>
          <button
            onClick={() => setActiveTab("tickets")}
            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "tickets" ? "bg-[#CCFF00] text-black" : "text-gray-500 hover:text-white"}`}
          >
            My Tickets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Content Area */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === "docs" ? (
            <div className="space-y-6">
              {docs.map((section, idx) => (
                <div key={idx} className="bg-[#111] border border-white/10 rounded-3xl p-6 lg:p-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#CCFF00] mb-6 flex items-center gap-3">
                    {section.title === "Getting Started" && <Clock size={18} />}
                    {section.title === "Payouts & Settlement" && <Landmark size={18} />}
                    {section.title === "Operation Policies" && <Shield size={18} />}
                    {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.items.map((item, i) => (
                      <details key={i} className="group border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <summary className="flex justify-between items-center cursor-pointer list-none">
                          <span className="text-sm font-bold text-white/80 group-hover:text-white transition-colors">{item.q}</span>
                          <ChevronRight size={18} className="text-gray-500 group-open:rotate-90 transition-transform" />
                        </summary>
                        <p className="mt-4 text-xs text-gray-500 leading-relaxed font-medium pl-3 border-l-2 border-[#CCFF00]">
                          {item.a}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden flex flex-col min-h-[600px]">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest">
                  {selectedTicket ? `Ticket: ${selectedTicket.subject}` : "Active Conversations"}
                </h3>
                {selectedTicket && (
                  <button 
                    onClick={() => setSelectedTicket(null)}
                    className="text-[10px] font-black uppercase tracking-widest text-[#CCFF00] hover:underline"
                  >
                    Back to List
                  </button>
                )}
              </div>
              
              {fetching ? (
                <div className="flex-1 flex items-center justify-center text-gray-500 uppercase font-black text-[10px] tracking-widest">Fetching Updates...</div>
              ) : selectedTicket ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Messages Section */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar max-h-[500px]">
                    {/* Initial Message */}
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="bg-[#1a1a1a] p-4 rounded-2xl rounded-tl-none border border-white/5">
                        <p className="text-xs font-bold text-[#CCFF00] mb-2 uppercase tracking-widest">YOU (Initial Request)</p>
                        <p className="text-[13px] leading-relaxed text-white/90">{selectedTicket.message}</p>
                        {selectedTicket.images?.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {selectedTicket.images.map((img, i) => (
                              <img key={i} src={img} alt="" className="rounded-lg border border-white/10 w-full h-24 object-cover" />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] text-gray-600 mt-2 font-bold uppercase">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                    </div>

                    {/* Replies */}
                    {selectedTicket.replies?.map((reply, idx) => (
                      <div key={idx} className={`flex flex-col ${reply.sender === 'OWNER' ? 'items-start' : 'items-end'} max-w-full`}>
                        <div className={`p-4 rounded-2xl border ${reply.sender === 'OWNER' 
                          ? 'bg-[#1a1a1a] border-white/5 rounded-tl-none max-w-[85%]' 
                          : 'bg-[#CCFF00]/10 border-[#CCFF00]/20 rounded-tr-none max-w-[85%]'}`}>
                          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${reply.sender === 'OWNER' ? 'text-gray-500' : 'text-[#CCFF00]'}`}>
                            {reply.sender === 'OWNER' ? 'YOU' : 'SUPPORT AGENT'}
                          </p>
                          <p className="text-[13px] leading-relaxed text-white/90">{reply.message}</p>
                        </div>
                        <span className="text-[8px] text-gray-600 mt-2 font-bold uppercase">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-white/5 bg-white/[0.01]">
                    {selectedTicket.status === 'CLOSED' ? (
                       <div className="p-4 text-center bg-red-500/10 border border-red-500/20 rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-red-500">This ticket has been closed</p>
                       </div>
                    ) : !selectedTicket.isAgentOnline ? (
                      <div className="p-4 text-center bg-orange-500/10 border border-orange-500/20 rounded-xl">
                         <div className="flex items-center justify-center gap-2 mb-1">
                            <Clock size={14} className="text-orange-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">Support Agent is currently Offline</p>
                         </div>
                         <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest animate-pulse">Wait till they come online to get real-time assistance.</p>
                      </div>
                    ) : null}

                    {selectedTicket.status !== 'CLOSED' && (
                      <div className="mt-4 flex gap-2">
                        <input 
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={selectedTicket.isAgentOnline ? "Type your message..." : "Agent is offline - you can still reply..."}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-medium"
                          onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                        />
                        <button 
                          onClick={handleReply}
                          disabled={!replyText.trim() || loading}
                          className="bg-[#CCFF00] text-black px-6 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#b3ff00] transition-all disabled:opacity-50"
                        >
                          Send
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : tickets.length > 0 ? (
                <div className="divide-y divide-white/5 no-scrollbar max-h-[600px] overflow-y-auto">
                  {tickets.map(ticket => (
                    <div 
                      key={ticket._id} 
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-6 hover:bg-white/[0.02] transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${ticket.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                ticket.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                  'bg-orange-500/10 text-orange-500 border-orange-500/20'
                              }`}>
                              {ticket.status}
                            </span>
                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">REF: {ticket._id.slice(-6)}</span>
                            {ticket.isAgentOnline ? (
                              <span className="flex items-center gap-1 text-[8px] font-black text-[#CCFF00] uppercase tracking-widest animate-pulse">
                                <span className="w-1.5 h-1.5 bg-[#CCFF00] rounded-full"></span>
                                Agent Online
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[8px] font-black text-orange-500 uppercase tracking-widest">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                Agent Offline
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{ticket.subject}</h4>
                        </div>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-4 font-medium">{ticket.message}</p>
                      <div className="flex items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <MessageSquare size={12} /> {ticket.replies?.length || 0} REPLIES
                        {ticket.images?.length > 0 && <span className="flex items-center gap-1"><AlertCircle size={12} /> {ticket.images.length} ATTACHMENTS</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                  <AlertCircle className="text-gray-800 mb-4" size={40} />
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">No Support History</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Raise Ticket Form */}
        <div className="lg:col-span-5">
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6 lg:p-8 space-y-6 sticky top-24">
            <div className="space-y-1">
              <h3 className="text-lg font-black uppercase tracking-widest">Raise Ticket</h3>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Response expected within 4-6 hours</p>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                <select
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="BILLING">Billing & Payouts</option>
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="BOOKING">Booking Dispute</option>
                  <option value="ACCOUNT">Account Management</option>
                  <option value="OTHER">General Query</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Subject</label>
                <input
                  type="text" required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-bold"
                  placeholder="e.g. Payout not received"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Message Body</label>
                  <span className="text-[8px] font-black text-gray-600">{formData.message.length.toLocaleString()}/10,000</span>
                </div>
                <textarea
                  required rows={5}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#CCFF00] font-medium resize-none"
                  placeholder="Describe your issue in detail..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Upload Screenshots (Max 5)</label>
                <div className="grid grid-cols-5 gap-2">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-white/10">
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
                    <label className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#CCFF00] hover:bg-[#CCFF00]/5 transition-all">
                      {uploading ? <div className="w-4 h-4 border-2 border-[#CCFF00] border-t-transparent rounded-full animate-spin" /> : <Plus size={18} className="text-gray-500" />}
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  )}
                </div>
              </div>

              <button
                type="submit" disabled={loading || uploading}
                className="w-full py-4 bg-[#CCFF00] text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-[#b3ff00] transition-all shadow-[0_10px_30px_rgba(204,255,0,0.15)] disabled:opacity-50"
              >
                {loading ? "Transmitting..." : "Initialize Support Request"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-8 border-t border-white/5 flex justify-between items-center opacity-40">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#999999]">
          Secure Communication Tunnel | End-to-End Encrypted
        </p>
        <div className="flex gap-4">
          <span className="text-[10px] font-medium uppercase tracking-widest">Support Node v2.0.4</span>
        </div>
      </div>
    </div>
  );
};

export default PartnerSupport;
