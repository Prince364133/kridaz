import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useSignUpForm from "@hooks/useSignUpForm";
import { GoogleLogin } from "@react-oauth/google";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Mail,
  Phone,
  ChevronLeft,
  Dumbbell,
  BookOpen,
  Users,
  Trophy,
  MapPin,
  Locate,
  UserSquare2
} from "lucide-react";
import toast from "react-hot-toast";

const ACCENT = "#3B82F6"; // Blue for coaches

const CoachSignUp = () => {
  const { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading,
    setValue,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError
  } = useSignUpForm("coach");
  const [mounted, setMounted] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || "";
            const state = data.address.state || "";
            const locationString = [city, state].filter(Boolean).join(", ");
            setValue("location", locationString, { shouldValidate: true });
            toast.success("Location fetched successfully");
          } else {
            toast.error("Could not determine location");
          }
        } catch (error) {
          toast.error("Error fetching location details");
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        toast.error("Location access denied or unavailable");
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-start pt-24 lg:pt-32 pb-20 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-blue-900/10" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none" />
      </div>

      <div className={`relative z-10 w-full max-w-[1300px] grid lg:grid-cols-5 gap-0 lg:gap-24 items-center px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>

        {/* Left Side */}
        <div className="hidden lg:flex lg:col-span-2 flex-col space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5">
              <Dumbbell size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Coach Network</span>
            </div>
            <h1 className="text-7xl xl:text-8xl font-bold text-white leading-[0.9] tracking-tight uppercase">
              COACH <br />
              <span style={{ color: ACCENT }}>SMARTER.</span>
            </h1>
            <p className="text-sm text-white/40 uppercase tracking-widest max-w-sm leading-relaxed">
              Join the TurfSpot coach network. Connect with players, manage sessions, and grow your coaching career.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Users, label: "Player Connect", val: "Coming Soon" },
              { icon: BookOpen, label: "Session Management", val: "Coming Soon" },
              { icon: Trophy, label: "Performance Tracking", val: "Coming Soon" },
              { icon: ShieldCheck, label: "Verified Coach Badge", val: "Coming Soon" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <item.icon size={16} className="text-blue-400/50" />
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-blue-400 uppercase">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-3">
          <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden relative">

            {/* Header */}
            <div className="bg-white/[0.02] border-b border-white/5 p-8 md:p-10 flex justify-between items-center">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400/60 uppercase">Coach Registration</span>
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Join as a Coach</h2>
                <p className="text-xs text-white/20 uppercase tracking-widest">Create your professional profile</p>
              </div>
              <Dumbbell size={32} className="text-blue-400/30" />
            </div>

            {/* Body */}
            <div className="p-8 md:p-14 space-y-10">
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <p className="text-xs text-blue-300/70 leading-relaxed">
                  The Coach module is <strong className="text-blue-300">coming soon</strong>. Register now to secure your spot on the early access waitlist.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {showOtpInput ? (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-white uppercase tracking-wider">Verification</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] mt-2">Enter the 6-digit code sent to your email</p>
                    </div>

                    <div className="space-y-2 group/field">
                      <div className="relative group/input text-center">
                        <input
                          {...register("otp")}
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-16 text-white text-center text-2xl tracking-[0.5em] font-bold outline-none transition-all"
                        />
                      </div>
                      {errors.otp && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center mt-2">{errors.otp.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 group/btn"
                    >
                      {loading ? "Verifying..." : "Verify & Join Network"}
                      {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Google Sign Up */}
                    <div className="w-full flex flex-col items-center justify-center mb-2">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        width="100%"
                        text="signup_with"
                      />
                    </div>

                    <div className="flex items-center gap-4 w-full my-6">
                      <div className="h-px bg-white/5 flex-1"></div>
                      <span className="text-white/10 text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap">OR REGISTER WITH EMAIL</span>
                      <div className="h-px bg-white/5 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                      {/* Name */}
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Full Name</label>
                        <div className="relative">
                          <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input
                            {...register("name")}
                            type="text"
                            placeholder="Your Name"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                          />
                        </div>
                        {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Email Address</label>
                        <div className="relative">
                          <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input
                            {...register("email")}
                            type="email"
                            placeholder="coach@example.com"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                          />
                        </div>
                        {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Phone Number</label>
                        <div className="relative">
                          <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input
                            {...register("phone")}
                            type="text"
                            placeholder="+91 00000 00000"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                          />
                        </div>
                        {errors.phone && <p className="text-red-400 text-xs ml-1">{errors.phone.message}</p>}
                      </div>

                      {/* Gender */}
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Gender</label>
                        <div className="relative">
                          <UserSquare2 size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 z-10 pointer-events-none" />
                          <select 
                            {...register("gender")}
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm appearance-none outline-none transition-all cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled className="bg-black text-white/40">Select Gender</option>
                            <option value="Male" className="bg-black text-white">Male</option>
                            <option value="Female" className="bg-black text-white">Female</option>
                            <option value="Other" className="bg-black text-white">Other</option>
                            <option value="Prefer not to say" className="bg-black text-white">Prefer not to say</option>
                          </select>
                        </div>
                        {errors.gender && <p className="text-red-400 text-xs ml-1">{errors.gender.message}</p>}
                      </div>

                      {/* Location */}
                      <div className="space-y-3 md:col-span-2 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Location</label>
                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                            <input 
                              {...register("location")}
                              type="text" 
                              placeholder="City, State"
                              className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={fetchLocation}
                            disabled={isFetchingLocation}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl h-14 px-4 flex items-center justify-center gap-2 text-white/80 transition-colors disabled:opacity-50 min-w-[120px]"
                          >
                            <Locate size={14} className={isFetchingLocation ? "animate-pulse text-blue-400" : ""} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{isFetchingLocation ? "Fetching..." : "Locate"}</span>
                          </button>
                        </div>
                        {errors.location && <p className="text-red-400 text-xs ml-1">{errors.location.message}</p>}
                      </div>

                      {/* Password */}
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Password</label>
                        <div className="relative">
                          <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input
                            {...register("password")}
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                          />
                        </div>
                        {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-3 group/field">
                        <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-blue-400 transition-colors ml-1">Confirm Password</label>
                        <div className="relative">
                          <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                          <input
                            {...register("confirmPassword")}
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-blue-500/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                          />
                        </div>
                        {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 group/btn mt-4"
                    >
                      {loading ? "Sending OTP..." : "Continue to Verification"}
                      {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                    </button>
                  </>
                )}
              </form>

              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-white/20 uppercase tracking-widest">Already registered?</p>
                <Link to="/login" className="flex items-center gap-2 text-blue-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
                  Login to Portal
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link to="/partners" className="inline-flex items-center gap-2 text-white/20 hover:text-white transition-colors text-xs uppercase tracking-widest group">
              <ChevronLeft size={14} className="group-hover:-translate-x-2 transition-transform" />
              Back to Partner Gateway
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachSignUp;

