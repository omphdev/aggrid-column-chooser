import React, { useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ColumnChooserProps } from '../../types';
import { ColumnChooserProvider, useColumnChooser } from './context/ColumnChooserContext';
import { DragProvider } from './context/DragContext';
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
  
  // Handle drop events
  const handleAvailableToPanelDrop = useCallback((items: string[], targetIndex?: number) => {
    console.log("Moving from available to selected:", items, "at index:", targetIndex);
    addToSelected(items, targetIndex);
  }, [addToSelected]);
  
  const handleSelectedToPanelDrop = useCallback((items: string[]) => {
    console.log("Moving from selected to available:", items);
    removeFromSelected(items);
  }, [removeFromSelected]);
  
  const handleReorderDrop = useCallback((itemId: string, items: string[], targetIndex: number) => {
    console.log("Reordering items:", items, "to index:", targetIndex);
    reorderSelected(itemId, targetIndex, items);
  }, [reorderSelected]);
  
  return (
    <div className="column-chooser">
      <div className="column-chooser-panels">
        <AvailableColumnsPanel 
          className="column-chooser-panel"
          onColumnsDrop={handleSelectedToPanelDrop}
        />
        <SelectedColumnsPanel 
          className="column-chooser-panel"
          onColumnsReceived={handleAvailableToPanelDrop}
          onColumnsReordered={handleReorderDrop}
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