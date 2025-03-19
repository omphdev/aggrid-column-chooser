import React from 'react';
import { ColumnItem } from '../../types';
import TreeView from '../TreeView';
import './SelectedColumns.css';

interface SelectedColumnsProps {
  columns: ColumnItem[];
  selectedIds: string[];
  leafCount: number;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedCount: () => number;
  moveItemsToAvailable: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  reorderItems: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  moveSelectedUp: () => void;
  moveSelectedDown: () => void;
  clearSelected: () => void;
  onDoubleClick: (id: string) => void;
  moveItemsToSelected?: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  title?: string;
  showGroupLabels?: boolean;
}

const SelectedColumns: React.FC<SelectedColumnsProps> = ({
  columns,
  selectedIds,
  leafCount,
  toggleSelect,
  selectAll,
  clearSelection,
  getSelectedCount,
  moveItemsToAvailable,
  reorderItems,
  moveSelectedUp,
  moveSelectedDown,
  clearSelected,
  onDoubleClick,
  moveItemsToSelected,
  title = "Selected Columns",
  showGroupLabels = true
}) => {
  // Always use flat view for selected columns
  const useFlatView = true;
  
  // Handle drag start - TreeView will handle the details
  const handleDragStart = (e: React.DragEvent, item: ColumnItem) => {
    console.log('Drag start in SelectedColumns for item:', item.id);
  };
  
  // Handle drop - process drops from both panels
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // Get the drag data
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) {
        console.error('No drag data found');
        return;
      }
      
      const data = JSON.parse(dataText);
      console.log('Drop in selected columns:', data);
      
      // Get drop position from the event
      const positionedEvent = e as any;
      const dropPosition = positionedEvent.dropPosition || { insertBefore: true };
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Items coming from available panel
        console.log('Moving items from available to selected:', data.ids);
        
        if (moveItemsToSelected) {
          moveItemsToSelected(data.ids, dropPosition);
        }
      } else if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Reordering within selected panel
        console.log('Reordering within selected panel:', data.ids);
        reorderItems(data.ids, dropPosition);
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  // Handle double-click on an item
  const handleDoubleClick = (item: ColumnItem) => {
    onDoubleClick(item.id);
  };
  
  // Custom header with action buttons
  const renderCustomHeader = () => (
    <div className="selected-columns-header">
      <div className="header-title">
        <h3>{title}</h3>
        <div className="column-stats">
          <span className="column-count">{leafCount} columns</span>
          {getSelectedCount() > 0 && (
            <span className="selected-count">{getSelectedCount()} selected</span>
          )}
        </div>
      </div>
      
      <div className="header-actions">
        <div className="selection-actions">
          <button className="action-button" onClick={selectAll}>Select All</button>
          <button className="action-button" onClick={clearSelection}>Clear Selection</button>
        </div>
        
        <div className="column-actions">
          <button 
            className="action-button move-up-btn" 
            onClick={moveSelectedUp}
            disabled={getSelectedCount() === 0}
            title="Move selected row(s) up"
          >
            <span>↑</span>
          </button>
          <button 
            className="action-button move-down-btn" 
            onClick={moveSelectedDown}
            disabled={getSelectedCount() === 0}
            title="Move selected row(s) down"
          >
            <span>↓</span>
          </button>
          <button 
            className="action-button clear-btn" 
            onClick={clearSelected}
            disabled={columns.length === 0}
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
          items={columns}
          selectedIds={selectedIds}
          title=""
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          toggleExpand={() => {}} // Not needed for flat view
          toggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          selectedCount={getSelectedCount()}
          totalCount={leafCount}
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