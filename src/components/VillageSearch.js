import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, MapPin } from 'lucide-react';

const VillageSearch = ({ onSelect, subdistrictId }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchVillages = useCallback(async () => {
    if (!subdistrictId) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/search?q=${query}&subdistrict_id=${subdistrictId}`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [query, subdistrictId]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.length >= 2 && subdistrictId) {
        searchVillages();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, subdistrictId, searchVillages]);


  return (
    <div ref={wrapperRef} className="relative space-y-2 animate-fade-in">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400 ml-1">
        Quick Village Search
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Search size={18} />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!subdistrictId}
          placeholder={subdistrictId ? "Type village name..." : "Select subdistrict first"}
          className="w-full pl-11 pr-10 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map((v) => (
            <button
              key={v.village_id}
              onClick={() => {
                onSelect(v);
                setIsOpen(false);
                setQuery(v.village);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-left transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <MapPin size={16} />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-100">{v.village}</div>
                <div className="text-xs text-slate-500">{v.subdistrict}, {v.district}, {v.state}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VillageSearch;
