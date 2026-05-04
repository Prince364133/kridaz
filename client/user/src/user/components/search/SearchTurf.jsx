import { useState, useEffect, useRef } from "react";
import { Trophy, ChevronDown, Globe, RotateCcw, Crosshair } from "lucide-react";
import { fetchStates, fetchCities } from "../../utils/locationService";

const SPORTS_LIST = [
  "Football", "Cricket", "Badminton", "Tennis", "Basketball", 
  "Swimming", "Volleyball", "Table Tennis", "Squash", "Hockey"
];

const SearchTurf = ({ onSearch }) => {
  const [sport, setSport] = useState("");
  const [radius, setRadius] = useState(50);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
  const sportDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Fetch states on mount
  useEffect(() => {
    const loadStates = async () => {
      const data = await fetchStates();
      setStates(data);
    };
    loadStates();
  }, []);

  // Fetch cities when state changes
  useEffect(() => {
    if (state) {
      const loadCities = async () => {
        const data = await fetchCities(state);
        setCities(data);
      };
      loadCities();
      setCity(""); // Reset city when state changes
    } else {
      setCities([]);
    }
  }, [state]);

  // Get user location for radius filtering
  const getMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        setIsLocating(false);
        alert("Unable to retrieve your location. Please check permissions.");
      }
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sportDropdownRef.current && !sportDropdownRef.current.contains(event.target)) setShowSportDropdown(false);
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target)) setShowStateDropdown(false);
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Store onSearch in a ref to avoid infinite loops from unstable parent references
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);

  // Auto-search effect — debounced, triggers on filter changes only
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onSearchRef.current({ 
        searchTerm: sport, 
        radius: userLocation ? radius : undefined, 
        city, 
        state,
        lat: userLocation?.lat,
        lng: userLocation?.lng
      });
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [sport, radius, city, state, userLocation]);

  const resetFilters = () => {
    setCity("");
    setState("");
    setRadius(50);
    setSport("");
    setUserLocation(null);
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto animate-fade-in-up">
      <div className="relative group">
        {/* Main Unified Bar */}
        <div className="relative flex flex-col lg:flex-row items-stretch bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] lg:rounded-full p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-[#84CC16]/40">
          
          {/* Custom Sports Dropdown */}
          <div className="flex-1 relative z-[100] border-b lg:border-b-0 lg:border-r border-white/5" ref={sportDropdownRef}>
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
              <div className="absolute top-[115%] left-0 w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
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

          {/* State Filter Dropdown */}
          <div className="flex-1 relative z-[90] border-b lg:border-b-0 lg:border-r border-white/5" ref={stateDropdownRef}>
            <button
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className="flex items-center w-full h-full px-8 py-4 text-left group/btn"
            >
              <Globe className={`mr-4 shrink-0 transition-transform duration-500 ${showStateDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} size={22} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">State</span>
                <span className="text-[13px] font-black text-white uppercase tracking-wider truncate">
                  {state || "Select State"}
                </span>
              </div>
              <ChevronDown size={14} className={`ml-auto text-gray-600 transition-transform duration-500 ${showStateDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showStateDropdown && (
              <div className="absolute top-[115%] left-0 w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[#84CC16]/20 grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setState(""); setShowStateDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors group/opt"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover/opt:text-white">All States</span>
                  </button>
                  {states.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setState(s); setShowStateDropdown(false); }}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all text-left group/opt ${state === s ? "bg-[#84CC16] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${state === s ? "text-black" : ""}`}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* City Filter Dropdown */}
          <div className="flex-1 relative z-[80] border-b lg:border-b-0 lg:border-r border-white/5" ref={cityDropdownRef}>
            <button
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              disabled={!state}
              className={`flex items-center w-full h-full px-8 py-4 text-left group/btn ${!state ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <Globe className={`mr-4 shrink-0 transition-transform duration-500 ${showCityDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} size={22} />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">City</span>
                <span className="text-[13px] font-black text-white uppercase tracking-wider truncate">
                  {city || "Select City"}
                </span>
              </div>
              <ChevronDown size={14} className={`ml-auto text-gray-600 transition-transform duration-500 ${showCityDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showCityDropdown && state && (
              <div className="absolute top-[115%] left-0 w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="p-2 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[#84CC16]/20 grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setCity(""); setShowCityDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors group/opt"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 group-hover/opt:text-white">All Cities</span>
                  </button>
                  {cities.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCity(c); setShowCityDropdown(false); }}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all text-left group/opt ${city === c ? "bg-[#84CC16] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${city === c ? "text-black" : ""}`}>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Radius Selector & Geolocation */}
          <div className="flex-[1.5] flex items-center px-8 py-4 w-full border-b lg:border-b-0 lg:border-r border-white/5">
            <button 
              onClick={getMyLocation}
              className={`mr-5 p-2 rounded-full transition-all ${userLocation ? "bg-[#84CC16]/20 text-[#84CC16]" : "bg-white/5 text-gray-600 hover:text-white"}`}
              title="Use My Location"
            >
              <Crosshair size={20} className={isLocating ? "animate-spin" : ""} />
            </button>
            <div className="flex flex-col w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">Range</span>
                <span className="text-[11px] font-black text-[#84CC16] tracking-tighter">{radius} KM</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                step="5"
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
