import { useState, useRef, useEffect } from "react";
import { PHONE_REGEX } from '@kridaz/shared-constants/validation';
import { Check, Trophy, Activity, Zap, Target, MapPin, Phone, User as UserIcon, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { updateUser } from "@redux/slices/authSlice";
import { searchLocations } from "@utils/locationService";

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: "",
    gender: "",
    location: "",
    sportTypes: [],
    password: "",
    confirmPassword: ""
  });

  // Populate existing fields if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        phone: user.phone || prev.phone,
        gender: user.gender || prev.gender,
        location: user.location || user.city || prev.location,
        sportTypes: user.sportTypes || prev.sportTypes,
      }));

      // If signed up via Google, skip password creation (Step 1)
      if (user.googleId) {
        setStep(2);
      }
    }
  }, [user]);

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

  const handleNext = () => {
    if (step === 1) {
      if (!formData.password || !formData.confirmPassword) {
        toast.error("Please create a password for your account");
        return;
      }
      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    } else if (step === 2) {
      if (!formData.phone || !formData.gender) {
        toast.error("Please fill in all details");
        return;
      }
      if (!PHONE_REGEX.test(formData.phone)) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
    } else if (step === 3) {
      if (!formData.location) {
        toast.error("Please enter your location");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    const minStep = user?.googleId ? 2 : 1;
    if (step > minStep) {
      setStep(prev => prev - 1);
    }
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
      const res = await axiosInstance.put("/api/user/auth/updateProfile", formData);
      if (res.data.success) {
        dispatch(updateUser(res.data.user));
        toast.success("Profile completed! Welcome to the arena.");
        localStorage.setItem("kridaz_onboarding_dismissed", "true");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-[#000000] border border-[#2D2D2D] w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 bg-[#000000]">
          <div 
            className="bg-[#CCFF00] transition-all duration-500 shadow-[0_0_10px_#CCFF00]" 
            style={{ width: `${((step - (user?.googleId ? 1 : 0)) / (user?.googleId ? 3 : 4)) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic">
              {step === 1 && "Secure Account"}
              {step === 2 && "Final Touches"}
              {step === 3 && "Where's the Arena?"}
              {step === 4 && "Pick Your Game"}
            </h2>
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">
              {step === 1 && "Step 1 of 4: Create Password"}
              {step === 2 && (user?.googleId ? "Step 1 of 3: Basic Profile" : "Step 2 of 4: Basic Profile")}
              {step === 3 && (user?.googleId ? "Step 2 of 3: Your Location" : "Step 3 of 4: Your Location")}
              {step === 4 && (user?.googleId ? "Step 3 of 3: Your Interests" : "Step 4 of 4: Your Interests")}
            </p>
          </div>

          {/* Content */}
          <div className="min-h-[280px] flex flex-col justify-center">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 rounded-[8px] bg-[#CCFF00]/5 border border-[#CCFF00]/20 flex items-start gap-4 mb-4">
                  <div className="p-3 rounded-[8px] bg-[#CCFF00]/10 text-[#CCFF00]">
                    <Zap size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-sm">One Last Thing!</h4>
                    <p className="text-white/40 text-[10px]">Create a password so you can login directly next time.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">New Password</span>
                    <div className="mt-2 relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Min 6 characters"
                        className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Confirm Password</span>
                    <div className="mt-2 relative">
                      <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        placeholder="Re-enter password"
                        className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all"
                      />
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Phone Number</span>
                    <div className="mt-2 relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="10-digit mobile number"
                        className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all"
                      />
                    </div>
                  </label>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Gender</span>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setFormData({...formData, gender: g})}
                          className={`py-4 rounded-[8px] border font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                            formData.gender === g
                              ? "bg-[#CCFF00] border-[#CCFF00] text-black shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                              : "bg-white/[0.03] border-[#2D2D2D] text-white/40 hover:border-[#2D2D2D]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 rounded-[8px] bg-[#CCFF00]/5 border border-[#CCFF00]/20 flex items-start gap-4">
                  <div className="p-3 rounded-[8px] bg-[#CCFF00]/10 text-[#CCFF00]">
                    <MapPin size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold">Local Experience</h4>
                    <p className="text-white/40 text-xs">Tell us where you are to find turfs and players near you.</p>
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
                      className="w-full bg-white/[0.03] border border-[#2D2D2D] rounded-[8px] py-4 pl-12 pr-12 text-white placeholder:text-white/10 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00] outline-none transition-all"
                    />
                    {isSearchingLocation && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-[#CCFF00] animate-spin" />
                      </div>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && locationSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-[#2D2D2D] rounded-[12px] overflow-hidden z-[110] shadow-2xl max-h-[200px] overflow-y-auto custom-scrollbar">
                        {locationSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectLocation(suggestion)}
                            className="w-full px-5 py-3 text-left hover:bg-[#CCFF00]/10 text-white/80 hover:text-white border-b border-[#2D2D2D] last:border-0 transition-colors flex flex-col gap-0.5"
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

            {step === 4 && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-right-4 duration-300">
                {sports.map((sport) => (
                  <button
                    key={sport.name}
                    onClick={() => toggleSport(sport.name)}
                    className={`flex items-center gap-3 p-4 rounded-[8px] border transition-all duration-300 ${
                      formData.sportTypes.includes(sport.name)
                        ? "bg-[#CCFF00] border-[#CCFF00] text-black scale-[1.02] shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                        : "bg-white/[0.03] border-[#2D2D2D] text-white/40 hover:border-[#2D2D2D] hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={formData.sportTypes.includes(sport.name) ? "text-black" : "text-[#CCFF00]"}>
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
            {step > (user?.googleId ? 2 : 1) && (
              <button
                onClick={handleBack}
                className="flex-1 bg-[#000000] hover:bg-white/10 text-white h-16 rounded-[8px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border border-[#2D2D2D]"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            
            {step < 4 ? (
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
                className="flex-[2] bg-[#CCFF00] text-black h-16 rounded-[8px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(132,204,22,0.3)] disabled:opacity-50 disabled:grayscale"
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

