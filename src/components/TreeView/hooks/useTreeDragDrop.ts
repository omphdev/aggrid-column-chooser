import { useState, useCallback } from 'react';
import { findDropPosition, parseDragData } from '../../../utils/dragUtils/operations';
import { showInsertIndicator, hideAll } from '../../../utils/dragUtils/silhouette';

export const useTreeDragDrop = (onDrop: (e: React.DragEvent) => void) => {
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  
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
    
    // Check if this is a valid drop target
    const dragData = parseDragData(e);
    if (!dragData) return;
    
    console.log('Drag over item:', itemId);
    
    // Don't show indicator if dragging onto itself
    if (dragData.ids.length === 1 && dragData.ids[0] === itemId) return;
    
    // Calculate whether to insert before or after with a 1/3 - 2/3 split for better accuracy
    // This gives a larger target area at the top and bottom of each item
    const rect = element.getBoundingClientRect();
    const mouseRelativePos = (e.clientY - rect.top) / rect.height;
    const insertBefore = mouseRelativePos < 0.33; // Use top third for "insert before"
    
    // Show insertion indicator
    showInsertIndicator(element, insertBefore);
    
    // Update active drop target
    setActiveDropTarget(itemId);
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setTimeout(() => {
      if (!document.activeElement || !document.activeElement.classList.contains('tree-item')) {
        setActiveDropTarget(null);
      }
    }, 50);
  }, []);
  
  // Handle container drag over
  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    // Critical: Prevent default to enable drop
    e.preventDefault();
  }, []);
  
  // Handle drop with position information
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event triggered');
    
    // Get the drop position
    let dropPosition;
    
    if (activeDropTarget) {
      // Find the target element
      const targetElement = document.querySelector(`[data-item-id="${activeDropTarget}"]`) as HTMLElement;
      if (targetElement) {
        dropPosition = findDropPosition(e, targetElement);
      }
    }
    
    // Enhance the event with position information
    const enhancedEvent = e as any;
    if (dropPosition) {
      enhancedEvent.dropPosition = dropPosition;
      console.log('Drop position:', dropPosition);
    }
    
    // Reset state
    setActiveDropTarget(null);
    hideAll();
    
    // Call parent drop handler
    onDrop(enhancedEvent);
  }, [activeDropTarget, onDrop]);

  return {
    activeDropTarget,
    handleItemDragOver,
    handleDragLeave,
    handleContainerDragOver,
    handleDrop
  };
};