// src/utils/dragSilhouette.ts
// Global silhouette utility for drag operations

// Track if the silhouette is already initialized
let isInitialized = false;

// Reference to the DOM element
let silhouetteElement: HTMLDivElement | null = null;

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
  `;
  document.head.appendChild(styleSheet);
  
  // Add to document
  document.body.appendChild(silhouetteElement);
  
  // Add global mouse move listener to update position
  document.addEventListener('mousemove', handleGlobalMouseMove);
  
  // Add global drag end listener to hide
  document.addEventListener('dragend', hideSilhouette);
  
  // Add global drop listener to hide
  document.addEventListener('drop', hideSilhouette);
  
  // Track when dragging leaves the window
  document.addEventListener('mouseleave', hideSilhouette);
  
  // Also handle cases where the drag operation is canceled
  document.addEventListener('dragcancel', hideSilhouette);
  document.addEventListener('dragleave', handleDragLeave);
  
  // Handle the case when user presses Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentDraggedItem.isActive) {
      hideSilhouette();
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
  
  document.removeEventListener('mousemove', handleGlobalMouseMove);
  document.removeEventListener('dragend', hideSilhouette);
  document.removeEventListener('drop', hideSilhouette);
  document.removeEventListener('mouseleave', hideSilhouette);
  document.removeEventListener('dragcancel', hideSilhouette);
  document.removeEventListener('dragleave', handleDragLeave);
  
  silhouetteElement = null;
  isInitialized = false;
}

/**
 * Handle when the drag leaves the document
 */
function handleDragLeave(e: DragEvent) {
  // Check if leaving the document
  const toElement = e.relatedTarget as HTMLElement;
  if (!toElement || toElement.tagName === 'HTML') {
    hideSilhouette();
  }
}

/**
 * Update silhouette position based on mouse movement
 */
function handleGlobalMouseMove(e: MouseEvent) {
  if (!silhouetteElement || !currentDraggedItem.isActive) return;
  
  // Update position with offset
  silhouetteElement.style.left = `${e.clientX + OFFSET_X}px`;
  silhouetteElement.style.top = `${e.clientY + OFFSET_Y}px`;
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
 * Hide the silhouette
 */
export function hideSilhouette() {
  if (!silhouetteElement) return;
  
  silhouetteElement.style.display = 'none';
  currentDraggedItem.isActive = false;
}

/**
 * Get the current drag state
 */
export function getDragState() {
  return {
    isActive: currentDraggedItem.isActive,
    text: currentDraggedItem.text
  };
}

/**
 * Helper function to handle dragStart events
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
      document.body.removeChild(emptyImg);
    }, 100);
  }
  
  // Safety check: Ensure silhouette gets hidden when drag ends
  // by adding an event listener directly to the dragged element
  const element = e.currentTarget as HTMLElement;
  
  // Using one-time event listeners to clean up
  element.addEventListener('dragend', () => {
    hideSilhouette();
  }, { once: true });
}