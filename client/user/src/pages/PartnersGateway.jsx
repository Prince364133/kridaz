import { ArrowRight, Store, Award, Shield, Target, Cpu, Zap, Globe, Activity } from "lucide-react";
import { Link } from "react-router-dom";

const PRI = "#84CC16";
const BDR = "#2A2A2A";

const partners = [
  {
    role: "Venue Partner",
    title: "MANAGE VENUES",
    desc: "Deploy advanced booking automation and real-time turf analytics. Scale your facility's operational efficiency.",
    link: "http://localhost:5174/venue-owner",
    icon: Store,
    stat: "99.9% Uptime",
    id: "VP-01"
  },
  {
    role: "Professional Coach",
    title: "COACHING EXCELLENCE",
    desc: "Orchestrate masterclasses and manage student rosters with professional precision. Expand your brand's reach.",
    link: "http://localhost:5174/coach-landing",
    icon: Award,
    stat: "Verified",
    id: "PC-02"
  },
  {
    role: "Certified Umpire",
    title: "EXPERT OFFICIATING",
    desc: "Connect with premium tournament circuits. Synchronize your officiating schedule with our partner platform.",
    link: "http://localhost:5174/umpire-landing",
    icon: Shield,
    stat: "Certified",
    id: "CU-03"
  },
];

export default function PartnersGateway() {
  return (
    <div className="min-h-screen bg-[#000] text-white">
      {/* Professional Background Overlay */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0" />
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: `radial-gradient(${PRI} 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      
      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[85vh] flex items-center pt-16 lg:pt-20 pb-20 overflow-hidden border-b border-[#2A2A2A]">
        {/* Right-Aligned Visual */}
        <div className="absolute right-0 top-0 w-full lg:w-[70%] h-full z-0 opacity-40">
          <img 
            src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1600&q=80" 
            alt="Partners Network" 
            className="h-full w-full object-cover transition-all duration-[5000ms] hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>

        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <div className="max-w-4xl space-y-12">
            {/* Status Tag */}
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-[#84CC16]/30 bg-[#84CC16]/5 animate-fadeIn">
               <Activity className="w-4 h-4 text-[#84CC16]" />
               <span className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">Global Partner Network: Active</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-7xl lg:text-[10rem] font-bold leading-[0.8] tracking-tight uppercase">
                JOIN US AS A <br />
                <span className="text-[#84CC16]">PARTNER.</span>
              </h1>
              <p className="text-gray-500 uppercase tracking-widest max-w-2xl border-l border-[#84CC16]/50 pl-8 ml-2 text-sm">
                Join our exclusive network of sports operators. Whether managing venues, coaching talent, or officiating matches—we provide the competitive advantage.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-6">
              <Link to="/signup" className="btn-bms h-16 px-12 text-xl tracking-widest flex items-center gap-4">
                JOIN NOW <ArrowRight className="w-6 h-6" />
              </Link>
              <div className="hidden sm:flex items-center gap-10 border-l border-white/10 pl-10">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Active Partners</div>
                  <div className="text-2xl font-bold text-[#84CC16]">1,240+</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Growth Rate</div>
                  <div className="text-2xl font-bold text-[#84CC16]">85.4%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vertical Decoration */}
        <div className="absolute bottom-12 left-12 hidden lg:block">
           <div className="text-[10px] font-bold text-white/10 rotate-90 origin-left uppercase tracking-[1em]">Partner_Ecosystem_Layer</div>
        </div>
      </section>

      {/* ── SELECTION GRID ── */}
      <section className="relative z-10 py-32 container mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-10">
          {partners.map((p, idx) => (
            <div key={p.role} className="group relative">
               {/* Background Glow */}

               
               <div className="relative h-full flex flex-col p-10 bg-[#111] border border-[#2A2A2A] rounded-[32px] overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[#84CC16]/50">
                  {/* Partner ID */}
                  <div className="absolute top-8 right-8 text-[10px] font-bold text-white/10 uppercase tracking-widest">{p.id}</div>
                  
                  {/* Icon Box */}
                  <div className="w-16 h-16 rounded-2xl bg-black border border-[#2A2A2A] flex items-center justify-center mb-10 transition-all">
                    <p.icon size={28} className="text-[#84CC16]" />
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="text-[10px] font-bold text-[#84CC16] tracking-widest uppercase">{p.role}</div>
                    <h3 className="text-4xl font-bold text-white uppercase tracking-tight leading-none">{p.title}</h3>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed mb-12 flex-1">
                    {p.desc}
                  </p>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center py-4 border-y border-white/5">
                       <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">System Status</span>
                       <span className="text-[10px] font-bold text-[#84CC16] uppercase tracking-widest">{p.stat}</span>
                    </div>

                    <a 
                      href={p.link} 
                      className="w-full flex items-center justify-between h-14 px-6 border border-white/5 rounded-full font-bold text-xs tracking-widest uppercase hover:bg-white/5 hover:border-[#84CC16]/50 transition-all group/link"
                    >
                      Get Started
                      <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                    </a>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Global Footer CTA */}
        <div className="mt-40 p-20 bg-[#0A0A0A] border border-[#2A2A2A] rounded-[48px] relative overflow-hidden text-center group">

           <div className="relative z-10 space-y-10">
              <div className="flex flex-col items-center gap-4">
                 <div className="w-16 h-1 bg-[#84CC16]" />
                 <h2 className="text-6xl font-bold text-white uppercase tracking-tight">Already a Partner?</h2>
                 <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Access your professional dashboard</p>
              </div>
              
              <a 
                href="http://localhost:5174/login" 
                className="btn-bms h-16 px-16 text-xl tracking-widest inline-flex items-center gap-4"
              >
                ACCESS DASHBOARD <Zap className="w-5 h-5" />
              </a>
           </div>
        </div>
      </section>
    </div>
  );
}

