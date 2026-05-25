import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft, Zap, Sparkles, Clock } from "lucide-react";

const MarketplaceComingSoon = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#55DEE8]/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Animated Icon Container */}
        <div className="flex justify-center mb-4">
          <div className="relative group">
            <div className="absolute -inset-4 bg-[#55DEE8]/20 rounded-full blur-xl group-hover:bg-[#55DEE8]/30 transition-all duration-500 animate-pulse" />
            <div className="relative w-24 h-24 bg-zinc-900 border border-[#55DEE8]/30 rounded-[8px] flex items-center justify-center shadow-2xl">
              <ShoppingBag size={42} className="text-[#55DEE8]" />
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-[6px] text-[10px] font-black uppercase tracking-[0.2em] text-[#55DEE8]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#55DEE8] animate-ping" />
          Development in Progress
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85]">
            Market<br />
            <span className="text-zinc-500">Place</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold text-[#55DEE8] uppercase tracking-wide">
            The Ultimate Sports Arsenal
          </p>
        </div>

        {/* Description */}
        <p className="text-zinc-500 text-sm md:text-base font-medium max-w-md mx-auto leading-relaxed">
          We're curating a premium collection of sports gear, equipment, and exclusive Kridaz merchandise. Built for champions, arriving soon.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
          {[
            { icon: Zap, label: "Pro Gear" },
            { icon: Sparkles, label: "Exclusive" },
            { icon: Clock, label: "Coming Q3" }
          ].map((item, i) => (
            <div key={i} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-[8px] flex flex-col items-center gap-2">
              <item.icon size={20} className="text-[#55DEE8]" />
              <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link 
            to="/" 
            className="w-full sm:w-auto bg-[#55DEE8] text-black px-10 py-4 rounded-[8px] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-[0_20px_40px_rgba(85,222,232,0.2)]"
          >
            Back to Arena
          </Link>
          <button 
            className="w-full sm:w-auto px-10 py-4 rounded-[8px] font-black uppercase text-xs tracking-widest border border-zinc-800 text-zinc-500 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-2"
          >
            Notify Me
          </button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed bottom-10 left-10 hidden xl:block animate-bounce-slow">
        <div className="flex flex-col items-start">
          <div className="w-1 h-20 bg-gradient-to-t from-[#55DEE8] to-transparent opacity-20 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-800 vertical-text rotate-180">SYSTEMS.LOADING</p>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceComingSoon;
