import { useState, useCallback } from 'react';
import { ExtendedColDef } from '../components/types';

interface UseContextMenuProps {
  selectedItems: string[];
  availableColumns: ExtendedColDef[];
  selectedColumns: ExtendedColDef[];
  onColumnGroupChanged: (groups: any[], operation: string) => void;
  setAvailableColumns: (columns: ExtendedColDef[]) => void;
  setSelectedColumns: (columns: ExtendedColDef[]) => void;
  addToGroup: (groupId: string, columnIds: string[]) => void;
  removeFromGroup: (groupId: string, columnIds: string[]) => void;
}

export const useContextMenu = ({
  selectedItems,
  availableColumns,
  selectedColumns,
  onColumnGroupChanged,
  setAvailableColumns,
  setSelectedColumns,
  addToGroup,
  removeFromGroup
}: UseContextMenuProps) => {
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [targetGroup, setTargetGroup] = useState<string | null>(null);

  // Function to handle right-click event
  const handleContextMenu = useCallback((event: React.MouseEvent, groupId?: string) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setTargetGroup(groupId || null);
  }, []);

  // Function to close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenuPosition(null);
    setTargetGroup(null);
  }, []);

  // Function to create new group from context menu in available panel
  const handleCreateGroup = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    const newGroup = {
      id: `group-${Date.now()}`,
      name: 'New Group',
      columns: availableColumns.filter(col => selectedItems.includes(col.field))
    };
    
    const remainingColumns = availableColumns.filter(col => !selectedItems.includes(col.field));
    setAvailableColumns(remainingColumns);
    
    onColumnGroupChanged([newGroup], 'ADD');
    closeContextMenu();
  }, [availableColumns, selectedItems, onColumnGroupChanged, closeContextMenu]);

  // Function to create new group from context menu in selected panel
  const handleCreateSelectedGroup = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    const newGroup = {
      id: `selected-group-${Date.now()}`,
      name: 'New Selected Group',
      columns: selectedColumns.filter(col => selectedItems.includes(col.field))
    };
    
    const remainingColumns = selectedColumns.filter(col => !selectedItems.includes(col.field));
    setSelectedColumns(remainingColumns);
    
    onColumnGroupChanged([newGroup], 'ADD');
    closeContextMenu();
  }, [selectedColumns, selectedItems, onColumnGroupChanged, closeContextMenu]);

  // Function to remove items from a group
  const handleRemoveFromGroup = useCallback(() => {
    if (!targetGroup || selectedItems.length === 0) return;
    
    removeFromGroup(targetGroup, selectedItems);
    closeContextMenu();
  }, [targetGroup, selectedItems, removeFromGroup, closeContextMenu]);

  return {
    contextMenuPosition,
    targetGroup,
    handleContextMenu,
    closeContextMenu,
    handleCreateGroup,
    handleCreateSelectedGroup,
    handleRemoveFromGroup
  };
}; 