import React from 'react';
import { ColumnItem } from '../../types';
import TreeView from '../TreeView';

interface AvailableColumnsProps {
  columns: ColumnItem[];
  selectedIds: string[];
  leafCount: number;
  toggleExpand: (id: string) => void;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedCount: () => number;
  moveItemsToSelected: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  moveItemsToAvailable?: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  onDoubleClick: (id: string) => void;
  title?: string;
}

const AvailableColumns: React.FC<AvailableColumnsProps> = ({
  columns,
  selectedIds,
  leafCount,
  toggleExpand,
  toggleSelect,
  selectAll,
  clearSelection,
  getSelectedCount,
  moveItemsToSelected,
  moveItemsToAvailable,
  onDoubleClick,
  title = "Available Columns"
}) => {
  // Handle drag start - just pass through, TreeView will handle it
  const handleDragStart = (e: React.DragEvent, item: ColumnItem) => {
    // Handled by TreeView component
    console.log('Drag start in AvailableColumns for item:', item.id);
  };
  
  // Handle drop - process drops from the Selected panel
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
      console.log('Drop in available columns:', data);
      
      // Get drop position from the event
      const positionedEvent = e as any;
      const dropPosition = positionedEvent.dropPosition || { insertBefore: true };
      
      // Only handle drops from the selected panel
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        console.log('Moving items from selected to available:', data.ids);
        
        // Call the appropriate function 
        if (moveItemsToAvailable) {
          moveItemsToAvailable(data.ids, dropPosition);
        } else {
          // Use the other function if the direct one isn't available
          moveItemsToSelected(data.ids, dropPosition);
        }
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  // Handle double-click to move an item
  const handleDoubleClick = (item: ColumnItem) => {
    onDoubleClick(item.id);
  };
  
  return (
    <TreeView
      items={columns}
      selectedIds={selectedIds}
      title={title}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      toggleExpand={toggleExpand}
      toggleSelect={toggleSelect}
      onSelectAll={selectAll}
      onClearSelection={clearSelection}
      selectedCount={getSelectedCount()}
      totalCount={leafCount}
      flatView={false} // Available columns are always in tree view
      source="available"
      onDoubleClick={handleDoubleClick}
      countChildren={true}
    />
  );
};

export default React.memo(AvailableColumns);