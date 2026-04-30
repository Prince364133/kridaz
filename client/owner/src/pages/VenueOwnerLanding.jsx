import { ArrowRight, CheckCircle, BarChart3, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";

const PRI = "#84CC16";

const benefits = [
  { icon: CalendarDays, title: "Automated Bookings", desc: "No more phone calls. Let players book your turf 24/7." },
  { icon: BarChart3, title: "Revenue Tracking", desc: "Real-time insights into your earnings, peak hours, and customer retention." },
  { icon: CheckCircle, title: "Seamless Management", desc: "Block out maintenance hours, set dynamic pricing, and manage staff." }
];

export default function PartnerLanding() {
  return (
    <div className="min-h-screen text-white pt-20 pb-20" style={{ backgroundColor: "#000" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold mb-6 uppercase tracking-widest"
              style={{ background: "rgba(132,204,22,0.08)", borderColor: "rgba(132,204,22,0.25)", color: PRI }}>
              Venue Partners
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-none uppercase mb-6">
              Maximize Your <br /><span style={{ color: PRI }}>Turf Utilization.</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg">
              Transform your sports facility into a fully automated, high-yield business. BookMySportz connects you with thousands of local players actively looking for venues.
            </p>
            <Link to="/signup?role=owner" className="inline-flex items-center gap-3 font-bold text-black rounded-full px-8 py-4 hover:brightness-110 transition-all uppercase tracking-widest" style={{ backgroundColor: PRI }}>
              Register Your Venue <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid gap-6">
            {benefits.map((b, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-3xl border border-white/10 bg-[#111]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ borderColor: "rgba(132,204,22,0.2)", backgroundColor: "rgba(132,204,22,0.05)" }}>
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
      </div>
    </div>
  );
}
