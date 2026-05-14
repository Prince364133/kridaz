import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { User, Mail, Phone, MapPin, Award, BookOpen, Camera, Save, Loader2, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video, Play, Layout, X, ChevronDown, Zap } from "lucide-react";
import toast from "react-hot-toast";

/**
 * ProfessionalProfile — The definitive dossier for professionals.
 * Fully rebranded for the Scorer Portal with Teal Green (#00C187) and Inter font.
 */

const ALL_SPORTS = [
  "Cricket", "Football", "Badminton", "Tennis", "Table Tennis", 
  "Basketball", "Volleyball", "Swimming", "Yoga", "Gym & Fitness",
  "Kabaddi", "Squash", "Athletics", "Boxing", "Chess", "Golf",
  "Hockey", "Martial Arts", "Skating", "Billiards", "Wrestling",
  "Archery", "Cycling", "Handball", "Rugby", "Padel", "Pickleball",
  "Karate", "Taekwondo", "MMA", "Crossfit", "Pilates", "Zumba",
  "Dance", "Shooting", "Fencing", "Baseball", "Softball", "Lacrosse",
  "Polo", "Snooker", "Pool", "Bowling", "E-Sports"
];

const ALL_LANGUAGES = [
  "English", "Hindi", "Marathi", "Telugu", "Tamil", "Kannada", "Malayalam",
  "Bengali", "Gujarati", "Punjabi", "Spanish", "French", "German", "Japanese",
  "Chinese", "Arabic", "Portuguese", "Russian"
];

