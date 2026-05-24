const fs = require('fs');
const file = 'client/user/src/features/scoring/components/StartScoringModal.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Replace location state and useEffect
const oldStateBlock = `  // Location state
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Fetch initial location (States and Auto-detect)
  useEffect(() => {
    let isMounted = true;
    const initLocation = async () => {
      try {
        const stateList = await fetchStates();
        if (isMounted) setStates(stateList);

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}&format=json&addressdetails=1\`);
              const data = await res.json();
              const userState = data.address?.state;
              let userCity = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb;
              
              if (userState && isMounted) {
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
              }
            } catch (err) {
              console.log('Reverse geocoding failed', err);
            }
          }, () => {
            console.log('Geolocation permission denied or failed');
          });
        }
      } catch (err) {
        console.error('Failed to init location', err);
      }
    };
    initLocation();
    return () => { isMounted = false; };
  }, []);`;

const newStateBlock = `  // Location state
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch initial location via geolocation
  useEffect(() => {
    let isMounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(\`https://nominatim.openstreetmap.org/reverse?lat=\${pos.coords.latitude}&lon=\${pos.coords.longitude}&format=json&addressdetails=1\`);
          const data = await res.json();
          const userState = data.address?.state;
          let userCity = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb;
          
          if (userState && isMounted) {
            setFormData(f => ({ ...f, state: userState, city: userCity || '' }));
            setLocationQuery(\`\${userCity ? userCity + ', ' : ''}\${userState}\`);
          }
        } catch (err) {
          console.log('Reverse geocoding failed', err);
        }
      }, () => {
        console.log('Geolocation permission denied or failed');
      });
    }
    return () => { isMounted = false; };
  }, []);

  // Auto-suggest handler
  const handleLocationChange = async (e) => {
    const val = e.target.value;
    setLocationQuery(val);
    setShowLocationSuggestions(true);
    if (val.length >= 3) {
      setIsSearchingLocation(true);
      const results = await searchLocations(val);
      setLocationSuggestions(results);
      setIsSearchingLocation(false);
    } else {
      setLocationSuggestions([]);
    }
  };

  const selectLocation = (loc) => {
    setLocationQuery(loc.display_name);
    setFormData(f => ({ ...f, city: loc.city || loc.suburb, state: loc.state }));
    setShowLocationSuggestions(false);
  };`;

content = content.replace(oldStateBlock, newStateBlock);

// 2. Replace UI inputs
const oldUIBlock = `            <div className="grid grid-cols-2 gap-4">
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

const newUIBlock = `            <div className="relative" ref={locationRef}>
              <label className={labelClass}>Location</label>
              <input 
                type="text" 
                value={locationQuery}
                onChange={handleLocationChange}
                onFocus={() => setShowLocationSuggestions(true)}
                placeholder="Search city, state, or address..."
                className={inputClass}
              />
              {isSearchingLocation && (
                <div className="absolute right-3 top-10 text-white/40"><Loader2 size={16} className="animate-spin" /></div>
              )}
              {showLocationSuggestions && locationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl overflow-hidden">
                  {locationSuggestions.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectLocation(loc)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                    >
                      <div className="text-sm font-bold text-white truncate">{loc.display_name.split(',')[0]}</div>
                      <div className="text-xs text-white/40 truncate">{loc.display_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>`;

content = content.replace(oldUIBlock, newUIBlock);

fs.writeFileSync(file, content);
console.log('StartScoringModal.jsx location updated');
