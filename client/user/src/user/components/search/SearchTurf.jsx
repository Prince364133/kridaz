import { useState, useEffect, useRef } from "react";
import { Search, Calendar, Trophy, ChevronDown, Filter, Sliders, Globe, Flame, RotateCcw } from "lucide-react";

const SPORTS_LIST = [
  "Football", "Cricket", "Badminton", "Tennis", "Basketball", 
  "Swimming", "Volleyball", "Table Tennis", "Squash", "Hockey"
];

const SearchTurf = ({ onSearch }) => {
  const [sport, setSport] = useState("");
  const [radius, setRadius] = useState(50);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const sportDropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sportDropdownRef.current && !sportDropdownRef.current.contains(event.target)) {
        setShowSportDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearch({ 
        searchTerm: sport, 
        location: "", 
        radius, 
        city, 
        state 
      });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [sport, radius, city, state, onSearch]);

  const resetFilters = () => {
    setCity("");
    setState("");
    setRadius(50);
    setSport("");
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto animate-fade-in-up">
      <div className="relative group">
        {/* Main Unified Bar */}
        <div className="relative flex flex-col lg:flex-row items-stretch bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] lg:rounded-full p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-[#84CC16]/40">
          
          {/* Custom Sports Dropdown */}
          <div className="flex-1 relative z-50 border-b lg:border-b-0 lg:border-r border-white/5" ref={sportDropdownRef}>
            <button
              onClick={() => setShowSportDropdown(!showSportDropdown)}
              className="flex items-center w-full h-full px-8 py-4 text-left group/btn"
            >
              <Trophy className={`mr-4 shrink-0 transition-transform duration-500 ${showSportDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} size={22} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Category</span>
                <span className="text-[13px] font-black text-white uppercase tracking-wider truncate">
                  {sport || "All Sports"}
                </span>
              </div>
              <ChevronDown size={14} className={`ml-auto text-gray-600 transition-transform duration-500 ${showSportDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showSportDropdown && (
              <div className="absolute top-[115%] left-0 w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[#84CC16]/20 grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setSport(""); setShowSportDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors group/opt"
                  >
                    <Trophy size={14} className="mr-3 text-gray-600 group-hover/opt:text-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover/opt:text-white">All Sports</span>
                  </button>
                  {SPORTS_LIST.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSport(s); setShowSportDropdown(false); }}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all text-left group/opt ${sport === s ? "bg-[#84CC16] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${sport === s ? "text-black" : ""}`}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* City Filter */}
          <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-white/5 flex items-center px-8">
            <Globe className="text-gray-600 mr-4 shrink-0" size={20} />
            <div className="flex flex-col w-full">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">City</span>
              <input
                type="text"
                placeholder="ANY"
                className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-800 w-full text-[13px] font-black uppercase tracking-wider p-0"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          {/* State Filter */}
          <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-white/5 flex items-center px-8">
            <Globe className="text-gray-600 mr-4 shrink-0" size={20} />
            <div className="flex flex-col w-full">
              <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">State</span>
              <input
                type="text"
                placeholder="ANY"
                className="bg-transparent border-none focus:ring-0 text-white placeholder-gray-800 w-full text-[13px] font-black uppercase tracking-wider p-0"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>

          {/* Radius Selector */}
          <div className="flex-[1.5] flex items-center px-8 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/5">
            <Sliders className="text-gray-600 mr-5 shrink-0" size={20} />
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Range</span>
                <span className="text-[11px] font-black text-[#84CC16] tracking-tighter">{radius} KM</span>
              </div>
              <input
                type="range"
                min="1"
                max="1000"
                step="10"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#84CC16] hover:accent-[#A3E635] transition-all"
              />
            </div>
          </div>

          {/* Reset Button Integrated */}
          <div className="p-2 flex items-center justify-center lg:px-6">
            <button
              onClick={resetFilters}
              className="flex items-center gap-2 px-6 py-3 rounded-full hover:bg-white/5 text-gray-600 hover:text-[#FF3B3B] transition-all group/reset whitespace-nowrap"
            >
              <RotateCcw size={16} className="group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Reset</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SearchTurf;
