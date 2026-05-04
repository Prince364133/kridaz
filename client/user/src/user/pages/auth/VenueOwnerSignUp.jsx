import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import usePartnerSignUpForm from "../../hooks/usePartnerSignUpForm";
import {
  ArrowRight,
  ShieldCheck,
  Building2,
  BarChart3,
  CalendarCheck,
  Lock,
  User,
  Mail,
  Phone,
  ChevronLeft,
} from "lucide-react";

const VenueOwnerSignUp = () => {
  const { register, handleSubmit, errors, onSubmit, loading } = usePartnerSignUpForm("owner");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden flex flex-col items-center justify-start pt-24 lg:pt-32 pb-20 font-sans">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-[#84CC16]/5" />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-[#84CC16]/5 blur-[150px] rounded-full pointer-events-none" />
      </div>

      <div className={`relative z-10 w-full max-w-[1300px] grid lg:grid-cols-5 gap-0 lg:gap-24 items-center px-6 transition-all duration-1000 transform ${mounted ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}`}>

        {/* Left Side */}
        <div className="hidden lg:flex lg:col-span-2 flex-col space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#84CC16]/20 bg-[#84CC16]/5">
              <Building2 size={12} className="text-[#84CC16]" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#84CC16] uppercase">Venue Partner Program</span>
            </div>
            <h1 className="text-7xl xl:text-8xl font-bold text-white leading-[0.9] tracking-tight uppercase">
              OWN YOUR <br />
              <span className="text-[#84CC16]">VENUE.</span>
            </h1>
            <p className="text-sm text-white/40 uppercase tracking-widest max-w-sm leading-relaxed">
              List your sports facility, manage bookings in real-time, and grow your revenue with TurfSpot.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Building2, label: "Venue Management", val: "Full Access" },
              { icon: BarChart3, label: "Revenue Analytics", val: "Live" },
              { icon: CalendarCheck, label: "Booking Engine", val: "Active" },
              { icon: ShieldCheck, label: "Advanced Security", val: "Enabled" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div className="flex items-center gap-4">
                  <item.icon size={16} className="text-[#84CC16]/50" />
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-[#84CC16] uppercase">{item.val}</span>
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
                  <div className="w-2 h-2 rounded-full bg-[#84CC16] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#84CC16]/60 uppercase">Venue Owner</span>
                </div>
                <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Venue Registration</h2>
                <p className="text-xs text-white/20 uppercase tracking-widest">Create your partner account</p>
              </div>
              <Building2 size={32} className="text-[#84CC16]/30" />
            </div>

            {/* Body */}
            <div className="p-8 md:p-14 space-y-10">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  <div className="space-y-3 group/field">
                    <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input
                        {...register("name")}
                        type="text"
                        placeholder="Your Name"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-3 group/field">
                    <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="name@business.com"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-3 group/field">
                    <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input
                        {...register("phone")}
                        type="text"
                        placeholder="+91 00000 00000"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs ml-1">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-3 group/field">
                    <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input
                        {...register("password")}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                      />
                    </div>
                    {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-3 md:col-span-2 group/field">
                    <label className="text-xs font-bold text-white/20 uppercase tracking-widest group-focus-within/field:text-[#84CC16] transition-colors ml-1">Confirm Password</label>
                    <div className="relative">
                      <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" />
                      <input
                        {...register("confirmPassword")}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-white/[0.03] border border-white/5 focus:border-[#84CC16]/50 rounded-xl h-14 pl-12 pr-4 text-white text-sm placeholder:text-white/10 outline-none transition-all"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-xs ml-1">{errors.confirmPassword.message}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 rounded-xl font-bold uppercase tracking-wider text-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 group/btn"
                >
                  {loading ? "Creating Account..." : "Register as Venue Owner"}
                  {!loading && <ArrowRight className="w-6 h-6 group-hover/btn:translate-x-2 transition-transform" />}
                </button>
              </form>

              <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-white/20 uppercase tracking-widest">Already have an account?</p>
                <Link to="/login" className="flex items-center gap-2 text-[#84CC16] hover:text-white transition-colors text-xs font-bold uppercase tracking-widest group">
                  Login to Partner Portal
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

export default VenueOwnerSignUp;
