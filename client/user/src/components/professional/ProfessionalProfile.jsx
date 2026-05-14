import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axiosInstance from "@hooks/useAxiosInstance";
import { User, Mail, Phone, MapPin, Award, BookOpen, Camera, Save, Loader2, Plus, Trash2, CheckCircle2, ChevronLeft, ChevronRight, FileText, Image as ImageIcon, Video, Play, Layout } from "lucide-react";
import toast from "react-hot-toast";

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
  const { user } = useSelector((state) => state.auth);
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
      const res = await axiosInstance.get(`/api/professional/details/${user.id || user.user}`);
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
        achievements: prof.achievements ? prof.achievements.split("\n").filter(a => a) : []
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
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
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
      toast.success("Certification added to list");
    } else {
      toast.error("Certification title is required");
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
        toast.error("Image size should be less than 2MB");
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
      toast.success("Portfolio item added");
    } else {
      toast.error("Title and Media are required");
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
        toast.error("File size should be less than 5MB");
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
    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
  );

  const StepIndicator = () => (
    <div className="flex items-center gap-6 mb-12">
      {[1, 2, 3].map((step) => (
        <button 
          key={step} 
          onClick={() => jumpToStep(step)}
          className="flex items-center gap-3 group text-left outline-none"
        >
          <div className={`w-10 h-10 rounded-[4px] flex items-center justify-center text-xs font-bold transition-all duration-500 ${
            currentStep === step 
              ? "bg-[#CCFF00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)]" 
              : currentStep > step 
                ? "bg-[#2D2D2D] text-[#CCFF00] border border-[#CCFF00]/20" 
                : "bg-[#111111] border border-[#2D2D2D] text-[#444] group-hover:border-[#CCFF00]/50"
          }`}>
            {currentStep > step ? <CheckCircle2 size={18} /> : `0${step}`}
          </div>
          <div className="hidden md:block">
            <p className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${currentStep === step ? "text-[#CCFF00]" : "text-[#444] group-hover:text-[#CCFF00]/60"}`}>
              Step {step}
            </p>
            <p className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${currentStep === step ? "text-white" : "text-[#222] group-hover:text-white/60"}`}>
              {step === 1 ? "Professional" : step === 2 ? "Certifications" : "Portfolio"}
            </p>
          </div>
          {step < 3 && <div className={`w-8 h-[1px] ${currentStep > step ? "bg-[#CCFF00]/30" : "bg-[#2D2D2D]"}`} />}
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
    <div className="space-y-8 animate-fade-in font-open-sans pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-10 border-b border-[#2D2D2D]">
        <div className="space-y-1">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-inter">
            COACH <span className="text-[#CCFF00]">DOSSIER</span>
          </h1>
          <p className="text-[#999999] text-xs font-semibold uppercase tracking-[0.3em] font-inter mt-1">Manage your professional presence and credentials</p>
        </div>

        <button 
          onClick={handleUpdate}
          disabled={loading}
          className="px-8 py-4 bg-[#111111] border border-[#2D2D2D] rounded-[4px] text-[11px] font-bold text-[#CCFF00] uppercase tracking-widest hover:border-[#CCFF00]/50 transition-all flex items-center gap-3 shadow-2xl group"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} className="group-hover:scale-110 transition-transform" />}
          Save Changes
        </button>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-[4px]">
            <p className="text-[9px] font-bold text-[#444] uppercase tracking-widest">Dossier Completion</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-[#222] rounded-full overflow-hidden">
                <div className="h-full bg-[#CCFF00]" style={{ width: `${(currentStep / 3) * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold text-white font-inter">{Math.round((currentStep / 3) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <StepIndicator />

      <div className="w-full">
        {currentStep === 1 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left: Quick Summary */}
            <div className="lg:col-span-4 space-y-6">
              {/* Sports expertise again as it's professional */}
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-6 shadow-[var(--shadow-2)] relative">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-white mb-6 font-inter flex items-center gap-2">
                  <Award size={14} className="text-[#CCFF00]" /> Sports Expertise
                </h3>
                <div className="relative mb-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Search and Add Sport"
                      className="flex-1 bg-[#111111] border border-[#2D2D2D] rounded-[4px] px-4 py-2.5 text-[11px] text-white outline-none focus:border-[#CCFF00] font-open-sans transition-all"
                      value={newGameType}
                      onChange={(e) => {
                        setNewGameType(e.target.value);
                        setShowSportsDropdown(true);
                      }}
                      onFocus={() => setShowSportsDropdown(true)}
                    />
                    <button onClick={() => addGameType()} className="w-10 h-10 bg-[#CCFF00] text-black rounded-[4px] hover:bg-white transition-all flex items-center justify-center flex-shrink-0"><Plus size={18} /></button>
                  </div>

                  {/* Sports Dropdown */}
                  {showSportsDropdown && filteredSports.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-[#2D2D2D] rounded-[4px] shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredSports.map(sport => (
                        <button 
                          key={sport}
                          onClick={() => addGameType(sport)}
                          className="w-full px-4 py-3 text-left text-[11px] text-white hover:bg-[#CCFF00]/10 transition-colors border-b border-[#1a1a1a] last:border-0"
                        >
                          {sport}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.gameTypes.map(type => (
                    <span key={type} className="px-3 py-1.5 bg-[#111111] border border-[#2D2D2D] rounded-[4px] text-[10px] font-bold text-white flex items-center gap-2 font-inter">
                      {type}
                      <button onClick={() => removeGameType(type)} className="text-[#444] hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Availability Mode Card */}
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 shadow-[var(--shadow-2)] space-y-6 group hover:border-[#CCFF00]/20 transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#2D2D2D] flex items-center justify-center group-hover:border-[#CCFF00]/50 transition-all">
                    <MapPin size={18} className="text-[#CCFF00]" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-inter">Availability</h3>
                    <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-1">Coaching Mode</p>
                  </div>
                </div>
                <div className="relative">
                  <select 
                    className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all appearance-none cursor-pointer"
                    value={formData.availabilityMode}
                    onChange={(e) => setFormData({...formData, availabilityMode: e.target.value})}
                  >
                    <option value="Offline">Offline / On-field Only</option>
                    <option value="Online">Online / Remote Only</option>
                    <option value="Both">Flexible (Both)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#444]">
                    <Plus size={14} className="rotate-45" />
                  </div>
                </div>
              </div>

              {/* Languages Spoken Card */}
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 shadow-[var(--shadow-2)] space-y-6 group hover:border-[#CCFF00]/20 transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#2D2D2D] flex items-center justify-center group-hover:border-[#CCFF00]/50 transition-all">
                    <BookOpen size={18} className="text-[#CCFF00]" />
                  </div>
                  <div>
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-inter">Languages</h3>
                    <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-1">Spoken Fluency</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Search Language..."
                        className="flex-1 bg-[#111111] border border-[#2D2D2D] rounded-[4px] px-4 py-3.5 text-[12px] text-white outline-none focus:border-[#CCFF00] font-open-sans transition-all"
                        value={newLanguage}
                        onChange={(e) => {
                          setNewLanguage(e.target.value);
                          setShowLanguagesDropdown(true);
                        }}
                        onFocus={() => setShowLanguagesDropdown(true)}
                      />
                      <button onClick={() => addLanguage()} className="w-12 h-12 bg-[#CCFF00] text-black rounded-[4px] hover:bg-white transition-all flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(204,255,0,0.1)]"><Plus size={20} /></button>
                    </div>

                    {showLanguagesDropdown && filteredLanguages.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-3 bg-[#080808] border border-[#2D2D2D] rounded-[6px] shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar border-t-[#CCFF00]/20">
                        {filteredLanguages.map(lang => (
                          <button 
                            key={lang}
                            onClick={() => addLanguage(lang)}
                            className="w-full px-5 py-4 text-left text-[12px] text-white hover:bg-[#CCFF00]/10 transition-colors border-b border-[#1a1a1a] last:border-0 flex items-center justify-between group/lang"
                          >
                            <span>{lang}</span>
                            <Plus size={12} className="text-[#222] group-hover/lang:text-[#CCFF00] transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    {formData.languages.map(lang => (
                      <span key={lang} className="px-4 py-2 bg-[#111111] border border-[#2D2D2D] rounded-[4px] text-[11px] font-bold text-white flex items-center gap-3 font-inter hover:border-[#CCFF00]/40 transition-all">
                        {lang}
                        <button onClick={() => removeLanguage(lang)} className="text-[#444] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Professional Fields */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-10 shadow-[var(--shadow-2)]">
                {/* Core Expertise */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-[#CCFF00]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-inter">Core Expertise</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Professional Headline</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Master Cricket Coach & Video Analyst"
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Coaching Level</label>
                      <select 
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all appearance-none"
                        value={formData.coachingLevel}
                        onChange={(e) => setFormData({...formData, coachingLevel: e.target.value})}
                      >
                        <option value="Beginner">Beginner / Grassroots</option>
                        <option value="Intermediate">Intermediate / Club</option>
                        <option value="Elite">Elite / Professional</option>
                        <option value="National">National / International</option>
                      </select>
                    </div>
                    <div className="space-y-3 md:col-span-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Years of Experience</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 10+ Years"
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Training Specializations */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#CCFF00]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-inter">Specializations</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Training Types</label>
                      <div className="flex flex-wrap gap-3">
                        {["Individual", "Group", "Team", "Online", "Clinic"].map(type => (
                          <button 
                            key={type}
                            onClick={() => toggleArrayItem("trainingTypes", type)}
                            className={`px-4 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all ${
                              formData.trainingTypes.includes(type) 
                                ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]" 
                                : "bg-[#111111] border border-[#2D2D2D] text-[#444] hover:border-[#CCFF00]/30"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Age Groups</label>
                      <div className="flex flex-wrap gap-3">
                        {["Kids (<12)", "Teens (13-19)", "Adults (20+)", "Seniors"].map(age => (
                          <button 
                            key={age}
                            onClick={() => toggleArrayItem("ageGroups", age)}
                            className={`px-4 py-2 rounded-[4px] text-[10px] font-bold uppercase tracking-widest transition-all ${
                              formData.ageGroups.includes(age) 
                                ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]" 
                                : "bg-[#111111] border border-[#2D2D2D] text-[#444] hover:border-[#CCFF00]/30"
                            }`}
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

          {/* Career Milestones - Full Width Below */}
          <div className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-10 shadow-[var(--shadow-2)] relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#CCFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white uppercase tracking-tight font-inter flex items-center gap-4">
                      <Award size={28} className="text-[#CCFF00]" /> Career Milestones
                    </h3>
                    <p className="text-[#878C9F] text-[11px] font-bold uppercase tracking-[0.3em] font-inter">Chronicle your professional journey and key achievements</p>
                  </div>
                  <div className="flex gap-4 min-w-[300px] md:min-w-[500px]">
                    <input 
                      type="text" 
                      placeholder="e.g. Led Regional Team to Finals 2023"
                      className="flex-1 bg-[#111111] border border-[#2D2D2D] rounded-[4px] px-6 py-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all"
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
                    />
                    <button onClick={addAchievement} className="w-16 h-16 bg-[#CCFF00] text-black rounded-[4px] hover:scale-105 active:scale-95 transition-all flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(204,255,0,0.2)]">
                      <Plus size={28} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {formData.achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-start justify-between p-6 bg-[#080808] border border-[#2D2D2D] rounded-[6px] group/item hover:border-[#CCFF00]/40 transition-all duration-300 relative">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#2D2D2D] flex items-center justify-center flex-shrink-0 group-hover/item:border-[#CCFF00]/50">
                          <CheckCircle2 size={18} className="text-[#CCFF00]" />
                        </div>
                        <span className="text-[13px] text-white/90 font-open-sans leading-relaxed pt-1.5">{ach}</span>
                      </div>
                      <button onClick={() => removeAchievement(ach)} className="text-[#222] group-hover/item:text-red-500 transition-colors mt-2"><Trash2 size={16} /></button>
                    </div>
                  ))}
                  {formData.achievements.length === 0 && (
                    <div className="col-span-full py-16 border border-dashed border-[#2D2D2D] rounded-[8px] flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-[#111111] flex items-center justify-center">
                        <Award size={32} className="text-[#222]" />
                      </div>
                      <p className="text-[11px] text-[#444] font-bold uppercase tracking-[0.4em]">No milestones registered yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

        {currentStep === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Left: Add Certification Form */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-10 space-y-8 shadow-[var(--shadow-2)] relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#CCFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-[4px] bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                      <Award size={24} className="text-[#CCFF00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight font-inter">Add Certificate</h3>
                      <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-1">Showcase your achievements</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Certificate Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. ICC Level 1 Coaching Certificate"
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all"
                        value={newCert.title}
                        onChange={(e) => setNewCert({...newCert, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Brief Description</label>
                      <textarea 
                        rows="3"
                        placeholder="Provide some context about this certification..."
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all resize-none"
                        value={newCert.description}
                        onChange={(e) => setNewCert({...newCert, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Certificate Photo</label>
                      <div className="relative group/upload">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleCertImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full h-40 border border-dashed rounded-[4px] flex flex-col items-center justify-center gap-3 transition-all ${newCert.image ? "border-[#CCFF00]/40 bg-[#CCFF00]/5" : "border-[#2D2D2D] bg-[#111111] group-hover/upload:border-[#CCFF00]/30"}`}>
                          {newCert.image ? (
                            <img src={newCert.image} className="w-full h-full object-contain p-2" alt="Preview" />
                          ) : (
                            <>
                              <ImageIcon size={32} className="text-[#2D2D2D]" />
                              <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Click to upload image</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={addCertification}
                      className="w-full h-14 bg-[#CCFF00] text-black font-bold uppercase tracking-[0.2em] text-[11px] rounded-[4px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(204,255,0,0.15)] mt-4"
                    >
                      <Plus size={18} /> Add to Dossier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: List of Certifications */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-6 min-h-[600px] shadow-[var(--shadow-2)]">
                <div className="flex items-center justify-between border-b border-[#111] pb-6">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-[#CCFF00]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-inter">Verified Credentials</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{formData.certifications.length} certificates</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.certifications.map((cert, idx) => (
                    <div key={idx} className="bg-[#080808] border border-[#2D2D2D] rounded-[6px] overflow-hidden group/item hover:border-[#CCFF00]/40 transition-all duration-300">
                      <div className="h-40 bg-[#111111] relative overflow-hidden flex items-center justify-center border-b border-[#2D2D2D]">
                        {cert.image ? (
                          <img src={cert.image} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" alt={cert.title} />
                        ) : (
                          <Award size={48} className="text-[#1a1a1a]" />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => removeCertification(idx)} className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all"><Trash2 size={18} /></button>
                        </div>
                      </div>
                      <div className="p-5 space-y-2">
                        <h4 className="text-[12px] font-bold text-white uppercase tracking-tight font-inter line-clamp-1">{cert.title}</h4>
                        <p className="text-[10px] text-[#878C9F] font-open-sans line-clamp-2 leading-relaxed">{cert.description || "No description provided."}</p>
                      </div>
                    </div>
                  ))}

                  {formData.certifications.length === 0 && (
                    <div className="col-span-full h-full flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="w-20 h-20 rounded-full bg-[#111111] flex items-center justify-center border border-dashed border-[#2D2D2D]">
                        <Award size={40} className="text-[#1a1a1a]" />
                      </div>
                      <p className="text-[11px] text-[#444] font-bold uppercase tracking-[0.4em]">No certifications added yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Left: Add Work Showcase */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-10 space-y-8 shadow-[var(--shadow-2)] relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#CCFF00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative space-y-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-[4px] bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center">
                      <Layout size={24} className="text-[#CCFF00]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white uppercase tracking-tight font-inter">Showcase Work</h3>
                      <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest mt-1">Portfolio & Visuals</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex bg-[#111111] p-1 rounded-[4px] border border-[#2D2D2D]">
                      <button 
                        onClick={() => setNewPortfolioItem({...newPortfolioItem, mediaType: 'image', mediaUrl: ''})}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[2px] transition-all ${newPortfolioItem.mediaType === 'image' ? "bg-[#CCFF00] text-black" : "text-[#444] hover:text-white"}`}
                      >
                        Image
                      </button>
                      <button 
                        onClick={() => setNewPortfolioItem({...newPortfolioItem, mediaType: 'video', mediaUrl: ''})}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-[2px] transition-all ${newPortfolioItem.mediaType === 'video' ? "bg-[#CCFF00] text-black" : "text-[#444] hover:text-white"}`}
                      >
                        Video
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Showcase Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Under-19 Championship Highlight"
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all"
                        value={newPortfolioItem.title}
                        onChange={(e) => setNewPortfolioItem({...newPortfolioItem, title: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Short Description</label>
                      <textarea 
                        rows="3"
                        placeholder="Describe what's happening in this visual..."
                        className="w-full bg-[#111111] border border-[#2D2D2D] rounded-[4px] p-4 text-[13px] text-white focus:border-[#CCFF00] outline-none font-open-sans transition-all resize-none"
                        value={newPortfolioItem.description}
                        onChange={(e) => setNewPortfolioItem({...newPortfolioItem, description: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.2em] font-inter ml-1">Upload {newPortfolioItem.mediaType === 'image' ? 'Photo' : 'Video'}</label>
                      <div className="relative group/upload">
                        <input 
                          type="file" 
                          accept={newPortfolioItem.mediaType === 'image' ? 'image/*' : 'video/*'}
                          onChange={handlePortfolioMediaUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full h-40 border border-dashed rounded-[4px] flex flex-col items-center justify-center gap-3 transition-all ${newPortfolioItem.mediaUrl ? "border-[#CCFF00]/40 bg-[#CCFF00]/5" : "border-[#2D2D2D] bg-[#111111] group-hover/upload:border-[#CCFF00]/30"}`}>
                          {newPortfolioItem.mediaUrl ? (
                            newPortfolioItem.mediaType === 'image' ? (
                              <img src={newPortfolioItem.mediaUrl} className="w-full h-full object-contain p-2" alt="Preview" />
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <Play size={32} className="text-[#CCFF00]" />
                                <span className="text-[10px] font-bold text-[#CCFF00] uppercase tracking-widest">Video Ready</span>
                              </div>
                            )
                          ) : (
                            <>
                              {newPortfolioItem.mediaType === 'image' ? <ImageIcon size={32} className="text-[#2D2D2D]" /> : <Video size={32} className="text-[#2D2D2D]" />}
                              <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Click to upload {newPortfolioItem.mediaType}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={addPortfolioItem}
                      className="w-full h-14 bg-[#CCFF00] text-black font-bold uppercase tracking-[0.2em] text-[11px] rounded-[4px] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(204,255,0,0.15)] mt-4"
                    >
                      <Plus size={18} /> Add to Portfolio
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Portfolio Gallery */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#000000] border border-[#2D2D2D] rounded-[8px] p-8 space-y-8 min-h-[600px] shadow-[var(--shadow-2)]">
                <div className="flex items-center justify-between border-b border-[#111] pb-6">
                  <div className="flex items-center gap-3">
                    <Play size={16} className="text-[#CCFF00]" />
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-white font-inter">Work Portfolio</h3>
                  </div>
                  <span className="text-[10px] font-bold text-[#444] uppercase tracking-widest">{formData.portfolio.length} items</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {formData.portfolio.map((item, idx) => (
                    <div key={idx} className="bg-[#080808] border border-[#2D2D2D] rounded-[8px] overflow-hidden group/item hover:border-[#CCFF00]/40 transition-all duration-300">
                      <div className="aspect-video bg-[#111111] relative overflow-hidden flex items-center justify-center border-b border-[#2D2D2D]">
                        {item.mediaType === 'image' ? (
                          <img src={item.mediaUrl} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700" alt={item.title} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] group-hover/item:bg-[#CCFF00]/5 transition-colors">
                            <Play size={48} className="text-[#CCFF00] opacity-40 group-hover/item:opacity-100 transition-all group-hover/item:scale-125" />
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest mt-4">Video Content</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => removePortfolioItem(idx)} className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-all shadow-lg"><Trash2 size={20} /></button>
                        </div>
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[13px] font-bold text-white uppercase tracking-tight font-inter">{item.title}</h4>
                          <span className={`px-2 py-0.5 rounded-[2px] text-[8px] font-bold uppercase tracking-widest ${item.mediaType === 'image' ? "bg-blue-500/10 text-blue-500" : "bg-[#CCFF00]/10 text-[#CCFF00]"}`}>
                            {item.mediaType}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#878C9F] font-open-sans leading-relaxed line-clamp-3">{item.description || "No description provided."}</p>
                      </div>
                    </div>
                  ))}

                  {formData.portfolio.length === 0 && (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-[#111111] flex items-center justify-center border border-dashed border-[#2D2D2D]">
                        <Video size={40} className="text-[#1a1a1a]" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-[12px] font-bold text-white uppercase tracking-[0.3em]">Your stage is empty</p>
                        <p className="text-[10px] text-[#444] font-bold uppercase tracking-widest">Add photos or videos of your coaching sessions to impress users</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 flex justify-between items-center">
          <button 
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`h-14 px-10 rounded-[4px] border border-[#2D2D2D] text-[#878C9F] font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3 ${currentStep === 1 ? "opacity-0 pointer-events-none" : "hover:text-white hover:border-white"}`}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          
          <button 
            onClick={nextStep}
            disabled={loading}
            className="h-14 px-12 rounded-[4px] bg-[#CCFF00] text-black font-bold uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 shadow-[0_10px_30px_rgba(204,255,0,0.2)]"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : currentStep === 3 ? "Finalize Profile" : "Next Milestone"}
            {currentStep < 3 && <ChevronRight size={16} />}
            {currentStep === 3 && <Save size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
