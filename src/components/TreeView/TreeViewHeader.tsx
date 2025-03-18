// src/components/TreeView/TreeViewHeader.tsx
import React from "react";
import { TreeViewHeaderProps } from "../../types";

/**
 * Header component for tree view with selection controls
 */
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
      {/* Show selected count if any */}
      {selectedCount > 0 && (
        <span style={{ 
          marginRight: '10px', 
          fontSize: '12px',
          color: '#1890ff'
        }}>
          {selectedCount} selected
        </span>
      )}
      
      {/* Action buttons */}
      <button 
        onClick={onSelectAll}
        className="action-button"
        style={{ 
          marginRight: '5px',
          padding: '2px 8px',
          border: '1px solid #ddd',
          borderRadius: '3px',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.2s'
        }}
      >
        Select All
      </button>
      <button 
        onClick={onClearSelection}
        className="action-button"
        style={{ 
          padding: '2px 8px',
          border: '1px solid #ddd',
          borderRadius: '3px',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer',
          fontSize: '12px',
          transition: 'all 0.2s'
        }}
      >
        Clear
      </button>
    </div>
  </div>
);

export default TreeViewHeader;