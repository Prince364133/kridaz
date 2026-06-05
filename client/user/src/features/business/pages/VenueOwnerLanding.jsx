import { useState } from "react";
import { CheckCircle, BarChart3, CalendarDays, Zap, Play, X, FileCheck, Landmark, User, QrCode, Loader2, ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance.js";
import toast from "react-hot-toast";
import ScrollToTop from "@components/common/ScrollToTop";

const GRADIENT = "linear-gradient(90deg, #BFF367 0%, #BFF367 100%)";

const benefits = [
  { icon: CalendarDays, title: "Automated Bookings", desc: "No more phone calls. Let players book your turf 24/7." },
  { icon: BarChart3, title: "Revenue Tracking", desc: "Real-time insights into your earnings, peak hours, and customer retention metrics." },
  { icon: CheckCircle, title: "Seamless Management", desc: "Block maintenance hours, set dynamic pricing, and manage your team with ease." }
];

export default function VenueOwnerLanding() {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [panFront, setPanFront] = useState(null);
  const [panBack, setPanBack] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { user, isLoggedIn } = useSelector((state) => state.auth);

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to register your venue.");
      navigate("/login?redirect=/business/venue");
      return;
    }
    setShowDocumentModal(true);
  };

  // Compute user registration status
  const professionalRoles = ["coach", "umpire", "streamer", "commentator", "venue_owner", "venu_owners"];
  const hasExistingRole = isLoggedIn && (user?.ownerProfile || professionalRoles.includes(user?.role?.toLowerCase()));
  const hasPendingApplication = isLoggedIn && user?.applicationStatus === "pending";

  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase();
    if (role === "venue_owner" || role === "venu_owners" || user?.ownerProfile) return "/venue-owner";
    if (["coach", "umpire", "streamer", "commentator", "scorer"].includes(role)) return `/professional/${role}`;
    return "/";
  };

  // Renders the appropriate CTA based on user status
  const renderActionButton = (size = "normal") => {
    const isHero = size === "hero";

    if (hasExistingRole) {
      return (
        <div className={`flex flex-col items-center gap-3 ${isHero ? 'w-full max-w-md' : 'w-full max-w-sm'}`}>
          <div className={`w-full bg-white/5 border border-[#BFF367]/20 backdrop-blur-sm rounded-[10px] ${isHero ? 'p-4 md:p-5' : 'p-3 md:p-4'} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-[#BFF367]" />
              <span className={`text-white font-black uppercase tracking-wider ${isHero ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>Already a Professional</span>
            </div>
            <p className="text-white/60 text-[10px] md:text-xs mb-3 leading-relaxed">You already have an active role as <span className="text-[#BFF367] font-bold">{user?.role}</span>.</p>
            <button
              onClick={() => navigate(getDashboardPath())}
              className={`bg-[#BFF367] text-black font-black uppercase tracking-widest rounded-[8px] hover:brightness-110 transition-all flex items-center justify-center gap-2 mx-auto ${isHero ? 'px-6 py-2.5 text-xs md:text-sm' : 'px-5 py-2 text-[10px] md:text-xs'}`}
            >
              Go to Dashboard <ArrowRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    if (hasPendingApplication) {
      return (
        <div className={`flex flex-col items-center gap-3 ${isHero ? 'w-full max-w-md' : 'w-full max-w-sm'}`}>
          <div className={`w-full bg-white/5 border border-amber-500/20 backdrop-blur-sm rounded-[10px] ${isHero ? 'p-4 md:p-5' : 'p-3 md:p-4'} text-center`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className={`text-white font-black uppercase tracking-wider ${isHero ? 'text-sm md:text-base' : 'text-xs md:text-sm'}`}>Application Pending</span>
            </div>
            <p className="text-white/60 text-[10px] md:text-xs leading-relaxed">You have applied for <span className="text-amber-400 font-bold">{user?.applicationRole || 'Venue Owner'}</span>. We are verifying your application. You will be notified once approved.</p>
          </div>
        </div>
      );
    }

    return (
      <button onClick={handleRegisterClick} className={`text-center bg-[#BFF367] text-black font-black rounded-[8px] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(191,243,103,0.25)] whitespace-nowrap ${isHero ? 'px-6 py-3 md:px-8 md:py-3.5 text-[11px] sm:text-sm md:text-base' : 'px-6 py-3 md:px-8 md:py-3.5 text-[11px] md:text-sm'}`}>
        Register Your Venue
      </button>
    );
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!aadharFront || !aadharBack || !panFront || !panBack) {
      toast.error("Please upload front and back of both Aadhaar and PAN cards.");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append("name", user?.name || "");
      data.append("email", user?.email || "");
      data.append("phone", user?.phone || "");
      data.append("role", "venu_owners");
      
      data.append("documents", aadharFront, `aadhar_front_${aadharFront.name}`);
      data.append("documents", aadharBack, `aadhar_back_${aadharBack.name}`);
      data.append("documents", panFront, `pan_front_${panFront.name}`);
      data.append("documents", panBack, `pan_back_${panBack.name}`);

      const response = await axiosInstance.post("/api/user/auth/upgrade-request", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        toast.success("Application submitted successfully!");
        setShowDocumentModal(false);
        setAadharFront(null);
        setAadharBack(null);
        setPanFront(null);
        setPanBack(null);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit application");
      if (err.response?.data?.message?.includes("already have a pending application") || err.response?.data?.message?.includes("already has a professional role")) {
         setShowDocumentModal(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAadharUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!aadharFront) {
        setAadharFront(file);
      } else if (!aadharBack) {
        setAadharBack(file);
      }
    }
    e.target.value = null;
  };

  const handlePanUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!panFront) {
        setPanFront(file);
      } else if (!panBack) {
        setPanBack(file);
      }
    }
    e.target.value = null;
  };

  return (
    <div className="relative min-h-screen text-white bg-[#121414] font-inter overflow-hidden pb-20 lg:pb-0">
      <ScrollToTop />
      
      {/* ── Hero Section ── */}
      <section className="relative pt-12 md:pt-16 pb-20 md:pb-32 overflow-hidden bg-black">
        {/* Atmospheric Glow Background */}
        <div className="absolute top-0 left-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full blur-[100px] md:blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"
             style={{ backgroundColor: "rgba(191,243,103,0.06)" }}></div>
             
        <div className="max-w-7xl mx-auto px-5 md:px-6 relative z-10">
          <div className="text-center flex flex-col items-center max-w-4xl mx-auto">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#BFF367]/30 bg-[#BFF367]/10 rounded-full mb-6 md:mb-8">
              <span className="text-[#BFF367] text-[9px] md:text-[10px] uppercase tracking-widest font-black">For Venue Owners & Partners</span>
            </div>

            {/* Title */}
            <h1 
              className="text-4xl md:text-[64px] leading-[1.1] font-black uppercase tracking-tight mb-6 md:mb-8 w-full"
              style={{ fontFamily: "'Open Sans', sans-serif" }}
            >
              <span className="text-white block md:inline">Grow Your Venue.</span><br className="hidden md:block" />
              <span className="text-[#BFF367] block md:inline mt-1 md:mt-0">Maximize Every Slot.</span>
            </h1>

            {/* Paragraph */}
            <p className="text-white/70 text-sm md:text-lg mb-10 md:mb-12 max-w-2xl font-medium leading-relaxed px-2 md:px-0">
              Kridaz helps you automate bookings, manage operations, and connect with thousands of players looking for venues like yours.
            </p>

            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-12 md:mb-16 border-t border-white/10 pt-10 md:pt-12 w-full">
              {benefits.map((b, i) => (
                <div key={i} className="flex flex-row md:flex-row items-center md:items-start gap-4 md:gap-5 group text-left">
                  <div className="w-12 h-12 md:w-12 md:h-12 shrink-0 rounded-[10px] md:rounded-[12px] flex items-center justify-center border border-[#BFF367]/20 bg-gradient-to-b from-[#262626] to-[#1A1A1A]">
                    <b.icon className="w-5 h-5 md:w-5 md:h-5 text-[#BFF367]" />
                  </div>
                  <div>
                    <h3 className="text-white text-xs md:text-sm font-black mb-1 md:mb-2 uppercase tracking-wide" style={{ fontFamily: "'Open Sans', sans-serif" }}>{b.title}</h3>
                    <p className="text-white/50 text-xs md:text-xs leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-row items-center justify-center gap-4 md:gap-6 w-full md:w-auto mt-2">
              {renderActionButton("hero")}
              {!hasExistingRole && !hasPendingApplication && (
              <button className="flex items-center gap-2 md:gap-3 group shrink-0">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center bg-white/5 transition-all group-hover:bg-white/10 group-hover:scale-110 shrink-0">
                  <Play className="w-3 h-3 md:w-4 md:h-4 text-white fill-white" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-white font-black uppercase tracking-widest text-[10px] md:text-[11px]">Watch Demo</div>
                  <div className="text-white/50 text-[9px] md:text-[10px] mt-0.5 font-medium">See how it works</div>
                </div>
                <div className="text-left sm:hidden">
                   <div className="text-white font-black uppercase tracking-widest text-[10px]">Demo</div>
                </div>
              </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Grid Stats Section ── */}
      <section className="py-16 md:py-24 bg-[#0c0f0f]">
        <div className="max-w-5xl mx-auto px-5 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            
            {/* Large Feature Card */}
            <div className="bg-gradient-to-b from-[#262626] to-[#1A1A1A] border border-[#262626] p-6 md:p-8 rounded-[16px] relative overflow-hidden group flex flex-col justify-between">
              <div className="relative z-10">
                <span className="text-[#BFF367] font-black text-[10px] md:text-xs tracking-widest uppercase mb-2 md:mb-3 block">Command Center</span>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-3 md:mb-4 tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>Total Control Over Your Facility</h2>
                <p className="text-white/70 text-sm max-w-sm mb-6 md:mb-8 leading-relaxed">
                  Monitor every court, every trainer, and every booking from a single, unified interface designed for high-performance management.
                </p>
                
                <div className="space-y-3 md:space-y-4 max-w-sm">
                  <div className="flex justify-between text-[10px] md:text-xs font-black text-white/70 tracking-widest">
                    <span>PEAK CAPACITY</span>
                    <span>94%</span>
                  </div>
                  <div className="h-2.5 md:h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                     <div className="h-full bg-[#BFF367] w-[94%]" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 4px, #121414 4px, #121414 6px)" }}></div>
                  </div>
                </div>
              </div>
              
              {/* decorative bg */}
              <div className="absolute right-0 bottom-0 w-full md:w-1/2 h-1/2 md:h-full opacity-10 md:opacity-20 pointer-events-none grayscale group-hover:grayscale-0 transition-all duration-700 mt-10 md:mt-0">
                 <img src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'; }} alt="Stadium" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Small Data Card */}
            <div className="bg-gradient-to-b from-[#262626] to-[#1A1A1A] border border-[#BFF367]/20 p-6 md:p-8 rounded-[16px] flex flex-col justify-between group">
               <div>
                  <Zap className="w-8 h-8 md:w-8 md:h-8 text-[#BFF367] fill-[#BFF367] mb-4 md:mb-5 drop-shadow-[0_0_15px_rgba(191,243,103,0.5)] group-hover:scale-110 transition-transform" />
                  <h3 className="text-white text-xl md:text-2xl font-black mb-2 md:mb-3 uppercase tracking-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>Lightning Fast Onboarding</h3>
                  <p className="text-white/70 text-xs md:text-sm leading-relaxed">
                    Get your venue listed and start receiving automated bookings in under 15 minutes. Our system integrates with your existing workflow seamlessly.
                  </p>
               </div>
               <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-white/5">
                  <div className="flex items-center gap-3 md:gap-4">
                     <div className="flex -space-x-2 md:-space-x-3">
                        <img src="https://i.pravatar.cc/100?img=12" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#1A1A1A] object-cover" alt="User" />
                        <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#1A1A1A] object-cover" alt="User" />
                        <img src="https://i.pravatar.cc/100?img=47" className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-[#1A1A1A] object-cover" alt="User" />
                     </div>
                     <span className="text-[10px] md:text-xs font-black text-white/70 tracking-wide">+2k Venue Owners</span>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Final Section ── */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-black">
        <div className="max-w-2xl mx-auto px-5 md:px-6 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight" style={{ fontFamily: "'Open Sans', sans-serif" }}>Ready to Scale Your Sports Business?</h2>
          <p className="text-white/70 text-xs md:text-base max-w-xl mx-auto mb-8 md:mb-10">
            Join the fastest-growing network of sports venues and turn your operation into a well-oiled machine.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 w-full px-4 md:px-0">
             {renderActionButton("cta")}
             <button className="border border-white/20 text-white px-6 py-3 md:px-8 md:py-3.5 font-black text-[11px] md:text-sm rounded-[8px] hover:bg-white/5 transition-colors">
               Contact Sales
             </button>
          </div>
        </div>
        
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, #BFF367 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>
      </section>

      {/* ── Document Verification Modal ── */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-[10px] p-6 md:p-8 w-full max-w-lg relative animate-fadeInUp">
            <button 
              onClick={() => setShowDocumentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-8 uppercase tracking-wider text-white text-center" style={{ fontFamily: "'Open Sans'" }}>Document Verification</h2>
            
            <form className="space-y-6 mt-4" onSubmit={handleDocumentSubmit}>
              
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {/* Aadhaar Upload Box */}
                <label className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${aadharFront && aadharBack ? 'opacity-80' : ''}`}>
                  <span className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>AADHAAR CARD</span>
                  <div className={`relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] p-2 md:p-3 overflow-hidden shadow-inner flex flex-col justify-between transition-all ${aadharFront && aadharBack ? 'ring-2 ring-[#BFF367]' : 'group-hover:ring-2 group-hover:ring-[#BFF367]'}`}>
                    {aadharFront && aadharBack ? (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <FileCheck className="text-[#BFF367] mb-2" size={32} />
                        <span className="text-white font-bold tracking-wider uppercase text-center text-xs" style={{ fontFamily: "'Inter'" }}>Aadhaar Uploaded</span>
                      </div>
                    ) : (
                      <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-opacity ${aadharFront && !aadharBack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         <span className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs" style={{ fontFamily: "'Inter'" }}>
                           {aadharFront ? "Upload Aadhaar Back" : "Upload Aadhaar Front"}
                         </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start opacity-60">
                      <Landmark className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                      <div className="space-y-1 md:space-y-1.5 flex flex-col items-end mt-0.5">
                        <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:gap-3 mt-1 opacity-60">
                      <div className="w-10 h-12 md:w-12 md:h-14 bg-gray-400/30 rounded-[8px] overflow-hidden flex items-end justify-center border border-gray-400/20">
                        <User className="w-8 h-8 md:w-10 md:h-10 text-gray-600 -mb-1.5" fill="currentColor" />
                      </div>
                      <div className="flex-1 space-y-2 md:space-y-2.5 mt-0.5 md:mt-1">
                        <div className="w-full h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                        <div className="w-5/6 h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                        <div className="w-4/6 h-2 md:h-2.5 bg-gray-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAadharUpload} disabled={aadharFront && aadharBack} />
                </label>

                {/* PAN Upload Box */}
                <label className={`flex flex-col items-center gap-3 md:gap-4 cursor-pointer group ${panFront && panBack ? 'opacity-80' : ''}`}>
                  <span className="text-white font-black tracking-wider uppercase text-center text-sm md:text-base" style={{ fontFamily: "'Inter'" }}>PAN CARD</span>
                  <div className={`relative w-full h-[110px] md:h-[130px] bg-[#D9D9D9] rounded-[10px] overflow-hidden shadow-inner flex flex-col justify-between transition-all ${panFront && panBack ? 'ring-2 ring-[#BFF367]' : 'group-hover:ring-2 group-hover:ring-[#BFF367]'}`}>
                    {panFront && panBack ? (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <FileCheck className="text-[#BFF367] mb-2" size={32} />
                        <span className="text-white font-bold tracking-wider uppercase text-center text-xs" style={{ fontFamily: "'Inter'" }}>PAN Uploaded</span>
                      </div>
                    ) : (
                      <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-opacity ${panFront && !panBack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                         <span className="text-white font-bold tracking-wider uppercase text-center text-[10px] md:text-xs" style={{ fontFamily: "'Inter'" }}>
                           {panFront ? "Upload PAN Back" : "Upload PAN Front"}
                         </span>
                      </div>
                    )}
                    <div className="w-full h-5 md:h-6 bg-gray-400/60 flex justify-between items-center px-2 md:px-3 opacity-60 shrink-0">
                      <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-600 rounded-sm"></div>
                      <div className="w-12 md:w-20 h-1.5 md:h-2 bg-gray-600 rounded-full"></div>
                    </div>
                    <div className="p-2 md:p-3 flex-1 flex flex-col justify-between opacity-60">
                      <div className="flex gap-1.5 md:gap-2">
                        <div className="flex-1 space-y-1.5 md:space-y-2 mt-0.5">
                          <div className="flex gap-1">
                            <div className="w-6 md:w-10 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                            <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-10 md:w-16 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                            <div className="w-4 md:w-8 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                          </div>
                          <div className="w-8 md:w-14 h-1.5 md:h-2 bg-gray-500 rounded-full"></div>
                        </div>
                        <div className="w-10 md:w-14 space-y-1 md:space-y-1.5 mt-0.5">
                           <div className="w-full h-1 md:h-1.5 bg-gray-500 rounded-full"></div>
                           <div className="w-3/4 h-1 md:h-1.5 bg-gray-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-gray-600 font-bold tracking-widest font-mono text-[8px] md:text-[10px]">ABCDE1234F</span>
                        <QrCode className="w-6 h-6 md:w-8 md:h-8 text-gray-600" />
                      </div>
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePanUpload} disabled={panFront && panBack} />
                </label>
              </div>

              <div className="flex justify-center mt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full max-w-[240px] py-3 rounded-[10px] font-bold text-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  style={{ background: GRADIENT, fontFamily: "'Inter'" }}
                >
                  {isSubmitting ? (
                     <><Loader2 size={20} className="animate-spin" /> Submitting</>
                  ) : (
                     "Submit & Register"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
