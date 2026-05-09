import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Clock, Calendar, Check, X, 
  Info, Phone, User, Globe, Shield, Activity
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import useTurfData from "@hooks/admin/useTurf";
import ConfirmationPopup from "./ConfirmationPopup";
import TurfSkeleton from "./TurfSkeleton";

const VenueApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { turfData, loading, approveTurf, rejectTurf } = useTurfData();
  const [turf, setTurf] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: "" });

  useEffect(() => {
    if (turfData && id) {
      const found = turfData.find(t => t._id === id);
      setTurf(found);
    }
  }, [turfData, id]);

  const handleApprove = async (adminData) => {
    const success = await approveTurf(id, adminData);
    if (success) {
      toast.success(`Venue Approved by ${adminData.name}`);
      navigate("/admin/turfs");
    }
  };

  const handleReject = async (adminData) => {
    const success = await rejectTurf(id, adminData);
    if (success) {
      toast.success(`Venue Rejected by ${adminData.name}`);
      navigate("/admin/turfs");
    }
  };

  if (loading || !turf) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-10">
        <TurfSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[#2D2D2D] px-6 py-4 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-[#CCFF00] transition-colors font-bold uppercase text-[10px] tracking-widest"
        >
          <ArrowLeft size={16} />
          Return to Queue
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#CCFF00]/10 rounded-full border border-[#CCFF00]/20">
            <Activity size={12} className="text-[#CCFF00] animate-pulse" />
            <span className="text-[9px] font-black text-[#CCFF00] uppercase tracking-widest">Active Verification Session</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-12 space-y-12">
        {/* Hero Section */}
        <div className="relative h-[50vh] rounded-[40px] overflow-hidden border border-[#2D2D2D] shadow-2xl">
          <img 
            src={turf.image} 
            alt={turf.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.onerror = null; e.target.src = "/banner-2.png"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
          
          <div className="absolute bottom-0 left-0 w-full p-10 lg:p-16 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-4 py-1.5 bg-[#CCFF00] text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                Venue Verification
              </span>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                turf.status === 'approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                turf.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              }`}>
                {turf.status}
              </span>
            </div>
            <h1 className="text-5xl lg:text-8xl font-black text-white uppercase tracking-tighter leading-none">
              {turf.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-400 font-bold">
              <MapPin size={18} className="text-[#CCFF00]" />
              <span className="text-lg">{turf.location}</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          {/* Left Column: Extensive Details */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Description Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-[#CCFF00]">
                <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
                  <Info size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">The Mission Brief</h2>
              </div>
              <p className="text-gray-400 text-xl leading-relaxed font-medium italic">
                "{turf.description || "No description provided for this venue."}"
              </p>
            </section>

            {/* Gallery Section */}
            {turf.images && turf.images.length > 0 && (
              <section className="space-y-8">
                <div className="flex items-center gap-3 text-[#CCFF00]">
                  <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
                    <Globe size={16} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em]">Visual Telemetry</h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {turf.images.map((img, i) => (
                    <div key={i} className="group relative aspect-video rounded-3xl overflow-hidden border border-[#2D2D2D] hover:border-[#CCFF00]/50 transition-all cursor-zoom-in">
                      <img src={img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={`Gallery ${i}`} />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-[#CCFF00] text-black rounded-full">Expand Intelligence</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Hardware Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-3 text-[#CCFF00]">
                <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/10 flex items-center justify-center border border-[#CCFF00]/20">
                  <Shield size={16} />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em]">On-Site Amenities</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {turf.facilities?.map((facility, i) => (
                  <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-[24px] flex flex-col items-center gap-4 text-center group hover:bg-[#CCFF00]/5 hover:border-[#CCFF00]/30 transition-all">
                     <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#CCFF00] group-hover:scale-110 transition-transform">
                        <Activity size={20} />
                     </div>
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">{facility}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Operations & Verification */}
          <div className="space-y-10">
            
            {/* Action Center */}
            {turf.status === 'pending' && (
              <div className="p-8 bg-[#0a0a0a] border border-[#CCFF00]/30 rounded-[32px] space-y-6 shadow-2xl shadow-[#CCFF00]/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/10 blur-[60px] pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-black uppercase tracking-tighter">Verification Required</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Execute platform governance action</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, type: "approve" })}
                      className="w-full py-5 bg-[#CCFF00] text-black font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-[#CCFF00]/80 transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#CCFF00]/20"
                    >
                      <Check size={18} />
                      Authorize Venue
                    </button>
                    <button 
                      onClick={() => setConfirmModal({ isOpen: true, type: "reject" })}
                      className="w-full py-5 bg-white/5 border border-red-500/30 text-red-500 font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-red-500/10 transition-all flex items-center justify-center gap-3"
                    >
                      <X size={18} />
                      Decline Request
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Summary */}
            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[40px] space-y-8">
              <div className="pb-8 border-b border-white/5">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Base Operations Cost</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tracking-tighter">₹{turf.pricePerHour}</span>
                  <span className="text-[#CCFF00] font-black text-sm uppercase">/ Hour</span>
                </div>
              </div>
              
              <div className="space-y-8">
                <DetailRow icon={Clock} label="OPERATING WINDOW" val={`${turf.openTime} - ${turf.closeTime}`} />
                <DetailRow icon={Calendar} label="LISTING TIMESTAMP" val={turf.createdAt ? format(new Date(turf.createdAt), "PPP") : "N/A"} />
                <DetailRow icon={User} label="PARTNER IDENTIFIER" val={turf.owner?.name || turf.owner || "Anonymous Merchant"} />
              </div>

              {/* Manager Contacts */}
              {turf.managerContacts && turf.managerContacts.length > 0 && (
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ground Intelligence</p>
                  {turf.managerContacts.map((contact, i) => (
                    <div key={i} className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-2xl transition-colors">
                      <div className="flex flex-col">
                        <span className="text-white font-black text-sm uppercase tracking-tight">{contact.name}</span>
                        <span className="text-gray-500 text-xs font-bold">{contact.phone}</span>
                      </div>
                      <a href={`tel:${contact.phone}`} className="p-3 bg-[#CCFF00]/10 text-[#CCFF00] rounded-xl group-hover:bg-[#CCFF00] group-hover:text-black transition-all">
                        <Phone size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationPopup 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.type === 'approve' ? handleApprove : handleReject}
        title={confirmModal.type === 'approve' ? 'Finalize Authorization' : 'Reject Intelligence'}
        message={`Executing ${confirmModal.type} protocol for ${turf.name}. Please provide governance credentials.`}
        type={confirmModal.type === 'approve' ? 'success' : 'danger'}
        confirmText={confirmModal.type === 'approve' ? 'Confirm Authorization' : 'Confirm Rejection'}
        showGovernanceForm={true}
      />
    </div>
  );
};

const DetailRow = ({ icon: Icon, label, val }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-3 text-gray-500">
      <Icon size={14} className="text-[#CCFF00]" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <p className="text-white font-bold text-lg leading-tight tracking-tight">{val}</p>
  </div>
);

export default VenueApprovalDetail;
