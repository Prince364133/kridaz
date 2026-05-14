import React from "react";
import { 
  Zap, 
  Trophy, 
  Target, 
  TrendingUp, 
  ChevronRight, 
  CheckCircle2,
  Users,
  Shield,
  BarChart3,
  ArrowRight,
  Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const PRI = "#00C187"; // User's requested Teal Green

export default function ScorerLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00C187] selection:text-black font-inter">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#00C187]/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00C187]/5 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C187] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00C187]"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 font-inter">
              Join 500+ Official Digital Scorers
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.9] mb-8 animate-fade-in-up delay-100 font-inter">
            THE DIGITAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00C187]">
              SCORE ENGINE
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-400 font-medium leading-relaxed mb-12 animate-fade-in-up delay-200 font-inter">
            Elevate every match with professional ball-by-ball scoring. Real-time stats, 
            player analytics, and official certifications — all in one premium dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
            <button 
              onClick={() => navigate("/signup/scorer")}
              className="group relative px-10 py-5 bg-[#00C187] text-black font-bold uppercase text-xs tracking-widest rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_20px_40px_-10px_rgba(0,193,135,0.3)] font-inter"
            >
              <span className="relative z-10 flex items-center gap-3">
                Become a Scorer <ChevronRight size={18} />
              </span>
            </button>
            <button 
              onClick={() => navigate("/scorer/dashboard")}
              className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 font-bold uppercase text-xs tracking-widest rounded-2xl transition-all font-inter"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-32 px-6 bg-[#000000]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Zap, 
                title: "Precision Engine", 
                desc: "Advanced scoring interface designed for speed and accuracy. Handle complex match scenarios with ease." 
              },
              { 
                icon: BarChart3, 
                title: "Real-time Sync", 
                desc: "Every ball updated instantly across streaming overlays, player profiles, and official leaderboards." 
              },
              { 
                icon: TrendingUp, 
                title: "Professional Fees", 
                desc: "Get hired for official matches, build your reputation, and earn verified fees for your technical expertise." 
              }
            ].map((feature, i) => (
              <div key={i} className="p-10 rounded-[2rem] bg-[#0A0A0A] border border-white/5 hover:border-[#00C187]/20 transition-all group shadow-xl">
                <div className="w-14 h-14 bg-[#00C187]/10 text-[#00C187] rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#00C187] group-hover:text-black transition-all duration-500">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-4 font-inter">{feature.title}</h3>
                <p className="text-[#878C9F] text-sm leading-relaxed font-inter">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-32 px-6 border-t border-white/5 bg-[#000000]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <h2 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter leading-none font-inter">
              WHY SCORE ON <br />
              <span className="text-[#00C187]">KRIDAZ?</span>
            </h2>
            <div className="space-y-6">
              {[
                { title: "Official Certification", desc: "Gain recognized status in the local cricket community with verified badges." },
                { title: "Smart Statistics", desc: "Auto-generated wagon wheels, run rates, and detailed player performance maps." },
                { title: "Profile Building", desc: "Showcase your scoring history and maintain a high professional accuracy rating." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group">
                  <div className="mt-1">
                    <CheckCircle2 className="text-[#00C187]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1 uppercase tracking-tight font-inter">{item.title}</h4>
                    <p className="text-sm text-[#878C9F] leading-relaxed font-inter">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-[#00C187]/10 to-transparent border border-white/10 overflow-hidden relative group">
               <div className="absolute inset-8 bg-[#0A0A0A] rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-center p-12 text-center group-hover:scale-[1.01] transition-transform duration-700">
                  <div className="space-y-8">
                    <Activity size={64} className="text-[#00C187] mx-auto opacity-50 animate-pulse" />
                    <div className="space-y-2">
                      <p className="text-4xl font-bold text-white uppercase tracking-tighter font-inter">12,450+</p>
                      <p className="text-[10px] font-bold text-[#878C9F] uppercase tracking-[0.3em] font-inter">Matches Scored Digitally</p>
                    </div>
                    <div className="h-px w-20 bg-[#00C187]/30 mx-auto" />
                    <p className="text-sm text-[#878C9F] italic font-inter leading-relaxed">"The most intuitive scoring experience I've ever used. Every ball counts towards professional growth."</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-40 px-6 text-center bg-[#00C187] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] opacity-30" />
        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold text-black uppercase tracking-tighter leading-[0.9] mb-12 font-inter">
            READY TO POWER THE NEXT BIG MATCH?
          </h2>
          <button 
            onClick={() => navigate("/signup/scorer")}
            className="group px-12 py-6 bg-black text-[#00C187] font-bold uppercase text-xs tracking-[0.2em] rounded-2xl transition-all hover:scale-[1.05] active:scale-95 shadow-2xl flex items-center gap-4 mx-auto font-inter"
          >
            Create Scorer Profile <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
