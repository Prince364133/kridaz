import { ArrowRight, Users, Target, Video, CheckCircle, Star, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@components/common/ScrollToTop";

const PRI = "#3B82F6"; // Blue for coaches

const benefits = [
  { icon: Users, title: "Manage Roster", desc: "Easily track student progress, manage subscriptions, and organize batches." },
  { icon: Target, title: "Attract Athletes", desc: "Get discovered by players looking to improve their skills in your area." },
  { icon: Video, title: "Host Masterclasses", desc: "Set up exclusive training sessions, bootcamps, and video analysis." }
];

const BG = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1800&q=80&auto=format&fit=crop";

export default function CoachLanding() {
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
        style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.70) 40%, rgba(0,0,0,0.90) 100%)" }}
      />
      {/* ── Accent dot grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }}
      />
      {/* ── Blue glow blob */}
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Hero Section ── */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[70vh] md:min-h-[80vh] py-10 md:py-0">
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] md:text-xs font-semibold mb-4 md:mb-6 uppercase tracking-widest"
              style={{ background: "rgba(59,130,246,0.08)", borderColor: "rgba(59,130,246,0.25)", color: PRI }}
            >
              Professional Coaches
            </div>
            <h1 className="font-display text-4xl md:text-7xl leading-[1.1] md:leading-none uppercase mb-6">
              Build Your <br /><span style={{ color: PRI }}>Legacy.</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-lg mx-auto md:mx-0">
              Take your coaching business to the next level. Kridaz provides the digital infrastructure to manage your students, schedule sessions, and grow your brand.
            </p>
            <Link
              to="/business/register?role=coach"
              className="inline-flex items-center gap-3 font-bold text-white rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest text-sm md:text-base"
              style={{ backgroundColor: PRI }}
            >
              Join as a Coach <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid gap-4 md:gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="flex gap-4 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10 backdrop-blur-sm"
                style={{ background: "rgba(10,10,10,0.75)" }}
              >
                <div
                  className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ borderColor: "rgba(59,130,246,0.2)", backgroundColor: "rgba(59,130,246,0.08)" }}
                >
                  <b.icon size={20} className="md:w-6 md:h-6" style={{ color: PRI }} />
                </div>
                <div>
                  <h3 className="font-display text-xl md:text-2xl uppercase mb-1 md:mb-2">{b.title}</h3>
                  <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works ── */}
        <div className="mt-20 md:mt-32 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-10 md:mb-12 uppercase tracking-tight">How to Scale Your Academy</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              { icon: Users, title: "Setup Academy", desc: "List your sports, define age groups, and set your fee structure." },
              { icon: Target, title: "Manage Attendance", desc: "Digital attendance, progress reports, and parent communication tools." },
              { icon: CheckCircle, title: "Automate Billing", desc: "Automatic invoices and payment reminders so you can focus on coaching." }
            ].map((step, i) => (
              <div key={i} className="p-6 md:p-8 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-white/10 hover:border-blue-500/30 transition-all group">
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 md:mb-6 rounded-xl md:rounded-2xl bg-white/10 group-hover:bg-blue-500/20 transition-colors">
                  <step.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 uppercase tracking-wider">{step.title}</h3>
                <p className="text-gray-400 text-xs md:text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="mt-20 md:mt-32 max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-black text-white text-center mb-10 md:mb-16 uppercase tracking-tight">Coach Spotlight</h2>
          <div className="grid gap-6 md:gap-8">
            {[
              { 
                text: "“Managing 100+ students across 3 batches was a nightmare. Kridaz simplified my administrative work by 80%.”", 
                name: "Coach Arjun", 
                role: "National Cricket Academy", 
                icon: Trophy 
              }
            ].map((t, i) => (
              <div key={i} className="p-6 md:p-10 bg-white/5 backdrop-blur-md rounded-[2rem] md:rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <t.icon size={60} className="md:w-20 md:h-20" />
                </div>
                <p className="text-lg md:text-2xl text-gray-200 font-medium relative z-10 leading-relaxed mb-6 md:mb-8">
                  {t.text}
                </p>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-500/20 border border-blue-500/40" />
                  <div>
                    <div className="text-white text-xs md:text-base font-bold uppercase tracking-wider">{t.name}</div>
                    <div className="text-blue-500 text-[10px] md:text-sm font-semibold">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
}
