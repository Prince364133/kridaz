// Business Registration Page for Professional Upgrades
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance.js";
import { 
  Building2, 
  GraduationCap, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  FileText, 
  ChevronLeft,
  Briefcase,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";

const PRI = "#84CC16";

export default function BusinessRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || "owner";
  
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: roleFromUrl,
    businessDetails: {
      businessName: "",
      registrationNumber: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      experience: "",
      specialization: "",
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login first to register your business");
      navigate("/login?redirect=" + encodeURIComponent("/business/register?role=" + roleFromUrl));
      return;
    }

    // Check if user already has a professional role
    const professionalRoles = ["owner", "VENUE_OWNER", "VERIFIED_VENUE_OWNER", "COACH", "UMPIRE", "admin", "BMSP_ADMIN"];
    if (user?.role && professionalRoles.includes(user.role)) {
      setHasRoleConflict(user.role);
    }
  }, [isAuthenticated, navigate, roleFromUrl, user?.role]);

  const [hasRoleConflict, setHasRoleConflict] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/upgrade-request", formData);
      if (response.data.success) {
        setSubmitted(true);
        toast.success(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit application");
    } finally {
      setLoading(false);
    }
  };

  if (hasRoleConflict) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 p-12 rounded-[40px] border border-red-500/10 bg-[#0A0A0A] relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
           <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <ShieldAlert size={40} className="text-red-500" />
           </div>
           <h2 className="text-4xl font-display uppercase tracking-tight">Role <span className="text-red-500">Conflict</span></h2>
           <p className="text-gray-400 leading-relaxed">
             You already have the <span className="text-white font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/5">{hasRoleConflict}</span> role assigned to this account.
           </p>
           <p className="text-sm text-gray-500 italic">
             To ensure focus and security, TurfSpot supports only one professional dashboard per account. Please use a different account if you wish to join as a {roleFromUrl}.
           </p>
           <button onClick={() => navigate("/")} className="w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs">
             Back to Home
           </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 p-12 rounded-[40px] border border-white/5 bg-[#0A0A0A] relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-[#84CC16]" />
           <div className="w-20 h-20 bg-[#84CC16]/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Clock size={40} className="text-[#84CC16] animate-pulse" />
           </div>
           <h2 className="text-4xl font-display uppercase tracking-tight">Application <span className="text-[#84CC16]">Pending</span></h2>
           <p className="text-gray-400 leading-relaxed">
             Thank you for applying to be a {formData.role}. Our admin team is currently reviewing your registration details and documents.
           </p>
           <div className="bg-white/5 rounded-2xl p-6 text-sm text-left space-y-4">
             <div className="flex items-center gap-3 text-gray-300">
               <CheckCircle2 size={18} className="text-[#84CC16]" />
               <span>Application Received</span>
             </div>
             <div className="flex items-center gap-3 text-gray-300">
               <div className="w-[18px] h-[18px] border-2 border-[#84CC16]/30 border-t-[#84CC16] rounded-full animate-spin" />
               <span>Document Verification In-Progress</span>
             </div>
             <div className="flex items-center gap-3 text-white/20">
               <div className="w-[18px] h-[18px] border-2 border-white/10 rounded-full" />
               <span>Final Approval & Access</span>
             </div>
           </div>
           <button onClick={() => navigate("/")} className="w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs">
             Back to Home
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 font-sans selection:bg-[#84CC16] selection:text-black">
      <div className="max-w-4xl mx-auto px-6">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Go Back</span>
        </button>

        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          
          <div className="space-y-10">
            <div>
              <h1 className="text-5xl md:text-6xl font-display uppercase leading-none mb-4">
                Professional <br /> <span style={{ color: PRI }}>Registration.</span>
              </h1>
              <p className="text-gray-400 text-lg">Tell us about your business to get verified and access the TurfSpot Command Center.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2 group">
                   <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Full Name</label>
                   <input 
                     type="text" value={formData.name} disabled
                     className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-gray-400 outline-none cursor-not-allowed"
                   />
                 </div>
                 <div className="space-y-2 group">
                   <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Email Address</label>
                   <input 
                     type="email" value={formData.email} disabled
                     className="w-full bg-white/5 border border-white/5 rounded-2xl h-14 px-5 text-gray-400 outline-none cursor-not-allowed"
                   />
                 </div>
              </div>

              <div className="p-8 rounded-[32px] border border-white/5 bg-[#0A0A0A] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#84CC16]/20" />
                
                <h3 className="text-xl font-display uppercase tracking-tight flex items-center gap-3">
                  {formData.role === 'owner' ? <Building2 className="text-[#84CC16]" /> : <Award className="text-[#84CC16]" />}
                  {formData.role === 'owner' ? 'Business Details' : 'Professional Profile'}
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {formData.role === 'owner' ? (
                    <>
                      <div className="space-y-2 group col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Business Name</label>
                        <input 
                          type="text" name="businessDetails.businessName" required
                          onChange={handleChange}
                          placeholder="e.g. Dream Sports Arena"
                          className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Registration Number</label>
                        <input 
                          type="text" name="businessDetails.registrationNumber" required
                          onChange={handleChange}
                          placeholder="GSTIN or License No."
                          className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Business Phone</label>
                        <input 
                          type="text" name="phone" required
                          onChange={handleChange}
                          placeholder="+91 00000 00000"
                          className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 group col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Specialization</label>
                        <input 
                          type="text" name="businessDetails.specialization" required
                          onChange={handleChange}
                          placeholder="e.g. Advanced Cricket Coaching"
                          className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Years of Experience</label>
                        <input 
                          type="text" name="businessDetails.experience" required
                          onChange={handleChange}
                          placeholder="e.g. 5+ Years"
                          className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Contact Phone</label>
                        <input 
                          type="text" name="phone" required
                          onChange={handleChange}
                          placeholder="+91 00000 00000"
                          className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 group-focus-within:text-[#84CC16] transition-colors">Full Address</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#84CC16]" />
                    <input 
                      type="text" name="businessDetails.address" required
                      onChange={handleChange}
                      placeholder="Street name, Landmark"
                      className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 pl-12 pr-5 text-white outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <input 
                      type="text" name="businessDetails.city" required
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" name="businessDetails.state" required
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" name="businessDetails.zipCode" required
                      onChange={handleChange}
                      placeholder="Zip Code"
                      className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-[32px] border border-white/5 bg-[#0A0A0A] space-y-6">
                 <h3 className="text-xl font-display uppercase tracking-tight flex items-center gap-3">
                  <FileText className="text-[#84CC16]" /> Verification Documents
                </h3>
                <p className="text-gray-500 text-sm italic">Note: For this demo, please provide a link to your business registration document or certification (e.g. Google Drive link).</p>
                <input 
                  type="url" required
                  placeholder="Paste document link here"
                  className="w-full bg-white/5 border border-white/5 focus:border-[#84CC16]/50 rounded-2xl h-14 px-5 text-white outline-none transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-[#84CC16] hover:bg-[#a3e635] text-black font-bold text-lg uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
                <ArrowRight size={20} />
              </button>
            </form>
          </div>

          <aside className="space-y-6">
             <div className="p-8 rounded-[40px] border border-white/5 bg-[#0A0A0A] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <ShieldCheck size={80} className="text-[#84CC16]" />
                </div>
                <h4 className="font-display uppercase text-[#84CC16] mb-4">Verification Policy</h4>
                <ul className="space-y-4">
                  {[
                    "Reviews take 24-48 hours",
                    "Valid registration required",
                    "Email notification on status",
                    "Access dashboard instantly"
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-400">
                      <CheckCircle2 size={16} className="text-[#84CC16] shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
             </div>

             <div className="p-8 rounded-[40px] border border-[#84CC16]/20 bg-[#84CC16]/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-[#84CC16]/10">
                    <Briefcase size={20} className="text-[#84CC16]" />
                  </div>
                  <h4 className="font-display uppercase text-white">Why Register?</h4>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Join our enterprise network to get access to advanced analytics, automated billing, and a global audience of sports enthusiasts.
                </p>
             </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

function ShieldCheck({ size, className }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
