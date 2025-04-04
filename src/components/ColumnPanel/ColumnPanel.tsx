// src/components/ColumnPanel/ColumnPanel.tsx
import React, { useRef, useEffect } from 'react';
import { ColumnPanelProps } from '../types';
import AvailablePanel from './components/AvailablePanel';
import SelectedPanel from './components/SelectedPanel';
import ContextMenu from './components/ContextMenu';

// Import custom hooks
import { useAvailableColumns } from './hooks/useAvailableColumns';
import { useSelectedColumns } from './hooks/useSelectedColumns';
import { useColumnSelection } from './hooks/useColumnSelection';
import { useColumnGroups } from './hooks/useColumnGroups';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useContextMenu } from './hooks/useContextMenu';

// Import handlers
import { createDragDropHandlers, createColumnOperationHandlers } from './columnPanelHandlers';

// Import React Window CSS
const REACT_WINDOW_STYLES = `
  /* Ensure tree view items have proper height */
  .ReactVirtualized__Grid__innerScrollContainer > div {
    height: 32px !important;
  }
  
  /* Custom styling for the scrollbars */
  .ReactVirtualized__Grid::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .ReactVirtualized__Grid::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  .ReactVirtualized__Grid::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
  }
  
  .ReactVirtualized__Grid::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

const ColumnPanel: React.FC<ColumnPanelProps> = ({
  columnDefs,
  columnGroups: initialColumnGroups,
  onColumnChanged,
  onColumnGroupChanged
}) => {
  // Refs for tracking reordering state and timestamps
  const isReorderingRef = useRef<boolean>(false);
  const lastReorderTimeRef = useRef<number>(0);
  
  // Refs for the panels
  const availablePanelRef = useRef<HTMLDivElement | null>(null);
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);

  // Initialize hooks
  const { 
    availableColumns, 
    setAvailableColumns, 
    addToGroup, 
    createNewGroup 
  } = useAvailableColumns({ 
    columnDefs, 
    isReorderingRef 
  });

  const { 
    selectedColumns, 
    setSelectedColumns, 
    reorderColumn, 
    reorderColumnInGroup, 
    reorderGroup, 
    moveUp, 
    moveDown,
    isDragOperationRef
  } = useSelectedColumns({ 
    columnDefs, 
    isReorderingRef, 
    lastReorderTimeRef, 
    onColumnChanged 
  });

  const { 
    selectedItems, 
    setSelectedItems, 
    handleSelect, 
    clearSelection 
  } = useColumnSelection({ 
    availableColumns, 
    selectedColumns 
  });

  const { 
    columnGroups, 
    setColumnGroups, 
    expandedGroups, 
    setExpandedGroups, 
    expandedSelectedGroups, 
    setExpandedSelectedGroups, 
    toggleGroup, 
    toggleSelectedGroup, 
    addToSelectedGroup, 
    removeFromSelectedGroup, 
    createSelectedColumnGroup 
  } = useColumnGroups({ 
    initialColumnGroups, 
    onColumnGroupChanged,
    columnDefs
  });

  const { 
    dropIndicatorIndex, 
    setDropIndicatorIndex, 
    dropTarget, 
    setDropTarget, 
    draggedColumnId, 
    setDraggedColumnId, 
    draggedGroupPath, 
    setDraggedGroupPath, 
    draggedColumnGroup, 
    setDraggedColumnGroup, 
    groupDropTarget, 
    setGroupDropTarget, 
    selectedGroupDropTarget, 
    setSelectedGroupDropTarget, 
    groupDropIndicatorIndices, 
    setGroupDropIndicatorIndices, 
    resetDragState 
  } = useDragAndDrop();

  const { 
    contextMenuPosition, 
    contextMenuTargetGroup, 
    closeContextMenu, 
    openContextMenu 
  } = useContextMenu();

  // Create handlers for drag and drop operations
  const {
    handleDragStart,
    handleGroupDragStart,
    handleSelectedGroupDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = createDragDropHandlers(
    availableColumns,
    setAvailableColumns,
    selectedColumns,
    setSelectedColumns,
    selectedItems,
    clearSelection,
    columnGroups,
    setColumnGroups,
    draggedColumnId,
    setDraggedColumnId,
    draggedGroupPath,
    setDraggedGroupPath,
    draggedColumnGroup,
    setDraggedColumnGroup,
    dropTarget,
    setDropTarget,
    setGroupDropTarget,
    setSelectedGroupDropTarget,
    setDropIndicatorIndex,
    setGroupDropIndicatorIndices,
    resetDragState,
    reorderColumn,
    reorderColumnInGroup,
    reorderGroup,
    addToSelectedGroup,
    removeFromSelectedGroup,
    onColumnChanged,
    onColumnGroupChanged,
    isReorderingRef,
    isDragOperationRef,
    availablePanelRef,
    selectedPanelRef
  );

  // Create handlers for column operations
  const {
    moveToSelected,
    moveGroupToSelected,
    moveToAvailable,
    clearAll,
    handleCreateGroup,
    handleCreateSelectedGroup,
    handleRemoveFromGroup,
    moveUp: handleMoveUp,  // Renamed to avoid direct passing
    moveDown: handleMoveDown  // Renamed to avoid direct passing
  } = createColumnOperationHandlers(
    availableColumns,
    setAvailableColumns,
    selectedColumns,
    setSelectedColumns,
    columnGroups,
    setColumnGroups,
    selectedItems,
    clearSelection,
    onColumnChanged,
    onColumnGroupChanged,
    addToGroup,
    createNewGroup,
    toggleGroup,
    addToSelectedGroup,
    removeFromSelectedGroup,
    createSelectedColumnGroup,
    moveUp,
    moveDown,
    expandedGroups,
    setExpandedGroups,
    isDragOperationRef
  );

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent, groupPath?: string, inSelectedPanel = false, groupName?: string) => {
    e.preventDefault();
    
    if (inSelectedPanel) {
      // Only show context menu in selected panel if items are selected
      if (selectedItems.length === 0 || !selectedColumns.some(col => selectedItems.includes(col.field))) return;
      
      // Position the context menu at the mouse coordinates
      openContextMenu({ x: e.clientX, y: e.clientY }, groupName);
    } else {
      // Only show context menu in available panel if items are selected
      if (selectedItems.length === 0 || !availableColumns.some(col => selectedItems.includes(col.field))) return;
      
      // Position the context menu at the mouse coordinates
      openContextMenu({ x: e.clientX, y: e.clientY }, groupPath);
    }
  };

  // Add React Window styles to the document
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = REACT_WINDOW_STYLES;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="column-panel">
      <div className="panel-container">
        <AvailablePanel
          availableColumns={availableColumns}
          selectedItems={selectedItems}
          expandedGroups={expandedGroups}
          draggedColumnId={draggedColumnId}
          draggedGroupPath={draggedGroupPath}
          groupDropTarget={groupDropTarget}
          dropTarget={dropTarget}
          availablePanelRef={availablePanelRef}
          onSelect={handleSelect}
          onMoveToSelected={moveToSelected}
          onCreateGroup={handleCreateGroup}
          onDragStart={handleDragStart}
          onGroupDragStart={handleGroupDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onContextMenu={handleContextMenu}
          onToggleGroup={toggleGroup}
        />

        <SelectedPanel
          selectedColumns={selectedColumns}
          selectedItems={selectedItems}
          columnGroups={columnGroups}
          expandedSelectedGroups={expandedSelectedGroups}
          draggedColumnId={draggedColumnId}
          draggedColumnGroup={draggedColumnGroup}
          selectedGroupDropTarget={selectedGroupDropTarget}
          dropTarget={dropTarget}
          dropIndicatorIndex={dropIndicatorIndex}
          groupDropIndicatorIndices={groupDropIndicatorIndices}
          selectedPanelRef={selectedPanelRef}
          onSelect={handleSelect}
          onMoveToAvailable={moveToAvailable}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onClearAll={clearAll}
          onCreateSelectedGroup={handleCreateSelectedGroup}
          onDragStart={handleDragStart}
          onSelectedGroupDragStart={handleSelectedGroupDragStart}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onContextMenu={handleContextMenu}
          onToggleSelectedGroup={toggleSelectedGroup}
        />
      </div>

      <ContextMenu
        position={contextMenuPosition}
        targetGroup={contextMenuTargetGroup}
        inSelectedPanel={!!contextMenuPosition && !!selectedItems.some(id => selectedColumns.some(col => col.field === id))}
        onCreateGroup={
          selectedItems.some(id => selectedColumns.some(col => col.field === id)) 
            ? () => handleCreateSelectedGroup(contextMenuTargetGroup || undefined) 
            : () => handleCreateGroup(contextMenuTargetGroup || undefined)
        }
        onRemoveFromGroup={
          contextMenuTargetGroup && selectedItems.some(id => selectedColumns.some(col => col.field === id)) 
            ? () => handleRemoveFromGroup(contextMenuTargetGroup) 
            : undefined
        }
        onClose={closeContextMenu}
      />
    </div>
  );
};

export default ColumnPanel;