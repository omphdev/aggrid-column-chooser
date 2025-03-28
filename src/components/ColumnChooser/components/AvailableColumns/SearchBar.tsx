import React from 'react';
import { useSearch } from '../../hooks/useSearch';

const SearchBar: React.FC = () => {
  const { selectedSearchQuery, handleSelectedSearchChange } = useSearch();
  
  return (
    <div className="panel-search">
      <input
        type="text"
        placeholder="Search selected columns..."
        value={selectedSearchQuery}
        onChange={handleSelectedSearchChange}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;