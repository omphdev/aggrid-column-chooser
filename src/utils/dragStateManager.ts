// utils/dragStateManager.ts

/**
 * A utility to manage drag state across different tree view panels.
 * This helps ensure only one panel shows a drop indicator at a time.
 */
export const DragStateManager = {
    // Tracks which panel is currently being dragged over
    activeDropTargetId: null as string | null,
    
    /**
     * Sets the active drop target
     * @param id The component ID of the active drop target
     */
    setActiveDropTarget(id: string | null) {
      this.activeDropTargetId = id;
    },
    
    /**
     * Gets the current active drop target ID
     * @returns The ID of the active drop target, or null if none
     */
    getActiveDropTarget() {
      return this.activeDropTargetId;
    },
    
    /**
     * Checks if the given ID is the current active drop target
     * @param id The ID to check
     * @returns True if the ID is the active drop target
     */
    isActive(id: string) {
      return this.activeDropTargetId === id;
    }
  };