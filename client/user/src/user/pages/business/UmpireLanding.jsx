import { ArrowRight, Calendar, Star, Trophy, CheckCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@components/common/ScrollToTop";

const PRI = "#F59E0B"; // Amber for officials

const benefits = [
  { icon: Trophy, title: "Find Tournaments", desc: "Get notified about local tournaments and matches that need certified officials." },
  { icon: Calendar, title: "Flexible Schedule", desc: "Manage your availability and accept matches that fit your timeline." },
  { icon: Star, title: "Build Reputation", desc: "Earn ratings from players and organizers to unlock higher-tier match opportunities." }
];

const BG = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=1800&q=80&auto=format&fit=crop";

export default function UmpireLanding() {
  return (
    <div className="relative min-h-screen text-white pt-4 pb-20 overflow-hidden" style={{ backgroundColor: "#000" }}>
      <ScrollToTop />
      
      {/* ── Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG})` }}
      />
      {/* ── Dark overlay */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.68) 40%, rgba(0,0,0,0.90) 100%)" }}
      />
      {/* ── Accent dot grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }}
      />
      {/* ── Amber glow blob */}
      <div className="absolute -top-20 right-0 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Hero Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center min-h-[80vh]">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold mb-6 uppercase tracking-widest"
              style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)", color: PRI }}
            >
              Certified Officials
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-none uppercase mb-6">
              Officiate & <br /><span style={{ color: PRI }}>Earn.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Turn your expertise into income. Kridaz connects certified umpires and referees with local tournaments and leagues looking for professional officiating.
            </p>
            <Link
              to="/business/register?role=umpire"
              className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest"
              style={{ backgroundColor: PRI }}
            >
              Join as an Official <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-3xl border border-white/10 backdrop-blur-sm"
                style={{ background: "rgba(10,10,10,0.75)" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ borderColor: "rgba(245,158,11,0.2)", backgroundColor: "rgba(245,158,11,0.08)" }}
                >
                  <b.icon size={24} style={{ color: PRI }} />
                </div>
                <div>
                  <h3 className="font-display text-2xl uppercase mb-2">{b.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works */}
        <div className="mt-32 text-center">
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-12 uppercase tracking-tight">The Road to Pro Officiating</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-amber-500/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-amber-500/20 transition-colors">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Get Verified</h3>
              <p className="text-gray-400">Upload your certifications and background checks to join the elite pool.</p>
            </div>
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-amber-500/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-amber-500/20 transition-colors">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Set Availability</h3>
              <p className="text-gray-400">Mark your free weekends and preferred match locations on the map.</p>
            </div>
            <div className="p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-amber-500/30 transition-colors group">
              <div className="flex items-center justify-center w-14 h-14 mx-auto mb-6 rounded-2xl bg-white/10 group-hover:bg-amber-500/20 transition-colors">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">Get Paid Fast</h3>
              <p className="text-gray-400">Instant payouts after match completion through our secure payment gateway.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
