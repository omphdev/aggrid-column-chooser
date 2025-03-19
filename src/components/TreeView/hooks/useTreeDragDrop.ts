import { useState, useCallback, useEffect } from 'react';
import { parseDragData } from '../../../utils/dragUtils/operations';
import { showInsertIndicator, hideAll } from '../../../utils/dragUtils/silhouette';

export const useTreeDragDrop = (onDrop: (e: React.DragEvent) => void) => {
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  const [insertBefore, setInsertBefore] = useState<boolean>(true);
  
  // Clear all drop indicators
  const clearDropIndicators = useCallback(() => {
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    document.querySelectorAll('.empty-message.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
    hideAll();
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearDropIndicators();
    };
  }, [clearDropIndicators]);
  
  // Handle drag over for items
  const handleItemDragOver = useCallback((
    e: React.DragEvent, 
    element: HTMLElement | null, 
    itemId: string
  ) => {
    if (!element) return;
    
    // Critical: Prevent default to enable drop
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we should allow the drop
    const dragData = parseDragData(e);
    if (!dragData) return;
    
    // Don't show indicator if dragging onto itself
    if (dragData.ids.length === 1 && dragData.ids[0] === itemId) {
      clearDropIndicators();
      return;
    }
    
    // Clear previous indicators
    clearDropIndicators();
    
    // Calculate mouse position within the element
    const rect = element.getBoundingClientRect();
    const mouseRelativePos = (e.clientY - rect.top) / rect.height;
    const newInsertBefore = mouseRelativePos < 0.5; 
    
    // Set visual indicators
    if (newInsertBefore) {
      element.classList.add('drag-over-top');
    } else {
      element.classList.add('drag-over-bottom');
    }
    
    // Update state
    setActiveDropTarget(itemId);
    setInsertBefore(newInsertBefore);
    
    console.log(`Drag over: target=${itemId}, insertBefore=${newInsertBefore}`);
  }, [clearDropIndicators]);
  
  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    // Use a small timeout to avoid flickering when moving between items
    setTimeout(() => {
      // Check if we're still over a valid drag target
      const dragTargets = document.querySelectorAll('.tree-item:hover, .flat-item:hover');
      if (dragTargets.length === 0) {
        clearDropIndicators();
        setActiveDropTarget(null);
      }
    }, 50);
  }, [clearDropIndicators]);
  
  // Handle container drag over (empty areas)
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    // Critical: Prevent default to enable drop
    e.preventDefault();
    e.stopPropagation();
    
    const target = e.currentTarget as HTMLElement;
    const emptyMessage = target.querySelector('.empty-message');
    
    // If there's an empty message and we're hovering over it
    if (emptyMessage && emptyMessage.matches(':hover')) {
      // Clear all other indicators
      clearDropIndicators();
      
      // Add drag-over class to empty message
      emptyMessage.classList.add('drag-over');
      
      // Reset active target since we're dropping on an empty area
      setActiveDropTarget(null);
    }
  }, [clearDropIndicators]);
  
  // Handle drop with position information
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event triggered');
    
    // Create enhanced event with drop position
    const enhancedEvent = e as any;
    
    if (activeDropTarget) {
      // If we have an active target, use it with our insert position
      enhancedEvent.dropPosition = {
        targetId: activeDropTarget,
        insertBefore: insertBefore
      };
      console.log('Drop position:', enhancedEvent.dropPosition);
    } else {
      // If dropping in an empty area, default to appending at the end
      enhancedEvent.dropPosition = { 
        targetId: undefined,
        insertBefore: false 
      };
      console.log('Dropping at the end (no target)');
    }
    
    // Reset state and clean up
    setActiveDropTarget(null);
    clearDropIndicators();
    
    // Call parent drop handler
    onDrop(enhancedEvent);
  }, [activeDropTarget, insertBefore, onDrop, clearDropIndicators]);

  return {
    activeDropTarget,
    handleItemDragOver,
    handleDragLeave,
    handleContainerDragOver,
    handleDrop
  };
};