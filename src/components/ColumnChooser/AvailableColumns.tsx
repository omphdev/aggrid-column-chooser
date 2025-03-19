import React from 'react';
import { useColumnContext } from '../../contexts/ColumnContext';
import TreeView from '../TreeView';
import { countLeafNodes } from '../../utils/columnUtils';

interface AvailableColumnsProps {
  title?: string;
}

const AvailableColumns: React.FC<AvailableColumnsProps> = ({
  title = "Available Columns"
}) => {
  const {
    state,
    toggleExpandAvailable,
    toggleSelectAvailable,
    selectAllAvailable,
    clearSelectionAvailable,
    moveItemsToAvailable,
    getSelectedCount,
    moveItemToSelected
  } = useColumnContext();
  
  // Get the available columns from state
  const { availableColumns } = state;
  
  // Get the selected count
  const selectedCount = getSelectedCount('available');
  
  // Get leaf node count
  const leafNodeCount = countLeafNodes(availableColumns);
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: any) => {
    // Drag handling is done in TreeView component
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    // Get the drag data from the event
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Only handle drops from the selected panel
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Get drop position from the enhanced event
        const positionedEvent = e as any;
        const dropPosition = positionedEvent.dropPosition || { insertBefore: true };
        
        // Move items to available
        moveItemsToAvailable(data.ids, dropPosition);
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  // Handle double-click on an item
  const handleDoubleClick = (item: any) => {
    moveItemToSelected(item.id);
  };
  
  return (
    <TreeView
      items={availableColumns}
      title={title}
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      toggleExpand={toggleExpandAvailable}
      toggleSelect={toggleSelectAvailable}
      onSelectAll={selectAllAvailable}
      onClearSelection={clearSelectionAvailable}
      selectedCount={selectedCount}
      flatView={false} // Available columns are always in tree view
      source="available"
      onDoubleClick={handleDoubleClick}
      countChildren={true}
    />
  );
};

export default React.memo(AvailableColumns);