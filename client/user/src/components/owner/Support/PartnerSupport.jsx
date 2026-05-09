import React, { useState, useEffect } from "react";
import {
  LifeBuoy, Book, Send, MessageSquare,
  ChevronRight, Search, FileText, HelpCircle,
  Plus, Upload, X, CheckCircle2, AlertCircle,
  Clock, Shield, Landmark, Percent, UserCheck
} from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const PartnerSupport = () => {
  const [activeTab, setActiveTab] = useState("docs");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "OTHER",
    message: "",
    images: []
  });
  const [uploading, setUploading] = useState(false);

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      return toast.error("Maximum 5 images allowed");
    }

    setUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "bms_preset");
        const res = await fetch("https://api.cloudinary.com/v1_1/dx1iwkw0h/image/upload", {
          method: "POST",
          body: data
        });
        const fileData = await res.json();
        return fileData.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch (err) {
      toast.error("Image upload failed");
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

  // Documentation Data
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
<<<<<<< HEAD
    <div className="p-4 md:p-8 space-y-8 animate-fade-in text-white bg-[#050505] min-h-screen pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <HelpCircle className="text-[#CCFF00]" size={32} />
            <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter">Support <span className="text-[#CCFF00]">& Docs</span></h1>
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
            <div className="bg-[#111] border border-white/10 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest">Active Conversations</h3>
              </div>
              {loading ? (
                <div className="p-20 text-center text-gray-500 uppercase font-black text-[10px] tracking-widest">Fetching Updates...</div>
              ) : tickets.length > 0 ? (
                <div className="divide-y divide-white/5 max-h-[700px] overflow-y-auto no-scrollbar">
                  {tickets.map(ticket => (
                    <div key={ticket._id} className="p-6 hover:bg-white/[0.02] transition-all cursor-pointer group">
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
                          </div>
                          <h4 className="text-sm font-black uppercase tracking-tight group-hover:text-[#CCFF00] transition-colors">{ticket.subject}</h4>
                        </div>
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-4 font-medium">{ticket.message}</p>
                      <div className="flex items-center gap-4 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                        <MessageSquare size={12} /> {ticket.replies.length} REPLIES
                        {ticket.images.length > 0 && <span className="flex items-center gap-1"><FileText size={12} /> {ticket.images.length} ATTACHMENTS</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center">
                  <AlertCircle className="mx-auto text-gray-800 mb-4" size={40} />
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
=======
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

                  <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Category</label>
                      <select
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-all appearance-none text-sm"
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

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Subject</label>
                      <input
                        type="text" required
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-all text-sm"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of the issue"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-[#878C9F] uppercase tracking-widest ml-1">Message</label>
                      <textarea
                        required rows="5"
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[8px] px-4 py-3 text-white focus:outline-none focus:border-[#CCFF00]/60 transition-all text-sm custom-scrollbar"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
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
                    {fetching ? (
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
>>>>>>> 01016f4 (Standardized avatar rendering system across all user-facing components)
              </div>
            </div>
          </div>
          );
};

          export default PartnerSupport;

