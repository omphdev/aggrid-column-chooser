import React, { useCallback, useState, useEffect, useRef } from 'react';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  debounceTime?: number;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  debounceTime = 300
}) => {
  // Input state
  const [inputValue, setInputValue] = useState(value);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  // Input change handler with debounce
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceTime);
  }, [onChange, debounceTime]);
  
  // Clear search handler
  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
  }, [onChange]);
  
  return (
    <div className={`search-box ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="search-input"
      />
      {inputValue && (
        <button 
          className="search-clear"
          onClick={handleClear}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default React.memo(SearchBox);