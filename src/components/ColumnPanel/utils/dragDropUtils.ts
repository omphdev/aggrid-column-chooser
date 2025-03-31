import { ColumnGroup } from '../../types';
import React from 'react';

/**
 * Detects which area (group or panel) a drop is occurring in
 * @param e Drag event
 * @returns Information about the drop area
 */
export const detectDropArea = (e: React.DragEvent<HTMLDivElement>): {
  isGroupContent: boolean;
  groupName: string | null;
} => {
  const currentElement = e.target as HTMLElement;
  let isGroupContent = false;
  let groupName: string | null = null;
  
  // Check if dropping in a group's content area
  const groupContentElement = currentElement.closest('.group-columns-container');
  if (groupContentElement) {
    isGroupContent = true;
    
    // Get the parent group container
    const groupContainer = groupContentElement.closest('.group-container-selected');
    if (groupContainer) {
      const name = groupContainer.getAttribute('data-group-name');
      if (name) groupName = name;
    }
  } else {
    // If not in group content, see if we're on a group header
    const groupHeader = currentElement.closest('.selected-group-header');
    if (groupHeader) {
      const groupContainer = groupHeader.closest('.group-container-selected');
      if (groupContainer) {
        const name = groupContainer.getAttribute('data-group-name');
        if (name) groupName = name;
      }
    }
  }
  
  return { isGroupContent, groupName };
};

/**
 * Calculate drop index based on mouse position
 * @param e Drag event
 * @param selectedPanelRef Reference to selected panel DOM element
 * @param selectedItems Currently selected items
 * @param draggedColumnId ID of column being dragged
 * @param draggedColumnGroup ID of group being dragged
 * @param columnGroups Column groups configuration
 * @returns Calculated drop index
 */
export const calculateDropIndex = (
  e: React.DragEvent<HTMLDivElement>,
  selectedPanelRef: React.RefObject<HTMLDivElement | null>,
  selectedItems: string[],
  draggedColumnId: string | null,
  draggedColumnGroup: string | null,
  columnGroups: ColumnGroup[]
): number => {
  const selectedPanelElement = selectedPanelRef.current;
  if (!selectedPanelElement) return 0;
  
  // Get container
  const columnsList = selectedPanelElement.querySelector('.columns-list');
  if (!columnsList) return 0;
  
  const containerRect = columnsList.getBoundingClientRect();
  
  // Get all column items
  const columnItems = Array.from(
    columnsList.querySelectorAll('.column-item, .group-container-selected')
  );
  if (columnItems.length === 0) return 0;
  
  // If we're dragging multiple columns, we need to filter out all selected items
  const selectedIndices = selectedItems.includes(draggedColumnId || '')
    ? selectedItems.map(id => {
        // Find the index of the item with this id (can be column or group)
        return columnItems.findIndex(item => {
          if (item.classList.contains('column-item')) {
            return item.getAttribute('data-column-id') === id;
          } else {
            // For groups, check if any of its columns match
            const groupName = item.getAttribute('data-group-name');
            const group = columnGroups.find(g => g.headerName === groupName);
            return group && group.children.includes(id);
          }
        });
      }).filter(index => index !== -1)
    : draggedColumnId
      ? [columnItems.findIndex(item => 
          item.classList.contains('column-item') && 
          item.getAttribute('data-column-id') === draggedColumnId
        )]
      : [];
  
  // If dragging a group, find its index
  if (draggedColumnGroup) {
    selectedIndices.push(columnItems.findIndex(item => 
      item.classList.contains('group-container-selected') && 
      item.getAttribute('data-group-name') === draggedColumnGroup
    ));
  }
  
  // Mouse position relative to container
  const mouseY = e.clientY - containerRect.top;
  
  // Find the index where we should insert
  for (let i = 0; i < columnItems.length; i++) {
    // Skip if this is a selected item being dragged
    if (selectedIndices.includes(i)) continue;
    
    const rect = columnItems[i].getBoundingClientRect();
    const itemTop = rect.top - containerRect.top;
    const itemHeight = rect.height;
    const middleY = itemTop + (itemHeight / 2);
    
    if (mouseY < middleY) {
      return i;
    }
  }
  
  // If mouse is below all items, drop at the end
  return columnItems.length;
};

/**
 * Calculate drop position within a group
 * @param groupName Name of the group
 * @param e Drag event
 * @param selectedPanelRef Reference to selected panel DOM element
 * @param draggedColumnId ID of column being dragged
 * @param selectedItems Currently selected items
 * @returns Calculated drop index within the group
 */
export const calculateGroupColumnDropIndex = (
  groupName: string, 
  e: React.DragEvent<HTMLDivElement>,
  selectedPanelRef: React.RefObject<HTMLDivElement | null>,
  draggedColumnId: string | null,
  selectedItems: string[]
): number => {
  const selectedPanelElement = selectedPanelRef.current;
  if (!selectedPanelElement) return 0;
  
  // Find the group container
  const groupContainer = selectedPanelElement.querySelector(`[data-group-name="${groupName}"]`);
  if (!groupContainer) return 0;
  
  // Get all column items in this group
  const columnItems = Array.from(
    groupContainer.querySelectorAll('.column-item')
  );
  if (columnItems.length === 0) return 0;
  
  // Mouse position relative to container
  const containerRect = groupContainer.getBoundingClientRect();
  const mouseY = e.clientY - containerRect.top;
  
  // Find the column we're dragging (if any)
  let draggedColumnIndices: number[] = [];
  if (draggedColumnId) {
    const draggedIndex = columnItems.findIndex(
      item => item.getAttribute('data-column-id') === draggedColumnId
    );
    draggedColumnIndices = draggedIndex !== -1 ? [draggedIndex] : [];
    
    // If we're dragging multiple columns, include their indices too
    if (selectedItems.includes(draggedColumnId) && selectedItems.length > 1) {
      draggedColumnIndices = selectedItems
        .map(id => columnItems.findIndex(item => item.getAttribute('data-column-id') === id))
        .filter(index => index !== -1);
    }
  }
  
  // Find the column position where we should insert
  for (let i = 0; i < columnItems.length; i++) {
    // Skip if this is a selected item being dragged
    if (draggedColumnIndices.includes(i)) continue;
    
    const rect = columnItems[i].getBoundingClientRect();
    const itemTop = rect.top - containerRect.top;
    const itemHeight = rect.height;
    const middleY = itemTop + (itemHeight / 2);
    
    if (mouseY < middleY) {
      return i;
    }
  }
  
  // If mouse is below all items, drop at the end
  return columnItems.length;
};