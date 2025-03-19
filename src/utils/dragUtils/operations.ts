import { ColumnItem } from '../../types';
import { showSilhouette, hideAll } from './silhouette';

/**
 * Handle drag start with silhouette effect
 */
export function handleDragStart(
  e: React.DragEvent,
  item: ColumnItem,
  source: 'available' | 'selected',
  selectedIds: string[] = []
) {
  console.log('Starting drag operation', { source, id: item.id });
  
  // CRITICAL: Set effectAllowed
  e.dataTransfer.effectAllowed = 'move';
  
  // Determine which IDs to drag
  const ids = item.selected && selectedIds.length > 0 ? selectedIds : [item.id];
  const text = ids.length > 1 ? `${ids.length} columns` : item.name;
  
  // Set drag data (crucial part!)
  const dragData = JSON.stringify({
    ids,
    source,
    itemName: text
  });
  
  e.dataTransfer.setData('text/plain', dragData);
  console.log('Set drag data:', dragData);
  
  // Create transparent drag image
  const emptyImg = document.createElement('div');
  emptyImg.style.position = 'absolute';
  emptyImg.style.top = '-9999px';
  document.body.appendChild(emptyImg);
  
  try {
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
  } finally {
    setTimeout(() => document.body.removeChild(emptyImg), 100);
  }
  
  // Show the silhouette
  showSilhouette(text, e.clientX, e.clientY);
  
  // Mark the element as being dragged
  const element = e.currentTarget as HTMLElement;
  element.setAttribute('data-dragging', 'true');
  
  // Clean up on drag end
  element.addEventListener('dragend', () => {
    console.log('Drag ended');
    element.removeAttribute('data-dragging');
    hideAll();
  }, { once: true });
}

/**
 * Handle drag start for available columns panel
 * @param e Drag event
 * @param item Item being dragged
 * @param availableItems Either array of selected IDs or all available items 
 */
export function handleDragStartForAvailable(
  e: React.DragEvent, 
  item: ColumnItem,
  availableItems: string[] | ColumnItem[]
) {
  // Determine if we have an array of IDs or column items
  let selectedIds: string[];
  
  if (availableItems.length > 0 && typeof availableItems[0] === 'string') {
    // If we already have an array of strings, use it directly
    selectedIds = availableItems as string[];
  } else {
    // If we have column items, extract selected IDs
    selectedIds = getSelectedItems(availableItems as ColumnItem[]);
  }
  
  // Use the selected IDs if item is selected, or just this item's ID
  const ids = item.selected && selectedIds.length > 0 ? selectedIds : [item.id];
  handleDragStart(e, item, 'available', ids);
}

/**
 * Handle drag start for selected columns panel
 * @param e Drag event
 * @param item Item being dragged
 * @param selectedItems Either array of selected IDs or all selected items
 */
export function handleDragStartForSelected(
  e: React.DragEvent, 
  item: ColumnItem,
  selectedItems: string[] | ColumnItem[]
) {
  // Determine if we have an array of IDs or column items
  let selectedIds: string[];
  
  if (selectedItems.length > 0 && typeof selectedItems[0] === 'string') {
    // If we already have an array of strings, use it directly
    selectedIds = selectedItems as string[];
  } else {
    // If we have column items, extract selected IDs
    selectedIds = getSelectedItems(selectedItems as ColumnItem[]);
  }
  
  // Use the selected IDs if item is selected, or just this item's ID
  const ids = item.selected && selectedIds.length > 0 ? selectedIds : [item.id];
  handleDragStart(e, item, 'selected', ids);
}

/**
 * Get selected items from a tree structure
 */
export function getSelectedItems(items: ColumnItem[]): string[] {
  const selectedIds: string[] = [];
  
  const collectSelectedIds = (itemList: ColumnItem[]) => {
    for (const item of itemList) {
      if (item.selected) {
        selectedIds.push(item.id);
      }
      
      if (item.children && item.children.length > 0) {
        collectSelectedIds(item.children);
      }
    }
  };
  
  collectSelectedIds(items);
  return selectedIds;
}

/**
 * Process drag and drop operations
 */
export function processDragDrop(
  e: React.DragEvent,
  sourcePanel: string,
  availableColumns: ColumnItem[],
  selectedColumns: ColumnItem[],
  allPossibleColumns: ColumnItem[],
  clearSelectionFunction: () => void,
  isFlatView: boolean = false
): { 
  newAvailable: ColumnItem[], 
  newSelected: ColumnItem[] 
} {
  e.preventDefault();
  
  try {
    const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { 
      ids: string[], 
      source: string 
    };
    
    if (data.source === sourcePanel && data.ids && data.ids.length > 0) {
      // Implementation would go here
      // For now returning unmodified copies to satisfy type requirements
      return { 
        newAvailable: [...availableColumns], 
        newSelected: [...selectedColumns] 
      };
    }
  } catch (err) {
    console.error('Error processing drag data:', err);
  }
  
  return { 
    newAvailable: [...availableColumns], 
    newSelected: [...selectedColumns] 
  };
}

/**
 * Insert item into tree at specific index
 */
export function insertItemIntoTreeAtIndex(
  items: ColumnItem[],
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore: boolean = true
): ColumnItem[] {
  // Clone to avoid mutation
  const result = [...items];
  
  if (targetId) {
    const targetIndex = result.findIndex(i => i.id === targetId);
    if (targetIndex >= 0) {
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      
      // Make sure we don't already have this item
      if (!result.some(i => i.id === item.id)) {
        result.splice(insertIndex, 0, item);
      }
      
      return result;
    }
  }
  
  // Add to end if target not found
  if (!result.some(i => i.id === item.id)) {
    result.push(item);
  }
  
  return result;
}

/**
 * Insert item into flat list
 */
export function insertItemIntoFlatList(
  tree: ColumnItem[],
  item: ColumnItem,
  allPossibleColumns: ColumnItem[],
  targetId?: string,
  insertBefore: boolean = true
): ColumnItem[] {
  // Clone to avoid mutation
  const result = [...tree];
  
  if (targetId) {
    const targetIndex = result.findIndex(i => i.id === targetId);
    if (targetIndex >= 0) {
      const insertIndex = insertBefore ? targetIndex : targetIndex + 1;
      
      // Make sure we don't already have this item
      if (!result.some(i => i.id === item.id)) {
        result.splice(insertIndex, 0, item);
      }
      
      return result;
    }
  }
  
  // Add to end if target not found
  if (!result.some(i => i.id === item.id)) {
    result.push(item);
  }
  
  return result;
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
  const insertBefore = mouseRelativePos < 0.33; // Use top third for "insert before"
  
  console.log(`Drop position calculated: targetId=${targetId}, insertBefore=${insertBefore}, relativePos=${mouseRelativePos.toFixed(2)}`);
  
  return { targetId, insertBefore };
}