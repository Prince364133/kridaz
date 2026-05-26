import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Copy, Check, Tv, Search } from "lucide-react";

const CreateStream = () => {
  const [step, setStep] = useState(1);
  const [scoringId, setScoringId] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const themes = [
    { id: "dark", name: "Dark Midnight", preview: "bg-gray-900 border-gray-700" },
    { id: "light", name: "Clean Light", preview: "bg-white border-gray-200" },
    { id: "neon", name: "Neon Cyber", preview: "bg-black border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]" },
    { id: "sport", name: "Sport Classic", preview: "bg-blue-900 border-blue-700" },
    { id: "minimal", name: "Minimal Transparent", preview: "bg-black/50 border-white/20 backdrop-blur-md" },
  ];

  const handleFetchMatch = (e) => {
    e.preventDefault();
    if (!scoringId.trim()) return;
    
    // Mock fetching match data
    setTimeout(() => {
      setMatchData({
        id: scoringId,
        title: "Kridaz Premier League: Team A vs Team B",
        date: new Date().toLocaleDateString(),
        venue: "Central Turf, Main Ground"
      });
      setStep(2);
    }, 500);
  };

  const handleCopyLink = () => {
    const link = `https://kridaz.com/ticker/${matchData?.id}?theme=${selectedTheme}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Create Stream</h1>
        <p className="text-gray-400 mt-2">Set up your OBS ticker and broadcast settings in 3 easy steps.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-10 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#55DEE8] -z-10 rounded-full transition-all duration-500" 
          style={{ width: `${((step - 1) / 2) * 100}%` }}
        />
        
        {[1, 2, 3].map(num => (
          <div 
            key={num}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 transition-all duration-300 ${ step >= num ? "bg-[#55DEE8] border-black text-black" : "bg-black border-white/20 text-white/50" }`}
          >
            {step > num ? <Check size={18} /> : num}
          </div>
        ))}
      </div>

      {/* Step 1: Input Scoring ID */}
      {step === 1 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[8px] animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-white mb-6">Step 1: Link Match</h2>
          <form onSubmit={handleFetchMatch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Scoring ID / Match Code</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  value={scoringId}
                  onChange={(e) => setScoringId(e.target.value)}
                  placeholder="Enter the match scoring ID..."
                  className="w-full bg-black border border-white/10 rounded-[8px] py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#55DEE8] transition-colors"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">You can find the Scoring ID in the Umpire or Scorer portal for this match.</p>
            </div>
            
            <button
              type="submit"
              className="bg-[#55DEE8] hover:bg-[#55DEE8]/90 text-black font-bold py-4 px-8 rounded-[8px] w-full sm:w-auto transition-colors flex items-center justify-center gap-2"
            >
              Fetch Match Data
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Select Theme */}
      {step === 2 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[8px] animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Step 2: Select Ticker Theme</h2>
            <button onClick={() => setStep(1)} className="text-sm text-gray-400 hover:text-white">Change Match</button>
          </div>
          
          <div className="mb-8 p-4 bg-black/50 border border-white/10 rounded-[8px]">
            <h3 className="text-sm font-bold text-[#55DEE8] mb-1">Selected Match:</h3>
            <p className="text-white font-medium">{matchData?.title}</p>
            <p className="text-sm text-gray-400">{matchData?.venue} • {matchData?.date}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-4 rounded-[8px] border-2 text-left transition-all ${ selectedTheme === theme.id ? "border-[#55DEE8] bg-[#55DEE8]/5" : "border-white/10 hover:border-white/30 bg-black/50" }`}
              >
                <div className={`w-full h-20 rounded-lg mb-3 border ${theme.preview} flex flex-col items-center justify-center gap-2`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20"></div>
                    <div className="w-8 h-8 rounded-full bg-white/20"></div>
                  </div>
                  <div className="w-24 h-2 bg-white/20 rounded-full"></div>
                </div>
                <h4 className="font-bold text-white">{theme.name}</h4>
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="px-8 py-4 rounded-[8px] font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedTheme}
              className="px-8 py-4 rounded-[8px] font-bold text-black bg-[#55DEE8] hover:bg-[#55DEE8]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            >
              Generate Ticker
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Ticker Link */}
      {step === 3 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-[8px] animate-in fade-in duration-300">
          <h2 className="text-xl font-bold text-white mb-2">Step 3: Add to OBS Studio</h2>
          <p className="text-gray-400 mb-8">Copy the link below and add it as a "Browser Source" in your streaming software (OBS, Streamlabs, etc).</p>
          
          <div className="space-y-6">
            <div className="bg-black/50 border border-white/10 p-6 rounded-[8px]">
              <label className="block text-sm font-bold text-[#55DEE8] mb-4">OBS Browser Source URL</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-black border border-white/20 rounded-[8px] p-3 font-mono text-sm text-gray-300 overflow-x-auto whitespace-nowrap">
                  https://kridaz.com/ticker/{matchData?.id}?theme={selectedTheme}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-lg text-white transition-colors flex items-center justify-center min-w-[48px]"
                >
                  {isCopied ? <Check size={20} className="text-[#55DEE8]" /> : <Copy size={20} />}
                </button>
              </div>
            </div>

            <div className="bg-black/50 border border-white/10 p-6 rounded-[8px] space-y-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Tv size={18} className="text-[#55DEE8]" /> Recommended OBS Settings
              </h3>
              <ul className="space-y-2 text-sm text-gray-400 list-disc list-inside">
                <li>Width: <span className="text-white font-mono">1920</span> (or match your canvas width)</li>
                <li>Height: <span className="text-white font-mono">150</span> (or preferred ticker height)</li>
                <li>Check "Custom frame rate" and set to <span className="text-white font-mono">60 fps</span></li>
                <li>Check "Clear cache of page on scene activation" to ensure live data</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="px-8 py-4 rounded-[8px] font-bold text-white bg-white/10 hover:bg-white/20 transition-colors"
            >
              Change Theme
            </button>
            <Link
              to={`/professional/streamer/manage/${matchData?.id}`}
              className="px-8 py-4 rounded-[8px] font-bold text-black bg-[#55DEE8] hover:bg-[#55DEE8]/90 transition-colors flex-1 sm:flex-none text-center"
            >
              Manage Stream Dashboard
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateStream;
