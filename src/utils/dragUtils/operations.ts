import { ColumnItem } from '../../types';
import { showSilhouette, hideAll } from './silhouette';

/**
 * Handle drag start with silhouette effect
 */
function handleDragStart(
  e: React.DragEvent,
  item: ColumnItem,
  source: 'available' | 'selected',
  ids: string[]
) {
  console.log(`Starting drag: source=${source}, ids=${ids.join(',')}`);
  
  // CRITICAL: Set effectAllowed
  e.dataTransfer.effectAllowed = 'move';
  
  // Create text representation based on number of items
  const text = ids.length > 1 ? `${ids.length} columns` : item.name;
  
  // Create drag data with source information
  const dragData = JSON.stringify({
    ids,
    source,
    itemName: text
  });
  
  e.dataTransfer.setData('text/plain', dragData);
  
  // Use empty drag image to hide browser default
  const emptyImg = document.createElement('div');
  emptyImg.style.position = 'absolute';
  emptyImg.style.top = '-9999px';
  document.body.appendChild(emptyImg);
  
  try {
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
  } finally {
    setTimeout(() => document.body.removeChild(emptyImg), 100);
  }
  
  // Show custom silhouette
  showSilhouette(text, e.clientX, e.clientY);
  
  // Mark the element as being dragged
  const element = e.currentTarget as HTMLElement;
  element.setAttribute('data-dragging', 'true');
  
  // Clean up on drag end
  const handleDragEnd = () => {
    console.log('Drag operation ended');
    element.removeAttribute('data-dragging');
    hideAll();
    document.removeEventListener('dragend', handleDragEnd);
  };
  
  document.addEventListener('dragend', handleDragEnd);
}

/**
 * Handle drag start for available columns panel - can be used with selectedIds or empty array
 */
export function handleDragStartForAvailable(
  e: React.DragEvent, 
  item: ColumnItem,
  dragIds: string[]
) {
  // Find all selected elements in the available panel
  const selectedElements = document.querySelectorAll('.tree-view [data-source="available"] .selected');
  const selectedItemIds: string[] = [];
  
  // Only collect IDs if this item is one of the selected items
  if (dragIds.length === 0) {
    // This means item is selected along with others
    selectedElements.forEach(el => {
      const itemId = el.getAttribute('data-item-id');
      if (itemId) selectedItemIds.push(itemId);
    });
  }
  
  // Use collected selected IDs or just this item's ID
  const ids = selectedItemIds.length > 0 ? selectedItemIds : [item.id];
  
  handleDragStart(e, item, 'available', ids);
}

/**
 * Handle drag start for selected columns panel - can be used with selectedIds or empty array
 */
export function handleDragStartForSelected(
  e: React.DragEvent, 
  item: ColumnItem,
  dragIds: string[]
) {
  // Find all selected elements in the selected panel
  const selectedElements = document.querySelectorAll('.tree-view [data-source="selected"] .selected');
  const selectedItemIds: string[] = [];
  
  // Only collect IDs if this item is one of the selected items
  if (dragIds.length === 0) {
    // This means item is selected along with others
    selectedElements.forEach(el => {
      const itemId = el.getAttribute('data-item-id');
      if (itemId) selectedItemIds.push(itemId);
    });
  }
  
  // Use collected selected IDs or just this item's ID
  const ids = selectedItemIds.length > 0 ? selectedItemIds : [item.id];
  
  handleDragStart(e, item, 'selected', ids);
}

/**
 * Parse drag data from event
 */
export function parseDragData(e: React.DragEvent): { ids: string[], source: string } | null {
  try {
    return JSON.parse(e.dataTransfer.getData('text/plain'));
  } catch (err) {
    console.error('Error parsing drag data:', err);
    return null;
  }
}

/**
 * Find drop position from event and element
 */
export function findDropPosition(
  e: React.DragEvent, 
  element: HTMLElement
): { targetId?: string, insertBefore: boolean } {
  if (!element) return { insertBefore: true };
  
  // Get item ID from data attribute
  const targetId = element.dataset.itemId;
  
  // Calculate insert position based on mouse position relative to the element
  const rect = element.getBoundingClientRect();
  const mouseY = e.clientY;
  
  // Use a 1/3 - 2/3 split for better accuracy
  // This gives a more natural feel when dragging items as the "insert before" area
  // at the top of each item is larger than the default 50/50 split
  const mouseRelativePos = (mouseY - rect.top) / rect.height;
  const insertBefore = mouseRelativePos < 0.5; // Use 50/50 split for now
  
  console.log(`Drop position calculated: targetId=${targetId}, insertBefore=${insertBefore}, relativePos=${mouseRelativePos.toFixed(2)}`);
  
  // Add visual indicators
  if (insertBefore) {
    element.classList.add('drag-over-top');
    element.classList.remove('drag-over-bottom');
  } else {
    element.classList.add('drag-over-bottom');
    element.classList.remove('drag-over-top');
  }
  
  return { targetId, insertBefore };
}

/**
 * Clear drop position indicators
 */
export function clearDropPositionIndicators() {
  document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(element => {
    element.classList.remove('drag-over-top', 'drag-over-bottom');
  });
}

/**
 * Enhanced drop handling with position information
 */
export function enhanceDropHandling(handleDrop: (e: React.DragEvent) => void) {
  return (e: React.DragEvent) => {
    // Clear visual indicators before processing drop
    clearDropPositionIndicators();
    
    // Call original handler
    handleDrop(e);
  };
}