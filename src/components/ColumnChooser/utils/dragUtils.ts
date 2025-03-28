import { DragItem, TreeNode, ExtendedColDef } from '../types';

/**
 * Creates a drag ghost element for better visual feedback during drag operations
 */
export function createDragGhost(
  text: string, 
  isFromGroup = false, 
  groupName?: string
): HTMLElement {
  const ghostElement = document.createElement('div');
  ghostElement.classList.add('drag-ghost');
  
  if (isFromGroup) {
    ghostElement.classList.add('from-group');
    ghostElement.textContent = text;
    
    if (groupName) {
      ghostElement.dataset.groupName = groupName;
    }
  } else {
    ghostElement.textContent = text;
  }
  
  document.body.appendChild(ghostElement);
  
  // Remove ghost after drag operation completes
  setTimeout(() => {
    try {
      if (document.body.contains(ghostElement)) {
        document.body.removeChild(ghostElement);
      }
    } catch (error) {
      console.error('Error removing drag ghost:', error);
    }
  }, 0);
  
  return ghostElement;
}

/**
 * Configures dataTransfer object for drag operations
 */
export function setupDataTransfer(
  event: React.DragEvent, 
  item: DragItem, 
  selectedIds: string[]
): void {
  try {
    // Store complete drag data
    const dragData: DragItem = {
      ...item,
      selectedIds: selectedIds.includes(item.id) ? [...selectedIds] : [item.id]
    };
    
    // Set JSON data for our application to use
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    
    // Set plain text as fallback
    event.dataTransfer.setData('text/plain', item.id);
    
    // Add column-from-group data if applicable
    if (item.type === 'column' && item.parentId) {
      event.dataTransfer.setData('column-from-group', 'true');
      event.dataTransfer.setData('source-group-id', item.parentId);
    }
    
    // Set drag effect
    event.dataTransfer.effectAllowed = 'move';
  } catch (error) {
    console.error('Error setting up data transfer:', error);
  }
}

/**
 * Parses dataTransfer to retrieve drag data
 */
export function parseDragData(event: React.DragEvent): DragItem | null {
  try {
    const dataString = event.dataTransfer.getData('application/json');
    if (dataString) {
      return JSON.parse(dataString);
    }
  } catch (error) {
    console.error('Failed to parse drag data:', error);
  }
  return null;
}

/**
 * Determines drop position relative to a target element
 * Returns true if dropping after, false if dropping before
 */
export function getDropPosition(event: React.DragEvent, element: HTMLElement | null): boolean {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const middleY = rect.top + rect.height / 2;
  
  return event.clientY > middleY;
}
