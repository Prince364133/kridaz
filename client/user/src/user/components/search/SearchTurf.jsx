import { useState, useEffect, useRef } from "react";
import { Trophy, ChevronDown, Globe, RotateCcw, Search } from "lucide-react";
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
      onSearchRef.current({
        searchTerm: sport,
        city,
        state,
        // always pass user location so backend sorts by proximity
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
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

  const resetFilters = () => {
    setSport("");
    setState("");
    setCity("");
    setStateSearch("");
    setCitySearch("");
  };

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
        <div className="relative flex flex-row items-center bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-700 hover:border-[#84CC16]/40 overflow-x-auto no-scrollbar">

          {/* ── Sport Dropdown ─────────────────────────────────── */}
          <div className="flex-1 min-w-[90px] relative z-[100] border-r border-white/5" ref={sportDropdownRef}>
            <button
              onClick={() => setShowSportDropdown(!showSportDropdown)}
              className="flex items-center justify-center w-full h-full px-2 lg:px-8 py-2 lg:py-4 text-left"
            >
              <Trophy className={`hidden sm:block mr-2 lg:mr-4 shrink-0 w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-500 ${showSportDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] lg:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Category</span>
                <span className="text-[9px] lg:text-[13px] font-black text-white uppercase tracking-wider truncate w-full">{sport || "All"}</span>
              </div>
              <ChevronDown className={`hidden md:block ml-auto w-3 h-3 lg:w-4 lg:h-4 text-gray-600 transition-transform duration-500 ${showSportDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showSportDropdown && (
              <div className="absolute top-[115%] left-0 w-64 lg:w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                <div className="p-2 max-h-[300px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setSport(""); setShowSportDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors"
                  >
                    <Trophy size={14} className="mr-3 text-gray-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All Sports</span>
                  </button>
                  {SPORTS_LIST.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSport(s); setShowSportDropdown(false); }}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all text-left ${sport === s ? "bg-[#84CC16] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${sport === s ? "text-black" : ""}`}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── State Dropdown (with search) ───────────────────── */}
          <div className="flex-1 min-w-[90px] relative z-[90] border-r border-white/5" ref={stateDropdownRef}>
            <button
              onClick={() => { setShowStateDropdown(!showStateDropdown); setStateSearch(""); }}
              className="flex items-center justify-center w-full h-full px-2 lg:px-8 py-2 lg:py-4 text-left"
            >
              <Globe className={`hidden sm:block mr-2 lg:mr-4 shrink-0 w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-500 ${showStateDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] lg:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">State</span>
                <span className="text-[9px] lg:text-[13px] font-black text-white uppercase tracking-wider truncate w-full">{state || "Select"}</span>
              </div>
              <ChevronDown className={`hidden md:block ml-auto w-3 h-3 lg:w-4 lg:h-4 text-gray-600 transition-transform duration-500 ${showStateDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showStateDropdown && (
              <div className="absolute top-[115%] left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-0 w-64 lg:w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                {/* Search bar inside state dropdown */}
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                    <Search size={13} className="text-gray-500 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search state..."
                      value={stateSearch}
                      onChange={(e) => setStateSearch(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-white placeholder-gray-600 outline-none w-full uppercase tracking-wider"
                    />
                  </div>
                </div>
                <div className="p-2 max-h-[260px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setState(""); setShowStateDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All States</span>
                  </button>
                  {filteredStates.length === 0 ? (
                    <p className="text-[11px] text-gray-600 px-4 py-3 uppercase tracking-wider">No results</p>
                  ) : filteredStates.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setState(s); setShowStateDropdown(false); setStateSearch(""); }}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all text-left ${state === s ? "bg-[#84CC16] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${state === s ? "text-black" : ""}`}>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── City Dropdown (with search) ────────────────────── */}
          <div className="flex-1 min-w-[90px] relative z-[80] border-r border-white/5" ref={cityDropdownRef}>
            <button
              onClick={() => { if (state) { setShowCityDropdown(!showCityDropdown); setCitySearch(""); } }}
              disabled={!state}
              className={`flex items-center justify-center w-full h-full px-2 lg:px-8 py-2 lg:py-4 text-left ${!state ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <Globe className={`hidden sm:block mr-2 lg:mr-4 shrink-0 w-4 h-4 lg:w-5 lg:h-5 transition-transform duration-500 ${showCityDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] lg:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">City</span>
                <span className="text-[9px] lg:text-[13px] font-black text-white uppercase tracking-wider truncate w-full">{city || "Select"}</span>
              </div>
              <ChevronDown className={`hidden md:block ml-auto w-3 h-3 lg:w-4 lg:h-4 text-gray-600 transition-transform duration-500 ${showCityDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>

            {showCityDropdown && state && (
              <div className="absolute top-[115%] right-0 w-64 lg:w-72 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                {/* Search bar inside city dropdown */}
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                    <Search size={13} className="text-gray-500 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-white placeholder-gray-600 outline-none w-full uppercase tracking-wider"
                    />
                  </div>
                </div>
                <div className="p-2 max-h-[260px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button
                    onClick={() => { setCity(""); setShowCityDropdown(false); }}
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-[#84CC16]/10 text-left transition-colors"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">All Cities</span>
                  </button>
                  {filteredCities.length === 0 ? (
                    <p className="text-[11px] text-gray-600 px-4 py-3 uppercase tracking-wider">No results</p>
                  ) : filteredCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCity(c); setShowCityDropdown(false); setCitySearch(""); }}
                      className={`flex items-center px-4 py-3 rounded-xl transition-all text-left ${city === c ? "bg-[#84CC16] text-black" : "hover:bg-white/5 text-gray-400 hover:text-white"}`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${city === c ? "text-black" : ""}`}>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Reset Button ───────────────────────────────────── */}
          <div className="p-1 sm:p-2 flex items-center justify-center lg:px-6">
            <button
              onClick={resetFilters}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-4 lg:px-6 py-2 lg:py-3 rounded-full hover:bg-white/5 text-gray-600 hover:text-[#FF3B3B] transition-all group/reset whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3 lg:w-4 lg:h-4 group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
              <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-[0.2em]">Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTurf;
