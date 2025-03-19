// Track if the silhouette is already initialized
let isInitialized = false;

// Reference to the DOM elements
let silhouetteElement: HTMLDivElement | null = null;
let insertIndicatorElement: HTMLDivElement | null = null;

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
  silhouetteElement.style.zIndex = '10000';
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
  insertIndicatorElement.style.zIndex = '9999';
  insertIndicatorElement.style.height = '3px';
  insertIndicatorElement.style.backgroundColor = '#1890ff';
  insertIndicatorElement.style.borderRadius = '2px';
  insertIndicatorElement.style.display = 'none';
  insertIndicatorElement.style.boxShadow = '0 0 4px rgba(24, 144, 255, 0.5)';
  
  // Add animation
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes silhouettePulse {
      0% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(24, 144, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(24, 144, 255, 0); }
    }
    
    #global-drag-silhouette {
      animation: silhouettePulse 1.5s infinite;
    }
    
    #insert-position-indicator {
      animation: silhouettePulse 1.5s infinite;
    }
    
    .drag-spacing {
      transition: margin 0.15s ease-out !important;
    }
  `;
  document.head.appendChild(styleSheet);
  
  // Add elements to document
  document.body.appendChild(silhouetteElement);
  document.body.appendChild(insertIndicatorElement);
  
  // Add global event listeners
  // document.addEventListener('mousemove', handleGlobalMouseMove);
  // document.addEventListener('dragend', hideAll);
  // document.addEventListener('drop', hideAll);
  // document.addEventListener('mouseleave', hideAll);
  // document.addEventListener('dragcancel', hideAll);
  
  document.addEventListener('mousemove', handleGlobalMouseMove);
  document.addEventListener('dragend', hideAll);
  document.addEventListener('drop', hideAll);
  document.addEventListener('dragcancel', hideAll);
  
  // Set initialized flag
  isInitialized = true;
  console.log('Drag silhouette initialized');
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
  
  silhouetteElement = null;
  insertIndicatorElement = null;
  isInitialized = false;
}

/**
 * Update silhouette position based on mouse movement
 */
function handleGlobalMouseMove(e: MouseEvent) {
  if (silhouetteElement && silhouetteElement.style.display !== 'none') {
    // Update position with offset
    silhouetteElement.style.left = `${e.clientX + OFFSET_X}px`;
    silhouetteElement.style.top = `${e.clientY + OFFSET_Y}px`;
  }
}

/**
 * Show the silhouette with text
 */
export function showSilhouette(text: string, x: number, y: number) {
  if (!silhouetteElement) {
    initializeDragSilhouette();
  }
  
  if (!silhouetteElement) {
    console.error('Failed to create silhouette element');
    return;
  }
  
  console.log('Showing silhouette:', text);
  silhouetteElement.textContent = text;
  silhouetteElement.style.left = `${x + OFFSET_X}px`;
  silhouetteElement.style.top = `${y + OFFSET_Y}px`;
  silhouetteElement.style.display = 'block';
}

/**
 * Show an insertion indicator at the specified position
 */
export function showInsertIndicator(element: HTMLElement, insertBefore: boolean) {
  if (!insertIndicatorElement) {
    initializeDragSilhouette();
  }
  
  if (!insertIndicatorElement || !element) {
    console.error('Failed to show insert indicator');
    return;
  }
  
  console.log('Showing insert indicator');
  
  // Reset existing spacing
  resetRowSpacing();
  
  // Get element position
  const rect = element.getBoundingClientRect();
  
  // Position the indicator
  insertIndicatorElement.style.top = `${insertBefore ? rect.top - 2 : rect.bottom + 2}px`;
  insertIndicatorElement.style.left = `${rect.left}px`;
  insertIndicatorElement.style.width = `${rect.width}px`;
  insertIndicatorElement.style.display = 'block';
  
  // Add spacing effect
  element.classList.add('drag-spacing');
  if (insertBefore) {
    element.style.marginTop = '20px';
  } else {
    element.style.marginBottom = '20px';
  }
}

/**
 * Reset any row spacing created by the insert indicator
 */
function resetRowSpacing() {
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
 * Hide all visual indicators
 */
export function hideAll() {
  if (silhouetteElement) {
    silhouetteElement.style.display = 'none';
  }
  
  if (insertIndicatorElement) {
    insertIndicatorElement.style.display = 'none';
  }
  
  resetRowSpacing();
}

/**
 * Simplified drag start handler - compatible with legacy code
 * @param e The drag event
 * @param text The text to display in the silhouette
 */
export function createDragSilhouette(e: React.DragEvent, text: string) {
  // Set the proper drag effect
  e.dataTransfer.effectAllowed = 'move';
  
  // Show silhouette at start position
  showSilhouette(text, e.clientX, e.clientY);
  
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
  element.addEventListener('dragend', () => {
    hideAll();
    element.removeAttribute('data-dragging');
  }, { once: true });
}