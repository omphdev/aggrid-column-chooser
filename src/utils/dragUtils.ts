import { DragItem } from '../types';

// Global state for drag operations
let dragSilhouetteElement: HTMLDivElement | null = null;
let insertIndicatorElement: HTMLDivElement | null = null;
let isInitialized = false;

/**
 * Initialize drag silhouette system - call once at app start
 */
export function initializeDragSilhouette() {
  if (isInitialized) return;
  
  // Create the silhouette element for showing what's being dragged
  dragSilhouetteElement = document.createElement('div');
  dragSilhouetteElement.id = 'drag-silhouette';
  Object.assign(dragSilhouetteElement.style, {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: '10000',
    padding: '6px 12px',
    backgroundColor: 'rgba(24, 144, 255, 0.15)',
    border: '2px dashed #1890ff',
    borderRadius: '4px',
    color: '#1890ff',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  });
  
  // Create the insertion indicator for showing where item will be inserted
  insertIndicatorElement = document.createElement('div');
  insertIndicatorElement.id = 'insert-indicator';
  Object.assign(insertIndicatorElement.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '9999',
    height: '3px',
    backgroundColor: '#1890ff',
    borderRadius: '2px',
    display: 'none',
    boxShadow: '0 0 4px rgba(24, 144, 255, 0.5)'
  });
  
  // Add CSS for animations and transitions
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes pulseShadow {
      0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(24, 144, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
    }
    
    #drag-silhouette {
      animation: pulseShadow 1.5s infinite;
    }
    
    #insert-indicator {
      animation: pulseShadow 1.5s infinite;
    }
    
    .drag-spacing {
      transition: margin 0.15s ease-out;
    }
  `;
  
  document.head.appendChild(styleSheet);
  document.body.appendChild(dragSilhouetteElement);
  document.body.appendChild(insertIndicatorElement);
  
  // Add global handlers for drag operations
  document.addEventListener('mousemove', updateDragSilhouettePosition);
  document.addEventListener('dragend', hideAllDragIndicators);
  document.addEventListener('drop', hideAllDragIndicators);
  
  isInitialized = true;
}

/**
 * Clean up drag silhouette system - call when app unmounts
 */
export function cleanupDragSilhouette() {
  if (dragSilhouetteElement) {
    document.body.removeChild(dragSilhouetteElement);
  }
  
  if (insertIndicatorElement) {
    document.body.removeChild(insertIndicatorElement);
  }
  
  document.removeEventListener('mousemove', updateDragSilhouettePosition);
  document.removeEventListener('dragend', hideAllDragIndicators);
  document.removeEventListener('drop', hideAllDragIndicators);
  
  dragSilhouetteElement = null;
  insertIndicatorElement = null;
  isInitialized = false;
}

/**
 * Update position of the drag silhouette
 */
function updateDragSilhouettePosition(e: MouseEvent) {
  if (!dragSilhouetteElement || dragSilhouetteElement.style.display === 'none') return;
  
  dragSilhouetteElement.style.left = `${e.clientX + 15}px`;
  dragSilhouetteElement.style.top = `${e.clientY + 15}px`;
}

/**
 * Show the drag silhouette
 */
export function showDragSilhouette(text: string, x: number, y: number) {
  if (!dragSilhouetteElement) {
    initializeDragSilhouette();
  }
  
  if (!dragSilhouetteElement) return;
  
  dragSilhouetteElement.textContent = text;
  dragSilhouetteElement.style.left = `${x + 15}px`;
  dragSilhouetteElement.style.top = `${y + 15}px`;
  dragSilhouetteElement.style.display = 'block';
}

/**
 * Show the insertion indicator
 */
export function showInsertIndicator(
  element: HTMLElement, 
  insertBefore: boolean,
  containerElement?: HTMLElement
) {
  if (!insertIndicatorElement) {
    initializeDragSilhouette();
  }
  
  if (!insertIndicatorElement || !element) return;
  
  // Clear any existing spacing
  clearDragSpacing();
  
  // Get position
  const rect = element.getBoundingClientRect();
  const position = insertBefore ? rect.top : rect.bottom;
  
  // Position the indicator
  insertIndicatorElement.style.top = `${position - 2}px`;
  insertIndicatorElement.style.left = `${rect.left}px`;
  insertIndicatorElement.style.width = `${rect.width}px`;
  insertIndicatorElement.style.display = 'block';
  
  // Add spacing to the element
  element.classList.add('drag-spacing');
  if (insertBefore) {
    element.style.marginTop = '20px';
  } else {
    element.style.marginBottom = '20px';
  }
  
  return { insertBefore };
}

/**
 * Hide all drag indicators
 */
export function hideAllDragIndicators() {
  if (dragSilhouetteElement) {
    dragSilhouetteElement.style.display = 'none';
  }
  
  if (insertIndicatorElement) {
    insertIndicatorElement.style.display = 'none';
  }
  
  clearDragSpacing();
}

/**
 * Clear spacing on elements added for drag insertion indicators
 */
function clearDragSpacing() {
  document.querySelectorAll('.drag-spacing').forEach(element => {
    const el = element as HTMLElement;
    el.style.marginTop = '';
    el.style.marginBottom = '';
    
    // Remove the class after transition completes
    setTimeout(() => {
      el.classList.remove('drag-spacing');
    }, 200);
  });
}

/**
 * Handle drag start event
 */
export function handleDragStart(
  e: React.DragEvent,
  item: { id: string, name: string, selected?: boolean },
  source: 'available' | 'selected',
  selectedIds: string[] = []
) {
  // Use the provided item ID if nothing is selected
  const ids = item.selected && selectedIds.length > 0 ? selectedIds : [item.id];
  
  // Prepare the drag data
  const dragData: DragItem = {
    id: item.id,
    source,
    ids,
    itemName: ids.length > 1 ? `${ids.length} columns` : item.name
  };
  
  // Set the drag data
  e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  
  // Create a transparent drag image to replace the browser's default
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
  showDragSilhouette(
    dragData.itemName,
    e.clientX,
    e.clientY
  );
  
  // Mark element as dragging
  const element = e.currentTarget as HTMLElement;
  element.setAttribute('data-dragging', 'true');
  
  // Clean up on drag end
  element.addEventListener('dragend', () => {
    element.removeAttribute('data-dragging');
    hideAllDragIndicators();
  }, { once: true });
}

/**
 * Parse drag data from event
 */
export function parseDragData(e: React.DragEvent): DragItem | null {
  try {
    return JSON.parse(e.dataTransfer.getData('text/plain')) as DragItem;
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
  
  // Calculate insert position based on mouse position
  const rect = element.getBoundingClientRect();
  const mouseY = e.clientY;
  const threshold = rect.top + (rect.height / 2);
  const insertBefore = mouseY < threshold;
  
  return { targetId, insertBefore };
}