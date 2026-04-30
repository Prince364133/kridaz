import React from "react";
import { Link } from "react-router-dom";
import { Store, Award, Shield, ArrowRight, ChevronRight, BarChart3, Globe, Users } from "lucide-react";

const PRI = "#84CC16";

const partnerBenefits = [
  { 
    icon: Store, 
    title: "Venue Partners", 
    desc: "List your facility, automate your booking operations, and maximize revenue with our intelligent management tools.", 
    link: "/partner",
    img: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80"
  },
  { 
    icon: Award, 
    title: "Professional Coaches", 
    desc: "Build your brand, manage training sessions, and track student progress effortlessly through our unified platform.", 
    link: "/coach-landing",
    img: "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=600&q=80"
  },
  { 
    icon: Shield, 
    title: "Certified Umpires", 
    desc: "Connect with local sports leagues and tournaments. Manage your officiating schedule and grow your professional profile.", 
    link: "/umpire-landing",
    img: "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=600&q=80"
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#000] text-white font-sans">
      
      {/* ── HERO ── */}
      <section className="relative min-h-[85vh] flex items-center pt-24 pb-20 overflow-hidden border-b border-white/5">
        {/* Background Visual */}
        <div className="absolute right-0 top-0 w-full lg:w-[60%] h-full z-0 opacity-30">
          <img 
            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=80" 
            alt="Owner Hero" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
        </div>

        <div className="container mx-auto px-6 lg:px-20 relative z-10">
          <div className="max-w-4xl space-y-10">
            {/* Status Tag */}
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/5">
               <Globe className="w-4 h-4 text-[#84CC16]" />
               <span className="text-[10px] font-bold tracking-[0.2em] text-white/60 uppercase">Global Partner Network</span>
            </div>

            <div className="space-y-6">
              <h1 className="text-6xl lg:text-[7.5rem] font-bold leading-[0.85] tracking-tight uppercase">
                GROW YOUR <br />
                <span className="text-[#84CC16]">BUSINESS.</span>
              </h1>
              <p className="text-lg text-white/40 max-w-2xl border-l-2 border-[#84CC16] pl-8 leading-relaxed">
                Empowering sports professionals with cutting-edge facility management, coaching tools, and officiating networks. Scale your operations with TurfSpot.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-4">
              <Link to="/signup" className="bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 px-12 rounded-xl font-bold text-xl flex items-center gap-4 transition-all active:scale-[0.98]">
                JOIN THE NETWORK <ArrowRight className="w-6 h-6" />
              </Link>
              <Link to="/login" className="bg-white/5 hover:bg-white/10 border border-white/10 text-white h-16 px-10 rounded-xl font-bold text-lg flex items-center gap-4 transition-all">
                PARTNER LOGIN
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTNERSHIP CATEGORIES ── */}
      <section className="py-32 container mx-auto px-6">
        <div className="text-center mb-20 space-y-4">
           <h2 className="text-4xl font-bold uppercase tracking-tight">Built For Professionals</h2>
           <p className="text-white/40 text-sm tracking-widest uppercase">Streamlined solutions for every role</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {partnerBenefits.map((b) => (
            <div key={b.title} className="group relative">

               
               <div className="relative h-full flex flex-col p-10 bg-[#0A0A0A] border border-white/5 rounded-[40px] overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:border-[#84CC16]/30">
                  <div className="absolute inset-0 bg-cover bg-center opacity-[0.03] transition-transform duration-700 group-hover:scale-110" style={{ backgroundImage: `url('${b.img}')` }} />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-10 group-hover:border-[#84CC16]/30 transition-all">
                      {React.createElement(b.icon, { size: 28, className: "text-[#84CC16]" })}
                    </div>

                    <div className="space-y-4 mb-8">
                      <h3 className="text-3xl font-bold text-white uppercase tracking-tight leading-none">{b.title}</h3>
                    </div>

                    <p className="text-white/40 text-sm leading-relaxed mb-12 flex-1">
                      {b.desc}
                    </p>

                    <Link 
                      to={b.link} 
                      className="inline-flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[#84CC16] hover:gap-4 transition-all"
                    >
                      LEARN MORE <ArrowRight size={14} />
                    </Link>
                  </div>
               </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-32 container mx-auto px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto p-20 bg-gradient-to-b from-[#0A0A0A] to-black border border-white/5 rounded-[64px] text-center relative overflow-hidden">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#84CC16]/20 to-transparent" />
           
           <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                 <h2 className="text-5xl font-bold text-white uppercase tracking-tight leading-none">Ready to Scale Your Operations?</h2>
                 <p className="text-sm text-white/30 uppercase tracking-[0.4em]">Join 1,200+ partners worldwide</p>
              </div>
              
              <Link 
                to="/signup" 
                className="bg-[#84CC16] hover:bg-[#a3e635] text-black h-16 px-16 rounded-xl text-lg font-bold tracking-widest uppercase inline-flex items-center gap-4 transition-all"
              >
                GET STARTED <ArrowRight className="w-5 h-5" />
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
