import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@redux/slices/authSlice";
import useLoginForm from "../hooks/useLoginForm";
import GoogleAuthButton from "../components/GoogleAuthButton";
import OnboardingModal from "@components/modals/OnboardingModal";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Target, 
  Cpu, 
  Globe, 
  Lock, 
  User, 
  Trophy,
  ChevronRight,
  Monitor,
  Fingerprint,
  Radio
} from "lucide-react";
import { FormField } from "@components/common";

const SUBHEADING_STYLE = { fontFamily: "'Inter 28pt Light', sans-serif", fontWeight: 300 };

const Login = () => {
  const navigate = useNavigate();
  const { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError,
    showOnboarding,
    setShowOnboarding,
    onboardingUser,
    accountNotFound
  } = useLoginForm();
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch(); // for quick demo button

  const { isLoggedIn, role } = useSelector((state) => state.auth);
  
  useEffect(() => {
    setMounted(true);
    if (isLoggedIn && !showOnboarding) {
      const normalizedRole = role?.toLowerCase();
      const professionalRoles = ["coach", "umpire", "streamer", "scorer", "cheerleader", "commentator"];
      
      if (normalizedRole === "admin" || normalizedRole === "bmsp_admin") {
        dispatch(logout());
        toast.error("Administrators must log in via the Platform Admin Console.");
      } else if (normalizedRole === "venu_owners" || normalizedRole === "owner" || normalizedRole === "venue_owner") {
        navigate("/venue-owner");
      } else if (professionalRoles.includes(normalizedRole)) {
        navigate(`/professional/${normalizedRole}`);
      } else {
        navigate("/");
      }
    }
  }, [isLoggedIn, role, navigate, showOnboarding, dispatch]);

  return (
    <div className="min-h-screen bg-[#000] relative flex flex-col items-center justify-start pt-4 lg:pt-10 pb-12 font-sans">
      {/* Gï¿½ï¿½Gï¿½ï¿½ BACKGROUND LAYER Gï¿½ï¿½Gï¿½ï¿½ */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_black_100%)]" />
      </div>

      {/* Gï¿½ï¿½Gï¿½ï¿½ MAIN CONTENT Gï¿½ï¿½Gï¿½ï¿½ */}
      <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
          <div className="w-full relative">
            
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center mb-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-bold text-white">Login</h2>
                 <p className="text-sm text-white/60" style={SUBHEADING_STYLE}>Welcome back, please enter your details</p>
               </div>
            </div>

            {/* Body */}
            <div className="space-y-10 w-full">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                {/* OTP Step */}
                <div className={showOtpInput ? "space-y-6 block animate-fade-in" : "hidden"}>
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-white">Verification Code</h3>
                    <p className="text-sm text-white/60 mt-2">We sent a 6-digit code to your email address.</p>
                  </div>
                  
                  <div className="space-y-2 group/field">
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#BFF367] transition-colors" />
                      <input 
                        {...register("otp")}
                        type="text" 
                        placeholder="000000"
                        maxLength={6}
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#BFF367]/50 rounded-[8px] h-14 pl-12 pr-4 text-white text-center tracking-widest text-lg outline-none transition-all"
                      />
                    </div>
                    {errors.otp && <p className="text-xs text-red-500 mt-1 ml-1 text-center">{errors.otp.message}</p>}
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#BFF367] hover:bg-[#a3e635] text-black h-14 rounded-[8px] font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group/btn" 
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                  </button>
                </div>

                {/* Email/Password Step */}
                <div className={!showOtpInput ? "space-y-8 block animate-fade-in" : "hidden"}>
                    {/* Google Login Button */}
                    <div className="w-full mb-8">
                      <GoogleAuthButton 
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        isLoading={loading}
                        mode="signin"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 w-full mb-8">
                      <div className="h-px bg-white/10 flex-1"></div>
                      <span className="text-white/40 text-sm font-medium whitespace-nowrap">OR CONTINUE WITH EMAIL</span>
                      <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    <div className="space-y-6">
                      {/* Email Input */}
                      <div className="space-y-2">
                        <div className="flex justify-between px-1">
                          <label className="text-sm font-medium text-white/60 group-focus-within/input:text-[#BFF367] transition-colors">Email Address or Phone Number</label>
                        </div>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#BFF367] transition-colors">
                            <User size={16} />
                          </div>
                          <input
                            {...register("email")}
                            type="text"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d+$/.test(val)) {
                                e.target.value = val.slice(0, 10);
                              }
                              register("email").onChange(e);
                            }}
                            placeholder="name@example.com or 9876543210"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#BFF367]/50 rounded-[8px] h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all group-hover/input:bg-white/[0.05]"
                          />
                          {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                        </div>
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2">
                        <div className="flex justify-between px-1">
                          <label className="text-sm font-medium text-white/60 group-focus-within/input:text-[#BFF367] transition-colors">Password</label>
                          <Link to="/forgot-password" size="sm" className="text-xs text-white/40 hover:text-[#BFF367] transition-colors">Forgot Password?</Link>
                        </div>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#BFF367] transition-colors">
                            <Lock size={16} />
                          </div>
                          <input
                            {...register("password")}
                            type="password"
                            placeholder="Gï¿½ï¿½Gï¿½ï¿½Gï¿½ï¿½Gï¿½ï¿½Gï¿½ï¿½Gï¿½ï¿½Gï¿½ï¿½Gï¿½ï¿½"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#BFF367]/50 rounded-[8px] h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all group-hover/input:bg-white/[0.05]"
                          />
                          {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="space-y-4 mt-8">
                      {accountNotFound && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] mb-4 animate-fade-in">
                          <p className="text-sm text-red-500 text-center mb-3 font-medium">
                            Account not found. Create a new account to get started!
                          </p>
                          <Link 
                            to="/signup" 
                            className="w-full bg-white/10 hover:bg-white/20 text-white h-12 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                          >
                            Sign Up Now <ArrowRight size={16} />
                          </Link>
                        </div>
                      )}
                      
                      
                      <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-[#BFF367] hover:bg-[#a3e635] text-black h-14 rounded-[8px] font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 group/btn" 
                      >
                        {loading ? "Sending OTP..." : "Continue"}
                        {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                      </button>

                    </div>
                  </div>
              </form>
            </div>

            {/* Footer Sign Up Link */}
            <div className="pt-8 mt-10 border-t border-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-white/60">
                Don't have an account? <Link to="/signup" className="text-[#BFF367] hover:underline ml-2 font-semibold">Sign up</Link>
              </p>
            </div>
          </div>
          
          {/* Back Link */}
          <Link to="/" className="mt-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group">
            <ChevronRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* AMBIENT LIGHTING */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.01] pointer-events-none rounded-full" />
      {/* ONBOARDING MODAL */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={() => navigate("/")}
      />
    </div>
  );
};

export default Login;

