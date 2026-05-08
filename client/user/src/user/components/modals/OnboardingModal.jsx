import { useState } from "react";
import { Check, Trophy, Activity, Zap, Target, MapPin, Phone, User as UserIcon, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { updateUser } from "../../redux/slices/authSlice";

const OnboardingModal = ({ isOpen, onClose, onComplete }) => {
  const dispatch = useDispatch();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    phone: "",
    gender: "",
    location: "",
    sportTypes: []
  });

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
      if (!formData.phone || !formData.gender) {
        toast.error("Please fill in all details");
        return;
      }
      if (!/^[0-9]{10}$/.test(formData.phone)) {
        toast.error("Please enter a valid 10-digit phone number");
        return;
      }
    } else if (step === 2) {
      if (!formData.location) {
        toast.error("Please enter your location");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
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
      <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
        
        {/* Progress Bar */}
        <div className="flex h-1.5 bg-white/5">
          <div 
            className="bg-[#84CC16] transition-all duration-500 shadow-[0_0_10px_#84CC16]" 
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="space-y-2 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase italic">
              {step === 1 && "Final Touches"}
              {step === 2 && "Where's the Arena?"}
              {step === 3 && "Pick Your Game"}
            </h2>
            <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]">
              {step === 1 && "Step 1 of 3: Basic Profile"}
              {step === 2 && "Step 2 of 3: Your Location"}
              {step === 3 && "Step 3 of 3: Your Interests"}
            </p>
          </div>

          {/* Content */}
          <div className="min-h-[280px] flex flex-col justify-center">
            {step === 1 && (
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
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] outline-none transition-all"
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
                          className={`py-4 rounded-2xl border font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                            formData.gender === g
                              ? "bg-[#84CC16] border-[#84CC16] text-black shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                              : "bg-white/[0.03] border-white/5 text-white/40 hover:border-white/10"
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

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 rounded-3xl bg-[#84CC16]/5 border border-[#84CC16]/20 flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#84CC16]/10 text-[#84CC16]">
                    <MapPin size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold">Local Experience</h4>
                    <p className="text-white/40 text-xs">Tell us where you are to find turfs and players near you.</p>
                  </div>
                </div>
                
                <label className="block">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Your City/Area</span>
                  <div className="mt-2 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-[#84CC16] focus:ring-1 focus:ring-[#84CC16] outline-none transition-all"
                    />
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
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                      formData.sportTypes.includes(sport.name)
                        ? "bg-[#84CC16] border-[#84CC16] text-black scale-[1.02] shadow-[0_0_20px_rgba(132,204,22,0.2)]"
                        : "bg-white/[0.03] border-white/5 text-white/40 hover:border-white/10 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={formData.sportTypes.includes(sport.name) ? "text-black" : "text-[#84CC16]"}>
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
                className="flex-1 bg-white/5 hover:bg-white/10 text-white h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border border-white/5"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
            
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex-[2] bg-white text-black h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
              >
                Continue
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || formData.sportTypes.length === 0}
                className="flex-[2] bg-[#84CC16] text-black h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(132,204,22,0.3)] disabled:opacity-50 disabled:grayscale"
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
