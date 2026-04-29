import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Radio,
  Building2
} from "lucide-react";

const Login = () => {
  const { register, handleSubmit, errors, onSubmit, loading } = useLoginForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex items-center justify-center font-sans selection:bg-[#84CC16] selection:text-black">
      {/* ── CINEMATIC BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=2000')] bg-cover bg-center opacity-40 grayscale scale-105 animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/95 to-[#84CC16]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_0%,_black_100%)]" />
      </div>

      {/* ── DYNAMIC GRID & SCANLINES ── */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ 
          backgroundImage: `linear-gradient(rgba(132, 204, 22, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(132, 204, 22, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px' 
        }} />

      {/* ── MAIN COMMAND HUB ── */}
      <div className={`relative z-10 w-full max-w-[1200px] grid lg:grid-cols-2 gap-0 lg:gap-20 items-center px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        {/* Left Side: Cinematic Narrative */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 pr-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-sm bg-[#84CC16]/10 border-l-2 border-[#84CC16]">
              <Cpu size={14} className="text-[#84CC16] animate-pulse" />
              <span className="text-[10px] font-mono font-black tracking-[0.3em] text-[#84CC16] uppercase">Enterprise_Portal</span>
            </div>
            <h1 className="text-7xl xl:text-9xl font-display-heavy italic text-white leading-[0.85] tracking-tighter uppercase">
              COMMAND THE <br />
              <span className="text-[#84CC16] drop-shadow-[0_0_30px_rgba(132,204,22,0.3)]">ECOSYSTEM.</span>
            </h1>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 border border-white/5 bg-white/[0.02] space-y-2">
                <Target size={20} className="text-[#84CC16]/50" />
                <p className="text-[10px] font-mono text-white/40 uppercase leading-relaxed tracking-wider">High-precision venue management protocols.</p>
             </div>
             <div className="p-4 border border-white/5 bg-white/[0.02] space-y-2">
                <Activity size={20} className="text-[#84CC16]/50" />
                <p className="text-[10px] font-mono text-white/40 uppercase leading-relaxed tracking-wider">Real-time revenue synchronization engine.</p>
             </div>
          </div>
        </div>

        {/* Right Side: The Tactical Form */}
        <div className="flex flex-col items-center lg:items-start">
          <div className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative group">
            
            {/* Form Header */}
            <div className="bg-white/[0.02] border-b border-white/5 p-8 flex justify-between items-center">
               <div className="space-y-1">
                 <h2 className="text-xl font-display-heavy italic text-white uppercase tracking-wider">Commander Login</h2>
                 <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">Identify operational credentials</p>
               </div>
               <Fingerprint size={32} className="text-white/10 group-hover:text-[#84CC16]/30 transition-colors duration-500" />
            </div>

            {/* Form Body */}
            <div className="p-8 md:p-10 space-y-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                {/* Username Input */}
                <div className="space-y-2">
                  <div className="flex justify-between px-1">
                    <label className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest">Commander_Identity</label>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#84CC16] transition-colors">
                      <User size={16} />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="NAME@ENTERPRISE.COM"
                      className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-sm placeholder:text-white/10 outline-none transition-all group-hover:bg-white/[0.05]"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex justify-between px-1">
                    <label className="text-[10px] font-mono font-bold text-white/30 uppercase tracking-widest">Access_Protocol</label>
                    <Link to="/forgot-password" size="sm" className="text-[9px] font-mono text-white/10 hover:text-[#84CC16] transition-colors uppercase tracking-widest">Recover?</Link>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-[#84CC16] transition-colors">
                      <Lock size={16} />
                    </div>
                    <input
                      {...register("password")}
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-sm placeholder:text-white/10 outline-none transition-all group-hover:bg-white/[0.05]"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-display-heavy italic uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)] disabled:opacity-50 group/btn mt-8" 
                >
                  {loading ? "AUTHENTICATING..." : "INITIATE SESSION"}
                  {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                </button>
              </form>
            </div>

            {/* Footer Sign Up Link */}
            <div className="bg-white/[0.01] p-6 border-t border-white/5 text-center">
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
                New Commander? <Link to="/signup" className="text-[#84CC16] hover:underline ml-1 font-black">ENLIST AS PARTNER</Link>
              </p>
            </div>
          </div>
          
          {/* Back Link */}
          <Link to="/" className="mt-8 flex items-center gap-2 text-white/20 hover:text-white transition-colors text-[9px] font-mono uppercase tracking-[0.4em] group">
            <ChevronRight size={14} className="rotate-180 group-hover:-translate-x-2 transition-transform" />
            Return to Fleet Hub
          </Link>
        </div>
      </div>

      {/* ── AMBIENT GLOWS ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#84CC16]/5 blur-[200px] pointer-events-none rounded-full" />
    </div>
  );
};

export default Login;
