import { useState, useEffect, useRef } from "react";
import { Check, Trophy, Activity, Zap, Target, MapPin, ChevronLeft, Loader2, Image as ImageIcon, ChevronDown } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { updateUser, login } from "@redux/slices/authSlice";
import { searchLocations } from "@utils/locationService";
import { auth } from "../../../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const getNameFromEmail = (email) => {
  if (!email) return "";
  const prefix = email.split("@")[0];
  const clean = prefix.replace(/[0-9]/g, "").replace(/[\._\-]/g, " ").trim();
  return clean
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
};

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div 
        className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white hover:border-white/20 outline-none transition-all cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-white" : "text-white/40"}>
          {value ? options.find(o => o.value === value)?.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-white/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-[#333333] rounded-[10px] max-h-[220px] overflow-y-auto z-[999] shadow-xl custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
          {options.map((opt) => (
            <div 
              key={opt.value}
              className={`px-4 py-3 cursor-pointer transition-colors text-sm ${value === opt.value ? 'bg-[#BFF367]/10 text-[#BFF367] font-bold' : 'text-white/80 hover:bg-white/5 hover:text-white'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize from initialData depending on authMethod (google vs email/phone)
  const isGoogle = initialData?.authMethod === 'google';
  const needsPhoneVerification = initialData?.authMethod === 'google' || initialData?.authMethod === 'email';
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    name: "",
    email: "",
    phone: "",
    gender: "",
    dob: "",
    sportTypes: [],
    password: "",
    otp: "",
  });

  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  const days = Array.from({ length: 31 }, (_, i) => ({ value: (i + 1).toString().padStart(2, '0'), label: (i + 1).toString().padStart(2, '0') }));
  const months = [
    { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' }, { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' }, { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' }, { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => ({ value: (currentYear - i).toString(), label: (currentYear - i).toString() }));

  useEffect(() => {
    if (dobDay && dobMonth && dobYear) {
      setFormData(prev => ({ ...prev, dob: `${dobYear}-${dobMonth}-${dobDay}` }));
    }
  }, [dobDay, dobMonth, dobYear]);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [activeLocationTab, setActiveLocationTab] = useState("map");
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
        name: prev.name || derivedName || "",
        firstName: prev.firstName || derivedName.split(' ')[0] || "",
        lastName: prev.lastName || derivedName.split(' ').slice(1).join(' ') || "",
        email: prev.email || emailVal || "",
        phone: prev.phone || (isGoogle ? (userObj.phone || "") : (initialData?.phone || "")),
        gender: prev.gender || (isGoogle ? (userObj.gender || "") : ""),
        dob: prev.dob || (isGoogle ? (userObj.dob ? new Date(userObj.dob).toISOString().split('T')[0] : "") : ""),
        location: prev.location || (isGoogle ? (userObj.city || userObj.location || "") : ""),
        sportTypes: prev.sportTypes?.length ? prev.sportTypes : (isGoogle ? (userObj.sportTypes || []) : []),
        password: prev.password || initialData?.password || "",
        otp: prev.otp || initialData?.otp || "",
      }));

      if (isGoogle && userObj.profilePic) {
        setPreviewImage(userObj.profilePic);
      }

      // Set DOB state if available
      const existingDob = formData.dob || (isGoogle ? (userObj.dob ? new Date(userObj.dob).toISOString().split('T')[0] : "") : "");
      if (existingDob && existingDob.includes('-')) {
        const [y, m, d] = existingDob.split('-');
        setDobYear(y);
        setDobMonth(m);
        setDobDay(d);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen && needsPhoneVerification && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  }, [isOpen, needsPhoneVerification]);

  const handleSendPhoneOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      return toast.error("Please enter a valid 10-digit phone number");
    }
    setSendingPhoneOtp(true);
    try {
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+91${formData.phone}`;
      if (window.recaptchaVerifier) {
        const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        window.confirmationResult = confirmationResult;
        setPhoneOtpSent(true);
        toast.success("Verification OTP sent successfully!");
      } else {
        toast.error("Recaptcha not initialized");
      }
    } catch (error) {
      console.error("Firebase send error:", error);
      toast.error(error.message || "Failed to send verification OTP");
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length < 6) {
      return toast.error("Please enter the 6-digit OTP");
    }
    setVerifyingPhoneOtp(true);
    let firebaseIdToken = null;
    try {
      if (window.confirmationResult) {
        const result = await window.confirmationResult.confirm(phoneOtp);
        firebaseIdToken = await result.user.getIdToken();
      }

      const endpoint = isGoogle 
        ? "/api/user/auth/verify-phone-otp" 
        : "/api/user/auth/verify-otp";

      const payload = isGoogle 
        ? { phone: formData.phone, otp: firebaseIdToken || phoneOtp }
        : { email: formData.email, phone: formData.phone, otp: firebaseIdToken || phoneOtp };

      const res = await axiosInstance.post(endpoint, payload);
      if (res.data.success) {
        setIsPhoneVerified(true);
        if (res.data.registrationToken) {
          setPhoneRegistrationToken(res.data.registrationToken);
        }
        toast.success("Phone number verified successfully!");
      }
    } catch (error) {
      console.error("Firebase OTP confirmation error:", error);
      toast.error(error.response?.data?.message || error.message || "Invalid OTP");
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.firstName) return toast.error("Please enter your first name");
      if (!formData.dob) return toast.error("Please select your date of birth");
    } else if (step === 2) {
      if (!formData.gender) return toast.error("Please select your gender");
    } else if (step === 3) {
      if (formData.sportTypes.length === 0) return toast.error("Please select at least one sport");
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
    if (formData.sportTypes.length === 0) return toast.error("Please select at least one sport");
    
    // Only require email/phone/password validation if they are rendered for the specific flow
    if (!isGoogle && initialData?.authMethod === 'phone') {
      if (!formData.email) return toast.error("Email required");
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return toast.error("Please enter a valid email address (e.g., name@example.com)");
      }
    }
    if (!formData.password) return toast.error("Please create a password");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (needsPhoneVerification && !isPhoneVerified) return toast.error("Please verify your phone number via OTP");

    setLoading(true);
    try {
      const payloadName = formData.firstName + (formData.lastName ? ' ' + formData.lastName : '');
      if (isGoogle) {
        const res = await axiosInstance.put("/api/user/auth/updateProfile", {
          ...formData,
          name: payloadName,
          isOnboarded: true
        });
        if (res.data.success) {
          dispatch(updateUser(res.data.user));
          
          if (formData.profilePic && formData.profilePic instanceof File) {
            const formDataImage = new FormData();
            formDataImage.append('profilePicture', formData.profilePic);
            try {
              const picRes = await axiosInstance.post("/api/user/auth/profile-picture", formDataImage, {
                headers: { 
                  'Content-Type': 'multipart/form-data',
                }
              });
              if (picRes.data.success) {
                dispatch(updateUser({ profilePic: picRes.data.profilePic }));
              }
            } catch (err) {
              console.error("Failed to upload profile picture", err);
            }
          }

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
          name: payloadName,
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
        
        if (formData.profilePic && formData.profilePic instanceof File) {
          const formDataImage = new FormData();
          formDataImage.append('profilePicture', formData.profilePic);
          try {
            const picRes = await axiosInstance.post("/api/user/auth/profile-picture", formDataImage, {
              headers: { 
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${result.token}`
              }
            });
            if (picRes.data.success) {
              dispatch(updateUser({ profilePic: picRes.data.profilePic }));
            }
          } catch (err) {
            console.error("Failed to upload profile picture", err);
          }
        }

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[900px] h-[580px] max-h-[90vh] bg-[#161616] flex relative animate-in slide-in-from-bottom-8 duration-500 ease-out rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Left Side: Image Holder */}
        <div className="hidden md:block w-1/2 relative bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <img 
            src={step === 2 ? "/gender_bg.png" : step === 3 ? "/interests_bg.png" : step === 4 ? "/almost_done_bg.png" : "/onboarding_bg.png"} 
            alt="Auth Background" 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          />
        </div>

        {/* Right Side: Form Area */}
        <div className="w-full md:w-1/2 flex flex-col relative bg-[#161616]">
          {/* Progress Bar (Hidden for step 1 to match design) */}
          {step > 1 && (
            <div className="flex h-1.5 bg-[#000000] absolute top-0 left-0 right-0 overflow-hidden z-20">
              <div 
                className="bg-[#BFF367] transition-all duration-500 shadow-[0_0_10px_#BFF367]" 
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          )}

          <div className="p-5 md:p-6 pt-6 md:pt-8 flex-1 flex flex-col min-h-0 relative z-10">
          {/* Header */}
          {step === 1 ? (
            <div className="text-left mb-3 shrink-0">
              <h2 className="text-[24px] md:text-[28px] font-bold text-white tracking-tight leading-[1.1] font-['Inter']">
                Tell me some<br />details please?
              </h2>
            </div>
          ) : step === 2 ? (
            <div className="text-left mb-6 shrink-0">
              <h2 className="text-[32px] md:text-[36px] font-bold text-white tracking-tight leading-[1.1] font-['Inter']">
                What is<br />your gender?
              </h2>
              <p className="text-white/60 text-sm mt-3 leading-relaxed">
                This help us find you more<br />relevant content
              </p>
            </div>
          ) : (
            <div className="text-left mb-6 shrink-0">
              <h2 className="text-[32px] md:text-[40px] font-black text-white leading-tight mb-2 uppercase">
                {step === 3 && (
                  <>WHAT ARE YOU<br />INTERESTED IN?</>
                )}
                {step === 4 && "ALMOST DONE!"}
              </h2>
              <p className="text-[#999999] text-[13px] md:text-[14px]">
                {step === 3 && "Select sports to find relevant content"}
                {step === 4 && "Finalize your account details"}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col justify-start min-h-0 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-bottom-8 duration-300">
                
                {/* Image Upload Placeholder */}
                <div className="flex justify-center mb-3 mt-0">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[80px] h-[80px] rounded-full bg-[#222222] flex items-center justify-center relative cursor-pointer border border-transparent hover:border-[#BFF367]/50 transition-colors group shadow-lg overflow-hidden"
                  >
                    {previewImage ? (
                      <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={22} className="text-white/40 group-hover:text-white/60 transition-colors" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setPreviewImage(URL.createObjectURL(file));
                        setFormData({ ...formData, profilePic: file });
                      }
                    }} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">First Name</span>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-[#222222] border border-transparent rounded-[10px] py-3 px-4 text-white focus:border-white/20 outline-none transition-all text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Last Name</span>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-[#222222] border border-transparent rounded-[10px] py-3 px-4 text-white focus:border-white/20 outline-none transition-all text-sm"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Date of Birth</span>
                  <div className="flex gap-2">
                    <CustomSelect 
                      value={dobDay} 
                      onChange={setDobDay} 
                      options={days} 
                      placeholder="DD" 
                    />
                    <CustomSelect 
                      value={dobMonth} 
                      onChange={setDobMonth} 
                      options={months} 
                      placeholder="MM" 
                    />
                    <CustomSelect 
                      value={dobYear} 
                      onChange={setDobYear} 
                      options={years} 
                      placeholder="YYYY" 
                    />
                  </div>
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="flex justify-center gap-5 animate-in slide-in-from-bottom-8 duration-300 mt-6">
                <button
                  onClick={() => setFormData({...formData, gender: "Male"})}
                  className={`w-[158px] h-[228px] shrink-0 rounded-[16px] border-[1.5px] transition-all duration-300 relative overflow-hidden flex flex-col pt-5 ${
                    formData.gender === "Male" ? "border-white bg-[#161616]" : "border-[#2D2D2D] bg-[#111111]"
                  }`}
                >
                  <span className="text-white font-medium text-[15px] relative z-10 mb-2">Male</span>
                  <div className="flex-1 w-full relative">
                    <img 
                      src={formData.gender === "Male" ? "/gender/male_selected.png" : "/gender/male_default.png"} 
                      alt="Male" 
                      className="absolute inset-0 w-full h-full object-cover object-bottom"
                    />
                  </div>
                </button>

                <button
                  onClick={() => setFormData({...formData, gender: "Female"})}
                  className={`w-[158px] h-[228px] shrink-0 rounded-[16px] border-[1.5px] transition-all duration-300 relative overflow-hidden flex flex-col pt-5 ${
                    formData.gender === "Female" ? "border-white bg-[#161616]" : "border-[#2D2D2D] bg-[#111111]"
                  }`}
                >
                  <span className="text-white font-medium text-[15px] relative z-10 mb-2">Female</span>
                  <div className="flex-1 w-full relative">
                    <img 
                      src={formData.gender === "Female" ? "/gender/female_selected.png" : "/gender/female_default.png"} 
                      alt="Female" 
                      className="absolute inset-0 w-full h-full object-cover object-bottom"
                    />
                  </div>
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in slide-in-from-bottom-8 duration-300">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-3 block shrink-0">Pick Your Sports</span>
                  <div className="grid grid-cols-2 gap-4">
                    {sports.map((sport) => {
                      const isSelected = formData.sportTypes.includes(sport.name);
                      return (
                        <button
                          key={sport.name}
                          onClick={() => toggleSport(sport.name)}
                          className={`group relative w-full aspect-[4/5] rounded-[16px] transition-all duration-300 overflow-hidden ${ isSelected ? "scale-[1.02] z-10" : "border-[1.5px] border-[#2D2D2D] opacity-60 hover:opacity-100 hover:border-[#444]" }`}
                        >
                          {isSelected && (
                            <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                              {/* Faint solid border */}
                              <rect 
                                x="1" y="1" 
                                width="calc(100% - 2px)" height="calc(100% - 2px)" 
                                rx="15" 
                                fill="none" 
                                stroke="#BFF367" 
                                strokeWidth="2" 
                                opacity="0.2"
                              />
                              {/* Traveling highlight border */}
                              <rect 
                                x="1" y="1" 
                                width="calc(100% - 2px)" height="calc(100% - 2px)" 
                                rx="15" 
                                fill="none" 
                                stroke="#BFF367" 
                                strokeWidth="3" 
                                pathLength="100"
                                strokeDasharray="30 70" 
                                strokeLinecap="round"
                              >
                                <animate 
                                  attributeName="stroke-dashoffset" 
                                  values="100;0" 
                                  dur="2.5s" 
                                  calcMode="linear"
                                  repeatCount="indefinite" 
                                />
                              </rect>
                            </svg>
                          )}
                          
                          <div className="absolute inset-0 w-full h-full rounded-[16px] overflow-hidden flex flex-col justify-end">
                            <img 
                              src={`/sports/${sport.name.toLowerCase().replace(" ", "_")}.png`} 
                              alt={sport.name} 
                              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isSelected ? "scale-105" : "group-hover:scale-110"}`} 
                            />
                            
                            {/* Gradient Overlay for Text Visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                            
                            <span className="relative z-10 mb-3 font-black text-white text-[13px] tracking-widest uppercase text-center w-full">{sport.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-300">
                <div className="space-y-5">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Account Details</span>
                  
                  <div className="block" ref={locationRef}>
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Your City/Area</span>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10" size={18} />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        onFocus={() => setShowSuggestions(locationSuggestions.length > 0)}
                        placeholder="Select your location"
                        className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 pl-12 pr-4 text-white focus:border-white/20 outline-none transition-all placeholder-white/20"
                      />
                      {isSearchingLocation && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-[#BFF367] animate-spin" />
                        </div>
                      )}
                      {showSuggestions && locationSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#222222] border border-white/10 rounded-[10px] overflow-hidden z-[110] shadow-2xl max-h-[160px] overflow-y-auto custom-scrollbar">
                          {locationSuggestions.map((suggestion, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => handleSelectLocation(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-[#BFF367]/10 text-white/80 hover:text-white border-b border-white/5 last:border-0 transition-colors flex flex-col gap-0.5"
                            >
                              <span className="text-sm font-bold">{suggestion.city || suggestion.display_name.split(',')[0]}</span>
                              <span className="text-[10px] text-white/40 truncate">{suggestion.display_name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isGoogle && initialData?.authMethod === 'phone' && (
                    <label className="block">
                      <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Email Address</span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all"
                      />
                    </label>
                  )}

                  {(!isGoogle && initialData?.authMethod === 'email') || (isGoogle && !initialData?.user?.phone) ? (
                    <label className="block">
                      <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Phone Number</span>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
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
                            className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        
                        {needsPhoneVerification && !isPhoneVerified && (
                          <button
                            type="button"
                            onClick={handleSendPhoneOtp}
                            disabled={sendingPhoneOtp || !formData.phone || formData.phone.length < 10}
                            className="px-4 bg-[#BFF367]/10 hover:bg-[#BFF367]/20 border border-[#BFF367]/30 rounded-[8px] font-bold text-xs uppercase tracking-wider text-[#BFF367] transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap animate-pulse"
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
                              className="flex-1 bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-3 px-4 text-white placeholder:text-white/10 focus:border-[#BFF367] focus:ring-1 focus:ring-[#BFF367] outline-none transition-all text-center tracking-widest font-black"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyPhoneOtp}
                              disabled={verifyingPhoneOtp || phoneOtp.length < 6}
                              className="px-6 bg-[#BFF367] hover:scale-[1.02] active:scale-[0.98] rounded-[8px] font-black text-xs uppercase tracking-wider text-black transition-all disabled:opacity-40 disabled:scale-100"
                            >
                              {verifyingPhoneOtp ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify"}
                            </button>
                          </div>
                        </div>
                      )}
                    </label>
                  ) : null}

                  <label className="block pt-2">
                    <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Create Password</span>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Must be at least 6 characters"
                      className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4 mt-auto shrink-0 z-10 bg-[#161616]">
            <div className="flex w-full h-[52px] gap-4">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="w-[110px] shrink-0 bg-[#000000] hover:bg-white/10 text-white h-full rounded-[10px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border border-[#2D2D2D]"
                >
                  <ChevronLeft size={16} />
                  BACK
                </button>
              )}
              
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-[#60E5D0] to-[#A2F86D] text-black h-full rounded-[10px] font-medium text-[15px] flex items-center justify-center transition-all active:scale-[0.98] disabled:opacity-50"
                >
                CONTINUE
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || formData.sportTypes.length === 0}
                className="flex-1 bg-gradient-to-r from-[#60E5D0] to-[#A2F86D] text-black h-full rounded-[10px] font-medium text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Trophy size={18} />
                    ENTER THE ARENA
                  </>
                )}
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  </div>
  );
};

export default OnboardingModal;
