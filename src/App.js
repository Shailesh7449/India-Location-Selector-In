import React, { useEffect, useState, useCallback, useRef } from "react";
import { 
  Map, 
  MapPin, 
  Navigation, 
  Home, 
  RotateCcw, 
  Globe,
  AlertCircle,
  CheckCircle2,
  Layers,
  LayoutGrid,
  MapPinned,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import CustomSelect from "./components/CustomSelect";
import ThemeToggle from "./components/ThemeToggle";
import MapView from "./MapView";

const API_BASE = "http://localhost:3000";

function App() {
  // Data lists
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [subdistrictsList, setSubdistrictsList] = useState([]);
  const [villagesList, setVillagesList] = useState([]);

  // Current Selections (Internal)
  const [selections, setSelections] = useState({
    state: null,
    district: null,
    subdistrict: null,
    village: null
  });

  // Final Applied Selection (for Rendering)
  const [appliedData, setAppliedData] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const [mapZoom, setMapZoom] = useState(5);

  // Loading & Error States
  const [loading, setLoading] = useState({
    states: false,
    districts: false,
    subdistricts: false,
    villages: false,
    geocoding: false
  });
  const [error, setError] = useState(null);

  // Initial load
  useEffect(() => {
    fetchData("states", setStatesList, "states");
  }, []);

  const fetchData = async (endpoint, setter, loadingKey) => {
    setLoading(prev => ({ ...prev, [loadingKey]: true }));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${endpoint}`);
      if (!res.ok) throw new Error("Connection error");
      const data = await res.json();
      
      // Standardize data for CustomSelect (id/name)
      const formatted = data.map(item => ({
        id: item.village_id || item.subdistrict_id || item.district_id || item.state_id || item.id,
        name: item.village || item.subdistrict || item.district || item.state || item.name,
        ...item
      }));

      
      setter(formatted);
    } catch (err) {
      console.error(`Failed to load ${loadingKey}:`, err);
      setError(`Failed to load ${loadingKey}.`);
    } finally {
      setLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  const getCoordinates = async (query, fallbacks = []) => {
    const fetchCoords = async (q) => {
      try {
        console.log("Geocoding query:", q);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
        const data = await res.json();
        if (data?.[0]) {
          console.log("Geocoding success:", data[0]);
          return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
      } catch (err) {
        console.error("Geocoding error:", err);
      }
      return null;
    };

    let coords = await fetchCoords(query);
    if (!coords) {
      for (const fallback of fallbacks) {
        console.log("Trying fallback query:", fallback);
        coords = await fetchCoords(fallback);
        if (coords) break;
      }
    }
    return coords;
  };

  const handleVillageSearch = useCallback(async (query) => {
    const subId = selections.subdistrict?.subdistrict_id || selections.subdistrict?.id;
    console.log("Searching with Subdistrict ID:", subId); // Debugging 🔍
    
    if (!query || query.length < 2) {
      if (subId) {
        fetchData(`villages/${subId}`, setVillagesList, "villages");
      } else {
        setVillagesList([]);
      }
      return;
    }
    
    setLoading(prev => ({ ...prev, villages: true }));
    try {
      const url = subId 
        ? `${API_BASE}/search?q=${query}&subdistrict_id=${subId}`
        : `${API_BASE}/search?q=${query}`;
      
      const res = await fetch(url);
      const data = await res.json();
      console.log("Village API Response:", data); // Debugging 🔍
      
      const formattedData = data
        .filter(v => v.village && v.village !== v.state)
        .map(v => ({ 
          id: v.village_id || v.id, 
          name: v.village,
          subdistrict: v.subdistrict,
          district: v.district,
          state: v.state
        }));
        
      setVillagesList(formattedData);
    } catch (err) {
      console.error("Village search failed:", err);
    } finally {
      setLoading(prev => ({ ...prev, villages: false }));
    }
  }, [selections.subdistrict]);

  // Debounce handleVillageSearch
  const debouncedSearch = useRef(null);
  const onVillageSearch = (val) => {
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      handleVillageSearch(val);
    }, 400);
  };

  // Handlers
  const handleStateChange = (id) => {
    console.log("State Selected:", id);
    if (!id) {
      resetAll();
      return;
    }
    const numericId = Number(id);
    const item = statesList.find(s => s.id === numericId);
    setSelections({ state: item, district: null, subdistrict: null, village: null });
    setAppliedData(null);
    setMapLocation(null);
    setDistrictsList([]);
    setSubdistrictsList([]);
    setVillagesList([]);
    fetchData(`districts/${id}`, setDistrictsList, "districts");
  };

  const handleDistrictChange = (id) => {
    console.log("District Selected:", id);
    if (!id) {
      setSelections(prev => ({ ...prev, district: null, subdistrict: null, village: null }));
      setSubdistrictsList([]);
      setVillagesList([]);
      return;
    }
    const numericId = Number(id);
    const item = districtsList.find(d => d.id === numericId);
    setSelections(prev => ({ ...prev, district: item, subdistrict: null, village: null }));
    setAppliedData(null);
    setSubdistrictsList([]);
    setVillagesList([]);
    fetchData(`subdistricts/${id}`, setSubdistrictsList, "subdistricts");
  };

  const handleSubdistrictChange = (id) => {
    console.log("Subdistrict Selected:", id);
    if (!id) {
      setSelections(prev => ({ ...prev, subdistrict: null, village: null }));
      setVillagesList([]);
      return;
    }
    const numericId = Number(id);
    const item = subdistrictsList.find(sd => sd.id === numericId);
    setSelections(prev => ({ ...prev, subdistrict: item, village: null }));
    setAppliedData(null); // Reset applied state
    setVillagesList([]);
    
    // Fetch and format villages for this subdistrict
    setLoading(prev => ({ ...prev, villages: true }));
    fetch(`${API_BASE}/villages/${id}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.map(v => ({
          id: v.village_id || v.id,
          name: v.village,
          ...v
        }));
        console.log("Villages response for subdistrict:", formatted); // Debugging 🔍
        setVillagesList(formatted);
        setLoading(prev => ({ ...prev, villages: false }));
      })
      .catch(err => {
        console.error("Failed to load villages:", err);
        setLoading(prev => ({ ...prev, villages: false }));
      });
  };

  const handleVillageChange = (id) => {
    console.log("Selected Village ID:", id); // Debugging 🔍
    if (!id) {
      setSelections(prev => ({ ...prev, village: null }));
      return;
    }
    const numericId = Number(id);
    const item = villagesList.find(v => v.id === numericId);
    setSelections(prev => ({ ...prev, village: item }));
  };

  const handleApply = () => {
    if (!selections.state || !selections.district || !selections.subdistrict) return;
    
    // Update Applied Data (removes Pending Selection UI)
    setAppliedData({ ...selections });
  };

  const handleLocate = async () => {
    if (!selections.subdistrict) return;

    setLoading(prev => ({ ...prev, geocoding: true }));
    setError(null);

    const isVillage = !!selections.village;
    const vName = selections.village?.name || selections.village?.village || "";
    const sdName = selections.subdistrict?.subdistrict || selections.village?.subdistrict;
    const dName = selections.district?.district || selections.village?.district;
    const sName = selections.state?.state || selections.village?.state;

    // Use village if available, otherwise subdistrict
    const query = isVillage 
      ? `${vName}, ${sdName}, ${dName}, ${sName}, India`
      : `${sdName}, ${dName}, ${sName}, India`;
      
    const fallbacks = isVillage 
      ? [`${vName}, ${dName}, ${sName}, India`, `${vName}, ${sName}, India`]
      : [`${sdName}, ${sName}, India`, `${dName}, ${sName}, India`];

    const coords = await getCoordinates(query, fallbacks);
    
    if (coords) {
      setMapLocation(coords);
      setMapZoom(isVillage ? 15 : 12);
    } else {
      setError(`Could not pinpoint exact ${isVillage ? "village" : "subdistrict"} location. Showing general area.`);
      setMapZoom(isVillage ? 15 : 12);
    }
    setLoading(prev => ({ ...prev, geocoding: false }));
  };


  const resetAll = () => {
    setSelections({ state: null, district: null, subdistrict: null, village: null });
    setAppliedData(null);
    setMapLocation(null);
    setMapZoom(5);
    setDistrictsList([]);
    setSubdistrictsList([]);
    setVillagesList([]);
    setError(null);
  };

  const isApplyDisabled = !selections.state || !selections.district || !selections.subdistrict;

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 min-h-screen space-y-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-6xl relative overflow-hidden"
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl shadow-xl shadow-blue-500/20 ring-4 ring-white/10">
                <Globe className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Location Intelligence</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Enterprise Geo-Selector Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-5 py-3 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto whitespace-nowrap scrollbar-hide">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Path:</span>
              <span className={selections.state ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}>{selections.state?.state || "State"}</span>
              <span className="text-slate-300">/</span>
              <span className={selections.district ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}>{selections.district?.district || "District"}</span>
              <span className="text-slate-300">/</span>
              <span className={selections.village ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-400"}>{selections.village?.name || selections.village?.village || (selections.subdistrict ? "No Village Selected" : "Village")}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Form (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <CustomSelect 
                  label="State" 
                  icon={Map} 
                  options={statesList} 
                  value={selections.state?.id || ""} 
                  onChange={handleStateChange} 
                  loading={loading.states} 
                />
                
                <CustomSelect 
                  label="District" 
                  icon={Navigation} 
                  options={districtsList} 
                  value={selections.district?.id || ""} 
                  onChange={handleDistrictChange} 
                  loading={loading.districts} 
                  disabled={!selections.state} 
                />
                
                <CustomSelect 
                  label="Subdistrict" 
                  icon={MapPin} 
                  options={subdistrictsList} 
                  value={selections.subdistrict?.id || ""} 
                  onChange={handleSubdistrictChange} 
                  loading={loading.subdistricts} 
                  disabled={!selections.district} 
                />
                
                <CustomSelect 
                  label="Village" 
                  icon={Home} 
                  options={villagesList} 
                  value={selections.village?.id || selections.village?.village_id || ""} 
                  onChange={handleVillageChange} 
                  onSearch={onVillageSearch}
                  loading={loading.villages} 
                  disabled={!selections.subdistrict} 
                  placeholder={!selections.subdistrict ? "Select subdistrict first" : "Type to search village..."}
                  emptyMessage="No villages available — you can still apply selection"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button 
                  whileHover={{ scale: (isApplyDisabled || appliedData) ? 1 : 1.02, boxShadow: (isApplyDisabled || appliedData) ? "none" : "0 10px 25px -5px rgba(37, 99, 235, 0.4)" }}
                  whileTap={{ scale: (isApplyDisabled || appliedData) ? 1 : 0.98 }}
                  disabled={isApplyDisabled || appliedData}
                  onClick={handleApply}
                  className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 group ${
                    appliedData 
                      ? "bg-slate-500/50 cursor-default" 
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20 disabled:opacity-50"
                  }`}
                >
                  <CheckCircle2 size={20} className={appliedData ? "" : "group-hover:rotate-12 transition-transform"} />
                  {appliedData ? "Selection Applied" : "Apply Selection"}
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetAll}
                  className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-slate-700 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <RotateCcw size={22} />
                </motion.button>
              </div>
            </div>

            {/* Right Column: Map & Results (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              <div className="w-full h-[450px] relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl group">
                <MapView location={mapLocation} zoom={mapZoom} />
                
                {/* Visual State Indicators */}
                <AnimatePresence>
                  {(!appliedData || loading.geocoding || (appliedData && !mapLocation)) && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 z-10 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8 text-center"
                    >
                      {loading.geocoding ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                          <h3 className="text-xl font-bold">Locating...</h3>
                          <p className="text-slate-300 text-sm">Pinpointing exact coordinates</p>
                        </div>
                      ) : !appliedData ? (
                        <>
                          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 ring-8 ring-white/5 animate-pulse">
                            <MapPinned size={40} />
                          </div>
                          <h3 className="text-xl font-bold mb-2">Pending Selection</h3>
                          <p className="text-slate-300 max-w-xs text-sm">Complete the location form and click "Apply" to visualize the region.</p>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-blue-500/10">
                            <Navigation className="text-blue-400 w-10 h-10" />
                          </div>
                          <h3 className="text-xl font-bold mb-2">Ready to Locate</h3>
                          <p className="text-slate-300 max-w-xs text-sm">Data applied successfully. Click the "Locate" button below to visualize on map.</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons Below Map */}
              <div className="flex gap-4">
                <motion.button 
                  whileHover={{ scale: appliedData ? 1.02 : 1, boxShadow: appliedData ? "0 10px 25px -5px rgba(16, 185, 129, 0.4)" : "none" }}
                  whileTap={{ scale: appliedData ? 0.98 : 1 }}
                  disabled={!appliedData || loading.geocoding}
                  onClick={handleLocate}
                  className={`flex-1 py-4 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 group ${
                    !appliedData 
                      ? "bg-slate-400 cursor-not-allowed opacity-50" 
                      : loading.geocoding 
                        ? "bg-amber-500 cursor-wait" 
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/20"
                  }`}
                >
                  {loading.geocoding ? <Loader2 size={20} className="animate-spin" /> : <MapPinned size={20} className={appliedData ? "group-hover:bounce transition-transform" : ""} />}
                  {loading.geocoding ? "Locating..." : "Locate"}
                </motion.button>
              </div>

              {/* Dynamic Insights Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "State", value: selections.state?.state || "N/A", icon: Globe, color: "text-blue-500" },
                  { label: "Districts", value: districtsList.length || 0, icon: Layers, color: "text-indigo-500" },
                  { label: "Subdistricts", value: subdistrictsList.length || 0, icon: LayoutGrid, color: "text-purple-500" },
                  { label: "Villages", value: villagesList.length || 0, icon: MapPin, color: "text-pink-500" }
                ].map((stat, i) => (
                  <div key={i} className="p-4 bg-white/40 dark:bg-slate-800/40 rounded-2xl border border-white/20 shadow-sm">
                    <div className={`${stat.color} mb-1`}><stat.icon size={18} /></div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</div>
                    <div className="text-sm font-bold text-slate-800 dark:text-white truncate" title={stat.value}>{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Final Address Display */}
          <AnimatePresence>
            {appliedData && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-xl ring-2 ring-white/20 shadow-inner">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-2">Verified Selection Path</div>
                    <div className="text-xl md:text-2xl font-bold leading-tight">
                      {appliedData.village ? `${appliedData.village.village}, ` : ""} 
                      {appliedData.subdistrict.subdistrict}, <br className="hidden md:block" />
                      {appliedData.district.district}, {appliedData.state.state}, India
                    </div>
                    {!appliedData.village && (
                      <div className="text-[10px] text-blue-200 mt-2 font-medium bg-blue-500/20 w-fit px-2 py-0.5 rounded-full border border-blue-400/30">
                        Showing subdistrict-level location
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/10 px-6 py-4 rounded-3xl backdrop-blur-md border border-white/10">
                  <div className="text-right">
                    <div className="text-2xl font-black tracking-tighter">SUCCESS</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Location Synchronized</div>
                  </div>
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 gap-3 font-medium">
              <AlertCircle size={20} />
              {error}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default App;