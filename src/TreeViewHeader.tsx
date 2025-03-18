// components/TreeViewHeader.tsx
import React from "react";

export interface TreeViewHeaderProps {
  title: string;
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export const TreeViewHeader: React.FC<TreeViewHeaderProps> = ({
  title,
  selectedCount,
  onSelectAll,
  onClearSelection
}) => (
  <div style={{ 
    padding: '8px', 
    fontWeight: 'bold', 
    borderBottom: '1px solid #ccc',
    backgroundColor: '#f5f5f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <span>{title}</span>
    <div>
      {selectedCount > 0 && (
        <span style={{ 
          marginRight: '10px', 
          fontSize: '12px',
          color: '#1890ff'
        }}>
          {selectedCount} selected
        </span>
      )}
      <button 
        onClick={onSelectAll}
        className="action-button"
        style={{ marginRight: '5px' }}
      >
        Select All
      </button>
      <button 
        onClick={onClearSelection}
        className="action-button"
      >
        Clear
      </button>
    </div>
  </div>
);