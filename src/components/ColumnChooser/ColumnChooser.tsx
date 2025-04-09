import React, { useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ColumnChooserProps, DragItemTypes, DragItem } from '../../types';
import { ColumnChooserProvider, useColumnChooser } from './context/ColumnChooserContext';
import { DragProvider, useDrag } from './context/DragContext';
import AvailableColumnsPanel from './panels/AvailableColumnsPanel';
import SelectedColumnsPanel from './panels/SelectedColumnsPanel';
import './styles.css';

// The internal component that uses the contexts
const ColumnChooserInternal: React.FC = () => {
  // Access contexts
  const { 
    addToSelected, 
    removeFromSelected,
    reorderSelected
  } = useColumnChooser();
  
  const { 
    dragState, 
    endDrag 
  } = useDrag();
  
  // Function to handle drops between panels
  const handlePanelDrop = useCallback((dragItem: DragItem, dropResult: any) => {
    console.log("Panel Drop Handler:", dragItem, dropResult);
    
    if (!dropResult) return;
    
    // Handle column drops
    if (dragItem.type === DragItemTypes.COLUMN) {
      // From available to selected
      if (dragItem.sourcePanel === 'available' && dropResult.targetPanel === 'selected') {
        const itemsToMove = dragItem.multiple ? dragItem.items || [dragItem.id] : [dragItem.id];
        addToSelected(itemsToMove, dropResult.dropIndex);
      }
      // From selected to available
      else if (dragItem.sourcePanel === 'selected' && dropResult.targetPanel === 'available') {
        const itemsToMove = dragItem.multiple ? dragItem.items || [dragItem.id] : [dragItem.id];
        removeFromSelected(itemsToMove);
      }
      // Reorder within selected
      else if (dragItem.sourcePanel === 'selected' && dropResult.targetPanel === 'selected') {
        const itemsToMove = dragItem.multiple ? dragItem.items || [dragItem.id] : [dragItem.id];
        reorderSelected(dragItem.id, dropResult.dropIndex, itemsToMove);
      }
    }
    // Handle group drops
    else if (dragItem.type === DragItemTypes.GROUP) {
      // TODO: Implement group drag operations
      console.log("Group drop not yet implemented:", dragItem);
    }
    
    // Reset drag state
    endDrag();
  }, [addToSelected, removeFromSelected, reorderSelected, endDrag]);
  
  // Monitor drag state and handle drops
  useEffect(() => {
    const handleDocumentDrop = () => {
      // Reset drag state on any document drop
      if (dragState.isDragging) {
        console.log("Document drop detected, ending drag");
        endDrag();
      }
    };
    
    document.addEventListener('drop', handleDocumentDrop);
    document.addEventListener('dragend', handleDocumentDrop);
    
    return () => {
      document.removeEventListener('drop', handleDocumentDrop);
      document.removeEventListener('dragend', handleDocumentDrop);
    };
  }, [dragState.isDragging, endDrag]);
  
  return (
    <div className="column-chooser">
      <div className="column-chooser-panels">
        <AvailableColumnsPanel 
          className="column-chooser-panel"
          onDrop={handlePanelDrop}
        />
        <SelectedColumnsPanel 
          className="column-chooser-panel"
          onDrop={handlePanelDrop}
        />
      </div>
    </div>
  );
};

// The main component that provides contexts
const ColumnChooser: React.FC<ColumnChooserProps> = ({
  columnDefs,
  columnGroups,
  onColumnChanged,
  onColumnGroupChanged
}) => {
  // Add debugging for props
  console.log("ColumnChooser mounted with:", {
    columnCount: columnDefs.length,
    groupCount: columnGroups?.length || 0
  });
  
  return (
    <DndProvider backend={HTML5Backend}>
      <ColumnChooserProvider
        columnDefs={columnDefs}
        columnGroups={columnGroups}
        onColumnChanged={onColumnChanged}
        onColumnGroupChanged={onColumnGroupChanged}
      >
        <DragProvider>
          <ColumnChooserInternal />
        </DragProvider>
      </ColumnChooserProvider>
    </DndProvider>
  );
};

export default React.memo(ColumnChooser);