export default function ProfessionalProfile() {
  const { user, role } = useSelector((state) => state.auth);
  
  const isScorer = role?.toLowerCase().includes("scorer");
  const themeColor = isScorer ? "#00C187" : "#CCFF00";
  const portalName = isScorer ? "SCORER" : "COACH";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    gameTypes: [],
    city: "",
    state: "",
    specialization: "",
    experience: "",
    certifications: [],
    gender: "",
    dob: "",
    address: "",
    pinCode: "",
    coachingLevel: "Beginner",
    availabilityTimings: "",
    availabilityMode: "Both",
    preferredLocations: "",
    trainingTypes: [],
    ageGroups: [],
    languages: [],
    achievements: [],
    portfolio: []
  });

  const [newGameType, setNewGameType] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const [newCert, setNewCert] = useState({ title: "", description: "", image: "" });
  const [newPortfolioItem, setNewPortfolioItem] = useState({ title: "", description: "", mediaType: "image", mediaUrl: "" });
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [showLanguagesDropdown, setShowLanguagesDropdown] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const profId = user?._id || user?.id || user?.user;
      if (!profId) return;
      const res = await axiosInstance.get(`/api/professional/details/${profId}`);
      const prof = res.data.professional;
      setFormData({
        name: prof.name || "",
        gameTypes: prof.gameTypes || [],
        city: prof.city || "",
        state: prof.state || "",
        specialization: prof.businessDetails?.specialization || "",
        experience: prof.businessDetails?.experience || "",
        certifications: prof.certifications || [],
        gender: prof.gender || "",
        dob: prof.dob ? new Date(prof.dob).toISOString().split('T')[0] : "",
        address: prof.businessDetails?.address || "",
        pinCode: prof.businessDetails?.pinCode || "",
        coachingLevel: prof.coachingLevel || "Beginner",
        availabilityTimings: prof.availabilityTimings || "",
        availabilityMode: prof.availabilityMode || "Both",
        preferredLocations: prof.preferredLocations || "",
        trainingTypes: prof.trainingTypes || [],
        ageGroups: prof.ageGroups || [],
        languages: prof.languages ? prof.languages.split(", ").filter(l => l) : [],
        achievements: prof.achievements ? prof.achievements.split("\n").filter(a => a) : [],
        portfolio: prof.portfolio || []
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const payload = {
        ...formData,
        languages: formData.languages.join(", "),
        achievements: formData.achievements.join("\n")
      };
      await axiosInstance.put("/api/professional/update-profile", payload);
      toast.success("Dossier synchronized with server", {
        style: { background: "#000", color: "#fff", border: `1px solid ${themeColor}`, fontSize: "10px", fontWeight: "black" }
      });
    } catch (error) {
      toast.error("Synchronization failed");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleUpdate();
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  const jumpToStep = (step) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };

  const addGameType = (sport = newGameType) => {
    if (sport && !formData.gameTypes.includes(sport)) {
      setFormData({ ...formData, gameTypes: [...formData.gameTypes, sport] });
      setNewGameType("");
      setShowSportsDropdown(false);
    }
  };

  const removeGameType = (type) => {
    setFormData({ ...formData, gameTypes: formData.gameTypes.filter(t => t !== type) });
  };

  const addLanguage = (lang = newLanguage) => {
    if (lang && !formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
      setNewLanguage("");
      setShowLanguagesDropdown(false);
    }
  };

  const removeLanguage = (lang) => {
    setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
  };

  const addCertification = () => {
    if (newCert.title) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, { ...newCert }]
      });
      setNewCert({ title: "", description: "", image: "" });
      toast.success("Credential added to stack");
    } else {
      toast.error("Credential title is mandatory");
    }
  };

  const removeCertification = (index) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
    });
  };

  const handleCertImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be below 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCert({ ...newCert, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addAchievement = () => {
    if (newAchievement && !formData.achievements.includes(newAchievement)) {
      setFormData({ ...formData, achievements: [...formData.achievements, newAchievement] });
      setNewAchievement("");
    }
  };

  const removeAchievement = (ach) => {
    setFormData({ ...formData, achievements: formData.achievements.filter(a => a !== ach) });
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title && newPortfolioItem.mediaUrl) {
      setFormData({
        ...formData,
        portfolio: [...formData.portfolio, { ...newPortfolioItem }]
      });
      setNewPortfolioItem({ title: "", description: "", mediaType: "image", mediaUrl: "" });
      toast.success("Work showcased in portfolio");
    } else {
      toast.error("Title and media are mandatory");
    }
  };

  const removePortfolioItem = (index) => {
    setFormData({
      ...formData,
      portfolio: formData.portfolio.filter((_, i) => i !== index)
    });
  };

  const handlePortfolioMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Media size must be below 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPortfolioItem({ ...newPortfolioItem, mediaUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleArrayItem = (field, item) => {
    const current = [...formData[field]];
    if (current.includes(item)) {
      setFormData({ ...formData, [field]: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [field]: [...current, item] });
    }
  };

  if (fetching) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin" style={{ color: themeColor }} size={48} /></div>
  );

  const StepIndicator = () => (
    <div className="flex items-center gap-8 mb-12 overflow-x-auto no-scrollbar pb-4">
      {[1, 2, 3].map((step) => (
        <button 
          key={step} 
          onClick={() => jumpToStep(step)}
          className="flex items-center gap-4 group text-left outline-none shrink-0"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 ${
            currentStep === step 
              ? `text-black shadow-2xl` 
              : currentStep > step 
                ? "bg-white/5 border border-white/5" 
                : "bg-black border border-white/5 text-neutral-600 group-hover:border-white/10"
          }`}
          style={{ 
            backgroundColor: currentStep === step ? themeColor : currentStep > step ? "rgba(255,255,255,0.05)" : "transparent",
            color: currentStep === step ? "#000" : currentStep > step ? themeColor : "#444",
            boxShadow: currentStep === step ? `0 10px 25px ${themeColor}33` : 'none'
          }}>
            {currentStep > step ? <CheckCircle2 size={22} /> : `0${step}`}
          </div>
          <div className="hidden sm:block">
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors font-inter`}
               style={{ color: currentStep === step ? themeColor : "#444" }}>
              PHASE {step}
            </p>
            <p className={`text-[12px] font-black uppercase tracking-widest transition-colors font-inter ${currentStep === step ? "text-white" : "text-neutral-700 group-hover:text-white/60"}`}>
              {step === 1 ? "Professional" : step === 2 ? "Credentials" : "Work Portfolio"}
            </p>
          </div>
          {step < 3 && <div className={`w-10 h-[1px] ${currentStep > step ? "opacity-30" : "bg-white/5"}`} style={{ backgroundColor: currentStep > step ? themeColor : "rgba(255,255,255,0.05)" }} />}
        </button>
      ))}
    </div>
  );

  const filteredSports = ALL_SPORTS.filter(s => 
    (!newGameType || s.toLowerCase().includes(newGameType.toLowerCase())) && 
    !formData.gameTypes.includes(s)
  );

  const filteredLanguages = ALL_LANGUAGES.filter(l => 
    (!newLanguage || l.toLowerCase().includes(newLanguage.toLowerCase())) && 
    !formData.languages.includes(l)
  );

  return (
    <div className="space-y-10 animate-fade-in font-inter pb-32 h-full custom-scrollbar">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-12 border-b border-white/5">
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tighter text-white font-inter uppercase">
            {portalName} <span style={{ color: themeColor }}>DOSSIER</span>
          </h1>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] font-inter mt-2">Architect your professional presence and verified credentials</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 w-full xl:w-auto">
          <div className="px-6 py-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col justify-center">
            <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest font-inter mb-2">Completion Index</p>
            <div className="flex items-center gap-4">
              <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div className="h-full transition-all duration-1000" style={{ width: `${(currentStep / 3) * 100}%`, backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}66` }} />
              </div>
              <span className="text-[11px] font-black text-white font-inter">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={loading}
            className="px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center justify-center gap-4 shadow-2xl group font-inter text-[11px]"
            style={{ backgroundColor: themeColor, color: '#000', boxShadow: `0 10px 30px ${themeColor}33` }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:rotate-12 transition-transform" />}
            Save Dossier
          </button>
        </div>
      </div>

      <StepIndicator />

      <div className="w-full">
        {currentStep === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Left: Professional Quick Settings */}
              <div className="lg:col-span-4 space-y-8">
                <div className="bg-black border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white mb-8 font-inter flex items-center gap-3">
                    <Award size={18} style={{ color: themeColor }} /> Domain Expertise
                  </h3>
                  <div className="relative mb-6">
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Assign Domain..."
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-5 py-3.5 text-[12px] text-white outline-none focus:border-[#00C187]/50 font-inter transition-all"
                        value={newGameType}
                        onChange={(e) => {
                          setNewGameType(e.target.value);
                          setShowSportsDropdown(true);
                        }}
                        onFocus={() => setShowSportsDropdown(true)}
                      />
                      <button onClick={() => addGameType()} className="w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg shrink-0" style={{ backgroundColor: themeColor }}>
                        <Plus size={22} color="#000" />
                      </button>
                    </div>

                    {showSportsDropdown && filteredSports.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-[#080808] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar">
                        {filteredSports.map(sport => (
                          <button 
                            key={sport}
                            onClick={() => addGameType(sport)}
                            className="w-full px-6 py-4 text-left text-[12px] text-white hover:bg-[#00C187]/10 transition-colors border-b border-white/5 last:border-0 font-inter font-black uppercase tracking-tight"
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {formData.gameTypes.map(type => (
                      <span key={type} className="px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-[10px] font-black text-white flex items-center gap-3 font-inter uppercase tracking-widest hover:border-[#00C187]/30 transition-all">
                        {type}
                        <button onClick={() => removeGameType(type)} className="text-neutral-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                      </span>
                    ))}
                    {formData.gameTypes.length === 0 && (
                        <p className="text-[10px] text-neutral-800 font-black uppercase tracking-widest py-2 italic">Select Primary Domains</p>
                    )}
                  </div>
                </div>

                <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#00C187]/5 blur-3xl pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner">
                      <MapPin size={22} style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-white font-inter">Engagement</h3>
                      <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1">Operational Mode</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <select 
                      className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[13px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black uppercase tracking-widest transition-all appearance-none cursor-pointer"
                      value={formData.availabilityMode}
                      onChange={(e) => setFormData({...formData, availabilityMode: e.target.value})}
                    >
                      <option value="Offline">Physical Presence Only</option>
                      <option value="Online">Remote Operations Only</option>
                      <option value="Both">Hybrid Mode (Both)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>

                <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C187]/5 blur-[80px] pointer-events-none" />
                   <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner">
                      <BookOpen size={22} style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-white font-inter">Linguistics</h3>
                      <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1">Communication Stack</p>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="relative">
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Link Language..."
                          className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-5 py-4 text-[12px] text-white outline-none focus:border-[#00C187]/50 font-inter transition-all"
                          value={newLanguage}
                          onChange={(e) => {
                            setNewLanguage(e.target.value);
                            setShowLanguagesDropdown(true);
                          }}
                          onFocus={() => setShowLanguagesDropdown(true)}
                        />
                        <button onClick={() => addLanguage()} className="w-14 h-14 rounded-xl shadow-lg flex items-center justify-center shrink-0 transition-all active:scale-95" style={{ backgroundColor: themeColor }}>
                           <Plus size={24} color="#000" />
                        </button>
                      </div>

                      {showLanguagesDropdown && filteredLanguages.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-[#080808] border border-white/10 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto no-scrollbar">
                          {filteredLanguages.map(lang => (
                            <button 
                              key={lang}
                              onClick={() => addLanguage(lang)}
                              className="w-full px-6 py-4 text-left text-[12px] text-white hover:bg-[#00C187]/10 transition-colors border-b border-white/5 last:border-0 flex items-center justify-between group font-inter font-black uppercase"
                            >
                              <span>{lang}</span>
                              <Plus size={14} style={{ color: themeColor }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      {formData.languages.map(lang => (
                        <span key={lang} className="px-5 py-2.5 bg-white/[0.03] border border-white/5 rounded-xl text-[11px] font-black text-white flex items-center gap-4 font-inter uppercase tracking-widest hover:border-[#00C187]/30 transition-all">
                          {lang}
                          <button onClick={() => removeLanguage(lang)} className="text-neutral-600 hover:text-red-500 transition-colors"><X size={14} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Detailed Professional Matrix */}
              <div className="lg:col-span-8 space-y-8">
                <div className="bg-black border border-white/5 rounded-[2.5rem] p-10 lg:p-12 space-y-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C187]/5 blur-[100px] pointer-events-none" />
                  
                  <div className="space-y-10 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner">
                        <FileText size={22} style={{ color: themeColor }} />
                      </div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.3em] text-white font-inter">Professional Matrix</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Operational Headline</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Senior Scorer & Node Administrator"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all"
                          value={formData.specialization}
                          onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Proficiency Level</label>
                        <div className="relative">
                            <select 
                            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black uppercase tracking-widest transition-all appearance-none"
                            value={formData.coachingLevel}
                            onChange={(e) => setFormData({...formData, coachingLevel: e.target.value})}
                            >
                            <option value="Beginner">Junior Associate</option>
                            <option value="Intermediate">Mid-Tier Professional</option>
                            <option value="Elite">Elite / Senior Professional</option>
                            <option value="National">Governing Body Certified</option>
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-600">
                                <ChevronDown size={18} />
                            </div>
                        </div>
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Industry Tenure</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 12+ Professional Seasons"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10 relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shadow-inner">
                        <CheckCircle2 size={22} style={{ color: themeColor }} />
                      </div>
                      <h3 className="text-[14px] font-black uppercase tracking-[0.3em] text-white font-inter">Specialization Scopes</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Operational Types</label>
                        <div className="flex flex-wrap gap-3">
                          {["Individual", "Group", "Team", "Online", "Clinic"].map(type => (
                            <button 
                              key={type}
                              onClick={() => toggleArrayItem("trainingTypes", type)}
                              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                formData.trainingTypes.includes(type) 
                                  ? "text-black shadow-2xl" 
                                  : "bg-white/[0.03] border border-white/5 text-neutral-600 hover:border-[#00C187]/30 hover:text-white"
                              }`}
                              style={{ 
                                  backgroundColor: formData.trainingTypes.includes(type) ? themeColor : 'transparent',
                                  boxShadow: formData.trainingTypes.includes(type) ? `0 10px 20px ${themeColor}33` : 'none'
                              }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-6">
                        <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Target Demographics</label>
                        <div className="flex flex-wrap gap-3">
                          {["Kids (<12)", "Teens (13-19)", "Adults (20+)", "Seniors"].map(age => (
                            <button 
                              key={age}
                              onClick={() => toggleArrayItem("ageGroups", age)}
                              className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                formData.ageGroups.includes(age) 
                                  ? "text-black shadow-2xl" 
                                  : "bg-white/[0.03] border border-white/5 text-neutral-600 hover:border-[#00C187]/30 hover:text-white"
                              }`}
                              style={{ 
                                  backgroundColor: formData.ageGroups.includes(age) ? themeColor : 'transparent',
                                  boxShadow: formData.ageGroups.includes(age) ? `0 10px 20px ${themeColor}33` : 'none'
                              }}
                            >
                              {age}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-14 shadow-2xl relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-[#00C187]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
               <div className="relative">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-10 mb-14">
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tighter font-inter flex items-center gap-5">
                        <Award size={40} style={{ color: themeColor }} /> Career Milestones
                      </h3>
                      <p className="text-neutral-500 text-[11px] font-black uppercase tracking-[0.4em] font-inter">Establish your professional legacy and industry impact</p>
                    </div>
                    <div className="flex gap-4 w-full xl:w-auto xl:min-w-[600px]">
                      <input 
                        type="text" 
                        placeholder="Log Industry Milestone..."
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-2xl px-8 py-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all"
                        value={newAchievement}
                        onChange={(e) => setNewAchievement(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                      />
                      <button onClick={addAchievement} className="w-16 h-16 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor }}>
                        <Plus size={32} color="#000" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {formData.achievements.map((ach, idx) => (
                      <div key={idx} className="flex items-start justify-between p-8 bg-white/[0.02] border border-white/5 rounded-3xl group/item hover:border-[#00C187]/30 transition-all duration-500 relative shadow-lg">
                        <div className="flex items-start gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover/item:border-[#00C187]/40 transition-all shadow-inner">
                            <CheckCircle2 size={20} style={{ color: themeColor }} />
                          </div>
                          <span className="text-[14px] text-neutral-300 font-inter font-black uppercase tracking-tight leading-relaxed pt-2">{ach}</span>
                        </div>
                        <button onClick={() => removeAchievement(ach)} className="text-neutral-800 hover:text-red-500 transition-colors mt-3"><Trash2 size={18} /></button>
                      </div>
                    ))}
                    {formData.achievements.length === 0 && (
                      <div className="col-span-full py-24 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01] flex flex-col items-center justify-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
                          <Award size={40} className="text-neutral-800" />
                        </div>
                        <p className="text-[11px] text-neutral-700 font-black uppercase tracking-[0.5em]">Industry Timeline Empty</p>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Left: Add Certification Form */}
            <div className="lg:col-span-5 space-y-8">
              <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-12 space-y-10 shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00C187]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#00C187]/10 border border-[#00C187]/20 flex items-center justify-center shadow-lg">
                      <Award size={28} style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-inter">Add Credential</h3>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1.5">Showcase verified professional standing</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Credential Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Master Scorer - BCCI Certified"
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all"
                        value={newCert.title}
                        onChange={(e) => setNewCert({...newCert, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Brief Description</label>
                      <textarea 
                        rows="4"
                        placeholder="Detail the scope and validation of this credential..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all resize-none"
                        value={newCert.description}
                        onChange={(e) => setNewCert({...newCert, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Digital Proof</label>
                      <div className="relative group/upload">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleCertImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full h-48 border border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all ${newCert.image ? "border-[#00C187]/40 bg-[#00C187]/5 shadow-inner" : "border-white/5 bg-white/[0.02] group-hover/upload:border-[#00C187]/30"}`}>
                          {newCert.image ? (
                            <img src={newCert.image} className="w-full h-full object-contain p-4" alt="Preview" />
                          ) : (
                            <>
                              <ImageIcon size={40} className="text-neutral-800" />
                              <span className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">Link High-Res Identity Proof</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={addCertification}
                      className="w-full h-16 text-black font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl transition-all flex items-center justify-center gap-4 shadow-2xl mt-6 active:scale-95"
                      style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
                    >
                      <Plus size={22} /> Integrate Credential
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: List of Certifications */}
            <div className="lg:col-span-7 space-y-8">
              <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-12 space-y-10 min-h-[600px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C187]/5 blur-[100px] pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <FileText size={22} style={{ color: themeColor }} />
                    <h3 className="text-[14px] font-black uppercase tracking-[0.3em] text-white font-inter">Verified Stack</h3>
                  </div>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-4 py-1.5 bg-white/5 rounded-full border border-white/5">{formData.certifications.length} Credentials</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {formData.certifications.map((cert, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden group/item hover:border-[#00C187]/40 transition-all duration-500 shadow-xl">
                      <div className="h-48 bg-white/[0.03] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                        {cert.image ? (
                          <img src={cert.image} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-1000" alt={cert.title} />
                        ) : (
                          <Award size={56} className="text-neutral-900" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button onClick={() => removeCertification(idx)} className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-2xl"><Trash2 size={22} /></button>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <h4 className="text-[13px] font-black text-white uppercase tracking-tight font-inter line-clamp-1">{cert.title}</h4>
                        <p className="text-[11px] text-neutral-500 font-inter line-clamp-2 leading-relaxed">{cert.description || "Credential validation summary pending."}</p>
                      </div>
                    </div>
                  ))}

                  {formData.certifications.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-8 bg-white/[0.01] rounded-[2.5rem] border-2 border-dashed border-white/5">
                      <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
                        <Award size={48} className="text-neutral-900" />
                      </div>
                      <p className="text-[11px] text-neutral-700 font-black uppercase tracking-[0.5em]">Credential Stack Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-700">
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-12 space-y-10 shadow-2xl relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#00C187]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="relative space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-[#00C187]/10 border border-[#00C187]/20 flex items-center justify-center shadow-lg">
                      <Layout size={28} style={{ color: themeColor }} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter font-inter">Live Gallery</h3>
                      <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest mt-1.5">Portfolio & Industry Visuals</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex bg-white/[0.02] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                      <button 
                        onClick={() => setNewPortfolioItem({...newPortfolioItem, mediaType: 'image', mediaUrl: ''})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all transform active:scale-95 ${newPortfolioItem.mediaType === 'image' ? "text-black shadow-lg" : "text-neutral-600 hover:text-white"}`}
                        style={{ backgroundColor: newPortfolioItem.mediaType === 'image' ? themeColor : 'transparent' }}
                      >
                        Photography
                      </button>
                      <button 
                        onClick={() => setNewPortfolioItem({...newPortfolioItem, mediaType: 'video', mediaUrl: ''})}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all transform active:scale-95 ${newPortfolioItem.mediaType === 'video' ? "text-black shadow-lg" : "text-neutral-600 hover:text-white"}`}
                        style={{ backgroundColor: newPortfolioItem.mediaType === 'video' ? themeColor : 'transparent' }}
                      >
                        Broadcasting
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Project Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. IPL Regional Qualifiers 2024"
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all"
                        value={newPortfolioItem.title}
                        onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Case Brief</label>
                      <textarea 
                        rows="4"
                        placeholder="Narrate the impact and context of this industry visual..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-5 text-[14px] text-white focus:border-[#00C187]/50 outline-none font-inter font-black transition-all resize-none"
                        value={newPortfolioItem.description}
                        onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] ml-1">Upload {newPortfolioItem.mediaType === 'image' ? 'Artifact' : 'Feed'}</label>
                      <div className="relative group/upload">
                        <input 
                          type="file" 
                          accept={newPortfolioItem.mediaType === 'image' ? "image/*" : "video/*"}
                          onChange={handlePortfolioMediaUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full h-48 border border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-5 transition-all ${newPortfolioItem.mediaUrl ? "border-[#00C187]/40 bg-[#00C187]/5 shadow-inner" : "border-white/5 bg-white/[0.02] group-hover/upload:border-[#00C187]/30"}`}>
                          {newPortfolioItem.mediaUrl ? (
                             newPortfolioItem.mediaType === 'image' ? (
                                <img src={newPortfolioItem.mediaUrl} className="w-full h-full object-contain p-5" alt="Preview" />
                             ) : (
                                <div className="flex flex-col items-center gap-2">
                                   <Play size={48} style={{ color: themeColor }} />
                                   <span className="text-[10px] font-black text-white uppercase tracking-widest">Video Stream Ready</span>
                                </div>
                             )
                          ) : (
                            <>
                              {newPortfolioItem.mediaType === 'image' ? <ImageIcon size={48} className="text-neutral-800" /> : <Video size={48} className="text-neutral-800" />}
                              <span className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">Integrate Visual Asset</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={addPortfolioItem}
                      className="w-full h-16 text-black font-black uppercase tracking-[0.3em] text-[12px] rounded-2xl transition-all flex items-center justify-center gap-4 shadow-2xl mt-6 active:scale-95"
                      style={{ backgroundColor: themeColor, boxShadow: `0 10px 30px ${themeColor}33` }}
                    >
                      <Plus size={22} /> Publish to Gallery
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-8">
              <div className="bg-black border border-white/5 rounded-[3rem] p-10 lg:p-12 space-y-10 min-h-[600px] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C187]/5 blur-[100px] pointer-events-none" />
                <div className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <Layout size={22} style={{ color: themeColor }} />
                    <h3 className="text-[14px] font-black uppercase tracking-[0.3em] text-white font-inter">Work Exhibition</h3>
                  </div>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-4 py-1.5 bg-white/5 rounded-full border border-white/5">{formData.portfolio?.length || 0} Assets</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {formData.portfolio?.map((item, idx) => (
                    <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden group/item hover:border-[#00C187]/40 transition-all duration-500 shadow-xl">
                      <div className="h-56 bg-white/[0.03] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                        {item.mediaType === 'image' ? (
                          <img src={item.mediaUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-1000" alt={item.title} />
                        ) : (
                          <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-[#00C187]/10 flex items-center justify-center border border-[#00C187]/20">
                              <Play size={24} style={{ color: themeColor }} />
                            </div>
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em]">Motion Asset</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button onClick={() => removePortfolioItem(idx)} className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-2xl"><Trash2 size={22} /></button>
                        </div>
                      </div>
                      <div className="p-8 space-y-4">
                        <h4 className="text-[14px] font-black text-white uppercase tracking-tight font-inter line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-neutral-500 font-inter line-clamp-2 leading-relaxed">{item.description || "Project impact summary pending."}</p>
                      </div>
                    </div>
                  ))}

                  {(!formData.portfolio || formData.portfolio.length === 0) && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-8 bg-white/[0.01] rounded-[2.5rem] border-2 border-dashed border-white/5">
                      <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
                        <Layout size={48} className="text-neutral-900" />
                      </div>
                      <p className="text-[11px] text-neutral-700 font-black uppercase tracking-[0.5em]">Gallery Under Construction</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-[60]">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-6">
          {currentStep > 1 && (
            <button 
              onClick={prevStep}
              className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3 text-neutral-400 transform active:scale-95 shadow-xl"
            >
              <ChevronLeft size={18} /> Previous Phase
            </button>
          )}
          <button 
            onClick={nextStep}
            className={`flex-[2] h-16 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-2xl flex items-center justify-center gap-4`}
            style={{ backgroundColor: themeColor, color: '#000', boxShadow: `0 10px 40px ${themeColor}4D` }}
          >
            {currentStep === 3 ? (
              <><CheckCircle2 size={20} /> Finalize Dossier</>
            ) : (
              <><Zap size={20} /> Advance to Phase {currentStep + 1} <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
