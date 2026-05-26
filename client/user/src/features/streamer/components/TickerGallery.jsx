import React, { useState, useEffect } from "react";
import { Layout, CheckCircle2, Eye, Palette, Zap, Star, Shield, ArrowLeft, Loader2, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@hooks/useAxiosInstance";
import { toast } from "react-hot-toast";

export default function TickerGallery() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [loadingTheme, setLoadingTheme] = useState(null);

  const themes = [
    { 
      id: "classic", 
      name: "Classic Pro", 
      description: "Standard broadcast look with clean typography and blue accents.",
      color: "bg-blue-600",
      preview: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800&auto=format&fit=crop",
      features: ["Real-time Score", "Batsman Stats", "Bowler Stats", "Auto-Transitions"]
    },
    { 
      id: "modern", 
      name: "Modern Dark", 
      description: "Sleek, minimalist dark theme for professional night matches.",
      color: "bg-gray-800",
      preview: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop",
      features: ["Glassmorphism", "Compact Design", "Animated Borders", "Custom Logos"]
    },
    { 
      id: "neon", 
      name: "Neon Pulse", 
      description: "Vibrant pink and purple gradients for high-energy T20 games.",
      color: "bg-fuchsia-600",
      preview: "https://images.unsplash.com/photo-1562077981-4d7eafd44932?q=80&w=800&auto=format&fit=crop",
      features: ["Glow Effects", "Dynamic Gradients", "Flashy Transitions", "Social Media Handles"]
    },
    { 
      id: "premium", 
      name: "Gold Premium", 
      description: "The ultimate luxury broadcast experience with gold textures.",
      color: "bg-gradient-to-r from-[#55DEE8] to-[#BFF367]",
      preview: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?q=80&w=800&auto=format&fit=crop",
      features: ["Metallic Textures", "3D Icons", "Shadow Depth", "Sponsor Priority"]
    }
  ];

  const handleSelect = async (themeId) => {
    setSelectedTheme(themeId);
    
    if (matchId) {
      setLoadingTheme(themeId);
      try {
        await axiosInstance.post(`/hosted-game/update-ticker-theme/${matchId}`, { tickerTheme: themeId });
        toast.success(`${themeId.toUpperCase()} THEME ASSIGNED TO MATCH!`);
        setTimeout(() => navigate(`/matches/${matchId}/stream-setup`), 1500);
      } catch (error) {
        toast.error("FAILED TO UPDATE MATCH TICKER THEME");
      } finally {
        setLoadingTheme(null);
      }
    } else {
      toast.success(`${themeId.toUpperCase()} THEME SELECTED AS PREVIEW!`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 animate-fade-in custom-scrollbar pb-32">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/10">
                <ArrowLeft size={18} />
              </button>
              <span className="px-3 py-1 bg-violet-500/10 text-violet-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/20">
                Ticker Studio
              </span>
            </div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
              Theme <span className="text-violet-500">Gallery</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Select your signature look for live broadcasts</p>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
             <div className="text-right">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Credits</p>
                <p className="text-xl font-black text-white uppercase">Pro Plan</p>
             </div>
             <div className="w-12 h-12 rounded-[8px] bg-violet-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Star size={24} className="text-white fill-white" />
             </div>
          </div>
        </div>

        {/* Hero Preview */}
        <div className="relative h-[400px] w-full rounded-[8px] overflow-hidden group shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10">
           <img 
             src={themes.find(t => t.id === selectedTheme)?.preview} 
             className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
             alt="Theme Preview"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
           <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="space-y-4 max-w-xl">
                 <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${themes.find(t => t.id === selectedTheme)?.color} animate-pulse shadow-[0_0_15px_currentColor]`} />
                    <h2 className="text-4xl font-black text-white uppercase tracking-tight">{themes.find(t => t.id === selectedTheme)?.name}</h2>
                 </div>
                 <p className="text-gray-300 text-sm font-medium leading-relaxed italic">
                    "{themes.find(t => t.id === selectedTheme)?.description}"
                 </p>
                 <div className="flex flex-wrap gap-3">
                    {themes.find(t => t.id === selectedTheme)?.features.map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-[8px] text-[9px] font-black uppercase tracking-widest text-white/80 border border-white/10">
                        {f}
                      </span>
                    ))}
                 </div>
              </div>
              <button className="h-16 px-10 bg-white text-black font-black uppercase text-xs tracking-widest rounded-[8px] shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:bg-gray-100 transition-all flex items-center gap-3">
                 Live Demo <Play size={16} fill="currentColor" />
              </button>
           </div>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-12">
           {themes.map(theme => (
             <div 
               key={theme.id}
               onClick={() => !loadingTheme && handleSelect(theme.id)}
               className={`group relative p-8 rounded-[8px] border-2 transition-all cursor-pointer ${selectedTheme === theme.id ? 'bg-violet-500/5 border-violet-500 shadow-[0_0_50px_rgba(139,92,246,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
             >
                <div className="space-y-6">
                   <div className={`w-16 h-16 rounded-[8px] ${theme.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      {loadingTheme === theme.id ? <Loader2 className="text-white animate-spin" size={32} /> : <Palette size={32} className="text-white" />}
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">{theme.name}</h3>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed line-clamp-2">
                         {theme.description}
                      </p>
                   </div>
                   <div className="pt-4 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         <Zap size={14} className="text-violet-500" /> Professional
                      </div>
                      {selectedTheme === theme.id && !loadingTheme && (
                        <CheckCircle2 size={24} className="text-violet-500 animate-in zoom-in duration-300" />
                      )}
                   </div>
                </div>
                
                {/* Active Indicator Overlay */}
                {selectedTheme === theme.id && (
                  <div className="absolute inset-x-0 -bottom-4 flex justify-center">
                    <div className="px-4 py-1 bg-violet-500 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                      {matchId ? "ASSIGN THIS" : "ACTIVE LOOK"}
                    </div>
                  </div>
                )}
             </div>
           ))}
        </div>

        {/* Pro Tip */}
        <div className="mt-20 p-8 bg-gradient-to-r from-violet-500/10 to-transparent border border-violet-500/20 rounded-[8px] flex flex-col md:flex-row items-center gap-8 shadow-[0_0_50px_rgba(139,92,246,0.05)]">
           <div className="w-16 h-16 rounded-[8px] bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
              <Shield className="text-violet-500" size={32} />
           </div>
           <div className="space-y-1 text-center md:text-left">
              <h4 className="text-lg font-black text-white uppercase">Broadcast Customization</h4>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                 Selected themes apply to all live overlays generated via OBS or Browser Source. <br />
                 Changes are reflected instantly for all viewers on YouTube & Facebook.
              </p>
           </div>
           <button 
             onClick={() => navigate(-1)}
             className="w-full md:w-auto h-14 px-10 bg-white text-black font-black uppercase text-xs tracking-widest rounded-[8px] hover:bg-gray-100 transition-all ml-auto"
           >
              Return to Setup
           </button>
        </div>
      </div>
    </div>
  );
}
