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
  ShieldAlert,
  Loader2,
  Navigation
} from "lucide-react";
import toast from "react-hot-toast";
import { searchLocations } from "@user/utils/locationService";

const PRI = "#CCFF00";

export default function BusinessRegistration() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleFromUrl = searchParams.get("role") || "owner";
  
  const { user, isLoggedIn } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    role: roleFromUrl,
    portfolioUrl: "",
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

  const [files, setFiles] = useState({
    PAN: null,
    AADHAR: null,
    BUSINESS: null,
    GOOGLE: null,
    GST: null,
    VENUE: null
  });

  const isOwner = formData.role === 'owner' || formData.role === 'VENUE_OWNER';

  const handleFileChange = (type, file) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const [hasRoleConflict, setHasRoleConflict] = useState(false);
  const [existingRole, setExistingRole] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

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

  useEffect(() => {
    if (!isLoggedIn) {
      // If guest, redirect to specific professional signup pages based on the role
      if (roleFromUrl === 'owner' || roleFromUrl === 'VENUE_OWNER') {
        navigate("/signup/venue");
      } else if (roleFromUrl === 'coach') {
        navigate("/signup/coach");
      } else if (roleFromUrl === 'umpire') {
        navigate("/signup/official");
      } else if (roleFromUrl === 'streamer') {
        navigate("/signup/streamer");
      } else {
        toast.error("Please login first to register your business");
        navigate("/login?redirect=" + encodeURIComponent("/business/register?role=" + roleFromUrl));
      }
      return;
    }

    // Sync user data to formData when it becomes available
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
        phone: prev.phone || user.phone || ""
      }));
    }

    // Check for pending application status from Redux state
    if (user?.applicationStatus === "pending") {
      setIsPending(true);
      setPendingRole(user.applicationRole || roleFromUrl);
    }

    // Check if user already has a professional role
    const professionalRoles = ["owner", "venue_owner", "verified_venue_owner", "coach", "umpire", "streamer", "admin", "bmsp_admin"];
    const isLimitedUmpire = user?.role?.toLowerCase() === "limited_umpire";
    
    // limited_umpire is only a conflict if they aren't applying for umpire upgrade
    if (user?.role && (professionalRoles.includes(user.role.toLowerCase()) || (isLimitedUmpire && roleFromUrl !== "umpire"))) {
      setHasRoleConflict(true);
      setExistingRole(user.role);
    }
  }, [isLoggedIn, navigate, roleFromUrl, user]);

  // Debounced search for location suggestions
  useEffect(() => {
    const address = formData.businessDetails.address;
    const timer = setTimeout(async () => {
      if (address && address.length >= 3) {
        setIsSearching(true);
        const results = await searchLocations(address);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setIsSearching(false);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.businessDetails.address]);

  const handleSuggestionSelect = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        address: suggestion.display_name,
        city: suggestion.city || prev.businessDetails.city,
        state: suggestion.state || prev.businessDetails.state,
        zipCode: suggestion.postcode || prev.businessDetails.zipCode
      }
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting registration bundle...", { formData, files });

    if (hasRoleConflict) {
      toast.error("Role conflict detected. Please contact support.");
      return;
    }
    
    if (isPending) {
      toast.error("You already have a pending application.");
      return;
    }

    setLoading(true);

    try {
      // Consolidated Document validation
      const requiredDocs = isOwner 
        ? ['PAN', 'AADHAR', 'BUSINESS', 'GOOGLE', 'GST', 'VENUE']
        : ['PAN', 'AADHAR', 'BUSINESS', 'GOOGLE', 'GST'];

      const missingDocs = requiredDocs.filter(doc => !files[doc]);
      if (missingDocs.length > 0) {
        toast.error(`Please upload all required documents: ${missingDocs.join(", ")}`);
        setLoading(false);
        return;
      }

      // Mandatory field check
      const { businessName, registrationNumber, address, city, state, zipCode, specialization, experience } = formData.businessDetails;
      const { portfolioUrl, phone } = formData;

      if (!portfolioUrl) {
        toast.error("Portfolio link is mandatory");
        setLoading(false);
        return;
      }

      if (!phone) {
        toast.error("Contact phone number is mandatory");
        setLoading(false);
        return;
      }

      // Address validation for everyone
      if (!address || !city || !state || !zipCode) {
        toast.error("Please provide your full address details");
        setLoading(false);
        return;
      }

      if (isOwner) {
        if (!businessName || !registrationNumber) {
          toast.error("Please fill in all business details");
          setLoading(false);
          return;
        }
      } else {
        if (!specialization || !experience) {
          toast.error("Please fill in your specialization and experience");
          setLoading(false);
          return;
        }
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", phone);
      data.append("role", formData.role);
      data.append("portfolioUrl", portfolioUrl);
      data.append("businessDetails", JSON.stringify(formData.businessDetails));

      // Append all selected documents
      Object.keys(files).forEach(key => {
        if (files[key]) {
          data.append("documents", files[key], `${key}_${files[key].name}`);
        }
      });

      console.log("Sending request to backend...");
      const response = await axiosInstance.post("/api/user/auth/upgrade-request", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        toast.success("Application submitted successfully!");
        setSubmitted(true);
      } else {
        toast.error(response.data.message || "Submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMsg = error.response?.data?.message || "Failed to submit application. Check your connection.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Role Conflict ───
  if (hasRoleConflict && existingRole) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 p-12 rounded-[8px] border border-[#2D2D2D] bg-[#000000] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B]" />
          <div className="w-16 h-16 bg-[#F59E0B]/10 rounded-[8px] flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-[#F59E0B]" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Role <span className="text-[#F59E0B]">Conflict</span>
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Your account already holds the <span className="text-white capitalize font-semibold">{existingRole}</span> role. 
            Kridaz supports only one professional role per account.
          </p>
          <button
            onClick={() => {
              if (existingRole?.toLowerCase() === "coach") navigate("/coach");
              else if (existingRole?.toLowerCase() === "umpire") navigate("/umpire");
              else if (existingRole?.toLowerCase() === "streamer") navigate("/streamer");
              else if (["owner", "venue_owner", "verified_venue_owner"].includes(existingRole?.toLowerCase())) navigate("/partner");
              else if (["admin", "bmsp_admin"].includes(existingRole?.toLowerCase())) navigate("/admin");
              else navigate("/");
            }}
            className="w-full py-4 rounded-[8px] border border-[#2D2D2D] hover:border-[#F59E0B]/30 hover:text-[#F59E0B] transition-all font-normal uppercase tracking-widest text-[12px]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Application pending review ───
  if (isPending || submitted) {
    const displayRole = submitted ? formData.role : pendingRole;
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 p-12 rounded-[8px] border border-[#2D2D2D] bg-[#000000] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#CCFF00]" />
          <div className="w-16 h-16 bg-[#CCFF00]/10 rounded-[8px] flex items-center justify-center mx-auto mb-6">
            <Clock size={40} className="text-[#CCFF00] animate-pulse" />
          </div>
          <h2 className="text-4xl font-black uppercase tracking-tight">
            Application <span className="text-[#CCFF00]">Pending</span>
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Thank you for applying to be a{" "}
            <span className="text-white capitalize font-semibold">{displayRole}</span>. Our admin
            team is reviewing your registration details and documents.
          </p>
          <div className="bg-[#000000] rounded-[8px] p-5 text-[12px] text-left space-y-4 border border-[#2D2D2D]">
            <div className="flex items-center gap-3 text-gray-300">
              <CheckCircle2 size={18} className="text-[#CCFF00]" />
              <span>Application Received</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-[18px] h-[18px] border-2 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
              <span>Document Verification In-Progress</span>
            </div>
            <div className="flex items-center gap-3 text-white/20">
              <div className="w-[18px] h-[18px] border-2 border-[#2D2D2D] rounded-full" />
              <span>Final Approval &amp; Access</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-[8px] border border-[#2D2D2D] hover:border-[#CCFF00]/30 hover:text-[#CCFF00] transition-all font-normal uppercase tracking-widest text-[12px]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-4 pb-20 font-sans selection:bg-[#CCFF00] selection:text-black">
      <div className="w-full px-6">
        
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group">
          <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Go Back</span>
        </button>

        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          
          <div className="space-y-10">
            <div>
              <h1 className="text-5xl md:text-6xl font-black uppercase leading-none mb-4">
                Professional <br /> <span style={{ color: PRI }}>Registration.</span>
              </h1>
              <p className="text-gray-400 text-lg">Tell us about your business to get verified and access the Kridaz dashboard.</p>
            </div>

            {/* Role conflict banner removed as it's now handled by the early return view */}

            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">Full Name</label>
                   <input 
                     type="text" value={formData.name} disabled
                     className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[8px] h-14 px-5 text-[#878C9F] outline-none cursor-not-allowed"
                   />
                 </div>
                 <div className="space-y-2 group">
                   <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">Email Address</label>
                   <input 
                     type="email" value={formData.email} disabled
                     className="w-full bg-[#000000] border border-[#2D2D2D] rounded-[8px] h-14 px-5 text-[#878C9F] outline-none cursor-not-allowed"
                   />
                 </div>
              </div>

              <div className="p-8 rounded-[8px] border border-[#2D2D2D] bg-[#000000] space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-[60px] pointer-events-none" />
                
                <h3 className="text-lg font-semibold uppercase tracking-tight flex items-center gap-3">
                  {formData.role === 'owner' ? <Building2 className="text-[#CCFF00]" /> : <Award className="text-[#CCFF00]" />}
                  {formData.role === 'owner' ? 'Business Details' : 'Professional Profile'}
                </h3>

                <div className="grid grid-cols-2 gap-6">
                  {formData.role === 'owner' || formData.role === 'VENUE_OWNER' ? (
                    <>
                      <div className="space-y-2 group col-span-2">
                        <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" name="businessDetails.businessName"
                          value={formData.businessDetails.businessName}
                          onChange={handleChange}
                          placeholder="e.g. Dream Sports Arena"
                          className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                          Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" name="businessDetails.registrationNumber"
                          value={formData.businessDetails.registrationNumber}
                          onChange={handleChange}
                          placeholder="GSTIN or License No."
                          className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                          Business Phone <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 00000 00000"
                          className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2 group col-span-2">
                        <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                          Specialization <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" name="businessDetails.specialization"
                          value={formData.businessDetails.specialization}
                          onChange={handleChange}
                          placeholder="e.g. Advanced Cricket Coaching"
                          className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                          Years of Experience <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" name="businessDetails.experience"
                          value={formData.businessDetails.experience}
                          onChange={handleChange}
                          placeholder="e.g. 5+ Years"
                          className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2 group">
                        <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                          Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input 
                          type="text" name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 00000 00000"
                          className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] group-focus-within:text-[#CCFF00] transition-colors">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#CCFF00]" />
                    <input 
                      type="text" name="businessDetails.address"
                      value={formData.businessDetails.address}
                      onChange={handleChange}
                      autoComplete="off"
                      placeholder="Street name, Landmark"
                      className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 pl-12 pr-12 text-white outline-none transition-all"
                    />
                    
                    {isSearching && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-[#CCFF00] animate-spin" />
                      </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#000000] border border-[#2D2D2D] rounded-[8px] overflow-hidden z-50 shadow-2xl animate-in fade-in slide-in-from-top-2">
                          <div className="p-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                            {suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleSuggestionSelect(suggestion)}
                                  className="w-full flex items-start gap-3 p-3 rounded-[6px] hover:bg-[#CCFF00]/5 text-left transition-all group/item"
                                >
                                  <div className="p-2 bg-[#CCFF00]/10 rounded-[6px] transition-colors mt-0.5">
                                    <Navigation size={14} className="text-gray-500 group-hover/item:text-[#CCFF00]" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
                                      {suggestion.city || suggestion.display_name.split(',')[0]}
                                    </span>
                                    <span className="text-[9px] text-white/40 truncate">
                                      {suggestion.display_name}
                                    </span>
                                  </div>
                                </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <input 
                      type="text" name="businessDetails.city"
                      value={formData.businessDetails.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" name="businessDetails.state"
                      value={formData.businessDetails.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <input 
                      type="text" name="businessDetails.zipCode"
                      value={formData.businessDetails.zipCode}
                      onChange={handleChange}
                      placeholder="Zip Code"
                      className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Enhanced Document Section */}
              <div className="p-8 rounded-[8px] border border-[#2D2D2D] bg-[#000000] space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00]/5 blur-3xl pointer-events-none" />
                 
                 <h3 className="text-lg font-semibold uppercase tracking-tight flex items-center gap-3">
                   <FileText className="text-[#CCFF00]" /> Compliance Documents
                 </h3>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <DocumentUpload 
                     label="PAN Card" 
                     id="pan"
                     onFileSelect={(file) => handleFileChange("PAN", file)}
                     selectedFile={files.PAN}
                   />
                   <DocumentUpload 
                     label="Aadhar Card" 
                     id="aadhar"
                     onFileSelect={(file) => handleFileChange("AADHAR", file)}
                     selectedFile={files.AADHAR}
                   />
                   <DocumentUpload 
                     label="Business Registration" 
                     id="business"
                     onFileSelect={(file) => handleFileChange("BUSINESS", file)}
                     selectedFile={files.BUSINESS}
                   />
                   <DocumentUpload 
                     label="Google My Business" 
                     id="google"
                     onFileSelect={(file) => handleFileChange("GOOGLE", file)}
                     selectedFile={files.GOOGLE}
                   />
                   <DocumentUpload 
                     label="GST Certificate" 
                     id="gst"
                     onFileSelect={(file) => handleFileChange("GST", file)}
                     selectedFile={files.GST}
                   />
                    {isOwner && (
                      <DocumentUpload 
                        label="Venue Ownership Doc" 
                        id="venue"
                        onFileSelect={(file) => handleFileChange("VENUE", file)}
                        selectedFile={files.VENUE}
                      />
                    )}
                 </div>

                 <div className="pt-4 border-t border-[#2D2D2D]">
                   <label className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F] mb-2 block">Mandatory Portfolio Link</label>
                   <input 
                     type="url"
                     name="portfolioUrl"
                     value={formData.portfolioUrl || ''}
                     onChange={handleChange}
                     placeholder="e.g. Behance, Personal Website, or Instagram"
                     className="w-full bg-[#000000] border border-[#2D2D2D] focus:border-[#CCFF00]/50 rounded-[8px] h-14 px-5 text-white outline-none transition-all text-sm"
                   />
                 </div>
              </div>

              <button 
                type="submit"
                disabled={loading || hasRoleConflict}
                className={`w-full py-6 rounded-[8px] font-normal text-[13px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 ${
                  hasRoleConflict 
                    ? 'bg-[#2D2D2D] text-[#878C9F] cursor-not-allowed'
                    : 'bg-[#CCFF00] hover:opacity-90 text-black '
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span>Processing Application...</span>
                  </>
                ) : hasRoleConflict ? (
                  <>
                    <ShieldAlert size={20} />
                    <span>Cannot Apply Again</span>
                  </>
                ) : (
                  <>
                    <span>Submit Verification Bundle</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          <aside className="space-y-6">
             <div className="p-8 rounded-[8px] border border-[#2D2D2D] bg-[#000000] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <ShieldCheckIcon size={80} className="text-[#CCFF00]" />
                </div>
                <h4 className="text-[13px] font-semibold text-[#CCFF00] uppercase tracking-[0.3em] mb-4">Verification Policy</h4>
                <ul className="space-y-4">
                  {[
                    "Reviews take 24-48 hours",
                    "Valid registration required",
                    "Secure document handling",
                    "Email notification on status",
                    "Dedicated support access"
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-[12px] text-[#999999]">
                      <CheckCircle2 size={16} className="text-[#CCFF00] shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
             </div>

             <div className="p-8 rounded-[8px] border border-[#2D2D2D] bg-[#000000]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-[6px] bg-[#CCFF00]/10">
                    <Briefcase size={20} className="text-[#CCFF00]" />
                  </div>
                  <h4 className="text-[13px] font-semibold text-white uppercase tracking-[0.3em]">Partner Perks</h4>
                </div>
                <div className="space-y-4 text-gray-400 text-sm leading-relaxed">
                  <p>Join India's fastest growing sports ecosystem. Get access to:</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-[#000000] rounded-[8px] border border-[#2D2D2D]">
                      <span className="text-[#CCFF00] block font-semibold text-xl mb-1">0%</span>
                      <span className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F]">Initial Fee</span>
                    </div>
                    <div className="p-4 bg-[#000000] rounded-[8px] border border-[#2D2D2D]">
                      <span className="text-[#CCFF00] block font-semibold text-xl mb-1">24/7</span>
                      <span className="text-[10px] font-normal uppercase tracking-[0.3em] text-[#878C9F]">Support</span>
                    </div>
                  </div>
                </div>
             </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

function DocumentUpload({ label, id, onFileSelect, selectedFile }) {
  return (
    <div className="relative group">
      <input 
        type="file" 
        id={id} 
        className="hidden" 
        onChange={(e) => onFileSelect(e.target.files[0])}
        accept="image/*,.pdf"
      />
      <label 
        htmlFor={id}
        className={`flex flex-col items-center justify-center p-6 border border-dashed transition-all cursor-pointer h-32 text-center rounded-[8px]
          ${selectedFile 
            ? 'border-[#CCFF00] bg-[#CCFF00]/5' 
            : 'border-[#2D2D2D] bg-[#000000] hover:border-[#CCFF00]/50 hover:bg-[#CCFF00]/5'
          }`}
      >
        {selectedFile ? (
          <div className="space-y-1">
            <CheckCircle2 className="text-[#CCFF00] mx-auto mb-1" size={24} />
            <span className="text-[10px] font-bold text-[#CCFF00] uppercase truncate max-w-[140px] block">
              {selectedFile.name}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="w-10 h-10 bg-[#CCFF00]/10 rounded-[6px] flex items-center justify-center mx-auto mb-1 transition-transform">
               <FileText size={18} className="text-gray-500" />
            </div>
            <span className="text-[10px] font-normal text-[#878C9F] uppercase tracking-wider group-hover:text-[#CCFF00] transition-colors">
              {label}
            </span>
          </div>
        )}
      </label>
    </div>
  );
}

function ShieldCheckIcon({ size, className }) {
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




