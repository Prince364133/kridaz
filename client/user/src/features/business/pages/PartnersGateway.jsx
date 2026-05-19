import React from "react";
import { ArrowRight, Store, Award, Shield, Globe, Building2, Layout, BarChart3, Users, Tv } from "lucide-react";
import { Link } from "react-router-dom";

const PRI = "#55DEE8";

const partners = [
  {
    role: "Venue Partner",
    title: "OPERATE YOUR FACILITY",
    desc: "Streamline your booking process and manage your venue with our advanced facility management tools. Optimize your operational efficiency.",
    link: "/signup/venue",
    icon: Store,
    stat: "Business Growth",
    id: "PARTNER-01",
    accent: "#55DEE8",
    status: "Live",
  },
  {
    role: "Professional Coach",
    title: "GROW YOUR ACADEMY",
    desc: "Manage your training sessions and student progress with ease. Expand your coaching brand and reach more athletes.",
    link: "/signup/coach",
    icon: Award,
    stat: "High Performance",
    id: "COACH-02",
    accent: "#3B82F6",
    status: "Coming Soon",
  },
  {
    role: "Certified Umpire",
    title: "JOIN OUR NETWORK",
    desc: "Connect with local sports leagues and tournaments. Manage your officiating schedule through our unified partner platform.",
    link: "/signup/official",
    icon: Shield,
    stat: "Verified Official",
    id: "UMPIRE-03",
    accent: "#F59E0B",
    status: "Coming Soon",
  },
  {
    role: "YouTube Streamer",
    title: "BROADCAST THE ACTION",
    desc: "Broadcast matches live to your audience with integrated scoring overlays. Manage your streaming schedule and connect with match organizers.",
    link: "/signup/streamer",
    icon: Tv,
    stat: "Live Broadcasting",
    id: "STREAM-04",
    accent: "#EF4444",
    status: "Live",
  },
  {
    role: "Certified Scorer",
    title: "DIGITIZE EVERY BALL",
    desc: "Provide professional scoring services for tournaments and matches. Use our advanced scoring app to track every ball in real-time.",
    link: "/signup/scorer",
    icon: Layout,
    stat: "Match Digitizer",
    id: "SCORER-05",
    accent: "#A855F7",
    status: "Live",
  },
];

