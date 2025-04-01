import React, { useState, useEffect, useRef } from 'react';
import { ExtendedColDef, OperationType } from '../types';
import { getAllColumnsInGroup } from '../ColumnPanel/utils/treeUtils';
import AvailablePanel from '../ColumnPanel/components/AvailablePanel';
import SelectedTreePanel from './components/SelectedTreePanel';

interface GroupPanel2Props {
  groupsCols: ExtendedColDef[];
  selectedGroups: string[];
  onGroupChanged?: (selectedGroups: ExtendedColDef[], operationType: OperationType) => void;
}

const GroupPanel2: React.FC<GroupPanel2Props> = ({
  groupsCols,
  selectedGroups,
  onGroupChanged
}) => {
  // State for available and selected groups
  const [availableGroups, setAvailableGroups] = useState<ExtendedColDef[]>([]);
  const [selectedGroupColumns, setSelectedGroupColumns] = useState<ExtendedColDef[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSelectedGroups, setExpandedSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // State for drag and drop
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  
  // Refs for panels
  const availablePanelRef = useRef<HTMLDivElement | null>(null);
  const selectedPanelRef = useRef<HTMLDivElement | null>(null);
  
  // Initialize available and selected columns
  useEffect(() => {
    // Filter groups that are not in selectedGroups for available panel
    const available = groupsCols.filter(col => !selectedGroups.includes(col.field));
    // Filter groups that are in selectedGroups for selected panel
    const selected = groupsCols.filter(col => selectedGroups.includes(col.field));
    
    setAvailableGroups(available);
    setSelectedGroupColumns(selected);
  }, [groupsCols, selectedGroups]);
  
  // Toggle group expansion in available panel
  const toggleGroup = (e: React.MouseEvent, groupPath: string) => {
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedGroups(newExpandedGroups);
  };
  
  // Toggle group expansion in selected panel
  const toggleSelectedGroup = (e: React.MouseEvent, groupPath: string) => {
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedSelectedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedSelectedGroups(newExpandedGroups);
  };
  
  // Handle selection of a column
  const handleSelect = (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    let newSelectedItems = [...selectedItems];
    
    if (isMultiSelect) {
      // Toggle selection for multi-select (Ctrl/Cmd+click)
      if (newSelectedItems.includes(columnId)) {
        newSelectedItems = newSelectedItems.filter(id => id !== columnId);
      } else {
        newSelectedItems.push(columnId);
      }
    } else if (isRangeSelect) {
      // Range selection (Shift+click)
      if (newSelectedItems.length > 0) {
        const lastSelectedId = newSelectedItems[newSelectedItems.length - 1];
        const allColumns = [...availableGroups, ...selectedGroupColumns];
        
        const lastSelectedIndex = allColumns.findIndex(col => col.field === lastSelectedId);
        const currentIndex = allColumns.findIndex(col => col.field === columnId);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, currentIndex);
          const endIndex = Math.max(lastSelectedIndex, currentIndex);
          
          const rangeIds = allColumns
            .slice(startIndex, endIndex + 1)
            .map(col => col.field);
            
          newSelectedItems = Array.from(new Set([...newSelectedItems, ...rangeIds]));
        }
      } else {
        newSelectedItems = [columnId];
      }
    } else {
      // Single selection (regular click)
      newSelectedItems = [columnId];
    }
    
    setSelectedItems(newSelectedItems);
  };
  
  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => {
    e.stopPropagation();
    setDraggedColumnId(column.field);
    setDraggedGroupPath(null);
    
    const isMultiSelection = selectedItems.includes(column.field) && selectedItems.length > 1;
    
    const dragData = {
      type: 'column',
      columnId: column.field,
      sourcePanel: isAvailable ? 'available' : 'selected',
      isMultiSelection,
      selectedItems: isMultiSelection ? selectedItems : [column.field]
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle group drag start
  const handleGroupDragStart = (e: React.DragEvent<HTMLDivElement>, groupPath: string) => {
    e.stopPropagation();
    
    setDraggedGroupPath(groupPath);
    setDraggedColumnId(null);
    
    const dragData = {
      type: 'group',
      groupPath: groupPath,
      sourcePanel: 'available'
    };
    
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Handle drop 
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => {
    e.preventDefault();
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (dragData.type === 'column') {
        const { columnId, sourcePanel, isMultiSelection, selectedItems: draggedItems } = dragData;
        
        if (sourcePanel === 'available' && panel === 'selected') {
          // Move from available to selected
          moveToSelected(draggedItems);
        } else if (sourcePanel === 'selected' && panel === 'available') {
          // Move from selected to available
          moveToAvailable(draggedItems);
        }
      } else if (dragData.type === 'group') {
        const { groupPath: draggedGroupPath } = dragData;
        
        if (panel === 'selected') {
          // Move entire group to selected
          moveGroupToSelected(draggedGroupPath);
        }
      }
    } catch (error) {
      console.error('Invalid drag data', error);
    }
    
    // Reset drag state
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    setDropTarget(null);
    clearSelection();
  };
  
  // Move selected items to the selected panel
  const moveToSelected = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    // Find columns in available that are selected
    const columnsToMove = availableGroups.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from available
    const newAvailableGroups = availableGroups.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Add columns to selected
    const newSelectedGroups = [...selectedGroupColumns, ...columnsToMove];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupColumns(newSelectedGroups);
    clearSelection();
    
    // Expand the groups in selected panel that were just added
    const newExpandedSelectedGroups = new Set(expandedSelectedGroups);
    columnsToMove.forEach(col => {
      if (col.groupPath && col.groupPath.length > 0) {
        // Add all parent paths to expanded set
        let path = '';
        for (const segment of col.groupPath) {
          path = path ? `${path}.${segment}` : segment;
          newExpandedSelectedGroups.add(path);
        }
      }
    });
    setExpandedSelectedGroups(newExpandedSelectedGroups);
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'ADD');
    }
  };
  
  // Move a group to the selected panel
  const moveGroupToSelected = (groupPath: string) => {
    // Get all columns in this group and subgroups
    const groupColumns = getAllColumnsInGroup(availableGroups, groupPath);
    
    // Extract column IDs
    const columnIds = groupColumns.map(col => col.field);
    
    if (columnIds.length === 0) return;
    
    // Use the standard moveToSelected function
    moveToSelected(columnIds);
    
    // Expand the group in selected panel
    const newExpandedSelectedGroups = new Set(expandedSelectedGroups);
    newExpandedSelectedGroups.add(groupPath);
    setExpandedSelectedGroups(newExpandedSelectedGroups);
  };
  
  // Move selected items to the available panel
  const moveToAvailable = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    // Find columns in selected that are selected
    const columnsToMove = selectedGroupColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from selected
    const newSelectedGroups = selectedGroupColumns.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Add columns to available
    const newAvailableGroups = [...availableGroups, ...columnsToMove];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupColumns(newSelectedGroups);
    clearSelection();
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged(newSelectedGroups, 'REMOVED');
    }
  };
  
  // Clear all selected items
  const clearAll = () => {
    if (selectedGroupColumns.length === 0) return;
    
    // Move all selected items to available
    const newAvailableGroups = [...availableGroups, ...selectedGroupColumns];
    
    // Update state
    setAvailableGroups(newAvailableGroups);
    setSelectedGroupColumns([]);
    clearSelection();
    
    // Notify parent
    if (onGroupChanged) {
      onGroupChanged([], 'REMOVED');
    }
  };

  // Return empty handlers for context menu and group operations
  const emptyContextMenuHandler = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // No-operation function for unimplemented features
  const noop = (...args: any[]): void => {
    // This function intentionally does nothing
    // Used as a placeholder for unimplemented features
  };

  const handleCreateGroup = noop;
  
  return (
    <div className="column-panel">
      <div className="panel-container">
        <AvailablePanel
          availableColumns={availableGroups}
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
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget('available');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDropTarget(null);
          }}
          onDrop={handleDrop}
          onContextMenu={emptyContextMenuHandler}
          onToggleGroup={toggleGroup}
        />

        <SelectedTreePanel
          selectedColumns={selectedGroupColumns}
          selectedItems={selectedItems}
          expandedGroups={expandedSelectedGroups}
          draggedColumnId={draggedColumnId}
          dropTarget={dropTarget}
          selectedPanelRef={selectedPanelRef}
          onSelect={handleSelect}
          onMoveToAvailable={moveToAvailable}
          onClearAll={clearAll}
          onDragStart={handleDragStart}
          onDragOver={(e) => {
            e.preventDefault();
            setDropTarget('selected');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDropTarget(null);
          }}
          onDrop={handleDrop}
          onToggleGroup={toggleSelectedGroup}
        />
      </div>
    </div>
  );
};

export default GroupPanel2;