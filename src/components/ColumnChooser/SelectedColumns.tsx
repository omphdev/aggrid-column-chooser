import React from 'react';
import { useColumnContext } from '../../contexts/ColumnContext';
import TreeView from '../TreeView';
import { countLeafNodes } from '../../utils/columnUtils';
import './SelectedColumns.css';

interface SelectedColumnsProps {
  title?: string;
  flatView?: boolean;
  showGroupLabels?: boolean;
}

const SelectedColumns: React.FC<SelectedColumnsProps> = ({
  title = "Selected Columns",
  showGroupLabels = true
}) => {
  const {
    state,
    toggleExpandSelected,
    toggleSelectSelected,
    selectAllSelected,
    clearSelectionSelected,
    moveItemsToSelected,
    reorderSelectedItems,
    getSelectedCount,
    moveSelectedUp,
    moveSelectedDown,
    clearSelected,
    moveItemToAvailable
  } = useColumnContext();
  
  // Get columns from state
  const { selectedColumns } = state;
  
  // Get the selected count
  const selectedCount = getSelectedCount('selected');
  
  // Get leaf node count
  const leafNodeCount = countLeafNodes(selectedColumns);
  
  // Always use flat view for selected columns
  const useFlatView = true;
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: any) => {
    // Drag handling is done in TreeView component
    console.log(`Drag start in selected columns: ${item.id}`);
  };
  
  // Handle drop for reordering columns
  const handleDrop = (e: React.DragEvent) => {
    // Get the drag data from the event
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Get drop position from the enhanced event
      const positionedEvent = e as any;
      const dropPosition = positionedEvent.dropPosition || { insertBefore: true };
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Move items from available to selected
        console.log('Moving items from available to selected');
        moveItemsToSelected(data.ids, dropPosition);
      } else if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Reorder within the selected panel
        console.log('Reordering items within selected panel');
        console.log('Items to reorder:', data.ids);
        console.log('Drop position:', dropPosition);
        reorderSelectedItems(data.ids, dropPosition);
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  // Handle double-click on an item
  const handleDoubleClick = (item: any) => {
    moveItemToAvailable(item.id);
  };
  
  // Custom header with action buttons
  const renderCustomHeader = () => (
    <div className="selected-columns-header">
      <div className="header-title">
        <h3>{title}</h3>
        <div className="column-stats">
          <span className="column-count">{leafNodeCount} columns</span>
          {selectedCount > 0 && (
            <span className="selected-count">{selectedCount} selected</span>
          )}
        </div>
      </div>
      
      <div className="header-actions">
        <div className="selection-actions">
          <button className="action-button" onClick={selectAllSelected}>Select All</button>
          <button className="action-button" onClick={clearSelectionSelected}>Clear Selection</button>
        </div>
        
        <div className="column-actions">
          <button 
            className="action-button move-up-btn" 
            onClick={moveSelectedUp}
            disabled={selectedCount === 0}
            title="Move selected row(s) up"
          >
            <span>↑</span>
          </button>
          <button 
            className="action-button move-down-btn" 
            onClick={moveSelectedDown}
            disabled={selectedCount === 0}
            title="Move selected row(s) down"
          >
            <span>↓</span>
          </button>
          <button 
            className="action-button clear-btn" 
            onClick={clearSelected}
            disabled={selectedColumns.length === 0}
            title="Clear all selected columns"
          >
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="selected-columns-container">
      {renderCustomHeader()}
      
      <div className="selected-columns-content">
        <TreeView
          items={selectedColumns}
          title=""
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          toggleExpand={toggleExpandSelected}
          toggleSelect={toggleSelectSelected}
          onSelectAll={selectAllSelected}
          onClearSelection={clearSelectionSelected}
          selectedCount={selectedCount}
          flatView={useFlatView}
          showGroupLabels={showGroupLabels}
          source="selected"
          hideHeader={true}
          onDoubleClick={handleDoubleClick}
          enableReordering={true} // Enable reordering functionality
        />
      </div>
    </div>
  );
};

export default React.memo(SelectedColumns);