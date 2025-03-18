// src/components/DragDrop/DragSilhouette.tsx
import React, { useEffect } from 'react';
import { initializeDragSilhouette, cleanupDragSilhouette } from '../../utils/dragSilhouette';

/**
 * Component that initializes and cleans up the drag silhouette system
 * This should be rendered once at the app root level
 */
const DragSilhouette: React.FC = () => {
  // Initialize on mount, clean up on unmount
  useEffect(() => {
    // Initialize the drag silhouette system
    initializeDragSilhouette();

    // Clean up when the component unmounts
    return () => {
      cleanupDragSilhouette();
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default DragSilhouette;