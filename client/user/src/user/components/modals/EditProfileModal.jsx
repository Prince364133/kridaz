import { useState, useEffect } from "react";
import { X, User, Phone, MapPin, AlignLeft, Loader2, Check, Info } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../hooks/useAxiosInstance";
import { useDispatch } from "react-redux";
import { updateUser } from "../../../redux/slices/authSlice";

export default function EditProfileModal({ isOpen, onClose, user }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    phone: "",
    bio: "",
    gender: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        username: user.username || "",
        phone: user.phone || "",
        bio: user.bio || "",
        gender: user.gender || "",
        city: user.city || "",
        state: user.state || "",
      });
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-[#84CC16]/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#84CC16]/10 flex items-center justify-center">
              <User size={20} className="text-[#84CC16]" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Edit Profile</h2>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Customize your identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Full Name</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#84CC16] transition-colors" size={16} />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all"
                  placeholder="Enter your name"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Username</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84CC16] font-black text-sm">@</span>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all"
                  placeholder="username"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Contact Number</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#84CC16] transition-colors" size={16} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all appearance-none"
              >
                <option value="" className="bg-[#0A0A0A]">Select Gender</option>
                <option value="Male" className="bg-[#0A0A0A]">Male</option>
                <option value="Female" className="bg-[#0A0A0A]">Female</option>
                <option value="Other" className="bg-[#0A0A0A]">Other</option>
                <option value="Prefer not to say" className="bg-[#0A0A0A]">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Short Bio</label>
            <div className="relative group">
              <AlignLeft className="absolute left-4 top-4 text-white/20 group-focus-within:text-[#84CC16] transition-colors" size={16} />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all min-h-[100px] resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">City</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#84CC16] transition-colors" size={16} />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all"
                  placeholder="Enter city"
                />
              </div>
            </div>

            {/* State */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-[#84CC16] focus:ring-4 focus:ring-[#84CC16]/10 transition-all"
                placeholder="Enter state"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-2xl border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-8 py-4 rounded-2xl bg-[#84CC16] text-black text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#84CC16]/20 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check size={16} />
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
