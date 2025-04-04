// src/components/ColumnPanel/hooks/useDragDropForVirtualList.ts
import React, { useState, useRef, useCallback } from 'react';
import { TreeNode } from '../components/VirtualTree';

export interface UseDragDropForVirtualListProps {
  visibleNodes: TreeNode[];
  containerRef: React.RefObject<HTMLDivElement>;
  isSelectedPanel: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => void;
}

export interface DragDropState {
  dropTargetIndex: number;
  dropTargetGroupId: string | null;
  autoScrollSpeed: number;
  autoScrollDirection: 'up' | 'down' | 'none';
}

export const useDragDropForVirtualList = ({
  visibleNodes,
  containerRef,
  isSelectedPanel,
  onDragOver,
  onDrop
}: UseDragDropForVirtualListProps) => {
  // State for tracking drop indicators and auto-scrolling
  const [dragDropState, setDragDropState] = useState<DragDropState>({
    dropTargetIndex: -1,
    dropTargetGroupId: null,
    autoScrollSpeed: 0,
    autoScrollDirection: 'none',
  });
  
  // Auto-scroll animation frame ID (for cleanup)
  const autoScrollFrameRef = useRef<number | null>(null);
  
  // Element to get scroll position
  const getScrollContainer = useCallback(() => {
    if (containerRef.current) {
      // Find the virtualized list's scroll container (it has a specific class)
      return containerRef.current.querySelector('[style*="overflow: auto"]') as HTMLElement;
    }
    return null;
  }, [containerRef]);
  
  // Calculate the drop target index and group based on mouse position
  const calculateDropTarget = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const scrollContainer = getScrollContainer();
    
    if (!container || !scrollContainer) return { 
      index: -1, 
      groupId: null as string | null,
      autoScrollSpeed: 0,
      autoScrollDirection: 'none' as 'up' | 'down' | 'none'
    };
    
    const containerRect = container.getBoundingClientRect();
    const mouseY = e.clientY - containerRect.top;
    
    // Determine if we're hovering near the top or bottom edges for auto-scrolling
    const edgeThreshold = 30; // pixels from edge to trigger scrolling
    let autoScrollSpeed = 0;
    let autoScrollDirection: 'up' | 'down' | 'none' = 'none';
    
    if (mouseY < edgeThreshold) {
      // Near top edge, scroll up
      autoScrollSpeed = Math.max(1, Math.round((edgeThreshold - mouseY) / 5));
      autoScrollDirection = 'up';
    } else if (mouseY > containerRect.height - edgeThreshold) {
      // Near bottom edge, scroll down
      autoScrollSpeed = Math.max(1, Math.round((mouseY - (containerRect.height - edgeThreshold)) / 5));
      autoScrollDirection = 'down';
    }
    
    // Adjust the mouse position for scroll offset
    const adjustedMouseY = mouseY + scrollContainer.scrollTop;
    
    // Figure out which row we're hovering over (using row height of 32)
    const rowHeight = 32;
    const virtualRowIndex = Math.floor(adjustedMouseY / rowHeight);
    
    // Constrain to the available nodes
    const index = Math.min(Math.max(0, virtualRowIndex), visibleNodes.length);
    
    // Check if we're dropping onto a group
    let groupId: string | null = null;
    if (index < visibleNodes.length) {
      const node = visibleNodes[index];
      if (node.type === 'group') {
        groupId = node.id;
      }
    }
    
    return { 
      index, 
      groupId,
      autoScrollSpeed,
      autoScrollDirection
    };
  }, [containerRef, getScrollContainer, visibleNodes]);
  
  // Start auto-scrolling (if needed)
  const startAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current) {
      cancelAnimationFrame(autoScrollFrameRef.current);
    }
    
    if (dragDropState.autoScrollDirection === 'none' || dragDropState.autoScrollSpeed === 0) {
      return;
    }
    
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;
    
    const scroll = () => {
      if (dragDropState.autoScrollDirection === 'up') {
        scrollContainer.scrollTop -= dragDropState.autoScrollSpeed;
      } else if (dragDropState.autoScrollDirection === 'down') {
        scrollContainer.scrollTop += dragDropState.autoScrollSpeed;
      }
      
      // Continue scrolling if needed
      if (dragDropState.autoScrollDirection !== 'none') {
        autoScrollFrameRef.current = requestAnimationFrame(scroll);
      }
    };
    
    autoScrollFrameRef.current = requestAnimationFrame(scroll);
  }, [dragDropState, getScrollContainer]);
  
  // Stop auto-scrolling
  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrameRef.current) {
      cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
    
    setDragDropState(prev => ({
      ...prev,
      autoScrollSpeed: 0,
      autoScrollDirection: 'none'
    }));
  }, []);
  
  // Enhanced drag over handler
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Calculate the drop target
    const { index, groupId, autoScrollSpeed, autoScrollDirection } = calculateDropTarget(e);
    
    // Update the state
    setDragDropState(prev => {
      // Only update if something changed (prevents unnecessary re-renders)
      if (
        prev.dropTargetIndex !== index || 
        prev.dropTargetGroupId !== groupId ||
        prev.autoScrollSpeed !== autoScrollSpeed ||
        prev.autoScrollDirection !== autoScrollDirection
      ) {
        return {
          dropTargetIndex: index,
          dropTargetGroupId: groupId,
          autoScrollSpeed: autoScrollSpeed,
          autoScrollDirection: autoScrollDirection
        };
      }
      return prev;
    });
    
    // Start auto-scrolling if needed
    if (autoScrollSpeed && autoScrollSpeed > 0 && autoScrollDirection && autoScrollDirection !== 'none') {
      startAutoScroll();
    }
    
    // Call the original handler
    const panel = isSelectedPanel ? 'selected' : 'available';
    onDragOver(e, panel, groupId || undefined, groupId || undefined);
  }, [calculateDropTarget, isSelectedPanel, onDragOver, startAutoScroll]);
  
  // Enhanced drag leave handler
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // Only clear state if leaving the container (not just moving between children)
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setDragDropState({
        dropTargetIndex: -1,
        dropTargetGroupId: null,
        autoScrollSpeed: 0,
        autoScrollDirection: 'none'
      });
      
      stopAutoScroll();
    }
  }, [containerRef, stopAutoScroll]);
  
  // Enhanced drop handler
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Stop auto-scrolling
    stopAutoScroll();
    
    // Call the original handler
    const panel = isSelectedPanel ? 'selected' : 'available';
    onDrop(e, panel, dragDropState.dropTargetGroupId || undefined, dragDropState.dropTargetGroupId || undefined);
    
    // Reset state
    setDragDropState({
      dropTargetIndex: -1,
      dropTargetGroupId: null,
      autoScrollSpeed: 0,
      autoScrollDirection: 'none'
    });
  }, [isSelectedPanel, onDrop, dragDropState.dropTargetGroupId, stopAutoScroll]);
  
  // Clean up auto-scroll on unmount
  React.useEffect(() => {
    return () => {
      if (autoScrollFrameRef.current) {
        cancelAnimationFrame(autoScrollFrameRef.current);
      }
    };
  }, []);
  
  return {
    dragDropState,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};

export default useDragDropForVirtualList;