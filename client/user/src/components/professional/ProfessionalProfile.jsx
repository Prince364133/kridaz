import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { User, Mail, Phone, MapPin, Award, BookOpen, Camera, Save, Loader2, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video, Play, Layout, X, ChevronDown, Zap, ShieldCheck, Target, Globe } from "lucide-react";
import toast from "react-hot-toast";

/**
 * ProfessionalProfile — The definitive dossier for professionals.
 * Compact for the Console design language (Inter font, 8px radii).
 * Fully custom-styled dropdowns for premium dark theme parity.
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
  const [showEngagementDropdown, setShowEngagementDropdown] = useState(false);
  const [showProficiencyDropdown, setShowProficiencyDropdown] = useState(false);

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
      toast.success("Dossier synchronized", {
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
      toast.success("Credential added");
    } else {
      toast.error("Title is mandatory");
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
      toast.success("Work showcased");
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

  const filteredSports = ALL_SPORTS.filter(s => 
    (!newGameType || s.toLowerCase().includes(newGameType.toLowerCase())) && 
    !formData.gameTypes.includes(s)
  );

  const filteredLanguages = ALL_LANGUAGES.filter(l => 
    (!newLanguage || l.toLowerCase().includes(newLanguage.toLowerCase())) && 
    !formData.languages.includes(l)
  );

  if (fetching) return (
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin" style={{ color: themeColor }} size={48} /></div>
  );

  const StepIndicator = () => (
    <div className="flex items-center gap-4 mb-6 overflow-x-auto no-scrollbar pb-1">
      {[1, 2, 3].map((step) => (
        <button 
          key={step} 
          onClick={() => jumpToStep(step)}
          className="flex items-center gap-3 group text-left outline-none shrink-0"
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-black transition-all duration-300 ${
            currentStep === step 
              ? `text-black` 
              : currentStep > step 
                ? "bg-white/5 border border-white/5" 
                : "bg-black border border-white/5 text-neutral-600 group-hover:border-white/10"
          }`}
          style={{ 
            backgroundColor: currentStep === step ? themeColor : currentStep > step ? "rgba(255,255,255,0.05)" : "transparent",
            color: currentStep === step ? "#000" : currentStep > step ? themeColor : "#444",
            boxShadow: currentStep === step ? `0 0 15px ${themeColor}33` : 'none'
          }}>
            {currentStep > step ? <CheckCircle2 size={16} /> : `0${step}`}
          </div>
          <div className="hidden sm:block">
            <p className={`text-[7px] font-black uppercase tracking-[0.2em] transition-colors font-inter leading-none`}
               style={{ color: currentStep === step ? themeColor : "#444" }}>
              PHASE {step}
            </p>
            <p className={`text-[10px] font-black uppercase tracking-widest transition-colors font-inter mt-0.5 ${currentStep === step ? "text-white" : "text-neutral-700 group-hover:text-white/60"}`}>
              {step === 1 ? "Professional" : step === 2 ? "Credentials" : "Work Portfolio"}
            </p>
          </div>
          {step < 3 && <div className="w-6 h-[1px] bg-white/5" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in font-inter pb-20 h-full custom-scrollbar">
      {/* Header */}
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 relative z-10 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: themeColor }} />
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight font-['Open_Sans'] uppercase leading-none text-white">
                {portalName} <span style={{ color: themeColor }}>DOSSIER</span>
              </h1>
              <p className="text-[#878C9F] text-[9px] font-black uppercase tracking-[0.2em] font-inter mt-1 ml-0.5 opacity-60">Professional presence & verified credentials</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/5 px-6 py-2.5 rounded-lg backdrop-blur-xl">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-black" style={{ backgroundColor: themeColor }}>
                <Zap size={16} />
              </div>
              <div className="space-y-1">
                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-none">Status</p>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${(currentStep / 3) * 100}%`, backgroundColor: themeColor }} />
                  </div>
                  <span className="text-[11px] font-black text-white">{Math.round((currentStep / 3) * 100)}%</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleUpdate}
              disabled={loading}
              className="px-6 py-3 text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl" 
              style={{ backgroundColor: themeColor, boxShadow: `0 5px 15px ${themeColor}22` }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          </div>
      </header>

      <StepIndicator />

      <div className="w-full">
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column */}
              <div className="lg:col-span-4 space-y-4">
                {/* Domain Expertise */}
                <div className={`bg-white/[0.03] border border-white/5 rounded-lg p-5 backdrop-blur-xl relative ${showSportsDropdown ? 'z-[100]' : 'z-10'}`}>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-6 flex items-center gap-2">
                    <Award size={14} style={{ color: themeColor }} /> Domain Expertise
                  </h3>
                  
                  <div className="relative mb-4">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Assign Domain..."
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3 text-[11px] text-white outline-none focus:border-white/10 transition-all font-inter"
                        value={newGameType}
                        onChange={(e) => {
                          setNewGameType(e.target.value);
                          setShowSportsDropdown(true);
                        }}
                        onFocus={() => setShowSportsDropdown(true)}
                      />
                      <button onClick={() => addGameType()} className="w-11 h-11 rounded-lg flex items-center justify-center transition-all shrink-0" style={{ backgroundColor: themeColor }}>
                        <Plus size={18} color="#000" />
                      </button>
                    </div>

                    {showSportsDropdown && filteredSports.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar">
                        {filteredSports.map(sport => (
                          <button 
                            key={sport}
                            onClick={() => addGameType(sport)}
                            className="w-full px-4 py-2.5 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-black uppercase"
                          >
                            {sport}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {formData.gameTypes.map(type => (
                      <span key={type} className="px-3 py-1.5 bg-white/[0.05] border border-white/5 rounded-md text-[8px] font-black text-white flex items-center gap-2 uppercase tracking-widest">
                        {type}
                        <button onClick={() => removeGameType(type)} className="text-neutral-600 hover:text-red-500 transition-colors"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Custom Engagement Mode Dropdown */}
                <div className={`bg-white/[0.03] border border-white/5 rounded-lg p-5 backdrop-blur-xl relative ${showEngagementDropdown ? 'z-[100]' : 'z-10'}`}>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-6 flex items-center gap-2">
                    <MapPin size={14} style={{ color: themeColor }} /> Engagement
                  </h3>
                  <div className="relative">
                    <button 
                      onClick={() => setShowEngagementDropdown(!showEngagementDropdown)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[11px] text-white outline-none font-black uppercase tracking-widest transition-all flex items-center justify-between"
                    >
                      <span>{formData.availabilityMode === 'Both' ? 'Hybrid Mode' : formData.availabilityMode === 'Offline' ? 'Physical Only' : 'Remote Only'}</span>
                      <ChevronDown size={16} className={`transition-transform duration-300 ${showEngagementDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showEngagementDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden">
                        {[
                          { label: 'Physical Only', value: 'Offline' },
                          { label: 'Remote Only', value: 'Online' },
                          { label: 'Hybrid Mode', value: 'Both' }
                        ].map((opt) => (
                          <button 
                            key={opt.value}
                            onClick={() => {
                              setFormData({ ...formData, availabilityMode: opt.value });
                              setShowEngagementDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-black uppercase tracking-widest"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Linguistics */}
                <div className={`bg-white/[0.03] border border-white/5 rounded-lg p-5 backdrop-blur-xl relative ${showLanguagesDropdown ? 'z-[100]' : 'z-10'}`}>
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-6 flex items-center gap-2">
                    <Globe size={14} style={{ color: themeColor }} /> Languages
                  </h3>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Link Language..."
                          className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3 text-[11px] text-white outline-none focus:border-white/10 transition-all font-inter"
                          value={newLanguage}
                          onChange={(e) => {
                            setNewLanguage(e.target.value);
                            setShowLanguagesDropdown(true);
                          }}
                          onFocus={() => setShowLanguagesDropdown(true)}
                        />
                        <button onClick={() => addLanguage()} className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: themeColor }}>
                           <Plus size={18} color="#000" />
                        </button>
                      </div>

                      {showLanguagesDropdown && filteredLanguages.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl z-[100] max-h-64 overflow-y-auto custom-scrollbar">
                          {filteredLanguages.map(lang => (
                            <button 
                              key={lang}
                              onClick={() => addLanguage(lang)}
                              className="w-full px-4 py-2.5 text-left text-[10px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-black uppercase"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {formData.languages.map(lang => (
                        <span key={lang} className="px-3 py-1.5 bg-white/[0.05] border border-white/5 rounded-md text-[8px] font-black text-white flex items-center gap-2 uppercase tracking-widest">
                          {lang}
                          <button onClick={() => removeLanguage(lang)} className="text-neutral-600 hover:text-red-500 transition-colors"><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-6 backdrop-blur-xl space-y-8 shadow-2xl relative overflow-hidden">
                  {/* Professional Matrix */}
                  <div className="space-y-6 relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                      <FileText size={16} style={{ color: themeColor }} /> Professional Matrix
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Operational Headline</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Senior Scorer"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[12px] text-white focus:border-white/10 outline-none font-inter font-black transition-all"
                          value={formData.specialization}
                          onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        />
                      </div>
                      <div className={`space-y-1.5 relative ${showProficiencyDropdown ? 'z-[110]' : 'z-auto'}`}>
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Proficiency Level</label>
                        <div className="relative">
                            <button 
                              onClick={() => setShowProficiencyDropdown(!showProficiencyDropdown)}
                              className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[12px] text-white focus:border-white/10 outline-none font-black uppercase tracking-widest flex items-center justify-between"
                            >
                              <span>{
                                formData.coachingLevel === 'Beginner' ? 'Junior Associate' : 
                                formData.coachingLevel === 'Intermediate' ? 'Mid-Tier Professional' :
                                formData.coachingLevel === 'Elite' ? 'Elite / Senior' : 'Governing Body Certified'
                              }</span>
                              <ChevronDown size={16} className={`transition-transform duration-300 ${showProficiencyDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showProficiencyDropdown && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl z-[100] overflow-hidden">
                                {[
                                  { label: 'Junior Associate', value: 'Beginner' },
                                  { label: 'Mid-Tier Professional', value: 'Intermediate' },
                                  { label: 'Elite / Senior', value: 'Elite' },
                                  { label: 'Governing Body Certified', value: 'National' }
                                ].map((opt) => (
                                  <button 
                                    key={opt.value}
                                    onClick={() => {
                                      setFormData({ ...formData, coachingLevel: opt.value });
                                      setShowProficiencyDropdown(false);
                                    }}
                                    className="w-full px-4 py-3 text-left text-[11px] text-white hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 font-black uppercase tracking-widest"
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Industry Tenure</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 12+ Professional Seasons"
                          className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[12px] text-white focus:border-white/10 outline-none font-black transition-all"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialization Scopes */}
                  <div className="space-y-6 relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3">
                      <Target size={16} style={{ color: themeColor }} /> Specialization Scopes
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Operational Types</label>
                        <div className="flex flex-wrap gap-1.5">
                          {["Individual", "Group", "Team", "Online", "Clinic"].map(type => (
                            <button 
                              key={type}
                              onClick={() => toggleArrayItem("trainingTypes", type)}
                              className={`px-4 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                formData.trainingTypes.includes(type) 
                                  ? "text-black" 
                                  : "bg-white/[0.03] border border-white/5 text-neutral-600 hover:text-white"
                              }`}
                              style={{ backgroundColor: formData.trainingTypes.includes(type) ? themeColor : 'transparent' }}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest">Target Demographics</label>
                        <div className="flex flex-wrap gap-1.5">
                          {["Kids (<12)", "Teens (13-19)", "Adults (20+)", "Seniors"].map(age => (
                            <button 
                              key={age}
                              onClick={() => toggleArrayItem("ageGroups", age)}
                              className={`px-4 py-2.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                                formData.ageGroups.includes(age) 
                                  ? "text-black" 
                                  : "bg-white/[0.03] border border-white/5 text-neutral-600 hover:text-white"
                              }`}
                              style={{ backgroundColor: formData.ageGroups.includes(age) ? themeColor : 'transparent' }}
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

            {/* Career Milestones — Full Width */}
            <div className="bg-white/[0.03] border border-white/5 rounded-lg p-6 backdrop-blur-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="space-y-1">
                    <h3 className="text-[20px] font-black text-white uppercase tracking-widest flex items-center gap-3 font-inter">
                    <Award size={28} style={{ color: themeColor }} /> CAREER MILESTONES
                    </h3>
                    <p className="text-[8px] text-neutral-500 font-black uppercase tracking-[0.5em] opacity-50">Establish your professional legacy</p>
                </div>
                <div className="flex gap-2 w-full lg:w-auto lg:min-w-[350px]">
                    <input 
                    type="text" 
                    placeholder="Log Industry Milestone..."
                    className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-4 py-3 text-[12px] text-white outline-none font-black transition-all"
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                    />
                    <button onClick={addAchievement} className="w-11 h-11 rounded-lg shadow-xl flex items-center justify-center shrink-0 transition-all" style={{ backgroundColor: themeColor }}>
                    <Plus size={24} color="#000" />
                    </button>
                </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {formData.achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-start justify-between p-4 bg-white/[0.03] border border-white/5 rounded-lg group/item transition-all hover:border-white/10">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 size={14} style={{ color: themeColor }} className="mt-0.5 shrink-0" />
                        <span className="text-[11px] text-neutral-300 font-black uppercase tracking-tight leading-snug">{ach}</span>
                    </div>
                    <button onClick={() => removeAchievement(ach)} className="text-neutral-700 hover:text-red-500 transition-colors shrink-0 ml-2"><Trash2 size={14} /></button>
                    </div>
                ))}
                {formData.achievements.length === 0 && (
                    <div className="col-span-full py-10 bg-white/[0.01] rounded-lg border border-dashed border-white/5 flex flex-col items-center justify-center space-y-2">
                    <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em]">Timeline Node Empty</p>
                    </div>
                )}
                </div>
            </div>

            {/* Adjusted Navigation */}
            <div className="flex items-center justify-end gap-3 pt-6">
              {currentStep > 1 && (
                <button 
                  onClick={prevStep}
                  className="px-5 h-10 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-neutral-400 active:scale-95"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
              )}
              <button 
                onClick={nextStep}
                className="px-8 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
                style={{ backgroundColor: themeColor, color: '#000' }}
              >
                {currentStep === 3 ? (
                  <><CheckCircle2 size={14} /> Finalize</>
                ) : (
                  <><Zap size={14} /> Phase {currentStep + 1} <ChevronRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Add Certification */}
                <div className="lg:col-span-4 space-y-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-5 backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-black" style={{ backgroundColor: themeColor }}>
                        <Award size={20} />
                    </div>
                    <div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Verification</h3>
                        <p className="text-white text-[12px] font-black uppercase tracking-tight">Add Credential</p>
                    </div>
                    </div>

                    <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Credential Title</label>
                        <input 
                        type="text" 
                        placeholder="e.g. Master Scorer"
                        className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[11px] text-white focus:border-white/10 outline-none font-black transition-all"
                        value={newCert.title}
                        onChange={(e) => setNewCert({...newCert, title: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Description</label>
                        <textarea 
                        rows="3"
                        placeholder="Detail scope..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[11px] text-white focus:border-white/10 outline-none font-black transition-all resize-none"
                        value={newCert.description}
                        onChange={(e) => setNewCert({...newCert, description: e.target.value})}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Digital Proof</label>
                        <div className="relative group/upload">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleCertImageUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full h-36 border border-dashed rounded-lg flex flex-col items-center justify-center gap-3 transition-all ${newCert.image ? "border-white/20 bg-white/5" : "border-white/5 bg-white/[0.02] group-hover/upload:border-white/10"}`}>
                            {newCert.image ? (
                            <img src={newCert.image} className="w-full h-full object-contain p-2" alt="Preview" />
                            ) : (
                            <>
                                <ImageIcon size={24} className="text-neutral-900" />
                                <span className="text-[8px] font-black text-neutral-800 uppercase tracking-widest">Link Identity Proof</span>
                            </>
                            )}
                        </div>
                        </div>
                    </div>

                    <button 
                        onClick={addCertification}
                        className="w-full h-12 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                        style={{ backgroundColor: themeColor }}
                    >
                        <Plus size={16} /> Integrate
                    </button>
                    </div>
                </div>
                </div>

                {/* Right: Credentials List */}
                <div className="lg:col-span-8 space-y-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-6 backdrop-blur-xl space-y-6 min-h-[500px] relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 font-['Open_Sans']">
                        <ShieldCheck size={16} style={{ color: themeColor }} /> Verified Stack
                    </h3>
                    <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">{formData.certifications.length} Creds</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
                    {formData.certifications.map((cert, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden group/item transition-all hover:border-white/10">
                        <div className="h-24 bg-white/[0.02] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                            {cert.image ? (
                            <img src={cert.image} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" alt={cert.title} />
                            ) : (
                            <Award size={24} className="text-neutral-900" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button onClick={() => removeCertification(idx)} className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="p-3 space-y-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{cert.title}</h4>
                            <p className="text-[9px] text-neutral-500 font-medium line-clamp-2 leading-relaxed">{cert.description || "Pending validation."}</p>
                        </div>
                        </div>
                    ))}

                    {formData.certifications.length === 0 && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center space-y-4 bg-white/[0.01] rounded-lg border border-dashed border-white/5">
                        <ShieldCheck size={32} className="text-neutral-900" />
                        <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em]">Stack Empty</p>
                        </div>
                    )}
                    </div>
                </div>
                </div>
            </div>

            {/* Adjusted Navigation */}
            <div className="flex items-center justify-end gap-3 pt-6">
              <button 
                onClick={prevStep}
                className="px-5 h-10 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-neutral-400 active:scale-95"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button 
                onClick={nextStep}
                className="px-8 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
                style={{ backgroundColor: themeColor, color: '#000' }}
              >
                <Zap size={14} /> Phase 3 <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Gallery Form */}
                <div className="lg:col-span-4 space-y-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-5 backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden group">
                    <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-black" style={{ backgroundColor: themeColor }}>
                        <Layout size={20} />
                        </div>
                        <div>
                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Portfolio</h3>
                        <p className="text-white text-[12px] font-black uppercase tracking-tight">Live Gallery</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex bg-white/[0.03] p-1 rounded-lg border border-white/5">
                        <button 
                            onClick={() => setNewPortfolioItem({...newPortfolioItem, mediaType: 'image', mediaUrl: ''})}
                            className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${newPortfolioItem.mediaType === 'image' ? "text-black" : "text-neutral-600"}`}
                            style={{ backgroundColor: newPortfolioItem.mediaType === 'image' ? themeColor : 'transparent' }}
                        >
                            Photography
                        </button>
                        <button 
                            onClick={() => setNewPortfolioItem({...newPortfolioItem, mediaType: 'video', mediaUrl: ''})}
                            className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-md transition-all ${newPortfolioItem.mediaType === 'video' ? "text-black" : "text-neutral-600"}`}
                            style={{ backgroundColor: newPortfolioItem.mediaType === 'video' ? themeColor : 'transparent' }}
                        >
                            Broadcasting
                        </button>
                        </div>

                        <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Project Title</label>
                        <input 
                            type="text" 
                            placeholder="e.g. IPL Regional"
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[11px] text-white outline-none font-black transition-all"
                            value={newPortfolioItem.title}
                            onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})}
                        />
                        </div>

                        <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Brief</label>
                        <textarea 
                            rows="3"
                            placeholder="Impact..."
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg p-3.5 text-[11px] text-white outline-none font-black transition-all resize-none"
                            value={newPortfolioItem.description}
                            onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
                        />
                        </div>

                        <div className="space-y-1.5">
                        <label className="text-[8px] font-black text-neutral-600 uppercase tracking-widest ml-0.5">Upload</label>
                        <div className="relative group/upload">
                            <input 
                            type="file" 
                            accept={newPortfolioItem.mediaType === 'image' ? "image/*" : "video/*"}
                            onChange={handlePortfolioMediaUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className={`w-full h-36 border border-dashed rounded-lg flex flex-col items-center justify-center gap-3 transition-all ${newPortfolioItem.mediaUrl ? "border-white/20 bg-white/5" : "border-white/5 bg-white/[0.02] group-hover/upload:border-white/10"}`}>
                            {newPortfolioItem.mediaUrl ? (
                                newPortfolioItem.mediaType === 'image' ? (
                                    <img src={newPortfolioItem.mediaUrl} className="w-full h-full object-contain p-2" alt="Preview" />
                                ) : (
                                    <div className="flex flex-col items-center gap-1">
                                    <Play size={24} style={{ color: themeColor }} />
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest">Node Ready</span>
                                    </div>
                                )
                            ) : (
                                <>
                                {newPortfolioItem.mediaType === 'image' ? <ImageIcon size={24} className="text-neutral-900" /> : <Video size={24} className="text-neutral-900" />}
                                <span className="text-[8px] font-black text-neutral-800 uppercase tracking-widest">Visual Asset</span>
                                </>
                            )}
                            </div>
                        </div>
                        </div>

                        <button 
                        onClick={addPortfolioItem}
                        className="w-full h-12 text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                        style={{ backgroundColor: themeColor }}
                        >
                        <Plus size={16} /> Publish
                        </button>
                    </div>
                </div>
                </div>

                {/* Right: Exhibition Gallery */}
                <div className="lg:col-span-8 space-y-4">
                <div className="bg-white/[0.03] border border-white/5 rounded-lg p-6 backdrop-blur-xl space-y-6 min-h-[500px] relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4 relative z-10">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white flex items-center gap-3 font-['Open_Sans']">
                        <Layout size={16} style={{ color: themeColor }} /> Exhibition
                    </h3>
                    <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/5">{formData.portfolio?.length || 0} Assets</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 relative z-10">
                    {formData.portfolio?.map((item, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-lg overflow-hidden group/item transition-all hover:border-white/10">
                        <div className="h-28 bg-white/[0.02] relative overflow-hidden flex items-center justify-center border-b border-white/5">
                            {item.mediaType === 'image' ? (
                            <img src={item.mediaUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110" alt={item.title} />
                            ) : (
                            <div className="w-full h-full bg-[#111] flex flex-col items-center justify-center gap-2">
                                <Play size={20} style={{ color: themeColor }} />
                                <span className="text-[7px] font-black text-neutral-700 uppercase tracking-[0.3em]">Motion</span>
                            </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <button onClick={() => removePortfolioItem(idx)} className="w-10 h-10 bg-red-600 text-white rounded-lg flex items-center justify-center transition-all hover:scale-105"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="p-3 space-y-1">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-tight line-clamp-1">{item.title}</h4>
                            <p className="text-[9px] text-neutral-500 font-medium line-clamp-2 leading-relaxed">{item.description || "Pending."}</p>
                        </div>
                        </div>
                    ))}

                    {(!formData.portfolio || formData.portfolio.length === 0) && (
                        <div className="col-span-full py-16 flex flex-col items-center justify-center space-y-4 bg-white/[0.01] rounded-lg border border-dashed border-white/5">
                        <Layout size={32} className="text-neutral-900" />
                        <p className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em]">Empty</p>
                        </div>
                    )}
                    </div>
                </div>
                </div>
            </div>

            {/* Adjusted Navigation */}
            <div className="flex items-center justify-end gap-3 pt-6">
              <button 
                onClick={prevStep}
                className="px-5 h-10 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-neutral-400 active:scale-95"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button 
                onClick={handleUpdate}
                className="px-8 h-10 rounded-lg text-[9px] font-black uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 hover:brightness-110"
                style={{ backgroundColor: themeColor, color: '#000' }}
              >
                <CheckCircle2 size={14} /> Finalize
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
