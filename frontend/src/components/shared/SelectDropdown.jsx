import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

const SelectDropdown = ({ label, options = [], value, onChange, searchable, multi, error, placeholder = 'Select...', loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionValue)) {
        onChange(currentValues.filter(v => v !== optionValue));
      } else {
        onChange([...currentValues, optionValue]);
      }
    } else {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const removeValue = (e, optionValue) => {
    e.stopPropagation();
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];
      onChange(currentValues.filter(v => v !== optionValue));
    }
  };

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const renderValue = () => {
    if (loading) return <span className="text-cz-text-secondary">Loading...</span>;
    if (multi) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.length === 0) return <span className="text-cz-text-secondary">{placeholder}</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {currentValues.map(val => {
            const opt = options.find(o => o.value === val);
            return opt ? (
              <span key={val} className="bg-cz-nav-bg border border-cz-border text-xs px-2 py-1 rounded flex items-center">
                {opt.label}
                <button type="button" onClick={(e) => removeValue(e, val)} className="ml-1 text-cz-text-secondary hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ) : null;
          })}
        </div>
      );
    } else {
      const opt = options.find(o => o.value === value);
      return opt ? <span>{opt.label}</span> : <span className="text-cz-text-secondary">{placeholder}</span>;
    }
  };

  return (
    <div className="flex flex-col relative" ref={dropdownRef}>
      {label && (
        <label className="text-cz-text-secondary text-sm font-medium mb-1.5">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => !loading && setIsOpen(!isOpen)}
        className={`
          bg-cz-dark-bg text-white border rounded-lg px-4 py-2 flex items-center justify-between transition-all min-h-[42px]
          ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
          ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-cz-border'}
          ${isOpen && !error ? 'border-cz-accent-orange ring-2 ring-cz-accent-orange/50' : ''}
        `}
      >
        <div className="flex-1 overflow-hidden">
          {renderValue()}
        </div>
        <ChevronDown size={16} className={`text-cz-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-cz-card-bg border border-cz-border rounded-lg shadow-xl z-50 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-cz-border relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cz-text-secondary" size={14} />
              <input 
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-cz-dark-bg text-white border border-cz-border rounded pl-8 pr-2 py-1.5 text-sm focus:border-cz-accent-orange outline-none"
              />
            </div>
          )}
          
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-cz-text-secondary text-sm text-center">No options found</li>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = multi 
                  ? (Array.isArray(value) && value.includes(opt.value))
                  : value === opt.value;
                  
                return (
                  <li 
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      px-3 py-2 text-sm rounded cursor-pointer flex items-center justify-between
                      ${isSelected ? 'bg-cz-accent-orange/20 text-cz-accent-orange' : 'text-white hover:bg-cz-nav-bg'}
                    `}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={16} className="text-cz-accent-orange" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
      
      {error && (
        <span className="text-red-500 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export default SelectDropdown;
