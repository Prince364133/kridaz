import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  LogOut, 
  Camera, 
  MapPin, 
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  Bell,
  Lock,
  Globe,
  Briefcase
} from "lucide-react";
import { logout } from "@redux/slices/authSlice.js";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import toast from "react-hot-toast";

const DashboardProfile = () => {
  const user = useSelector((state) => state.auth.user);
  const role = useSelector((state) => state.auth.role);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/user/auth/logout");
      dispatch(logout());
      navigate("/", { replace: true });
    } catch (error) {
      dispatch(logout());
      navigate("/", { replace: true });
    }
  };

  const roleLabel = role?.replace("BMSP_", "") || "USER";

  return (
    <div className="min-h-[calc(100vh-120px)] text-white p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">My Profile</h1>
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Manage your personal information and account settings</p>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#84CC16]/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#84CC16] to-[#4ADE80] p-1 shadow-2xl shadow-[#84CC16]/20 group-hover:scale-105 transition-transform duration-500">
                  <div className="w-full h-full rounded-[1.4rem] bg-[#0d0d0d] flex items-center justify-center overflow-hidden">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={48} className="text-[#84CC16]" />
                    )}
                  </div>
                </div>
                <button className="absolute bottom-0 right-0 p-2.5 bg-[#84CC16] text-black rounded-xl shadow-lg hover:scale-110 transition-transform">
                  <Camera size={18} strokeWidth={2.5} />
                </button>
              </div>

              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">{user?.name || user?.fullName || "Partner User"}</h2>
              <div className="flex items-center gap-2 px-3 py-1 bg-[#84CC16]/10 rounded-full mb-4">
                <Shield size={12} className="text-[#84CC16]" />
                <span className="text-[10px] font-black text-[#84CC16] uppercase tracking-widest">{roleLabel}</span>
              </div>
              
              <div className="w-full border-t border-white/5 my-6" />
              
              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-white/40 text-sm">
                  <Mail size={16} />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-white/40 text-sm">
                  <MapPin size={16} />
                  <span>{user?.location || "Not Specified"}</span>
                </div>
                <div className="flex items-center gap-3 text-white/40 text-sm">
                  <Calendar size={16} />
                  <span>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8">
            <h3 className="text-red-500 font-black uppercase tracking-widest text-[10px] mb-4">Danger Zone</h3>
            <p className="text-red-500/60 text-[11px] font-bold leading-relaxed mb-6">Logging out will end your current session. You will need to log in again to access the dashboard.</p>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 py-4 bg-red-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Information Section */}
          <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/5 rounded-xl text-white/40"><Settings size={20} /></div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Account Details</h3>
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Personal and professional information</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${
                  isEditing ? "bg-white/10 text-white hover:bg-white/20" : "bg-[#84CC16]/10 text-[#84CC16] hover:bg-[#84CC16]/20"
                }`}
              >
                {isEditing ? "Cancel" : "Edit Info"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text" 
                    defaultValue={user?.name || ""}
                    disabled={!isEditing}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16]/50 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="email" 
                    defaultValue={user?.email || ""}
                    disabled
                    className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white/40 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 text-sm font-bold">+91</div>
                  <input 
                    type="text" 
                    defaultValue={user?.phoneNumber || ""}
                    disabled={!isEditing}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-sm text-white focus:outline-none focus:border-[#84CC16]/50 disabled:opacity-50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Role / Designation</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    type="text" 
                    defaultValue={roleLabel}
                    disabled
                    className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm text-white/40 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="mt-10 flex justify-end">
                <button className="flex items-center gap-3 px-10 py-4 bg-[#84CC16] text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#a3e635] hover:shadow-[0_0_30px_rgba(132,204,22,0.3)] transition-all">
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Quick Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-6 flex items-center gap-5 hover:border-[#84CC16]/20 transition-all cursor-pointer group">
              <div className="p-4 bg-white/5 rounded-2xl text-white/20 group-hover:bg-[#84CC16]/10 group-hover:text-[#84CC16] transition-all"><Lock size={20} /></div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Privacy & Security</h4>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Password and session logs</p>
              </div>
            </div>
            <div className="bg-[#0d0d0d] border border-white/5 rounded-[2.5rem] p-6 flex items-center gap-5 hover:border-[#84CC16]/20 transition-all cursor-pointer group">
              <div className="p-4 bg-white/5 rounded-2xl text-white/20 group-hover:bg-[#84CC16]/10 group-hover:text-[#84CC16] transition-all"><Bell size={20} /></div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-tight">Notifications</h4>
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Email and app alerts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfile;
