import { useState, useEffect, useRef } from "react";
import { Trophy, ChevronDown, Globe, Search } from "lucide-react";
import { fetchStates, fetchCities } from "../../utils/locationService";

const SPORTS_LIST = [
  "Football", "Cricket", "Badminton", "Tennis", "Basketball",
  "Swimming", "Volleyball", "Table Tennis", "Squash", "Hockey"
];

/**
 * SearchTurf — unified filter bar for the venue discovery page.
 * Props:
 *   onSearch(filters)  — called on every debounced change
 *   userLocation       — { lat, lng } auto-detected by the parent (Turf.jsx)
 */
const SearchTurf = ({ onSearch, userLocation }) => {
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // search-inside-dropdown state
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const sportDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // ── Fetch states on mount ──────────────────────────────────────────
  useEffect(() => {
    fetchStates().then(setStates);
  }, []);

  // ── Fetch cities whenever state changes ────────────────────────────
  useEffect(() => {
    if (state) {
      fetchCities(state).then((newCities) => {
        setCities(newCities);
        // Only clear city if the current city isn't in the new state's list
        // and it wasn't just auto-filled from userLocation
        if (city && !newCities.includes(city) && city !== userLocation?.city) {
          setCity("");
        }
      });
    } else {
      setCities([]);
      setCity("");
    }
  }, [state]);

  // ── Close dropdowns on outside click ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sportDropdownRef.current && !sportDropdownRef.current.contains(e.target)) setShowSportDropdown(false);
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target)) setShowStateDropdown(false);
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Stable ref for onSearch to avoid infinite loops ────────────────
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);

  // ── Debounced auto-search — fires on any filter change ─────────────
  useEffect(() => {
    const t = setTimeout(() => {
      const searchParams = {
        searchTerm: sport || undefined,
        city: city || undefined,
        state: state || undefined,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      };

      // Remove undefined values
      Object.keys(searchParams).forEach(key => searchParams[key] === undefined && delete searchParams[key]);

      onSearchRef.current(searchParams);
    }, 400);
    return () => clearTimeout(t);
  }, [sport, city, state, userLocation]);

  // ── Auto-fill detected location names ──────────────────────────────
  useEffect(() => {
    if (userLocation?.state && !state) {
      setState(userLocation.state);
    }
    if (userLocation?.city && !city) {
      setCity(userLocation.city);
    }
  }, [userLocation]);


  // ── Filtered lists for search-inside-dropdown ──────────────────────
  const filteredStates = stateSearch
    ? states.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
    : states;

  const filteredCities = citySearch
    ? cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  return (
    <div className="w-full max-w-[1500px] mx-auto animate-fade-in-up">
      <div className="relative group">
        {/* ── Main Bar ──────────────────────────────────────────── */}
        <div className="relative flex flex-row items-center bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-1.5 shadow-2xl transition-all duration-500 hover:border-[#84CC16]/30 min-h-[56px] md:min-h-[64px]">

          {/* ── Sport Dropdown ─────────────────────────────────── */}
          <div className="flex-1 min-w-[80px] relative z-[100] border-r border-white/5" ref={sportDropdownRef}>
            <button
              onClick={() => setShowSportDropdown(!showSportDropdown)}
              className="flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-xl group/btn"
            >
              <div className="p-2 bg-white/5 rounded-lg group-hover/btn:bg-[#84CC16]/10 transition-colors">
                <Trophy size={14} className={`${showSportDropdown ? "text-[#84CC16]" : "text-gray-500"}`} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Sport</span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight truncate w-full">{sport || "All"}</span>
              </div>
              <ChevronDown size={12} className={`ml-auto text-gray-600 transition-transform duration-500 ${showSportDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showSportDropdown && (
              <div className="absolute top-full mt-2 left-0 w-64 lg:w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <button
                    onClick={() => { setSport(""); setShowSportDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors group/item"
                  >
                    <Trophy size={14} className="mr-3 text-gray-600 group-hover/item:text-[#84CC16]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All Categories</span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {SPORTS_LIST.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSport(s); setShowSportDropdown(false); }}
                      className={`flex items-center px-4 py-2.5 rounded-xl transition-all text-left ${sport === s ? "bg-[#84CC16] text-black shadow-[0_0_15px_rgba(132,204,22,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${sport === s ? "text-black" : ""}`}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── State Dropdown ─────────────────────────────────── */}
          <div className="flex-1 min-w-[80px] relative z-[90] border-r border-white/5" ref={stateDropdownRef}>
            <button
              onClick={() => { setShowStateDropdown(!showStateDropdown); setStateSearch(""); }}
              className="flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-xl group/btn"
            >
              <div className="p-2 bg-white/5 rounded-lg group-hover/btn:bg-[#84CC16]/10 transition-colors">
                <Globe size={14} className={`${showStateDropdown ? "text-[#84CC16]" : "text-gray-500"}`} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">State</span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight truncate w-full">{state || "Select"}</span>
              </div>
              <ChevronDown size={12} className={`ml-auto text-gray-600 transition-transform duration-500 ${showStateDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showStateDropdown && (
              <div className="absolute top-full mt-2 left-0 w-64 lg:w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 focus-within:border-[#84CC16]/30 transition-all">
                    <Search size={12} className="text-gray-500 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Find state..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-white placeholder-gray-600 outline-none w-full uppercase tracking-wider"
                    />
                  </div>
                </div>
                <div className="p-2 max-h-[260px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <button
                    onClick={() => { setState(""); setShowStateDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All Locations</span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {filteredStates.length === 0 ? (
                    <p className="text-[10px] font-bold text-gray-600 px-4 py-3 uppercase tracking-widest text-center">No locations found</p>
                  ) : filteredStates.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setState(s); setShowStateDropdown(false); setStateSearch(""); }}
                      className={`flex items-center px-4 py-2.5 rounded-xl transition-all text-left ${state === s ? "bg-[#84CC16] text-black shadow-[0_0_15px_rgba(132,204,22,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${state === s ? "text-black" : ""}`}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── City Dropdown ──────────────────────────────────── */}
          <div className="flex-1 min-w-[80px] relative z-[80]" ref={cityDropdownRef}>
            <button
              onClick={() => { if (state) { setShowCityDropdown(!showCityDropdown); setCitySearch(""); } }}
              disabled={!state}
              className={`flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-xl group/btn ${!state ? "opacity-20 grayscale" : ""}`}
            >
              <div className="p-2 bg-white/5 rounded-lg group-hover/btn:bg-[#84CC16]/10 transition-colors">
                <MapPin size={14} className={`${showCityDropdown ? "text-[#84CC16]" : "text-gray-500"}`} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">City</span>
                <span className="text-[12px] font-bold text-white uppercase tracking-tight truncate w-full">{city || "Select"}</span>
              </div>
              <ChevronDown size={12} className={`ml-auto text-gray-600 transition-transform duration-500 ${showCityDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showCityDropdown && state && (
              <div className="absolute top-full mt-2 right-0 w-64 lg:w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 focus-within:border-[#84CC16]/30 transition-all">
                    <Search size={12} className="text-gray-500 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Find city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-white placeholder-gray-600 outline-none w-full uppercase tracking-wider"
                    />
                  </div>
                </div>
                <div className="p-2 max-h-[260px] overflow-y-auto grid grid-cols-1 gap-1 custom-scrollbar">
                  <button
                    onClick={() => { setCity(""); setShowCityDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All Cities</span>
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {filteredCities.length === 0 ? (
                    <p className="text-[10px] font-bold text-gray-600 px-4 py-3 uppercase tracking-widest text-center">No cities found</p>
                  ) : filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCity(c); setShowCityDropdown(false); setCitySearch(""); }}
                      className={`flex items-center px-4 py-2.5 rounded-xl transition-all text-left ${city === c ? "bg-[#84CC16] text-black shadow-[0_0_15px_rgba(132,204,22,0.3)]" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${city === c ? "text-black" : ""}`}>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTurf;
