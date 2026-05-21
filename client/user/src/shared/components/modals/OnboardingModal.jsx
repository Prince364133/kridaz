import { useState, useEffect, useRef } from "react";
import { Check, Trophy, Activity, Zap, Target, MapPin, Phone, Mail, User as UserIcon, Calendar, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { updateUser, login } from "@redux/slices/authSlice";
import { searchLocations } from "@utils/locationService";

const getNameFromEmail = (email) => {
  if (!email) return "";
  const prefix = email.split("@")[0];
  const clean = prefix.replace(/[0-9]/g, "").replace(/[\._\-]/g, " ").trim();
  return clean
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const OnboardingModal = ({ isOpen, onClose, initialData, onComplete }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Phone verification state
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [phoneRegistrationToken, setPhoneRegistrationToken] = useState("");

  // Initialize from initialData depending on authMethod (google vs email/phone)
  const isGoogle = initialData?.authMethod === 'google';
  const needsPhoneVerification = initialData?.authMethod === 'google' || initialData?.authMethod === 'email';
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    location: "",
    sportTypes: [],
    password: "",
    otp: "",
  });

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef(null);

  const sports = [
    { name: "Cricket", icon: <Trophy size={18} /> },
    { name: "Football", icon: <Activity size={18} /> },
    { name: "Badminton", icon: <Zap size={18} /> },
    { name: "Tennis", icon: <Target size={18} /> },
    { name: "Basketball", icon: <Activity size={18} /> },
    { name: "Volleyball", icon: <Zap size={18} /> },
    { name: "Table Tennis", icon: <Target size={18} /> },
    { name: "Pickleball", icon: <Trophy size={18} /> }
  ];

  const toggleSport = (sportName) => {
    setFormData(prev => ({
      ...prev,
      sportTypes: prev.sportTypes.includes(sportName)
        ? prev.sportTypes.filter(s => s !== sportName)
        : [...prev.sportTypes, sportName]
    }));
  };

  // Sync initialData to formData
  useEffect(() => {
    if (isOpen && initialData) {
      const isGoogle = initialData.authMethod === 'google';
      const userObj = isGoogle ? (initialData.user || {}) : {};
      
      const emailVal = isGoogle ? (userObj.email || "") : (initialData?.email || "");
      const derivedName = isGoogle 
        ? (userObj.name || getNameFromEmail(emailVal)) 
        : (initialData?.name || getNameFromEmail(emailVal));

      setFormData(prev => ({
        ...prev,
        name: prev.name || derivedName || "",
        email: prev.email || emailVal || "",
        phone: prev.phone || (isGoogle ? (userObj.phone || "") : (initialData?.phone || "")),
        gender: prev.gender || (isGoogle ? (userObj.gender || "") : ""),
        dob: prev.dob || (isGoogle ? (userObj.dob ? new Date(userObj.dob).toISOString().split('T')[0] : "") : ""),
        location: prev.location || (isGoogle ? (userObj.city || userObj.location || "") : ""),
        sportTypes: prev.sportTypes?.length ? prev.sportTypes : (isGoogle ? (userObj.sportTypes || []) : []),
        password: prev.password || initialData?.password || "",
        otp: prev.otp || initialData?.otp || "",
      }));
    }
  }, [isOpen, initialData]);

  const handleSendPhoneOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      return toast.error("Please enter a valid 10-digit phone number");
    }
    setSendingPhoneOtp(true);
    try {
      const endpoint = isGoogle 
        ? "/api/user/auth/send-phone-verification-otp" 
        : "/api/user/auth/send-otp";
      
      const payload = isGoogle 
        ? { phone: formData.phone } 
        : { email: formData.email, phone: formData.phone };

      const res = await axiosInstance.post(endpoint, payload);
      if (res.data.success) {
        setPhoneOtpSent(true);
        toast.success("Verification OTP sent successfully!");
        if (res.data.testOtp) {
          toast(`Test OTP: ${res.data.testOtp.phone}`, { icon: '🧑‍💻', duration: 10000 });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send verification OTP");
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length < 6) {
      return toast.error("Please enter the 6-digit OTP");
    }
    setVerifyingPhoneOtp(true);
    try {
      const endpoint = isGoogle 
        ? "/api/user/auth/verify-phone-otp" 
        : "/api/user/auth/verify-otp";

      const payload = isGoogle 
        ? { phone: formData.phone, otp: phoneOtp }
        : { email: formData.email, phone: formData.phone, otp: phoneOtp };

      const res = await axiosInstance.post(endpoint, payload);
      if (res.data.success) {
        setIsPhoneVerified(true);
        if (res.data.registrationToken) {
          setPhoneRegistrationToken(res.data.registrationToken);
        }
        toast.success("Phone verified successfully!");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name) return toast.error("Please enter your name");
      if (!formData.dob) return toast.error("Please select your date of birth");
      if (!formData.gender) return toast.error("Please select your gender");
      if (!formData.email) return toast.error("Valid email required");
      if (!formData.password) return toast.error("Please create a password");
      if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
      if (needsPhoneVerification && !isPhoneVerified) return toast.error("Please verify your phone number via OTP");
    } else if (step === 2) {
      if (!formData.location) return toast.error("Please enter your location");
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Location Autocomplete Effect
  useEffect(() => {
    if (!formData.location || formData.location.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchLocations(formData.location);
        setLocationSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.location]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (suggestion) => {
    setFormData({ ...formData, location: suggestion.display_name });
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (formData.sportTypes.length === 0) {
      toast.error("Please select at least one sport");
      return;
    }

    setLoading(true);
    try {
      if (isGoogle) {
        const res = await axiosInstance.put("/api/user/auth/updateProfile", {
          ...formData,
          isOnboarded: true
        });
        if (res.data.success) {
          dispatch(updateUser(res.data.user));
          toast.success("Profile completed! Welcome to the arena.");
          onComplete();
          onClose();
        }
      } else {
        const inviteToken = localStorage.getItem("pendingInvite");
        const umpireInvite = localStorage.getItem("umpireInvite");
        
        // Register newly created user via email/phone flow
        const payload = {
          ...formData,
          username: formData.email.split('@')[0] + Math.floor(Math.random()*1000), // temp username
          role: 'user',
          inviteToken,
          umpireInvite
        };
        
        // Pass either otp or phoneOtp depending on method
        if (initialData.authMethod === 'phone') {
          payload.registrationToken = initialData.registrationToken;
        } else if (initialData.authMethod === 'email') {
          payload.registrationToken = initialData.registrationToken;
          payload.phoneRegistrationToken = phoneRegistrationToken;
        } else {
          payload.otp = formData.otp;
        }

        const res = await axiosInstance.post("/api/user/auth/register", payload);
        const result = res.data;
        dispatch(login({ token: result.token, role: result.role, user: result.user }));
        toast.success("Registration complete! Welcome to the arena.");
        onComplete();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto custom-scrollbar">
      <div className="bg-[#000000] border border-[#2D2D2D] w-full max-w-xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500 max-h-[90vh] flex flex-col my-auto">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 bg-[#000000]">
          <div 
            className="bg-[#55DEE8] transition-all duration-500 shadow-[0_0_10px_#55DEE8]" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10 space-y-8 overflow-y-auto custom-scrollbar">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic">
              {step === 1 && "About You"}
              {step === 2 && "Where's the Arena?"}
              {step === 3 && "Pick Your Game"}
            </h2>
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">
              {step === 1 && "Step 1 of 3: Personal Details"}
              {step === 2 && "Step 2 of 3: Your Location"}
              {step === 3 && "Step 3 of 3: Your Interests"}
            </p>
          </div>

          {/* Content */}
          <div className="min-h-[280px] flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                <label className="block">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Full Name</span>
                  <div className="mt-2 relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Your name"
                      className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all"
                    />
                  </div>
                </label>

                {!isGoogle && initialData?.authMethod === 'phone' && (
                  <label className="block">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email Address</span>
                    <div className="mt-2 relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your@email.com"
                        className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 mt-1.5 ml-1 font-medium">* Required for invoices and bills</p>
                  </label>
                )}

                {(!isGoogle && initialData?.authMethod === 'email') || (isGoogle && !initialData?.user?.phone) ? (
                  <label className="block">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Phone Number</span>
                    <div className="mt-2 relative flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                        <input
                          type="tel"
                          maxLength={10}
                          value={formData.phone}
                          disabled={isPhoneVerified}
                          onChange={(e) => {
                            setFormData({...formData, phone: e.target.value.replace(/\D/g, '')});
                            if (phoneOtpSent) {
                              setPhoneOtpSent(false);
                              setIsPhoneVerified(false);
                            }
                          }}
                          placeholder="10-digit mobile number"
                          className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                      
                      {needsPhoneVerification && !isPhoneVerified && (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={sendingPhoneOtp || !formData.phone || formData.phone.length < 10}
                          className="px-4 bg-[#55DEE8]/10 hover:bg-[#55DEE8]/20 border border-[#55DEE8]/30 rounded-[8px] font-bold text-xs uppercase tracking-wider text-[#55DEE8] transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap animate-pulse"
                        >
                          {sendingPhoneOtp ? <Loader2 className="animate-spin w-4 h-4" /> : (phoneOtpSent ? "Resend" : "Get OTP")}
                        </button>
                      )}

                      {needsPhoneVerification && isPhoneVerified && (
                        <div className="px-4 bg-green-500/10 border border-green-500/30 rounded-[8px] font-bold text-xs uppercase tracking-wider text-green-400 flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                          <Check size={14} strokeWidth={3} />
                          Verified
                        </div>
                      )}
                    </div>

                    {needsPhoneVerification && phoneOtpSent && !isPhoneVerified && (
                      <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Phone Verification OTP</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit OTP"
                            className="flex-1 bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-3 px-4 text-white placeholder:text-white/10 focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all text-center tracking-widest font-black"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyPhoneOtp}
                            disabled={verifyingPhoneOtp || phoneOtp.length < 6}
                            className="px-6 bg-[#55DEE8] hover:scale-[1.02] active:scale-[0.98] rounded-[8px] font-black text-xs uppercase tracking-wider text-black transition-all disabled:opacity-40 disabled:scale-100"
                          >
                            {verifyingPhoneOtp ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify"}
                          </button>
                        </div>
                      </div>
                    )}
                  </label>
                ) : null}

                <label className="block">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Date of Birth</span>
                  <div className="mt-2 relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                      className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all [color-scheme:dark]"
                    />
                  </div>
                </label>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Gender</span>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setFormData({...formData, gender: g})}
                        className={`py-3 rounded-[8px] border font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                          formData.gender === g
                            ? "bg-[#55DEE8] border-[#55DEE8] text-black shadow-[0_0_20px_rgba(85,222,232,0.2)]"
                            : "bg-white/[0.03] border-[#2D2D2D] text-white/40 hover:border-[#2D2D2D]"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block pt-2">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Create Password</span>
                  <div className="mt-2 relative">
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Must be at least 6 characters"
                      className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 px-4 text-white placeholder:text-white/10 focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all"
                    />
                  </div>
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 rounded-[8px] bg-[#55DEE8]/5 border border-[#55DEE8]/20 flex items-start gap-4">
                  <div className="p-3 rounded-[8px] bg-[#55DEE8]/10 text-[#55DEE8]">
                    <MapPin size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold">Local Experience</h4>
                    <p className="text-white/40 text-xs">Tell us where you are to find venues and players near you.</p>
                  </div>
                </div>
                
                <label className="block" ref={locationRef}>
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Your City/Area</span>
                  <div className="mt-2 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        setFormData({...formData, location: e.target.value});
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(locationSuggestions.length > 0)}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-12 text-white placeholder:text-white/10 focus:border-[#55DEE8] focus:ring-1 focus:ring-[#55DEE8] outline-none transition-all"
                    />
                    {isSearchingLocation && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-[#55DEE8] animate-spin" />
                      </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#2D2D2D] rounded-[12px] overflow-hidden z-[110] shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                        {locationSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectLocation(suggestion)}
                            className="w-full px-5 py-3 text-left hover:bg-[#55DEE8]/10 text-white/80 hover:text-white border-b border-[#2D2D2D] last:border-0 transition-colors flex flex-col gap-0.5"
                          >
                            <span className="text-xs font-bold uppercase tracking-wider">{suggestion.city || suggestion.display_name.split(',')[0]}</span>
                            <span className="text-[9px] text-white/40 truncate">{suggestion.display_name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                {sports.map((sport) => (
                  <button
                    key={sport.name}
                    onClick={() => toggleSport(sport.name)}
                    className={`flex items-center gap-3 p-4 rounded-[8px] border transition-all duration-300 ${
                      formData.sportTypes.includes(sport.name)
                        ? "bg-[#55DEE8] border-[#55DEE8] text-black scale-[1.02] shadow-[0_0_20px_rgba(85,222,232,0.2)]"
                        : "bg-white/[0.03] border-[#2D2D2D] text-white/40 hover:border-[#2D2D2D] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={formData.sportTypes.includes(sport.name) ? "text-black" : "text-[#55DEE8]"}>
                      {sport.icon}
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest flex-1 text-left">{sport.name}</span>
                    {formData.sportTypes.includes(sport.name) && (
                      <Check size={14} strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 bg-[#000000] hover:bg-white/10 text-white h-16 rounded-[8px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border border-[#2D2D2D]"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-[2] bg-white text-black h-16 rounded-[8px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || formData.sportTypes.length === 0}
                className="flex-[2] bg-[#55DEE8] text-black h-16 rounded-[8px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(85,222,232,0.3)] disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Trophy size={20} />
                    Enter the Arena
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
