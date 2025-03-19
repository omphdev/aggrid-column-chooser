import React from 'react';
import { useColumnContext } from '../../contexts/ColumnContext';
import TreeView from '../TreeView';

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
    getSelectedCount
  } = useColumnContext();
  
  // Get the available columns from state
  const { availableColumns } = state;
  
  // Get the selected count
  const selectedCount = getSelectedCount('available');
  
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
    />
  );
};

export default React.memo(AvailableColumns);