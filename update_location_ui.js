const fs = require('fs');

const file = 'client/user/src/features/scoring/components/StartScoringModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports if needed
if (!content.includes('import { searchLocations }')) {
  content = content.replace(
    /import \{ fetchStates, fetchCities \} from '@shared\/utils\/locationService';/g,
    `import { fetchStates, fetchCities, searchLocations } from '@shared/utils/locationService';`
  );
}
if (!content.includes('Loader2')) {
  content = content.replace(
    /import \{ MapPin, /,
    `import { MapPin, Loader2, Navigation, `
  );
}

// 2. Add location auto-suggest state
const stateHookTarget = `  // Location state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);`;

const stateHookNew = `  // Location state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef(null);

  useEffect(() => {
    if (!locationInput || locationInput.length < 3 || (selectedLocation && selectedLocation.display_name === locationInput)) {
      if (locationInput === "") {
        setLocationSuggestions([]);
        setSelectedLocation(null);
        setFormData(f => ({ ...f, city: '', state: '' }));
      }
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingLocation(true);
      try {
        const results = await searchLocations(locationInput);
        setLocationSuggestions(results);
        setShowLocationSuggestions(results.length > 0);
      } catch (error) {
        console.error("Location search error:", error);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (locationRef.current && !locationRef.current.contains(e.target)) setShowLocationSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectLocation = (suggestion) => {
    setLocationInput(suggestion.display_name);
    setSelectedLocation({
      city: suggestion.city,
      state: suggestion.state,
      display_name: suggestion.display_name
    });
    setFormData(f => ({ ...f, city: suggestion.city, state: suggestion.state }));
    setShowLocationSuggestions(false);
  };`;

content = content.replace(stateHookTarget, stateHookNew);

// 3. Update navigator.geolocation
const geolocationOld = `              if (userState && isMounted) {
                setFormData(f => ({ ...f, state: userState }));
                const cityList = await fetchCities(userState);
                if (isMounted) {
                  setCities(cityList);
                  // Basic matching for city
                  if (userCity) {
                    const matchedCity = cityList.find(c => c.toLowerCase().includes(userCity.toLowerCase()) || userCity.toLowerCase().includes(c.toLowerCase()));
                    if (matchedCity) {
                      setFormData(f => ({ ...f, city: matchedCity }));
                    }
                  }
                }
              }`;

const geolocationNew = `              if (userState && isMounted) {
                setFormData(f => ({ ...f, state: userState, city: userCity || '' }));
                const display = \`\${userCity || ''}\${userCity && userState ? ', ' : ''}\${userState}\`;
                setLocationInput(display);
                setSelectedLocation({ city: userCity || '', state: userState, display_name: display });
              }`;

content = content.replace(geolocationOld, geolocationNew);

// 4. Replace JSX
const jsxOld = `            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>State</label>
                <select value={formData.state}
                  onChange={async e => {
                    const state = e.target.value;
                    setFormData(f => ({ ...f, state, city: '' }));
                    if (state) {
                      const c = await fetchCities(state);
                      setCities(c);
                    } else {
                      setCities([]);
                    }
                  }}
                  className={selectClass}>
                  <option value="">Select State</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>City</label>
                <select value={formData.city}
                  onChange={e => setFormData(f => ({ ...f, city: e.target.value }))}
                  className={selectClass}
                  disabled={!formData.state || cities.length === 0}>
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>`;

const jsxNew = `            <div className="relative w-full" ref={locationRef}>
              <label className={labelClass}>Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => {
                    setLocationInput(e.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  onFocus={() => setShowLocationSuggestions(locationSuggestions.length > 0)}
                  placeholder="Search city, state..."
                  className={\`\${inputClass} pl-10\`}
                />
                {isSearchingLocation && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 text-[#55DEE8] animate-spin" />
                  </div>
                )}
              </div>
              {showLocationSuggestions && (locationSuggestions.length > 0 || isSearchingLocation) && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-[110] animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="p-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {isSearchingLocation && locationSuggestions.length === 0 && (
                      <div className="px-4 py-6 text-center">
                        <Loader2 className="w-5 h-5 text-[#55DEE8] animate-spin mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Searching Locations...</p>
                      </div>
                    )}
                    {locationSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectLocation(suggestion)}
                        className="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-white/5 rounded-lg transition-all group/item"
                      >
                        <div className="mt-0.5 p-1.5 rounded-md bg-white/5 group-hover/item:bg-[#55DEE8]/20 transition-colors">
                          <Navigation className="w-3 h-3 text-gray-500 group-hover/item:text-[#55DEE8]" />
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
            </div>`;

content = content.replace(jsxOld, jsxNew);

fs.writeFileSync(file, content);
console.log('StartScoringModal updated with unified location autocomplete.');
