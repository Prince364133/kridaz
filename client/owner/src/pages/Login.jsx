import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../redux/slices/authSlice";
import useLoginForm from "@hooks/useLoginForm";
import { GoogleLogin } from "@react-oauth/google";
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
  Radio,
  Building2
} from "lucide-react";

const Login = () => {
  const dispatch = useDispatch();
  const { 
    register, 
    handleSubmit, 
    errors, 
    onSubmit, 
    loading,
    showOtpInput,
    handleGoogleSuccess,
    handleGoogleError
  } = useLoginForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-start pt-24 lg:pt-32 pb-20 font-sans">
      {/* ── BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/95 to-[#84CC16]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_black_100%)]" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className={`relative z-10 w-full max-w-[1200px] grid lg:grid-cols-2 gap-0 lg:gap-20 items-center px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>

        {/* Left Side: Content */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-[#84CC16]/10 border-l-2 border-[#84CC16]">
              <Building2 size={14} className="text-[#84CC16]" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-[#84CC16] uppercase">Partner Portal</span>
            </div>
            <h1 className="text-7xl xl:text-8xl font-bold text-white leading-[0.9] tracking-tight uppercase">
              MANAGE YOUR <br />
              <span className="text-[#84CC16]">BUSINESS.</span>
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 border border-white/5 bg-white/[0.02] space-y-3 rounded-2xl">
              <Globe size={20} className="text-[#84CC16]/50" />
              <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">Professional venue management tools.</p>
            </div>
            <div className="p-6 border border-white/5 bg-white/[0.02] space-y-3 rounded-2xl">
              <Activity size={20} className="text-[#84CC16]/50" />
              <p className="text-xs text-white/40 leading-relaxed uppercase tracking-wider">Real-time business analytics engine.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative">

            {/* Header */}
            <div className="bg-white/[0.02] border-b border-white/5 p-8 flex justify-between items-center">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Partner Login</h2>
                <p className="text-xs text-white/20 uppercase tracking-widest">Venue Owners · Coaches · Umpires</p>
              </div>
              <Lock size={32} className="text-white/10" />
            </div>

            {/* Body */}
            <div className="p-8 md:p-10 space-y-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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
                          className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-16 text-white text-center text-2xl tracking-[0.5em] font-bold outline-none transition-all"
                        />
                      </div>
                      {errors.otp && <p className="text-red-400 text-[10px] uppercase tracking-widest text-center mt-2">{errors.otp.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)] disabled:opacity-50 group/btn"
                    >
                      {loading ? "Verifying..." : "Verify & Login"}
                      {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Google Login Button */}
                    <div className="w-full flex flex-col items-center justify-center mb-2">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="filled_black"
                        shape="rectangular"
                        size="large"
                        width="384px"
                        text="signin_with"
                      />
                    </div>

                    <div className="flex items-center gap-4 w-full my-6">
                      <div className="h-px bg-white/5 flex-1"></div>
                      <span className="text-white/10 text-[10px] font-bold tracking-[0.3em] uppercase whitespace-nowrap">OR EMAIL</span>
                      <div className="h-px bg-white/5 flex-1"></div>
                    </div>

                    <div className="space-y-6">
                      {/* Email Input */}
                      <div className="space-y-2 group/field">
                        <div className="flex justify-between px-1">
                          <label className="text-xs font-bold text-white/30 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors">Email Address</label>
                        </div>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#84CC16] transition-colors">
                            <User size={16} />
                          </div>
                          <input
                            {...register("email")}
                            type="email"
                            placeholder="name@business.com"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all group-hover:bg-white/[0.05]"
                          />
                        </div>
                        {errors.email && <p className="text-red-400 text-[10px] uppercase tracking-widest mt-1 ml-1">{errors.email.message}</p>}
                      </div>

                      {/* Password Input */}
                      <div className="space-y-2 group/field">
                        <div className="flex justify-between px-1">
                          <label className="text-xs font-bold text-white/30 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors">Password</label>
                          <Link to="/forgot-password" size="sm" className="text-[10px] text-white/20 hover:text-[#84CC16] transition-colors uppercase tracking-widest">Forgot?</Link>
                        </div>
                        <div className="relative group/input">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#84CC16] transition-colors">
                            <Lock size={16} />
                          </div>
                          <input
                            {...register("password")}
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all group-hover:bg-white/[0.05]"
                          />
                        </div>
                        {errors.password && <p className="text-red-400 text-[10px] uppercase tracking-widest mt-1 ml-1">{errors.password.message}</p>}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="space-y-4 mt-8">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)] disabled:opacity-50 group/btn"
                      >
                        {loading ? "Sending OTP..." : "Continue"}
                        {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                      </button>

                    </div>
                  </>
                )}
              </form>
            </div>

            {/* Footer */}
            <div className="bg-white/[0.01] p-6 border-t border-white/5 text-center">
              <p className="text-xs text-white/20 uppercase tracking-widest">
                New Partner? <Link to="/partners" className="text-[#84CC16] hover:underline ml-1 font-bold">Choose Your Role</Link>
              </p>
            </div>
          </div>

          {/* Back Link */}
          <Link to="/" className="mt-8 flex items-center gap-2 text-white/20 hover:text-white transition-colors text-xs uppercase tracking-widest group">
            <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* AMBIENT GLOWS */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#84CC16]/5 blur-[200px] pointer-events-none rounded-full" />
    </div>
  );
};

export default Login;
