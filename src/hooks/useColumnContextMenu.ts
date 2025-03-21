import { useState, useCallback } from 'react';
import { ColumnItem } from '../types';

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface UseColumnContextMenuProps {
  onRenameGroup?: (groupId: string, newName: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  onMoveToGroup?: (columnIds: string[], groupId: string) => void;
  onCreateGroup?: (columnIds: string[], groupName: string) => void;
}

export const useColumnContextMenu = ({
  onRenameGroup,
  onDeleteGroup,
  onMoveToGroup,
  onCreateGroup,
}: UseColumnContextMenuProps) => {
  // Context menu state
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [targetItem, setTargetItem] = useState<ColumnItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<ColumnItem[]>([]);

  // Open context menu
  const openContextMenu = useCallback((event: React.MouseEvent, item: ColumnItem, selected: ColumnItem[] = []) => {
    event.preventDefault();
    event.stopPropagation();

    setPosition({ x: event.clientX, y: event.clientY });
    setTargetItem(item);
    setSelectedItems(selected);
    setIsOpen(true);
  }, []);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setIsOpen(false);
    setTargetItem(null);
    setSelectedItems([]);
  }, []);

  // Handle rename group
  const handleRenameGroup = useCallback((newName: string) => {
    if (targetItem && onRenameGroup) {
      onRenameGroup(targetItem.id, newName);
      closeContextMenu();
    }
  }, [targetItem, onRenameGroup, closeContextMenu]);

  // Handle delete group
  const handleDeleteGroup = useCallback(() => {
    if (targetItem && onDeleteGroup) {
      onDeleteGroup(targetItem.id);
      closeContextMenu();
    }
  }, [targetItem, onDeleteGroup, closeContextMenu]);

  // Handle move to group
  const handleMoveToGroup = useCallback((groupId: string) => {
    if (selectedItems.length > 0 && onMoveToGroup) {
      onMoveToGroup(selectedItems.map(item => item.id), groupId);
      closeContextMenu();
    }
  }, [selectedItems, onMoveToGroup, closeContextMenu]);

  // Handle create group
  const handleCreateGroup = useCallback((groupName: string) => {
    if (selectedItems.length > 0 && onCreateGroup) {
      onCreateGroup(selectedItems.map(item => item.id), groupName);
      closeContextMenu();
    }
  }, [selectedItems, onCreateGroup, closeContextMenu]);

  return {
    isOpen,
    position,
    targetItem,
    selectedItems,
    openContextMenu,
    closeContextMenu,
    handleRenameGroup,
    handleDeleteGroup,
    handleMoveToGroup,
    handleCreateGroup,
  };
}; 