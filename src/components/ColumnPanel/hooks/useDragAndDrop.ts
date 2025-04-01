import { useState } from 'react';
import { resetGroupDropIndicators } from '../utils/columnUtils';

export function useDragAndDrop() {
  // State for drop indicator
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number>(-1);
  
  // State to track which panel is the current drop target
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  
  // State to track the currently dragged column
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  
  // State to track the currently dragged group
  const [draggedGroupPath, setDraggedGroupPath] = useState<string | null>(null);
  
  // State for the currently dragged column group in selected panel
  const [draggedColumnGroup, setDraggedColumnGroup] = useState<string | null>(null);
  
  // State for group drop target (for when dragging onto a group)
  const [groupDropTarget, setGroupDropTarget] = useState<string | null>(null);
  
  // State for selected panel group drop target
  const [selectedGroupDropTarget, setSelectedGroupDropTarget] = useState<string | null>(null);
  
  // State for group column drop indicators
  const [groupDropIndicatorIndices, setGroupDropIndicatorIndices] = useState<{[groupName: string]: number}>({});

  // Reset all drag state
  const resetDragState = () => {
    setDropTarget(null);
    setDropIndicatorIndex(-1);
    setDraggedColumnId(null);
    setDraggedGroupPath(null);
    setDraggedColumnGroup(null);
    setGroupDropTarget(null);
    setSelectedGroupDropTarget(null);
    setGroupDropIndicatorIndices(resetGroupDropIndicators());
  };
  
  return {
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
  };
}