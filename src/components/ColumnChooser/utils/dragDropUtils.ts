import { DragItem, DragItemTypes, ExtendedColDef, ColumnGroup } from '../../../types';

/**
 * Detect which area (group or panel) a drop is occurring in
 * @param element The element where drop occurred
 * @returns Information about the drop area
 */
export function detectDropArea(element: HTMLElement | null): {
  isGroupContent: boolean;
  groupName: string | null;
} {
  if (!element) {
    return { isGroupContent: false, groupName: null };
  }
  
  // Check if dropping in a group's content area
  const groupContentElement = findClosestWithClass(element, 'group-columns-container');
  if (groupContentElement) {
    // Get the parent group container
    const groupContainer = findClosestWithClass(groupContentElement, 'group-container-selected');
    if (groupContainer) {
      const name = groupContainer.getAttribute('data-group-name');
      return { 
        isGroupContent: true, 
        groupName: name 
      };
    }
  }
  
  // If not in group content, see if we're on a group header
  const groupHeader = findClosestWithClass(element, 'selected-group-header');
  if (groupHeader) {
    const groupContainer = findClosestWithClass(groupHeader, 'group-container-selected');
    if (groupContainer) {
      const name = groupContainer.getAttribute('data-group-name');
      return { 
        isGroupContent: false, 
        groupName: name 
      };
    }
  }
  
  return { isGroupContent: false, groupName: null };
}

/**
 * Find the closest parent element with a specific class
 */
function findClosestWithClass(element: HTMLElement, className: string): HTMLElement | null {
  if (!element) return null;
  
  if (element.classList && element.classList.contains(className)) {
    return element;
  }
  
  return element.parentElement ? 
    findClosestWithClass(element.parentElement, className) : null;
}

/**
 * Calculate drop index for a group's columns
 * @param groupName Group name
 * @param clientOffset Mouse position
 * @param container Container element reference
 * @param draggedId ID of column being dragged
 * @param draggedItems All dragged item IDs (for multi-selection)
 * @returns Calculated drop index within the group
 */
export function calculateGroupDropIndex(
  groupName: string,
  clientOffset: { x: number, y: number } | null,
  container: HTMLElement | null,
  draggedId: string | null,
  draggedItems: string[]
): number {
  if (!container || !clientOffset) return 0;
  
  // Find the group container
  const groupContainer = container.querySelector(`[data-group-name="${groupName}"]`);
  if (!groupContainer) return 0;
  
  // Find the columns container
  const columnsContainer = groupContainer.querySelector('.group-columns-container');
  if (!columnsContainer) return 0;
  
  // Get all column items in this group
  const columnItems = Array.from(
    columnsContainer.querySelectorAll('.column-item')
  );
  
  if (columnItems.length === 0) return 0;
  
  // Mouse position relative to container
  const containerRect = columnsContainer.getBoundingClientRect();
  const mouseY = clientOffset.y - containerRect.top;
  
  // Find indices of columns being dragged
  const draggedIndices = draggedId && draggedItems.includes(draggedId)
    ? draggedItems.map(id => 
        columnItems.findIndex(item => 
          item.getAttribute('data-column-id') === id
        )
      ).filter(idx => idx !== -1)
    : draggedId
      ? [columnItems.findIndex(item => 
          item.getAttribute('data-column-id') === draggedId
        )]
      : [];
  
  // Calculate the index based on mouse position
  const ITEM_HEIGHT = 36; // Estimated height of each item
  let insertIndex = Math.floor(mouseY / ITEM_HEIGHT);
  
  // Adjust for boundaries
  insertIndex = Math.max(0, Math.min(insertIndex, columnItems.length));
  
  // Adjust for dragged items
  if (draggedIndices.some(idx => idx !== -1)) {
    // Count how many dragged items are before the insert index
    let adjustedIndex = insertIndex;
    for (const idx of draggedIndices) {
      if (idx !== -1 && idx < insertIndex) {
        adjustedIndex--;
      }
    }
    insertIndex = adjustedIndex;
  }
  
  return insertIndex;
}