import { useState, useEffect, useRef } from "react";
import { X, User, Phone, MapPin, AlignLeft, Loader2, Check, Info, Navigation, Camera, Star } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@hooks/useAxiosInstance";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../redux/slices/authSlice";
import { searchLocations } from "../../utils/locationService";

export default function EditProfileModal({ isOpen, onClose, user }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    bio: "",
    gender: "",
    location: "",
    interests: [],
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const locationRef = useRef(null);
  
  // Username check states
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'checking'
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        location: user.location || user.city || "",
        interests: user.interests || user.sportTypes || [],
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  // Username availability check
  useEffect(() => {
    const checkAvailability = async () => {
      if (!formData.username || formData.username === user?.username) {
        setUsernameStatus(null);
        return;
      }

      if (formData.username.length < 3) {
        setUsernameStatus('short');
        return;
      }

      setIsCheckingUsername(true);
      setUsernameStatus('checking');
      
      try {
        const response = await axiosInstance.get(`/api/user/auth/check-username?username=${formData.username}`);
        setUsernameStatus(response.data.available ? 'available' : 'taken');
      } catch (error) {
        console.error("Username check error:", error);
        setUsernameStatus(null);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timer = setTimeout(checkAvailability, 500);
    return () => clearTimeout(timer);
  }, [formData.username, user?.username]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    setUploading(true);
    try {
      const response = await axiosInstance.post("/api/user/auth/profile-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      dispatch(updateUser({ profilePicture: response.data.profilePicture }));
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosInstance.put("/api/user/auth/updateProfile", formData);
      if (response.data.success) {
        dispatch(updateUser(response.data.user));
        toast.success("Profile updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* ── Gradient SVG Definition for Modal Lucide Icons */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="modal-cyan-lime-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#55DEE8" />
            <stop offset="100%" stopColor="#BFF367" />
          </linearGradient>
        </defs>
      </svg>

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container - Upgraded to max-w-xl per Mockup */}
      <div className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[8px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header - Compact */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#55DEE8]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[8px] bg-[#55DEE8]/10 flex items-center justify-center shrink-0">
              <User size={18} className="text-[#55DEE8]" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white leading-none" style={{ fontFamily: "'Open Sans', sans-serif" }}>Edit Profile</h2>
              <p className="text-sm text-[#BFF367] font-black uppercase tracking-tight mt-1 leading-none" style={{ fontFamily: "'Inter', sans-serif" }}>Customize your identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-[8px] hover:bg-white/5 text-white/40 hover:text-white transition-all border border-transparent hover:border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form - Spaced out nicely and highly compact */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* Top Section: Avatar & Details side-by-side */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left Box: Profile Picture */}
            <div className="flex flex-col">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1.5 ml-1">Profile Picture</label>
              <div className="relative group shrink-0 w-20 h-20">
                <div className="w-20 h-20 rounded-[8px] bg-gradient-to-br from-[#55DEE8]/10 to-[#BFF367]/10 border border-white/10 overflow-hidden flex items-center justify-center group-hover:border-[#55DEE8]/30 transition-all p-[1px]">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="" 
                      className="w-full h-full object-cover rounded-[8px]"
                    />
                  ) : (
                    <span className="text-[#BFF367] font-black text-2xl tracking-tighter">
                      {user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U"}
                    </span>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <Loader2 size={20} className="animate-spin text-[#55DEE8]" />
                    </div>
                  )}
                </div>
                
                <label 
                  htmlFor="modal-profile-upload" 
                  className="absolute bottom-0 right-0 w-7 h-7 bg-black rounded-full border border-[#BFF367] flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-20"
                >
                  <Camera size={12} className="text-[#BFF367]" />
                  <input 
                    type="file" 
                    id="modal-profile-upload" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    disabled={uploading} 
                  />
                </label>
              </div>
            </div>

            {/* Right Box: Full Name & Username inputs */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={14} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#55DEE8] focus:ring-4 focus:ring-[#55DEE8]/10 transition-all placeholder-white/20"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Username</label>
                  {usernameStatus && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${ usernameStatus === 'available' ? 'text-[#BFF367]' : usernameStatus === 'taken' ? 'text-red-500' : usernameStatus === 'short' ? 'text-orange-500' : 'text-white/20' }`}>
                      {usernameStatus === 'checking' ? 'Checking...' :
                      usernameStatus === 'available' ? 'Available' :
                      usernameStatus === 'taken' ? 'Username Taken' :
                      usernameStatus === 'short' ? 'Too short' : ''}
                    </span>
                  )}
                </div>
                <div className="relative group">
                  <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-xs transition-colors ${ usernameStatus === 'available' ? 'text-[#BFF367]' : usernameStatus === 'taken' ? 'text-red-500' : 'text-white/20' }`}>@</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full bg-[#0d0d0d] border rounded-[8px] py-2.5 pl-9 pr-10 text-xs text-white focus:outline-none focus:ring-4 transition-all placeholder-white/20 ${ usernameStatus === 'available' ? 'border-[#BFF367]/50 focus:border-[#BFF367] focus:ring-[#BFF367]/10' : usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/10' : 'border-white/10 focus:border-[#55DEE8] focus:ring-[#55DEE8]/10' }`}
                    placeholder="username"
                    required
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Loader2 size={12} className="animate-spin text-[#55DEE8]" />
                    </div>
                  )}
                  {!isCheckingUsername && usernameStatus === 'available' && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                      <Check size={12} className="text-[#BFF367]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Phone & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Contact Number</label>
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={14} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#55DEE8] focus:ring-4 focus:ring-[#55DEE8]/10 transition-all placeholder-white/20"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Gender Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Gender</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors pointer-events-none" size={14} />
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-[#55DEE8] focus:ring-4 focus:ring-[#55DEE8]/10 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#000000]">Select Gender</option>
                  <option value="Male" className="bg-[#000000]">Male</option>
                  <option value="Female" className="bg-[#000000]">Female</option>
                  <option value="Other" className="bg-[#000000]">Other</option>
                  <option value="Prefer not to say" className="bg-[#000000]">Prefer not to say</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Short Bio with Character Limit */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Short Bio</label>
            <div className="relative group">
              <AlignLeft className="absolute left-3.5 top-3 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={14} />
              <textarea
                name="bio"
                maxLength={150}
                value={formData.bio}
                onChange={handleChange}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#55DEE8] focus:ring-4 focus:ring-[#55DEE8]/10 transition-all min-h-[60px] resize-none placeholder-white/20"
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="text-right text-[9px] font-bold text-white/30 uppercase tracking-widest mt-0.5">
              {formData.bio?.length || 0}/150
            </div>
          </div>

          {/* Row 4: Location */}
          <div className="space-y-1.5" ref={locationRef}>
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Location</label>
            <div className="relative group">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors" size={14} />
              <input
                type="text"
                value={formData.location}
                onChange={(e) => {
                  setFormData({...formData, location: e.target.value});
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(locationSuggestions.length > 0)}
                placeholder="e.g. Mumbai, Maharashtra"
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-[#55DEE8] focus:ring-4 focus:ring-[#55DEE8]/10 transition-all placeholder-white/20"
              />
              {isSearchingLocation && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-3.5 h-3.5 text-[#55DEE8] animate-spin" />
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] border border-white/10 rounded-[8px] overflow-hidden z-[110] shadow-2xl max-h-[140px] overflow-y-auto custom-scrollbar">
                  {locationSuggestions.map((suggestion, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => handleSelectLocation(suggestion)}
                      className="w-full px-4 py-2.5 text-left hover:bg-[#55DEE8]/10 text-white/80 hover:text-white border-b border-white/10 last:border-0 transition-colors flex flex-col gap-0.5"
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">{suggestion.city || suggestion.display_name.split(',')[0]}</span>
                      <span className="text-[9px] text-white/40 truncate">{suggestion.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Row 5: Sports & Interests select dropdown */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Sports & Interests</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {(formData.interests || []).map((interest, idx) => (
                <span key={idx} className="px-2.5 py-0.5 bg-[#55DEE8]/15 border border-[#55DEE8]/30 rounded-[8px] text-[9px] font-bold text-[#55DEE8] flex items-center gap-1.5">
                  {interest}
                  <button 
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        interests: prev.interests.filter(i => i !== interest)
                      }));
                    }}
                    className="hover:text-white"
                  >
                    <X size={8} />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative group">
              <Star className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#55DEE8] transition-colors pointer-events-none" size={14} />
              <select
                onChange={(e) => {
                  if (e.target.value && !formData.interests.includes(e.target.value)) {
                    setFormData(prev => ({
                      ...prev,
                      interests: [...prev.interests, e.target.value]
                    }));
                  }
                  e.target.value = "";
                }}
                className="w-full bg-[#0d0d0d] border border-white/10 rounded-[8px] py-2.5 pl-10 pr-10 text-xs text-white focus:outline-none focus:border-[#55DEE8] focus:ring-4 focus:ring-[#55DEE8]/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">Add your sports or interests</option>
                {["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis", "Swimming", "Gym", "Yoga"].filter(s => !formData.interests.includes(s)).map((sport, idx) => (
                  <option key={idx} value={sport}>{sport}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Row 6: Action Buttons Cancel / Save */}
          <div className="pt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 rounded-[8px] border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isCheckingUsername || usernameStatus === 'taken' || usernameStatus === 'short'}
              className="flex-[2] px-6 py-2.5 rounded-[8px] bg-gradient-to-r from-[#55DEE8] to-[#BFF367] text-black text-[9px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#55DEE8]/20 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
