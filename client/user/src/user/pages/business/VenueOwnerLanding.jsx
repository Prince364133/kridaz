import { ArrowRight, CheckCircle, BarChart3, CalendarDays, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import ScrollToTop from "@components/common/ScrollToTop";

const PRI = "#55DEE8";

const benefits = [
  { icon: CalendarDays, title: "Automated Bookings", desc: "No more phone calls. Let players book your turf 24/7." },
  { icon: BarChart3, title: "Revenue Tracking", desc: "Real-time insights into your earnings, peak hours, and customer retention." },
  { icon: CheckCircle, title: "Seamless Management", desc: "Block out maintenance hours, set dynamic pricing, and manage staff." }
];

const BG = "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1800&q=80&auto=format&fit=crop";

export default function VenueOwnerLanding() {
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
        style={{ background: "linear-gradient(160deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.88) 100%)" }}
      />
      {/* ── Accent dot grid */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }}
      />
      {/* ── Glow blob */}
      <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(85,222,232,0.12) 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* ── Hero Section ── */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center min-h-[70vh] md:min-h-[80vh] py-10 md:py-0">
          <div className="text-center md:text-left">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] md:text-xs font-semibold mb-4 md:mb-6 uppercase tracking-widest"
              style={{ background: "rgba(85,222,232,0.08)", borderColor: "rgba(85,222,232,0.25)", color: PRI }}
            >
              Venue Partners
            </div>
            <h1 className="font-display text-4xl md:text-7xl leading-[1.1] md:leading-none uppercase mb-6">
              Maximize Your <br /><span style={{ color: PRI }}>Turf Utilization.</span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-8 max-w-lg mx-auto md:mx-0">
              Transform your sports facility into a fully automated, high-yield business. Kridaz connects you with thousands of local players actively looking for venues.
            </p>
            <Link
              to="/business/register?role=venu_owners"
              className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest text-sm md:text-base"
              style={{ backgroundColor: PRI }}
            >
              Register Your Venue <ArrowRight size={20} />
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
                  style={{ borderColor: "rgba(85,222,232,0.2)", backgroundColor: "rgba(85,222,232,0.08)" }}
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
          <h2 className="font-display text-3xl md:text-5xl font-black text-white mb-10 md:mb-12 uppercase">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            {[
              { icon: CalendarDays, title: "Create Your Profile", desc: "Add venue details, photos and pricing in minutes." },
              { icon: BarChart3, title: "Set Availability", desc: "Define open hours, block maintenance slots and set dynamic pricing." },
              { icon: CheckCircle, title: "Start Receiving Bookings", desc: "Players book instantly, payments flow directly to you." }
            ].map((step, i) => (
              <div key={i} className="p-6 md:p-8 bg-white/5 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-white/10 hover:border-lime-500/30 transition-all group">
                <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 md:mb-6 rounded-xl md:rounded-2xl bg-white/10 group-hover:bg-lime-500/20 transition-colors">
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
          <h2 className="font-display text-3xl md:text-5xl font-black text-white text-center mb-10 md:mb-16 uppercase tracking-tight">Success Stories</h2>
          <div className="grid gap-6 md:gap-8">
            {[
              { 
                text: "“Kridaz turned idle slots into steady revenue. The dashboard is a total game‑changer for my business operations.”", 
                name: "Priya Sharma", 
                role: "Arena 51 Owner", 
                icon: Trophy 
              },
              { 
                text: "“Automated bookings freed up my staff’s time and boosted our evening bookings by 35%. Highly recommended.”", 
                name: "Rajesh Kumar", 
                role: "The Pitch Manager", 
                icon: BarChart3 
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
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-lime-500/20 border border-lime-500/40" />
                  <div>
                    <div className="text-white text-xs md:text-base font-bold uppercase tracking-wider">{t.name}</div>
                    <div className="text-lime-500 text-[10px] md:text-sm font-semibold">{t.role}</div>
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
