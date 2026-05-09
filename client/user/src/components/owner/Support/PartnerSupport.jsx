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
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                    ticket.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
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
                      onChange={e => setFormData({...formData, category: e.target.value})}
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
                      onChange={e => setFormData({...formData, subject: e.target.value})}
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
                      onChange={e => setFormData({...formData, message: e.target.value})}
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
    </div>
  );
};

export default PartnerSupport;
