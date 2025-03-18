// TreeViews.tsx - Refactored into smaller components
import React, { useState, useRef, useEffect } from "react";
import { ColumnItem, TreeItemProps, TreeViewProps } from "./types";
import { flattenTree } from "./utils/columnConverter";
import { DragStateManager } from "./utils/dragStateManager";
import { TreeItem } from "./TreeItem";
import { FlatItem } from "./FlatItem";
import { DropIndicator } from "./DropIndicator";
import { TreeViewHeader } from "./TreeViewHeader";

/**
 * Render flat list of items
 */
const renderFlatItems = (
  items: ColumnItem[], 
  onDragStart: (e: React.DragEvent, item: ColumnItem) => void,
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void,
  onDragOver?: (e: React.DragEvent, element: HTMLElement | null, itemId: string) => void,
  onDragLeave?: () => void,
  showGroupLabels = false
) => {
  // Flatten the tree structure while tracking group info for each leaf node
  interface EnhancedFlatItem extends ColumnItem {
    groupName?: string;
    flatIndex?: number;
  }
  
  const flatItems: EnhancedFlatItem[] = [];
  let flatIndex = 0;
  
  const processItem = (item: ColumnItem, groupName?: string) => {
    if (item.field && (!item.children || item.children.length === 0)) {
      // This is a leaf node, add it with its group info and index
      flatItems.push({ 
        ...item, 
        groupName,
        flatIndex: flatIndex++ 
      });
    }
    
    if (item.children && item.children.length > 0) {
      // For all children, pass the current item's name as their group
      const newGroupName = item.name;
      item.children.forEach(child => processItem(child, newGroupName));
    }
  };
  
  // Process all items
  items.forEach(item => processItem(item));
  
  return flatItems.map((item, idx) => (
    <FlatItem
      key={item.id}
      item={item}
      index={idx}
      flatIndex={item.flatIndex}
      onDragStart={onDragStart}
      toggleSelect={toggleSelect}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      groupName={item.groupName}
      showGroupLabels={showGroupLabels}
    />
  ));
};

/**
 * Main TreeView component
 */
