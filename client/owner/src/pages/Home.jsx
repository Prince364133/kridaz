import { Link } from "react-router-dom";
import { Store, TrendingUp, Users, Shield, ArrowRight, Award, ChevronRight } from "lucide-react";

const PRI = "#84CC16";
const BDR = "#2A2A2A";

const partnerBenefits = [
  { 
    icon: Store, 
    title: "Venue Partners", 
    desc: "List your turf, automate bookings, and maximize your revenue with our smart management tools.", 
    link: "/partner",
    img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80"
  },
  { 
    icon: Award, 
    title: "Professional Coaches", 
    desc: "Build your brand, host masterclasses, and manage student schedules effortlessly.", 
    link: "/coach-landing",
    img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80"
  },
  { 
    icon: Shield, 
    title: "Certified Umpires", 
    desc: "Get hired for local tournaments and matches. Manage your availability and earn more.", 
    link: "/umpire-landing",
    img: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&q=80"
  },
];

export default function Home() {
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#000" }}>
      {/* ── HERO ── */}
      <section className="relative min-h-[70vh] lg:min-h-screen flex items-start lg:items-center pt-16 lg:pt-20 overflow-hidden">
        {/* Right-Aligned Cinematic Background */}
        <div className="absolute right-0 top-0 w-full lg:w-[85%] h-full z-0 pointer-events-none flex items-center justify-end">
          <div className="relative h-[92%] w-auto transform lg:scale-[1.75] origin-right translate-y-64">
            <img 
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80" 
              alt="Owner Hero" 
              className="h-full w-auto object-contain opacity-40 brightness-[50%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </div>
        </div>

        <div className="absolute inset-0 opacity-[0.05] z-1"
          style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />
        
        <div className="relative max-w-full mx-auto px-10 lg:px-20 w-full grid lg:grid-cols-2 gap-12 items-center z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold"
              style={{ background: "rgba(132,204,22,0.08)", borderColor: "rgba(132,204,22,0.25)", color: PRI }}>
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: PRI }} />
              BookMySportz Partner Network
            </div>
            <div>
              <h1 className="font-display leading-[0.85] tracking-tighter uppercase" style={{ fontSize: "clamp(3rem,8vw,6.5rem)" }}>
                Grow Your <span style={{ color: PRI }}>Business.</span><br />
                Command Your<br />Arena.
              </h1>
              <p className="font-script text-2xl mt-3" style={{ color: PRI }}>the ultimate B2B platform</p>
            </div>
            <p className="text-xl opacity-70 max-w-xl leading-relaxed mb-6 lg:mb-10">
              Whether you own a venue, coach athletes, or officiate matches, our partner tools give you complete control over your operations and revenue.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 bg-primary text-black px-8 py-4 rounded-full font-bold shadow-[0_0_30px_rgba(132,204,22,0.3)] hover:scale-105 transition-all text-base">
                Become a Partner <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-bold border border-white/10 hover:border-primary transition-all text-base bg-white/5 backdrop-blur-md">
                Partner Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO CAN PARTNER ── */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t" style={{ borderColor: "#1A1A1A" }}>
        <div className="text-center mb-14">
          <h2 className="font-display text-5xl md:text-6xl leading-none uppercase">
            Built For <span style={{ color: PRI }}>Sports Professionals</span>
          </h2>
          <p className="font-script text-xl mt-2" style={{ color: PRI }}>elevate your operations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partnerBenefits.map(b => (
            <div key={b.title} className="p-8 rounded-3xl border flex flex-col group hover:-translate-y-1 transition-transform relative overflow-hidden" style={{ backgroundColor: "#111", borderColor: BDR }}>
              <div className="absolute inset-0 bg-cover bg-center opacity-20 transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${b.img}')` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border" style={{ borderColor: "rgba(132,204,22,0.2)", backgroundColor: "rgba(132,204,22,0.05)" }}>
                  <b.icon size={24} style={{ color: PRI }} className="group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="font-display text-2xl uppercase mb-3 text-white">{b.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{b.desc}</p>
                <Link to={b.link} className="mt-auto font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:text-[#84CC16] transition-colors" style={{ color: PRI }}>
                  Learn More <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 border-t border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto text-center">
            <h2 className="font-display text-5xl md:text-6xl leading-none uppercase mb-8">
              Ready to <span style={{ color: PRI }}>Dominate?</span>
            </h2>
            <div className="flex justify-center gap-4">
              <Link to="/signup" className="inline-flex items-center gap-2 font-bold text-black rounded-full px-10 py-4 hover:brightness-110 transition-all"
                style={{ backgroundColor: PRI }}>
                Onboard Now <ArrowRight size={18} />
              </Link>
            </div>
        </div>
      </section>

    </div>
  );
}
