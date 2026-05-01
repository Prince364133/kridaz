import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import useLoginForm from "@hooks/useLoginForm";
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

const Login = () => {
  const { register, handleSubmit, errors, onSubmit, loading } = useLoginForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] relative flex flex-col items-center justify-center pt-28 pb-12 font-sans">
      {/* ── BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_black_100%)]" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className={`relative z-10 w-full max-w-md mx-auto px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        <div className="flex flex-col items-center w-full max-w-md mx-auto">
          <div className="w-full relative">
            
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center mb-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-bold text-white">Login</h2>
                 <p className="text-sm text-white/60">Welcome back, please enter your details</p>
               </div>
            </div>

            {/* Body */}
            <div className="space-y-10 w-full">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                
                {/* Email Input */}
                <div className="space-y-2">
                  <div className="flex justify-between px-1">
                    <label className="text-sm font-medium text-white/60 group-focus-within/input:text-[#84CC16] transition-colors">Email Address</label>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#84CC16] transition-colors">
                      <User size={16} />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all group-hover/input:bg-white/[0.05]"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex justify-between px-1">
                    <label className="text-sm font-medium text-white/60 group-focus-within/input:text-[#84CC16] transition-colors">Password</label>
                    <Link to="/forgot-password" size="sm" className="text-xs text-white/40 hover:text-[#84CC16] transition-colors">Forgot Password?</Link>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#84CC16] transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all group-hover/input:bg-white/[0.05]"
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="space-y-4 mt-8">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 group/btn" 
                  >
                    {loading ? "Logging in..." : "Login"}
                    {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      dispatch(login({ 
                        token: "dummy-token-12345", 
                        role: "admin",
                        user: {
                          id: "admin-123",
                          name: "Platform Administrator",
                          email: "admin@turfspot.com",
                        }
                      }));
                      window.location.href = "/admin";
                    }}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white h-14 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all group/demo"
                  >
                    <Zap className="w-4 h-4 text-[#84CC16] group-hover/demo:animate-pulse" />
                    Quick Demo Access
                  </button>
                </div>
              </form>

              {/* Alternative Actions */}
              <div className="space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-white/5"></div>
                  <span className="absolute bg-[#000] px-4 text-xs text-white/40">Or continue with</span>
                </div>

                <div className="flex gap-4">
                   <button className="flex-1 h-12 border border-white/5 hover:border-white/20 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/[0.02]">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="Google" />
                      <span className="text-sm font-medium text-white/80">Google</span>
                   </button>
                   <button className="flex-1 h-12 border border-white/5 hover:border-white/20 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-white/[0.02]">
                      <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" className="w-4 h-4" alt="FB" />
                      <span className="text-sm font-medium text-white/80">Meta</span>
                   </button>
                </div>
              </div>
            </div>

            {/* Footer Sign Up Link */}
            <div className="pt-8 mt-10 border-t border-white/5 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-white/60">
                Don't have an account? <Link to="/signup" className="text-[#84CC16] hover:underline ml-2 font-semibold">Sign up</Link>
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
    </div>
  );
};

export default Login;
