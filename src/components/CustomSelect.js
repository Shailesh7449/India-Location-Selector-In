import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Loader2, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const CustomSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder, 
  disabled, 
  loading, 
  icon: Icon,
  className,
  onSearch, // Optional for remote searching
  emptyMessage, // Custom message when no results found
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync searchTerm with selected value name when not focused
  const selectedOption = useMemo(() => options.find(opt => String(opt.id) === String(value)), [options, value]);


  useEffect(() => {
    if (!isOpen && selectedOption) {
      setSearchTerm(selectedOption.name);
    } else if (!value) {
      setSearchTerm('');
    }
  }, [value, selectedOption, isOpen]);

  // Local filtering
  const filteredOptions = useMemo(() => {
    if (onSearch) return options; // If remote search is handled, don't filter locally
    return options.filter(opt => 
      opt.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, onSearch]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredOptions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (option) => {
    onChange(option.id);
    setSearchTerm(option.name);
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (!isOpen) setIsOpen(true);
    if (onSearch) onSearch(val);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={twMerge("space-y-2 relative", className)}>
      <label className="text-xs font-bold uppercase tracking-widest text-slate-400 ml-1">
        {label}
      </label>
      
      <div className="relative group">
        {/* Left Icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10 pointer-events-none">
          {Icon && <Icon size={18} />}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || `Search ${label}...`}
          className={clsx(
            "w-full pl-11 pr-20 py-3.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-sm font-medium",
            (disabled || loading) && "opacity-50 cursor-not-allowed bg-slate-100/50 dark:bg-slate-900/50"
          )}
        />

        {/* Action Icons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
          {searchTerm && !disabled && (
            <button 
              onClick={clearSelection}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
          
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <ChevronDown 
              size={18} 
              className={clsx("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} 
            />
          )}
        </div>

        {/* Dropdown List */}
        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              <div className="max-h-60 overflow-y-auto py-2 scrollbar-hide">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt, index) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={clsx(
                        "w-full flex items-center justify-between px-4 py-3 text-left transition-colors text-sm",
                        activeIndex === index ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-700 dark:text-slate-300",
                        String(value) === String(opt.id) && "font-bold bg-blue-50/50 dark:bg-blue-900/10"
                      )}
                    >
                      <span className="truncate">{opt.name}</span>
                      {String(value) === String(opt.id) && <Check size={14} className="text-blue-500" />}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center">
                    <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {emptyMessage || `No results for "${searchTerm}"`}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CustomSelect;

