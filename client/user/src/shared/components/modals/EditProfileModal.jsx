import { useState, useEffect, useRef } from "react";
import { X, User, Phone, MapPin, AlignLeft, Loader2, Check, Info, Navigation, Camera, Star, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);
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
    <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 flex justify-center">
      <div className="w-full max-w-md mx-auto h-[100dvh] bg-[#161616] flex flex-col relative animate-in slide-in-from-bottom-full duration-500 ease-out shadow-2xl">
        
        {/* Header */}
        <div className="px-6 md:px-8 pt-12 pb-4 shrink-0 flex items-start justify-between">
          <div className="text-left">
            <h2 className="text-[32px] md:text-[40px] font-black text-white leading-tight uppercase">
              EDIT PROFILE
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-6 md:px-8 space-y-6 custom-scrollbar pb-6">
            
            {/* Top Section: Avatar */}
            <div className="flex flex-col items-center mb-4">
              <div className="relative group shrink-0 w-24 h-24">
                <div className="w-24 h-24 rounded-full bg-[#222222] border border-transparent overflow-hidden flex items-center justify-center transition-all">
                  {user?.profilePicture ? (
                    <img 
                      src={user.profilePicture} 
                      alt="" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-white/40 font-black text-3xl tracking-tighter">
                      {user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U"}
                    </span>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-full">
                      <Loader2 size={24} className="animate-spin text-[#BFF367]" />
                    </div>
                  )}
                </div>
                
                <label 
                  htmlFor="modal-profile-upload" 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full border border-white/20 flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-20 group-hover:border-[#BFF367]"
                >
                  <Camera size={14} className="text-white group-hover:text-[#BFF367] transition-colors" />
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

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Full Name */}
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">Full Name</span>
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all placeholder-white/20"
                  placeholder="Enter your name"
                  required
                />
              </label>

              {/* Username */}
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">Username</span>
                  {usernameStatus && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${ usernameStatus === 'available' ? 'text-[#BFF367]' : usernameStatus === 'taken' ? 'text-red-500' : usernameStatus === 'short' ? 'text-orange-500' : 'text-white/20' }`}>
                      {usernameStatus === 'checking' ? 'Checking...' :
                      usernameStatus === 'available' ? 'Available' :
                      usernameStatus === 'taken' ? 'Username Taken' :
                      usernameStatus === 'short' ? 'Too short' : ''}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm transition-colors ${ usernameStatus === 'available' ? 'text-[#BFF367]' : usernameStatus === 'taken' ? 'text-red-500' : 'text-white/20' }`}>@</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full bg-[#222222] border rounded-[10px] py-4 pl-10 pr-12 text-white outline-none transition-all placeholder-white/20 ${ usernameStatus === 'available' ? 'border-[#BFF367]/50 focus:border-[#BFF367]' : usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500' : 'border-transparent focus:border-white/20' }`}
                    placeholder="username"
                    required
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Loader2 size={16} className="animate-spin text-[#BFF367]" />
                    </div>
                  )}
                  {!isCheckingUsername && usernameStatus === 'available' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Check size={16} className="text-[#BFF367]" />
                    </div>
                  )}
                </div>
              </label>

              {/* Row: Phone & Gender */}
              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <label className="block">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Contact</span>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all placeholder-white/20"
                    placeholder="Phone number"
                  />
                </label>

                {/* Gender */}
                <label className="block relative">
                  <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Gender</span>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 pr-10 text-white focus:border-white/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#161616]">Select Gender</option>
                    <option value="Male" className="bg-[#161616]">Male</option>
                    <option value="Female" className="bg-[#161616]">Female</option>
                    <option value="Other" className="bg-[#161616]">Other</option>
                    <option value="Prefer not to say" className="bg-[#161616]">Prefer not to say</option>
                  </select>
                  <div className="absolute right-4 bottom-4 pointer-events-none text-white/40">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </label>
              </div>

              {/* Short Bio */}
              <label className="block">
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Short Bio</span>
                <textarea
                  name="bio"
                  maxLength={150}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all min-h-[80px] resize-none placeholder-white/20"
                  placeholder="Tell us about yourself..."
                />
                <div className="text-right text-[10px] font-semibold text-white/40 uppercase tracking-widest mt-1.5">
                  {formData.bio?.length || 0}/150
                </div>
              </label>

              {/* Location */}
              <div className="relative block" ref={locationRef}>
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Location</span>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({...formData, location: e.target.value});
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(locationSuggestions.length > 0)}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white focus:border-white/20 outline-none transition-all placeholder-white/20"
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

              {/* Sports & Interests */}
              <div className="block relative">
                <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest mb-2 block">Sports & Interests</span>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {(formData.interests || []).map((interest, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-[#BFF367] rounded-[6px] text-[11px] font-bold text-black flex items-center gap-1.5 uppercase tracking-wider">
                      {interest}
                      <button 
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            interests: prev.interests.filter(i => i !== interest)
                          }));
                        }}
                        className="hover:opacity-60 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSportsDropdownOpen(!isSportsDropdownOpen)}
                    className="w-full bg-[#222222] border border-transparent rounded-[10px] py-4 px-4 text-white text-left focus:border-white/20 outline-none transition-all flex items-center justify-between"
                  >
                    <span className="text-white/40">Select sports or interests...</span>
                    {isSportsDropdownOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
                  </button>

                  {isSportsDropdownOpen && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-[#222222] border border-white/10 rounded-[10px] overflow-hidden z-[110] shadow-2xl max-h-[220px] overflow-y-auto custom-scrollbar">
                      {["Cricket", "Football", "Badminton", "Tennis", "Basketball", "Volleyball", "Table Tennis", "Swimming", "Gym", "Yoga"].map((sport, idx) => {
                        const isSelected = formData.interests.includes(sport);
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => {
                              if (isSelected) {
                                setFormData(prev => ({ ...prev, interests: prev.interests.filter(i => i !== sport) }));
                              } else {
                                setFormData(prev => ({ ...prev, interests: [...prev.interests, sport] }));
                              }
                            }}
                            className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex items-center justify-between"
                          >
                            <span className={`text-sm ${isSelected ? 'text-[#BFF367] font-bold' : 'text-white'}`}>{sport}</span>
                            {isSelected && <Check size={16} className="text-[#BFF367]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons (Fixed Bottom) */}
          <div className="shrink-0 p-6 md:p-8 bg-[#161616] border-t border-white/5 flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-[10px] bg-[#222222] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isCheckingUsername || usernameStatus === 'taken' || usernameStatus === 'short'}
              className="flex-[2] py-4 rounded-[10px] bg-[#BFF367] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#a5db4e] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