export default function PartnersGateway() {
  return (
    <div className="min-h-screen bg-[#000] text-white selection:bg-[#55DEE8] selection:text-black font-sans pt-16 lg:pt-20">

      {/* ── HERO SECTION ── */}
      <section className="relative flex items-center py-4 overflow-hidden border-b border-white/5">
        {/* Background Visual */}
        <div className="absolute right-0 top-0 w-full lg:w-[60%] h-full z-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1600&q=80"
            alt="Partners Network"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>

        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <div className="max-w-4xl space-y-10">
            {/* Status Tag */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
              <Globe className="w-4 h-4 text-[#55DEE8]" />
              <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">Join Our Global Network</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-6xl lg:text-[7rem] font-bold leading-[0.9] tracking-tight uppercase">
                JOIN US AS A <br />
                <span className="text-[#55DEE8]">PARTNER.</span>
              </h1>
              <p className="text-lg text-white/40 max-w-2xl border-l-2 border-[#55DEE8] pl-8 leading-relaxed">
                Connect with Kridaz to access a unified sports ecosystem. Whether you are a Venue Owner, Professional Coach, or Certified Official, we provide the ultimate platform to scale your impact.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link to="/signup/venue" className="bg-[#55DEE8] hover:bg-[#88EEF6] text-black h-14 px-8 rounded-xl font-bold text-sm flex items-center gap-3 transition-all shadow-[0_10px_30px_rgba(85, 222, 232,0.2)] active:scale-[0.98]">
                <Store className="w-4 h-4" /> Venue Owner
              </Link>
              <Link to="/signup/coach" className="bg-blue-500 hover:bg-blue-400 text-white h-14 px-8 rounded-xl font-bold text-sm flex items-center gap-3 transition-all active:scale-[0.98]">
                <Award className="w-4 h-4" /> Coach
              </Link>
              <Link to="/signup/official" className="bg-amber-500 hover:bg-amber-400 text-black h-14 px-8 rounded-xl font-bold text-sm flex items-center gap-3 transition-all active:scale-[0.98]">
                <Shield className="w-4 h-4" /> Umpire
              </Link>
              <Link to="/signup/streamer" className="bg-red-500 hover:bg-red-400 text-white h-14 px-8 rounded-xl font-bold text-sm flex items-center gap-3 transition-all active:scale-[0.98]">
                <Tv className="w-4 h-4" /> Streamer
              </Link>
              <Link to="/signup/scorer" className="bg-purple-500 hover:bg-purple-400 text-white h-14 px-8 rounded-xl font-bold text-sm flex items-center gap-3 transition-all active:scale-[0.98]">
                <Layout className="w-4 h-4" /> Scorer
              </Link>
              <div className="hidden sm:flex items-center gap-10 border-l border-white/10 pl-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Active Partners</p>
                  <p className="text-2xl font-bold text-[#55DEE8]">1,200+</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Growth Rate</p>
                  <p className="text-2xl font-bold text-[#55DEE8]">85% YoY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNER ROLES GRID ── */}
      <section className="relative z-10 py-16 container mx-auto px-6">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold uppercase tracking-tight">Select Your Role</h2>
          <p className="text-white/40 text-xs tracking-widest uppercase">Choose the partnership that fits your business</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {partners.map((p) => (
            <Link key={p.role} to={p.link} className="group relative flex flex-col p-8 bg-[#0A0A0A] border border-white/5 rounded-3xl transition-all duration-300 hover:border-white/20 hover:bg-[#111] hover:-translate-y-1 cursor-pointer shadow-lg hover:shadow-2xl"
              style={{ "--accent": p.accent }}
            >
              {/* Status badge */}
              <div className="absolute top-6 right-6">
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: p.status === "Live" ? `${p.accent}20` : "rgba(255,255,255,0.05)",
                    color: p.status === "Live" ? p.accent : "rgba(255,255,255,0.3)",
                    border: `1px solid ${p.status === "Live" ? p.accent + "40" : "rgba(255,255,255,0.08)"}`
                  }}
                >
                  {p.status}
                </span>
              </div>

              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: `${p.accent}15` }}
              >
                {React.createElement(p.icon, { size: 24, style: { color: p.accent } })}
              </div>

              <div className="space-y-3 mb-4">
                <div className="inline-block px-3 py-1 rounded-full" style={{ backgroundColor: `${p.accent}08`, border: `1px solid ${p.accent}20` }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: p.accent }}>{p.role}</p>
                </div>
                <h3 className="text-xl font-bold text-white uppercase tracking-tight">{p.title}</h3>
              </div>

              <p className="text-white/40 text-xs leading-relaxed mb-8 flex-1">
                {p.desc}
              </p>

              <div className="pt-6 border-t border-white/5 mt-auto">
                <div
                  className="flex items-center justify-between group/btn font-bold text-[10px] uppercase tracking-widest transition-colors"
                  style={{ color: p.accent }}
                >
                  {p.status === "Live" ? "Register Now" : "Join Waitlist"}
                  <ArrowRight size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-40 p-20 bg-gradient-to-b from-[#0A0A0A] to-black border border-white/5 rounded-[64px] text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#55DEE8]/20 to-transparent" />

          <div className="relative z-10 space-y-10">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-white uppercase tracking-tight">Ready to Scale Your Operations?</h2>
              <p className="text-sm text-white/30 uppercase tracking-[0.4em]">Direct access to the Venue Owner Dashboard</p>
            </div>

            <Link
              to="/login"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-16 px-16 rounded-xl text-lg font-bold tracking-widest uppercase inline-flex items-center gap-4 transition-all"
            >
              ACCESS Venue Owner Portal <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