export const TreeView: React.FC<TreeViewProps> = ({ 
  items, 
  onDragStart, 
  onDrop, 
  onDragOver, 
  title, 
  toggleExpand, 
  toggleSelect,
  onSelectAll,
  onClearSelection,
  selectedCount,
  flatView = false,
  showGroupLabels = false,
  onItemReorder,
}) => {
  const treeRef = useRef<HTMLDivElement>(null);
  const componentId = useRef(`tree-view-${Math.random().toString(36).substring(2, 9)}`).current;
  
  const [dropIndicator, setDropIndicator] = useState<{
    visible: boolean;
    top: number;
    itemId?: string;
    insertBefore: boolean;
    itemName?: string;
  }>({
    visible: false,
    top: 0,
    insertBefore: true,
    itemName: undefined
  });

  // Cleanup function for drop indicators
  const cleanupDropIndicators = () => {
    if (DragStateManager.isActive(componentId)) {
      DragStateManager.setActiveDropTarget(null);
    }
    
    setDropIndicator({
      visible: false,
      top: 0,
      insertBefore: true
    });
  };

  // Check if we should be allowed to show drop indicators
  const canShowDropIndicator = () => {
    return DragStateManager.getActiveDropTarget() === null || 
           DragStateManager.isActive(componentId);
  };

  // Handle showing drop indicators
  const handleItemDragOver = (e: React.DragEvent, element: HTMLElement | null, itemId: string) => {
    if (!element) return;
    
    // Set this component as the active drop target
    DragStateManager.setActiveDropTarget(componentId);
    
    // Extract the source panel from dataTransfer
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string,
        itemName?: string
      };
      
      // If we're dragging within the same panel and not a reorder operation, don't show indicators
      if ((title === "Available Columns" && data.source === "available") ||
          (title === "Selected Columns" && data.source === "selected")) {
        // Only show indicator if we support reordering or if this is from a different panel
        if (!onItemReorder) {
          cleanupDropIndicators();
          return;
        }
      }
      
      // Calculate if we should insert before or after based on mouse position
      const rect = element.getBoundingClientRect();
      const mouseY = e.clientY;
      const threshold = rect.top + (rect.height / 2);
      const insertBefore = mouseY < threshold;
      
      // Calculate position for the drop indicator
      const offsetTop = insertBefore ? rect.top : rect.bottom;
      const containerRect = treeRef.current?.getBoundingClientRect();
      const top = containerRect ? offsetTop - containerRect.top : offsetTop;

      setDropIndicator({
        visible: true,
        top,
        itemId,
        insertBefore,
        itemName: data.itemName || "Dragged Item"
      });
    } catch (err) {
      // If we can't parse the data, still show a generic indicator
      const rect = element.getBoundingClientRect();
      const mouseY = e.clientY;
      const threshold = rect.top + (rect.height / 2);
      const insertBefore = mouseY < threshold;
      
      const offsetTop = insertBefore ? rect.top : rect.bottom;
      const containerRect = treeRef.current?.getBoundingClientRect();
      const top = containerRect ? offsetTop - containerRect.top : offsetTop;

      setDropIndicator({
        visible: true,
        top,
        itemId,
        insertBefore,
        itemName: "Dragged Item"
      });
    }
  };

  const handleDragLeave = () => {
    // Add a small delay to avoid flickering when moving between items
    setTimeout(() => {
      // Check if the mouse is still over any part of our component
      if (!treeRef.current?.contains(document.activeElement) && 
          DragStateManager.isActive(componentId)) {
        DragStateManager.setActiveDropTarget(null);
        cleanupDropIndicators();
      }
    }, 50);
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Set this component as the active drop target
    DragStateManager.setActiveDropTarget(componentId);
    
    // If we're dragging over the container but not over any item,
    // show indicator at the bottom to allow appending
    if (canShowDropIndicator() && items.length > 0 && !dropIndicator.visible) {
      const containerRect = treeRef.current?.getBoundingClientRect();
      if (containerRect) {
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
            ids: string[], 
            source: string,
            itemName?: string 
          };
          
          setDropIndicator({
            visible: true,
            top: containerRect.height - 30, // Position a bit higher to show the silhouette
            insertBefore: false,
            itemName: data.itemName || "Dragged Item"
          });
        } catch (err) {
          setDropIndicator({
            visible: true,
            top: containerRect.height - 30,
            insertBefore: false,
            itemName: "Dragged Item"
          });
        }
      }
    }
    
    // Call the parent onDragOver if provided
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleContainerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Set this as the active drop target when entering
    DragStateManager.setActiveDropTarget(componentId);
    
    // If the container is empty, show a drop indicator
    if (items.length === 0) {
      const containerRect = treeRef.current?.getBoundingClientRect();
      if (containerRect) {
        try {
          const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
            ids: string[], 
            source: string,
            itemName?: string 
          };
          
          setDropIndicator({
            visible: true,
            top: containerRect.height / 2,
            insertBefore: false,
            itemName: data.itemName || "Dragged Item"
          });
        } catch (err) {
          setDropIndicator({
            visible: true,
            top: containerRect.height / 2,
            insertBefore: false,
            itemName: "Dragged Item"
          });
        }
      }
    }
  };

  // Add global event listeners for drag end to ensure cleanup
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      cleanupDropIndicators();
      
      // Also remove any dragging flags from elements
      const draggingElements = document.querySelectorAll('[data-dragging="true"]');
      draggingElements.forEach(el => {
        el.removeAttribute('data-dragging');
      });
    };
    
    // Handle drag end globally
    document.addEventListener('dragend', handleGlobalDragEnd);
    
    // Cleanup
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
      
      // When component unmounts, clear active target if it's this component
      if (DragStateManager.isActive(componentId)) {
        DragStateManager.setActiveDropTarget(null);
      }
    };
  }, [componentId]);

  const handleTreeDrop = (e: React.DragEvent) => {
    // Try to parse the data transfer to detect if it's a reordering operation
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
        ids: string[], 
        source: string 
      };
      
      // If this is a reordering within the same panel and we have the handler
      if (
        ((title === "Selected Columns" && data.source === "selected") ||
         (title === "Available Columns" && data.source === "available")) &&
        onItemReorder
      ) {
        // Call the reordering handler
        const positionedEvent = e as any;
        positionedEvent.dropPosition = {
          targetId: dropIndicator.itemId,
          insertBefore: dropIndicator.insertBefore
        };
        
        onItemReorder(positionedEvent);
        
        // Clean up drop indicators
        cleanupDropIndicators();
        return;
      }
    } catch (err) {
      // Continue with normal drop handling
    }
    
    // Add position info to the event for normal drops
    const positionedEvent = e as any;
    positionedEvent.dropPosition = {
      targetId: dropIndicator.itemId,
      insertBefore: dropIndicator.insertBefore
    };
    
    // Clean up drop indicators
    cleanupDropIndicators();
    
    // Call the parent onDrop handler
    if (onDrop) {
      onDrop(positionedEvent);
    }
  };

  return (
    <div 
      ref={treeRef}
      className="tree-view" 
      onDrop={handleTreeDrop} 
      onDragOver={handleContainerDragOver}
      onDragEnter={handleContainerDragEnter}
      onDragLeave={handleDragLeave}
      style={{ 
        border: '1px solid #ccc', 
        height: '100%', 
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      data-component-id={componentId}
    >
      {/* Drop indicator silhouette */}
      {dropIndicator.visible && (
        <DropIndicator 
          top={dropIndicator.top - 15}
          text={dropIndicator.itemName || "Dragged Item"}
        />
      )}
      
      <TreeViewHeader 
        title={title} 
        selectedCount={selectedCount} 
        onSelectAll={onSelectAll} 
        onClearSelection={onClearSelection} 
      />
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {items.length > 0 ? (
          flatView ? (
            // Flat view - render all leaf nodes regardless of hierarchy
            renderFlatItems(
              items, 
              onDragStart, 
              toggleSelect, 
              handleItemDragOver, 
              handleDragLeave,
              showGroupLabels
            )
          ) : (
            // Tree view - render normally with hierarchy
            items.map((item, idx) => (
              <TreeItem 
                key={item.id} 
                item={item} 
                onDragStart={onDragStart} 
                toggleExpand={toggleExpand}
                toggleSelect={toggleSelect}
                depth={0}
                index={idx}
                onDragOver={handleItemDragOver}
                onDragLeave={handleDragLeave}
              />
            ))
          )
        ) : (
          <div style={{ 
            padding: '15px', 
            textAlign: 'center', 
            color: '#999' 
          }}>
            Drag columns here
          </div>
        )}
      </div>
    </div>
  );
};