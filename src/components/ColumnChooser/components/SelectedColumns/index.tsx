// src/components/ColumnChooser/components/SelectedColumns/index.tsx
import React, { useState, useRef } from 'react';
import SearchBar from './SearchBar';
import GroupItem from './GroupItem';
import UngroupedColumns from './UngroupedColumns';
import ContextMenu from './ContextMenu';
import GroupDialog from './GroupDialog';
import { useColumnChooser } from '../../context/ColumnChooserContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useSearch } from '../../hooks/useSearch';
import { useGroupManagement } from '../../hooks/useGroupManagement';

const SelectedColumnsPanel: React.FC = () => {
  // State for tracking drag and drop operations
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [isDraggingOverGroup, setIsDraggingOverGroup] = useState(false);
  
  // Reference to the panel element
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Access state from context
  const { state } = useColumnChooser();
  
  // Get drag and drop handlers
  const { dropPosition, handlePanelDragOver, handleDrop } = useDragAndDrop();
  
  // Get search functionality
  const { filteredSelectedColumns, filteredGroups } = useSearch();
  
  // Get group management functionality
  const { 
    closeContextMenu, 
    showCreateGroupDialog, 
    showRenameGroupDialog 
  } = useGroupManagement();
  
  // Get columns that belong to a group
  const getGroupColumns = (groupId: string) => {
    const group = state.selectedGroups.find(g => g.id === groupId);
    if (!group) return [];
    
    return state.selectedColumns.filter(col => group.children.includes(col.id));
  };
  
  // Get columns that don't belong to any group
  const getUngroupedColumns = () => {
    const groupedColumnIds = state.selectedGroups.flatMap(g => g.children);
    return filteredSelectedColumns.filter(col => !groupedColumnIds.includes(col.id));
  };
  
  // Handle drag over for the entire panel
  const handlePanelDragOver_ = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Reset group-related drag state
    setIsDraggingOverGroup(false);
    setDragOverGroupId(null);
    
    handlePanelDragOver(e, 'selected');
  };
  
  // Handle drop on the entire panel
  const handlePanelDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    handleDrop(e, {
      id: 'empty-selected-panel',
      type: 'selected',
      index: dropPosition ?? undefined
    });
  };
  
  // Get ungrouped columns
  const ungroupedColumns = getUngroupedColumns();
  
  return (
    <div className="column-panel selected-panel">
      <div className="panel-header">
        <h4>Selected Columns</h4>
        <span className="column-count">{state.selectedColumns.length}</span>
      </div>
      
      <SearchBar />
      
      <div 
        ref={panelRef}
        className="panel-content"
        onClick={closeContextMenu}
        onDragOver={handlePanelDragOver_}
        onDrop={handlePanelDrop}
      >
        {state.selectedColumns.length === 0 ? (
          <div className="empty-message">No columns selected</div>
        ) : (
          <>
            {/* Render groups */}
            {filteredGroups.map(group => (
              <GroupItem
                key={group.id}
                group={group}
                columns={getGroupColumns(group.id)}
                isDraggingOverGroup={isDraggingOverGroup}
                dragOverGroupId={dragOverGroupId}
                dropPosition={dropPosition}
              />
            ))}
            
            {/* Render ungrouped columns */}
            <UngroupedColumns 
              columns={ungroupedColumns}
              isDraggingOverGroup={isDraggingOverGroup}
              dropPosition={dropPosition}
            />
          </>
        )}
        
        {/* Context Menu */}
        <ContextMenu />
        
        {/* Dialogs */}
        {showCreateGroupDialog && (
          <GroupDialog isCreateDialog={true} />
        )}
        
        {showRenameGroupDialog && (
          <GroupDialog isCreateDialog={false} />
        )}
      </div>
    </div>
  );
};

export default SelectedColumnsPanel;