import { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, MapPin, RotateCcw, Globe, Navigation, Loader2, Trophy } from "lucide-react";
import { searchLocations } from "../../utils/locationService";

/**
 * SearchTurf — unified filter bar for the venue discovery page.
 * Provides a high-density "Command Center" interface with real-time location autocomplete.
 */
const SearchTurf = ({ onSearch, userLocation }) => {
  const [sport, setSport] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showSportDropdown, setShowSportDropdown] = useState(false);
  const sportDropdownRef = useRef(null);
  const locationRef = useRef(null);

  const SPORTS_LIST = [
    "Football", "Cricket", "Badminton", "Tennis", "Basketball",
    "Swimming", "Volleyball", "Table Tennis", "Squash", "Hockey"
  ];

  // Sync with userLocation prop (auto-detected or from parent)
  // Sync with userLocation prop (auto-detected or from parent) - DISABLED AS PER USER REQUEST
  /*
  useEffect(() => {
    if (userLocation?.city && !selectedLocation) {
      const display = `${userLocation.city}${userLocation.state ? `, ${userLocation.state}` : ""}`;
      setLocationInput(display);
      setSelectedLocation({
        city: userLocation.city,
        state: userLocation.state,
        lat: userLocation.lat,
        lng: userLocation.lng,
        display_name: display
      });
    }
  }, [userLocation]);
  */

  // Debounced real-time location autocomplete
  useEffect(() => {
    if (!locationInput || locationInput.length < 3 || (selectedLocation && selectedLocation.display_name === locationInput)) {
      if (locationInput === "") {
        setSuggestions([]);
        setSelectedLocation(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(locationInput);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sportDropdownRef.current && !sportDropdownRef.current.contains(e.target)) setShowSportDropdown(false);
      if (locationRef.current && !locationRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update search results on filter change
  const onSearchRef = useRef(onSearch);
  useEffect(() => { onSearchRef.current = onSearch; }, [onSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      onSearchRef.current({
        searchTerm: sport || undefined,
        city: selectedLocation?.city || undefined,
        state: selectedLocation?.state || undefined,
        lat: selectedLocation?.lat,
        lng: selectedLocation?.lng
      });
    }, 400);
    return () => clearTimeout(t);
  }, [sport, selectedLocation]);

  const handleSelectLocation = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setSelectedLocation({
      city: suggestion.city,
      state: suggestion.state,
      lat: suggestion.lat,
      lng: suggestion.lng,
      display_name: suggestion.display_name
    });
    setShowSuggestions(false);
  };

  const resetFilters = () => {
    setSport("");
    setLocationInput("");
    setSelectedLocation(null);
    setSuggestions([]);
  };

  return (
    <div className="w-full animate-fade-in-up relative z-[50]">
      <div className="relative group">
        <div className="relative flex flex-row items-center bg-black/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-1.5 shadow-2xl transition-all duration-500 hover:border-[#84CC16]/30 min-h-[56px] md:min-h-[64px]">
          
          {/* Sport Selector */}
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

          {/* Unified Location Search */}
          <div className="flex-[2] min-w-[150px] relative z-[90]" ref={locationRef}>
            <div className="flex items-center gap-3 w-full h-full px-4 py-2 transition-all hover:bg-white/5 rounded-xl group/loc">
              <div className="p-2 bg-white/5 rounded-lg group-hover/loc:bg-[#84CC16]/10 transition-colors">
                <MapPin size={14} className={`${locationInput ? "text-[#84CC16]" : "text-gray-500"}`} />
              </div>
              <div className="flex flex-col text-left flex-1 relative">
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Location</span>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                  placeholder="Where do you want to play?"
                  className="bg-transparent border-none p-0 text-[12px] font-bold text-white placeholder-gray-700 outline-none w-full uppercase tracking-tight"
                />
                
                {isSearching && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-3 h-3 text-[#84CC16] animate-spin" />
                  </div>
                )}
              </div>
              <Navigation size={12} className="ml-auto text-gray-600 group-hover/loc:text-[#84CC16] transition-colors" />
            </div>

            {showSuggestions && (suggestions.length > 0 || isSearching) && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in slide-in-from-top-2 duration-300">
                <div className="p-2 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {isSearching && suggestions.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Loader2 className="w-6 h-6 text-[#84CC16] animate-spin mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Searching Locations...</p>
                    </div>
                  )}
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectLocation(suggestion)}
                      className="w-full flex items-start gap-4 px-4 py-3 text-left hover:bg-white/5 rounded-xl transition-all group/item"
                    >
                      <div className="mt-0.5 p-2 rounded-lg bg-white/5 group-hover/item:bg-[#84CC16]/20 transition-colors">
                        <Navigation className="w-3.5 h-3.5 text-gray-500 group-hover/item:text-[#84CC16]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">{suggestion.city}</span>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight line-clamp-1">{suggestion.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reset Filter */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center p-3 text-gray-500 hover:text-[#84CC16] transition-colors group/reset"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4 transition-transform duration-500 group-hover/reset:rotate-[-180deg]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchTurf;
