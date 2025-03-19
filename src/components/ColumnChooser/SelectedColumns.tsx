import React from 'react';
import { useColumnContext } from '../../contexts/ColumnContext';
import TreeView from '../TreeView';

interface SelectedColumnsProps {
  title?: string;
  flatView?: boolean;
  showGroupLabels?: boolean;
}

const SelectedColumns: React.FC<SelectedColumnsProps> = ({
  title = "Selected Columns",
  flatView,
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
    getSelectedCount
  } = useColumnContext();
  
  // Get columns and view mode from state
  const { selectedColumns, isFlatView } = state;
  
  // Get the selected count
  const selectedCount = getSelectedCount('selected');
  
  // Use context's flat view if prop not provided
  const useFlatView = flatView !== undefined ? flatView : isFlatView;
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: any) => {
    // Drag handling is done in TreeView component
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    // Get the drag data from the event
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Get drop position from the enhanced event
      const positionedEvent = e as any;
      const dropPosition = positionedEvent.dropPosition || { insertBefore: true };
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Move items from available to selected
        moveItemsToSelected(data.ids, dropPosition);
      } else if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Reorder within the selected panel
        reorderSelectedItems(data.ids, dropPosition);
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  return (
    <TreeView
      items={selectedColumns}
      title={title}
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
    />
  );
};

export default React.memo(SelectedColumns);