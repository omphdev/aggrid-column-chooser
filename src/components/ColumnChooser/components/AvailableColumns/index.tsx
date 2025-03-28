import React, { useState, useRef } from 'react';
import TreeNodeComponent from './TreeNode';
import SearchBar from './SearchBar';
import { useColumnChooser } from '../../context/ColumnChooserContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useSearch } from '../../hooks/useSearch';
import { countLeafNodes } from '../../utils/treeUtils';

const AvailableColumnsPanel: React.FC = () => {
  // State for expanded/collapsed groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Reference to the panel element
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Access state and dispatch from context
  const { state } = useColumnChooser();
  
  // Get drag and drop handlers
  const { handlePanelDragOver, handleDrop } = useDragAndDrop();
  
  // Get search functionality
  const { filteredAvailableColumns } = useSearch();
  
  // Handle drag over for the entire panel
  const handlePanelDragOver_ = (e: React.DragEvent) => {
    e.preventDefault();
    handlePanelDragOver(e, 'available');
  };
  
  // Handle drop for the entire panel
  const handlePanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    handleDrop(e, {
      id: 'available-panel',
      type: 'available'
    });
  };
  
  return (
    <div className="column-panel available-panel">
      <div className="panel-header">
        <h4>Available Columns</h4>
        <span className="column-count">{countLeafNodes(filteredAvailableColumns)}</span>
      </div>
      
      <SearchBar />
      
      <div 
        ref={panelRef}
        className="panel-content"
        onDragOver={handlePanelDragOver_}
        onDrop={handlePanelDrop}
      >
        {filteredAvailableColumns.length === 0 ? (
          <div className="empty-message">No columns available</div>
        ) : (
          filteredAvailableColumns.map(node => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              level={0}
              expandedGroups={expandedGroups}
              setExpandedGroups={setExpandedGroups}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default AvailableColumnsPanel;