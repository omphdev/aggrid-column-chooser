import { useState, useCallback, useEffect } from 'react';
import { hideAll } from '../../../utils/dragUtils/silhouette';

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
    
    // Prevent default to enable drop
    e.preventDefault();
    e.stopPropagation();
    
    // Get the target group ID if present
    const targetGroupId = element.getAttribute('data-group-id') || null;
    
    // Try getting the drag data (for Firefox compatibility)
    let dragData;
    try {
      const dataText = e.dataTransfer.getData('text/plain');
      if (dataText) {
        dragData = JSON.parse(dataText);
        
        // Don't show indicator if dragging onto itself
        if (dragData.ids.length === 1 && dragData.ids[0] === itemId) {
          clearDropIndicators();
          setActiveDropTarget(null);
          return;
        }
      }
    } catch (err) {
      // Continue even if we can't get data during dragover
    }
    
    // Clear previous indicators
    clearDropIndicators();
    
    // Calculate mouse position within the element
    const rect = element.getBoundingClientRect();
    const mouseRelativePos = (e.clientY - rect.top) / rect.height;
    
    // For groups, adjust the threshold to make it easier to drop above
    const isGroup = element.classList.contains('has-children');
    const threshold = isGroup ? 0.3 : 0.5; // Use 30% threshold for groups
    const newInsertBefore = mouseRelativePos < threshold;
    
    // Set visual indicators
    if (newInsertBefore) {
      element.classList.add('drag-over-top');
    } else {
      element.classList.add('drag-over-bottom');
    }
    
    // Update state
    setActiveDropTarget(itemId);
    setInsertBefore(newInsertBefore);
    
    console.log(`Drag over: target=${itemId}, insertBefore=${newInsertBefore}, targetGroupId=${targetGroupId}, isGroup=${isGroup}`);
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
    // Prevent default to enable drop
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
  
  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Drop event triggered');
    
    // Create enhanced event with drop position
    const enhancedEvent = e as any;
    let dragData;
    
    // Try to get the drag data
    try {
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) {
        console.error('No drag data available');
        clearDropIndicators();
        return;
      }
      
      dragData = JSON.parse(dataText);
      console.log('Drag data on drop:', dragData);
    } catch (err) {
      console.error('Invalid drag data:', err);
      clearDropIndicators();
      return;
    }
    
    // Get the target group ID if available
    const targetElement = e.target as HTMLElement;
    const targetGroupId = targetElement.closest('[data-group-id]')?.getAttribute('data-group-id') || null;
    
    // Set the drop position
    if (activeDropTarget) {
      // If we have an active target, use it with our insert position
      enhancedEvent.dropPosition = {
        targetId: activeDropTarget,
        insertBefore: insertBefore,
        targetGroupId: targetGroupId // Add group context to the drop
      };
      console.log('Drop position with group context:', enhancedEvent.dropPosition);
    } else {
      // If dropping in an empty area, default to appending at the end
      enhancedEvent.dropPosition = { 
        targetId: undefined,
        insertBefore: false,
        targetGroupId: targetGroupId // Still include group context even for empty areas
      };
      console.log('Dropping at the end (no target) with group:', targetGroupId);
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