import React, { useCallback } from 'react';
import { useColumnChooser } from '../context/ColumnChooserContext';

interface ActionButtonsProps {
  className?: string;
  panel: 'available' | 'selected';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  className = '',
  panel
}) => {
  // Access context
  const { 
    state: { selectedItems, availableColumns, selectedColumns },
    addToSelected,
    removeFromSelected,
    moveUp,
    moveDown,
    clearAll,
    createGroup
  } = useColumnChooser();
  
  // Check if selection is valid for the panel
  const hasValidSelection = panel === 'available'
    ? selectedItems.some(id => availableColumns.some(col => col.field === id))
    : selectedItems.some(id => selectedColumns.some(col => col.field === id));
  
  // Move to selected handler
  const handleMoveToSelected = useCallback(() => {
    if (!hasValidSelection) return;
    
    // Only add items that are in available columns
    const availableSelectedItems = selectedItems.filter(id => 
      availableColumns.some(col => col.field === id)
    );
    
    if (availableSelectedItems.length > 0) {
      addToSelected(availableSelectedItems);
    }
  }, [selectedItems, availableColumns, addToSelected, hasValidSelection]);
  
  // Move to available handler
  const handleMoveToAvailable = useCallback(() => {
    if (!hasValidSelection) return;
    
    // Only remove items that are in selected columns
    const selectedColumnsItems = selectedItems.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (selectedColumnsItems.length > 0) {
      removeFromSelected(selectedColumnsItems);
    }
  }, [selectedItems, selectedColumns, removeFromSelected, hasValidSelection]);
  
  // Create group handler
  const handleCreateGroup = useCallback(() => {
    if (!hasValidSelection) return;
    
    // Get items based on which panel we're in
    const validItems = panel === 'available'
      ? selectedItems.filter(id => availableColumns.some(col => col.field === id))
      : selectedItems.filter(id => selectedColumns.some(col => col.field === id));
    
    if (validItems.length > 0) {
      // Prompt for group name
      const groupName = prompt('Enter group name:');
      if (groupName) {
        createGroup(groupName, validItems);
      }
    }
  }, [
    panel, selectedItems, availableColumns, selectedColumns, 
    createGroup, hasValidSelection
  ]);
  
  // Move up handler
  const handleMoveUp = useCallback(() => {
    if (!hasValidSelection || panel !== 'selected') return;
    moveUp(selectedItems);
  }, [selectedItems, moveUp, hasValidSelection, panel]);
  
  // Move down handler
  const handleMoveDown = useCallback(() => {
    if (!hasValidSelection || panel !== 'selected') return;
    moveDown(selectedItems);
  }, [selectedItems, moveDown, hasValidSelection, panel]);
  
  // Clear all handler
  const handleClearAll = useCallback(() => {
    if (selectedColumns.length === 0) return;
    clearAll();
  }, [selectedColumns, clearAll]);
  
  if (panel === 'available') {
    return (
      <div className={`action-buttons ${className}`}>
        <button 
          onClick={handleMoveToSelected} 
          disabled={!hasValidSelection}
          className="action-button"
        >
          Add to Selected &gt;
        </button>
        <button 
          onClick={handleCreateGroup}
          disabled={!hasValidSelection}
          className="action-button"
        >
          Create Group
        </button>
      </div>
    );
  }
  
  return (
    <div className={`action-buttons ${className}`}>
      <button 
        onClick={handleMoveToAvailable} 
        disabled={!hasValidSelection}
        className="action-button"
      >
        &lt; Remove
      </button>
      <button 
        onClick={handleMoveUp} 
        disabled={!hasValidSelection}
        className="action-button"
      >
        Move Up
      </button>
      <button 
        onClick={handleMoveDown}
        disabled={!hasValidSelection}
        className="action-button"
      >
        Move Down
      </button>
      <button 
        onClick={handleCreateGroup}
        disabled={!hasValidSelection}
        className="action-button"
      >
        Create Group
      </button>
      <button 
        onClick={handleClearAll}
        disabled={selectedColumns.length === 0}
        className="action-button clear-all"
      >
        Clear All
      </button>
    </div>
  );
};

export default React.memo(ActionButtons);