import { useState } from 'react';

export function useContextMenu() {
  // State for context menu
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [contextMenuTargetGroup, setContextMenuTargetGroup] = useState<string | null>(null);
  
  // Close context menu
  const closeContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuTargetGroup(null);
  };
  
  // Open context menu at position
  const openContextMenu = (position: {x: number, y: number}, targetGroup: string | null = null) => {
    setContextMenuPosition(position);
    setContextMenuTargetGroup(targetGroup);
  };
  
  return {
    contextMenuPosition,
    contextMenuTargetGroup,
    closeContextMenu,
    openContextMenu,
    setContextMenuPosition,
    setContextMenuTargetGroup
  };
}