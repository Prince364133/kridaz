import { useState, useEffect, useRef } from "react";
import { Users, ChevronDown, Globe, RotateCcw, Search, MapPin } from "lucide-react";
import { fetchStates, fetchCities } from "../../utils/locationService";

const SPORTS_LIST = [
  "Football", "Cricket", "Badminton", "Tennis", "Basketball",
  "Swimming", "Volleyball", "Table Tennis", "Squash", "Hockey"
];

const SearchPlayers = ({ onSearch, userLocation }) => {
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const sportDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  useEffect(() => {
    fetchStates().then(setStates);
  }, []);

  useEffect(() => {
    if (state) {
      fetchCities(state).then((newCities) => {
        setCities(newCities);
        if (city && !newCities.includes(city) && city !== userLocation?.city) {
          setCity("");
        }
      });
    } else {
      setCities([]);
      setCity("");
    }
  }, [state]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sportDropdownRef.current && !sportDropdownRef.current.contains(e.target)) setShowSportDropdown(false);
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target)) setShowStateDropdown(false);
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target)) setShowCityDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onSearchRef = useRef(onSearch);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      onSearchRef.current({
        sport,
        city,
        state,
        lat: userLocation?.lat,
        lng: userLocation?.lng,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [sport, city, state, userLocation]);

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

  const filteredStates = stateSearch
    ? states.filter((s) => s.toLowerCase().includes(stateSearch.toLowerCase()))
    : states;

  const filteredCities = citySearch
    ? cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
    : cities;

  return (
    <div className="w-full animate-fade-in">
      <div className="relative group">
        <div className="relative flex flex-row items-center bg-black/80 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] transition-all duration-500 hover:border-[#84CC16]/40 overflow-x-auto no-scrollbar">
          
          {/* Sport */}
          <div className="flex-1 min-w-[90px] relative z-[100] border-r border-white/5" ref={sportDropdownRef}>
            <button
              onClick={() => setShowSportDropdown(!showSportDropdown)}
              className="flex items-center justify-center w-full h-full px-2 md:px-6 py-2 md:py-3 text-left"
            >
              <Search className={`hidden sm:block mr-2 md:mr-3 shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-500 ${showSportDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] md:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">Sport</span>
                <span className="text-[9px] md:text-xs font-black text-white uppercase tracking-wider truncate w-full">{sport || "All"}</span>
              </div>
              <ChevronDown className={`hidden md:block ml-auto w-3 h-3 text-gray-600 transition-transform duration-500 ${showSportDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>
            {showSportDropdown && (
              <div className="absolute top-[115%] left-0 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                <div className="p-2 max-h-[250px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button onClick={() => { setSport(""); setShowSportDropdown(false); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-gray-400 hover:bg-white/5 rounded-xl uppercase">All Sports</button>
                  {SPORTS_LIST.map((s) => (
                    <button key={s} onClick={() => { setSport(s); setShowSportDropdown(false); }} className={`w-full text-left px-4 py-2 text-[11px] font-bold rounded-xl uppercase transition-colors ${sport === s ? "bg-[#84CC16] text-black" : "text-gray-400 hover:bg-white/5"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* State */}
          <div className="flex-1 min-w-[90px] relative z-[90] border-r border-white/5" ref={stateDropdownRef}>
            <button
              onClick={() => { setShowStateDropdown(!showStateDropdown); setStateSearch(""); }}
              className="flex items-center justify-center w-full h-full px-2 md:px-6 py-2 md:py-3 text-left"
            >
              <MapPin className={`hidden sm:block mr-2 md:mr-3 shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-500 ${showStateDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] md:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">State</span>
                <span className="text-[9px] md:text-xs font-black text-white uppercase tracking-wider truncate w-full">{state || "Select"}</span>
              </div>
              <ChevronDown className={`hidden md:block ml-auto w-3 h-3 text-gray-600 transition-transform duration-500 ${showStateDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>
            {showStateDropdown && (
              <div className="absolute top-[115%] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-0 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                    <Search size={13} className="text-gray-500 shrink-0" />
                    <input type="text" placeholder="Search state..." value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} className="bg-transparent text-[11px] font-bold text-white placeholder-gray-600 outline-none w-full uppercase tracking-wider" />
                  </div>
                </div>
                <div className="p-2 max-h-[250px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button onClick={() => { setState(""); setShowStateDropdown(false); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-gray-400 hover:bg-white/5 rounded-xl uppercase">All States</button>
                  {filteredStates.map((s) => (
                    <button key={s} onClick={() => { setState(s); setShowStateDropdown(false); }} className={`w-full text-left px-4 py-2 text-[11px] font-bold rounded-xl uppercase transition-colors ${state === s ? "bg-[#84CC16] text-black" : "text-gray-400 hover:bg-white/5"}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* City */}
          <div className="flex-1 min-w-[90px] relative z-[80] border-r border-white/5" ref={cityDropdownRef}>
            <button
              onClick={() => { if (state) { setShowCityDropdown(!showCityDropdown); setCitySearch(""); } }}
              disabled={!state}
              className={`flex items-center justify-center w-full h-full px-2 md:px-6 py-2 md:py-3 text-left ${!state ? "opacity-30 cursor-not-allowed" : ""}`}
            >
              <Globe className={`hidden sm:block mr-2 md:mr-3 shrink-0 w-3.5 h-3.5 md:w-4 md:h-4 transition-transform duration-500 ${showCityDropdown ? "scale-110 text-[#84CC16]" : "text-gray-500"}`} />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full">
                <span className="text-[6px] md:text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-0.5">City</span>
                <span className="text-[9px] md:text-xs font-black text-white uppercase tracking-wider truncate w-full">{city || "Select"}</span>
              </div>
              <ChevronDown className={`hidden md:block ml-auto w-3 h-3 text-gray-600 transition-transform duration-500 ${showCityDropdown ? "rotate-180 text-[#84CC16]" : ""}`} />
            </button>
            {showCityDropdown && state && (
              <div className="absolute top-[115%] right-0 w-64 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110]">
                <div className="p-2 border-b border-white/5">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                    <Search size={13} className="text-gray-500 shrink-0" />
                    <input type="text" placeholder="Search city..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} className="bg-transparent text-[11px] font-bold text-white placeholder-gray-600 outline-none w-full uppercase tracking-wider" />
                  </div>
                </div>
                <div className="p-2 max-h-[250px] overflow-y-auto grid grid-cols-1 gap-1">
                  <button onClick={() => { setCity(""); setShowCityDropdown(false); }} className="w-full text-left px-4 py-2 text-[11px] font-bold text-gray-400 hover:bg-white/5 rounded-xl uppercase">All Cities</button>
                  {filteredCities.map((c) => (
                    <button key={c} onClick={() => { setCity(c); setShowCityDropdown(false); }} className={`w-full text-left px-4 py-2 text-[11px] font-bold rounded-xl uppercase transition-colors ${city === c ? "bg-[#84CC16] text-black" : "text-gray-400 hover:bg-white/5"}`}>{c}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-1 sm:p-2 flex items-center justify-center md:px-4">
            <button onClick={resetFilters} className="p-1.5 sm:p-2 rounded-full hover:bg-white/5 text-gray-600 hover:text-[#FF3B3B] transition-all group/reset">
              <RotateCcw className="w-3 h-3 md:w-3.5 md:h-3.5 group-hover/reset:rotate-[-180deg] transition-transform duration-500" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SearchPlayers;
