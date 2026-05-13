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
  BarChart3
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ScorerLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Join 500+ Official Scorers
            </span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] mb-8 animate-fade-in-up delay-100">
            THE DIGITAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              SCORE ENGINE
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-gray-400 font-medium leading-relaxed mb-12 animate-fade-in-up delay-200">
            Elevate every match with professional ball-by-ball scoring. Real-time stats, 
            player analytics, and official certifications — all in one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in-up delay-300">
            <button 
              onClick={() => navigate("/signup/scorer")}
              className="group relative px-10 py-5 bg-primary text-black font-black uppercase text-sm tracking-widest rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10 flex items-center gap-3">
                Become a Scorer <ChevronRight size={18} />
              </span>
            </button>
            <button className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 font-black uppercase text-sm tracking-widest rounded-2xl transition-all">
              Watch Demo
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-32 px-4 bg-[#050505]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 hover:border-primary/20 transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-black transition-all">
                <Zap size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Precision Engine</h3>
              <p className="text-gray-500 leading-relaxed">
                Advanced scoring interface designed for speed and accuracy. Handle complex match scenarios with ease.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 hover:border-primary/20 transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-black transition-all">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Real-time Sync</h3>
              <p className="text-gray-500 leading-relaxed">
                Every ball updated instantly across streaming overlays, player profiles, and leaderboards.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-[#0A0A0A] border border-white/5 hover:border-primary/20 transition-all group">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary group-hover:text-black transition-all">
                <TrendingUp size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Earn Rewards</h3>
              <p className="text-gray-500 leading-relaxed">
                Get hired for official matches, build your reputation, and earn professional fees for your expertise.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Section */}
      <div className="py-32 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-8">
              WHY SCORE ON <br />
              <span className="text-primary">KRIDAZ?</span>
            </h2>
            <div className="space-y-6">
              {[
                { title: "Official Certification", desc: "Gain recognized status in the local cricket community." },
                { title: "Smart Statistics", desc: "Auto-generated wagon wheels, run rates, and player maps." },
                { title: "Profile Building", desc: "Showcase your scoring history and accuracy rating." }
              ].map((item, i) => (
                <div key={i} className="flex gap-6 p-6 rounded-3xl hover:bg-white/5 transition-all group">
                  <div className="mt-1">
                    <CheckCircle2 className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1 uppercase tracking-tight">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 to-transparent border border-white/10 overflow-hidden">
               <div className="absolute inset-10 bg-[#111] rounded-[2rem] border border-white/5 shadow-2xl flex items-center justify-center p-12 text-center">
                  <div className="space-y-8">
                    <Trophy size={64} className="text-primary mx-auto opacity-50" />
                    <div className="space-y-2">
                      <p className="text-3xl font-black text-white uppercase tracking-tighter">12,450+</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Matches Scored Digitally</p>
                    </div>
                    <div className="h-px w-20 bg-primary/30 mx-auto" />
                    <p className="text-sm text-gray-400 italic">"The most intuitive scoring experience I've ever used. Every ball counts."</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-40 px-4 text-center bg-primary">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black text-black uppercase tracking-tighter leading-[0.9] mb-12">
            READY TO POWER THE NEXT BIG MATCH?
          </h2>
          <button 
            onClick={() => navigate("/signup/scorer")}
            className="px-12 py-6 bg-black text-primary font-black uppercase text-sm tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            Create Scorer Profile
          </button>
        </div>
      </div>
    </div>
  );
}
