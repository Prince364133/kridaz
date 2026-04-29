import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Cpu,
  Building2
} from "lucide-react";

const SignUp = () => {
  const { register, handleSubmit, errors, onSubmit, loading } = useSignUpForm();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-center font-sans selection:bg-[#84CC16] selection:text-black py-12 md:py-20">
      {/* ── CINEMATIC BACKGROUND LAYER ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000')] bg-cover bg-center opacity-30 grayscale scale-110 animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-[#84CC16]/5" />
      </div>

      {/* ── TACTICAL GRID & SCANLINES ── */}
      <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
        style={{ 
          backgroundImage: `linear-gradient(rgba(132, 204, 22, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(132, 204, 22, 0.1) 1px, transparent 1px)`,
          backgroundSize: '40px 40px' 
        }} />

      {/* ── MAIN CONTENT HUB ── */}
      <div className={`relative z-10 w-full max-w-[1300px] grid lg:grid-cols-5 gap-0 lg:gap-24 items-center px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>
        
        {/* Left Side: Stats / Narrative */}
        <div className="hidden lg:flex lg:col-span-2 flex-col space-y-12">
           <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#84CC16]/20 bg-[#84CC16]/5">
                <Building2 size={12} className="text-[#84CC16]" />
                <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#84CC16] uppercase">Network_Expansion</span>
              </div>
              <h1 className="text-7xl xl:text-8xl font-display-heavy italic text-white leading-[0.85] tracking-tighter uppercase">
                ENLIST AS <br />
                <span className="text-[#84CC16]">PARTNER.</span>
              </h1>
              <p className="text-[11px] font-mono text-white/30 uppercase tracking-[0.3em] max-w-sm leading-relaxed">
                Connect your venue to the most powerful sports management network. Scale your operations with BookMySportz.
              </p>
           </div>

           <div className="space-y-4">
              {[
                { icon: ShieldCheck, label: "Enterprise Security", val: "Active" },
                { icon: Zap, label: "Booking Speed", val: "Instant" },
                { icon: Globe, label: "Global Reach", val: "Active" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                   <div className="flex items-center gap-3">
                      <item.icon size={16} className="text-[#84CC16]/50" />
                      <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                   </div>
                   <span className="text-[10px] font-mono text-[#84CC16] uppercase">{item.val}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Right Side: The Form */}
        <div className="lg:col-span-3">
          <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative group">
            
            {/* Form Header */}
            <div className="bg-white/[0.02] border-b border-white/5 p-8 md:p-10 flex justify-between items-center">
               <div className="space-y-1">
                 <h2 className="text-2xl font-display-heavy italic text-white uppercase tracking-wider">Commander_Enlistment</h2>
                 <p className="text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">Deploy venue operational data</p>
               </div>
               <Server size={32} className="text-[#84CC16]/30" />
            </div>

            {/* Form Body */}
            <div className="p-8 md:p-14 space-y-12">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {/* Name */}
                  <div className="space-y-3 group/field">
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Commander_Handle</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input 
                        {...register("name")}
                        type="text" 
                        placeholder="NAME_OF_LEADER"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-xs placeholder:text-white/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-3 group/field">
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Enterprise_Mail</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input 
                        {...register("email")}
                        type="email" 
                        placeholder="NAME@ENTERPRISE.COM"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-xs placeholder:text-white/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-3 group/field">
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Comm_Link</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input 
                        {...register("phone")}
                        type="text" 
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-xs placeholder:text-white/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-3 group/field">
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Access_Protocol</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input 
                        {...register("password")}
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-xs placeholder:text-white/5 outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-3 md:col-span-2 group/field">
                    <label className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Verify_Protocol</label>
                    <div className="relative">
                      <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input 
                        {...register("confirmPassword")}
                        type="password" 
                        placeholder="••••••••••••"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white font-mono text-xs placeholder:text-white/5 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-display-heavy italic uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(132,204,22,0.2)] disabled:opacity-50 mt-4 group/btn" 
                >
                  {loading ? "PROCESSING..." : "CONFIRM PARTNERSHIP"}
                  {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                </button>
              </form>

              {/* Already in Network */}
              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                 <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Already in the Network?</p>
                 <Link to="/login" className="flex items-center gap-2 text-[#84CC16] hover:text-white transition-colors text-[10px] font-mono font-black uppercase tracking-[0.2em] group">
                    ACCESS COMMAND PORTAL
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
            </div>
          </div>
          
          {/* Abort */}
          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-white/20 hover:text-white transition-colors text-[9px] font-mono uppercase tracking-[0.4em] group">
              <ChevronLeft size={14} className="group-hover:-translate-x-2 transition-transform" />
              Return to Fleet Hub
            </Link>
          </div>
        </div>
      </div>

      {/* AMBIENT GLOWS */}
      <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#84CC16]/5 blur-[200px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-0 w-[600px] h-[600px] bg-[#84CC16]/5 blur-[200px] pointer-events-none rounded-full" />
    </div>
  );
};

export default SignUp;
