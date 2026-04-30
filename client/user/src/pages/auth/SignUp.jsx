import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSignUpForm from "@hooks/useSignUpForm";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Target, 
  UserPlus, 
  Globe, 
  Lock, 
  User, 
  Mail, 
  Phone,
  ChevronRight,
  ChevronLeft,
  Server,
  Database,
  Cpu
} from "lucide-react";

const SignUp = () => {
  const { register, handleSubmit, errors, onSubmit, loading } = useSignUpForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] relative flex flex-col items-center justify-center pt-28 pb-12 md:pt-32 md:pb-20 font-sans">
      {/* ── BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className={`relative z-10 w-full max-w-2xl mx-auto px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
          <div className="w-full relative">
            
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center mb-10">
               <div className="space-y-2">
                 <h2 className="text-3xl font-bold text-white">Create Account</h2>
                 <p className="text-sm text-white/60">Sign up to get started</p>
               </div>
            </div>

            {/* Body */}
            <div className="space-y-10 w-full">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Full Name */}
                  <div className="space-y-2 group/field">
                    <label className="text-sm font-medium text-white/60 group-focus-within/field:text-[#84CC16] transition-colors ml-1">Full Name</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#84CC16] transition-colors" />
                      <input 
                        {...register("name")}
                        type="text" 
                        placeholder="John Doe"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name.message}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2 group/field">
                    <label className="text-sm font-medium text-white/60 group-focus-within/field:text-[#84CC16] transition-colors ml-1">Email Address</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#84CC16] transition-colors" />
                      <input 
                        {...register("email")}
                        type="email" 
                        placeholder="name@example.com"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2 group/field">
                    <label className="text-sm font-medium text-white/60 group-focus-within/field:text-[#84CC16] transition-colors ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#84CC16] transition-colors" />
                      <input 
                        {...register("phone")}
                        type="text" 
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone.message}</p>}
                  </div>


                  {/* Password */}
                  <div className="space-y-2 group/field">
                    <label className="text-sm font-medium text-white/60 group-focus-within/field:text-[#84CC16] transition-colors ml-1">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#84CC16] transition-colors" />
                      <input 
                        {...register("password")}
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                    </div>
                    {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2 group/field">
                    <label className="text-sm font-medium text-white/60 group-focus-within/field:text-[#84CC16] transition-colors ml-1">Confirm Password</label>
                    <div className="relative">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/field:text-[#84CC16] transition-colors" />
                      <input 
                        {...register("confirmPassword")}
                        type="password" 
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group/btn" 
                >
                  {loading ? "Creating account..." : "Sign Up"}
                  {!loading && <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                </button>
              </form>

              {/* Back to Login */}
              <div className="pt-8 mt-10 border-t border-white/5 flex flex-col items-center justify-center text-center">
                <p className="text-sm text-white/60">
                  Already have an account? <Link to="/login" className="text-[#84CC16] hover:underline ml-2 font-semibold">Login</Link>
                </p>
              </div>
            </div>
          </div>
          
          {/* Back */}
          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group">
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* AMBIENT LIGHTING */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-white/[0.01] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-white/[0.01] pointer-events-none rounded-full" />
    </div>
  );
};

export default SignUp;
