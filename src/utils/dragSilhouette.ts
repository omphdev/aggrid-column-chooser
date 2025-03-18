// src/utils/dragSilhouette.ts

// Track if the silhouette is already initialized
let isInitialized = false;

// Reference to the DOM elements
let silhouetteElement: HTMLDivElement | null = null;
let insertIndicatorElement: HTMLDivElement | null = null;

// Stores info about what's being dragged
interface DraggedItem {
  text: string;
  width?: number;
  height?: number;
  isActive: boolean;
}

// Current drag state
let currentDraggedItem: DraggedItem = {
  text: '',
  isActive: false
};

// Current insert position state
let currentInsertPosition: {
  targetElement: HTMLElement | null;
  insertBefore: boolean;
  isActive: boolean;
} = {
  targetElement: null,
  insertBefore: true,
  isActive: false
};

// Position offset from cursor
const OFFSET_X = 15;
const OFFSET_Y = 15;

/**
 * Initialize the global silhouette - should be called once at app startup
 */
export function initializeDragSilhouette() {
  if (isInitialized || silhouetteElement) return;
  
  // Create the silhouette element
  silhouetteElement = document.createElement('div');
  silhouetteElement.id = 'global-drag-silhouette';
  silhouetteElement.style.position = 'fixed';
  silhouetteElement.style.pointerEvents = 'none';
  silhouetteElement.style.zIndex = '10000'; // Very high z-index to be above everything
  silhouetteElement.style.padding = '6px 12px';
  silhouetteElement.style.backgroundColor = 'rgba(24, 144, 255, 0.15)';
  silhouetteElement.style.border = '2px dashed #1890ff';
  silhouetteElement.style.borderRadius = '4px';
  silhouetteElement.style.color = '#1890ff';
  silhouetteElement.style.fontSize = '14px';
  silhouetteElement.style.fontWeight = '500';
  silhouetteElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  silhouetteElement.style.display = 'none';
  silhouetteElement.style.userSelect = 'none';
  silhouetteElement.style.whiteSpace = 'nowrap';
  silhouetteElement.style.maxWidth = '300px';
  silhouetteElement.style.overflow = 'hidden';
  silhouetteElement.style.textOverflow = 'ellipsis';
  
  // Create the insertion indicator element
  insertIndicatorElement = document.createElement('div');
  insertIndicatorElement.id = 'insert-position-indicator';
  insertIndicatorElement.style.position = 'absolute';
  insertIndicatorElement.style.pointerEvents = 'none';
  insertIndicatorElement.style.zIndex = '9999'; // High z-index but below silhouette
  insertIndicatorElement.style.height = '3px';
  insertIndicatorElement.style.backgroundColor = '#1890ff';
  insertIndicatorElement.style.borderRadius = '2px';
  insertIndicatorElement.style.display = 'none';
  insertIndicatorElement.style.boxShadow = '0 0 4px rgba(24, 144, 255, 0.5)';
  insertIndicatorElement.style.transition = 'transform 0.1s ease-out';
  insertIndicatorElement.style.transformOrigin = 'center';
  insertIndicatorElement.style.animation = 'indicatorPulse 1.5s infinite';
  
  // Add animation
  silhouetteElement.style.animation = 'silhouettePulse 1.5s infinite';
  
  // Add the animation keyframes
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes silhouettePulse {
      0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(24, 144, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
    }
    
    @keyframes indicatorPulse {
      0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.6); }
      70% { box-shadow: 0 0 4px 2px rgba(24, 144, 255, 0.3); }
      100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
    }
    
    .drag-spacing {
      transition: margin 0.15s ease-out !important;
    }
  `;
  document.head.appendChild(styleSheet);
  
  // Add elements to document
  document.body.appendChild(silhouetteElement);
  document.body.appendChild(insertIndicatorElement);
  
  // Add global mouse move listener to update position
  document.addEventListener('mousemove', handleGlobalMouseMove);
  
  // Add global drag end listener to hide
  document.addEventListener('dragend', hideAll);
  
  // Add global drop listener to hide
  document.addEventListener('drop', hideAll);
  
  // Track when dragging leaves the window
  document.addEventListener('mouseleave', hideAll);
  
  // Also handle cases where the drag operation is canceled
  document.addEventListener('dragcancel', hideAll);
  document.addEventListener('dragleave', handleDragLeave);
  
  // Handle the case when user presses Escape key
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && (currentDraggedItem.isActive || currentInsertPosition.isActive)) {
      hideAll();
    }
  });
  
  // Set initialized flag
  isInitialized = true;
}

/**
 * Clean up the silhouette - call this when app is unmounting
 */
export function cleanupDragSilhouette() {
  if (silhouetteElement && document.body.contains(silhouetteElement)) {
    document.body.removeChild(silhouetteElement);
  }
  
  if (insertIndicatorElement && document.body.contains(insertIndicatorElement)) {
    document.body.removeChild(insertIndicatorElement);
  }
  
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('dragend', hideAll);
  document.removeEventListener('drop', hideAll);
  document.removeEventListener('mouseleave', hideAll);
  document.removeEventListener('dragcancel', hideAll);
  document.removeEventListener('dragleave', handleDragLeave);
  
  silhouetteElement = null;
  insertIndicatorElement = null;
  isInitialized = false;
}

/**
 * Handle when the drag leaves the document
 */
function handleDragLeave(e: DragEvent) {
  // Check if leaving the document
  const toElement = e.relatedTarget as HTMLElement;
  if (!toElement || toElement.tagName === 'HTML') {
    hideAll();
  }
}

/**
 * Update silhouette position based on mouse movement
 */
function handleGlobalMouseMove(e: MouseEvent) {
  if (silhouetteElement && currentDraggedItem.isActive) {
    // Update position with offset
    silhouetteElement.style.left = `${e.clientX + OFFSET_X}px`;
    silhouetteElement.style.top = `${e.clientY + OFFSET_Y}px`;
  }
}

/**
 * Show the silhouette with specific text
 */
export function showSilhouette(params: {
  text: string;
  clientX: number;
  clientY: number;
  width?: number;
  height?: number;
}) {
  if (!silhouetteElement) {
    initializeDragSilhouette();
  }
  
  if (!silhouetteElement) return; // Safety check
  
  // Update text
  silhouetteElement.textContent = params.text;
  
  // Update position
  silhouetteElement.style.left = `${params.clientX + OFFSET_X}px`;
  silhouetteElement.style.top = `${params.clientY + OFFSET_Y}px`;
  
  // Set custom size if provided
  if (params.width) {
    silhouetteElement.style.width = `${params.width}px`;
  } else {
    silhouetteElement.style.width = 'auto';
  }
  
  // Update state
  currentDraggedItem = {
    text: params.text,
    width: params.width,
    height: params.height,
    isActive: true
  };
  
  // Show the element
  silhouetteElement.style.display = 'block';
}

/**
 * Show an insertion indicator at the specified position
 */
export function showInsertPosition(params: {
  element: HTMLElement;
  insertBefore: boolean;
  containerRect?: DOMRect;
}) {
  if (!insertIndicatorElement) {
    initializeDragSilhouette();
  }
  
  if (!insertIndicatorElement) return; // Safety check
  
  // Reset any existing spacing
  resetRowSpacing();
  
  const { element, insertBefore, containerRect } = params;
  const rect = element.getBoundingClientRect();
  
  // Calculate position relative to container if provided
  const top = insertBefore ? rect.top : rect.bottom;
  const left = rect.left;
  const width = rect.width;
  
  // Apply spacing to the rows to create a visual gap
  // We add a class to handle the transition smoothly
  element.classList.add('drag-spacing');
  
  // Apply margin to create space for the indicator
  const SPACING = 20; // Height of the gap to create
  
  if (insertBefore) {
    element.style.marginTop = `${SPACING}px`;
  } else {
    element.style.marginBottom = `${SPACING}px`;
  }
  
  // Position the insertion indicator
  insertIndicatorElement.style.top = `${top - (insertBefore ? 2 : -2)}px`;
  insertIndicatorElement.style.left = `${left}px`;
  insertIndicatorElement.style.width = `${width}px`;
  insertIndicatorElement.style.display = 'block';
  insertIndicatorElement.style.transform = 'scaleY(1.5)'; // Make it slightly thicker
  
  // Update state
  currentInsertPosition = {
    targetElement: element,
    insertBefore,
    isActive: true
  };
}

/**
 * Reset any row spacing created by the insert indicator
 */
function resetRowSpacing() {
  // Remove spacing from previous target element
  if (currentInsertPosition.targetElement) {
    currentInsertPosition.targetElement.style.marginTop = '';
    currentInsertPosition.targetElement.style.marginBottom = '';
    
    // Remove the transition class after a delay
    setTimeout(() => {
      if (currentInsertPosition.targetElement) {
        currentInsertPosition.targetElement.classList.remove('drag-spacing');
      }
    }, 200);
  }
  
  // Reset all other potentially affected elements
  document.querySelectorAll('.drag-spacing').forEach(element => {
    (element as HTMLElement).style.marginTop = '';
    (element as HTMLElement).style.marginBottom = '';
    
    // Remove the transition class after a delay
    setTimeout(() => {
      element.classList.remove('drag-spacing');
    }, 200);
  });
}

/**
 * Hide the insertion indicator
 */
export function hideInsertPosition() {
  if (!insertIndicatorElement) return;
  
  insertIndicatorElement.style.display = 'none';
  resetRowSpacing();
  
  currentInsertPosition = {
    targetElement: null,
    insertBefore: true,
    isActive: false
  };
}

/**
 * Hide the silhouette
 */
export function hideSilhouette() {
  if (!silhouetteElement) return;
  
  silhouetteElement.style.display = 'none';
  currentDraggedItem.isActive = false;
}

/**
 * Hide all visual indicators
 */
export function hideAll() {
  hideSilhouette();
  hideInsertPosition();
}

/**
 * Get the current drag state
 */
export function getDragState() {
  return {
    isActive: currentDraggedItem.isActive,
    text: currentDraggedItem.text,
    insertPositionActive: currentInsertPosition.isActive,
    insertBefore: currentInsertPosition.insertBefore
  };
}

/**
 * Helper function to handle dragStart events
 * @param e The drag event
 * @param text The text to display in the silhouette
 */
export function handleDragStart(e: React.DragEvent, text: string) {
  // Set the proper drag effect
  e.dataTransfer.effectAllowed = 'move';
  
  // Show silhouette at start position
  showSilhouette({
    text,
    clientX: e.clientX,
    clientY: e.clientY
  });
  
  // Set a transparent drag image to hide browser's default
  const emptyImg = document.createElement('div');
  emptyImg.style.width = '1px';
  emptyImg.style.height = '1px';
  emptyImg.style.position = 'absolute';
  emptyImg.style.top = '-9999px';
  document.body.appendChild(emptyImg);
  
  try {
    // Set drag image to empty
    e.dataTransfer.setDragImage(emptyImg, 0, 0);
  } finally {
    // Clean up after a short delay
    setTimeout(() => {
      if (document.body.contains(emptyImg)) {
        document.body.removeChild(emptyImg);
      }
    }, 100);
  }
  
  // Mark the element as being dragged
  const element = e.currentTarget as HTMLElement;
  element.setAttribute('data-dragging', 'true');
  
  // Safety check: Ensure everything gets hidden when drag ends
  // by adding an event listener directly to the dragged element
  element.addEventListener('dragend', () => {
    hideAll();
    element.removeAttribute('data-dragging');
  }, { once: true });
}

/**
 * Helper function to handle showing insert position indicator
 * @param e The drag event
 * @param element The target element
 * @param containerElement Optional container element for relative positioning
 */
export function handleDragOverForInsert(e: React.DragEvent, element: HTMLElement, containerElement?: HTMLElement) {
  if (!element) return;
  
  // Calculate if we should insert before or after based on mouse position
  const rect = element.getBoundingClientRect();
  const mouseY = e.clientY;
  const threshold = rect.top + (rect.height / 2);
  const insertBefore = mouseY < threshold;
  
  // Show the insertion indicator
  showInsertPosition({
    element,
    insertBefore,
    containerRect: containerElement?.getBoundingClientRect()
  });
  
  return { insertBefore };
}