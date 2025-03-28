// src/components/ColumnChooser/components/shared/ActionButtons.tsx
import React from 'react';
import { useColumnChooser } from '../../context/ColumnChooserContext';

interface ActionButtonsProps {
  type: 'available' | 'selected';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ type }) => {
  const { state, dispatch, handleColumnSelectionChange } = useColumnChooser();
  
  // Helper to collect all available leaf node IDs
  const getAllAvailableLeafIds = () => {
    const ids: string[] = [];
    
    const collectIds = (nodes: typeof state.availableColumns) => {
      nodes.forEach(node => {
        if (!node.isGroup) {
          ids.push(node.id);
        }
        if (node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };

    collectIds(state.availableColumns);
    return ids;
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (type === 'available') {
      const allIds = getAllAvailableLeafIds();
      dispatch({ type: 'SET_SELECTED_AVAILABLE_IDS', payload: allIds });
    } else {
      const allIds = state.selectedColumns.map(col => col.id);
      dispatch({ type: 'SET_SELECTED_SELECTED_IDS', payload: allIds });
    }
  };
  
  // Handle clear selection
  const handleClearSelection = () => {
    if (type === 'available') {
      dispatch({ type: 'SET_SELECTED_AVAILABLE_IDS', payload: [] });
    } else {
      dispatch({ type: 'SET_SELECTED_SELECTED_IDS', payload: [] });
    }
  };
  
  // Handle clear all selected columns (move all to available)
  const handleClearAllSelected = () => {
    handleColumnSelectionChange({
      items: state.selectedColumns.map(node => node.column),
      operationType: 'REMOVE'
    });
  };
  
  // Handle move up/down in selected panel
  const handleMoveUpDown = (direction: 'up' | 'down') => {
    if (state.selectedSelectedIds.length === 0) return;

    // Create a new array with the current order
    const newOrder = [...state.selectedColumns];
    const indices = state.selectedSelectedIds.map(id => 
      newOrder.findIndex(col => col.id === id)
    ).sort(direction === 'up' ? (a, b) => a - b : (a, b) => b - a);

    // Move each selected item
    indices.forEach(idx => {
      const newIdx = direction === 'up' 
        ? Math.max(0, idx - 1) 
        : Math.min(newOrder.length - 1, idx + 1);
      
      if (idx !== newIdx) {
        const [removed] = newOrder.splice(idx, 1);
        newOrder.splice(newIdx, 0, removed);
      }
    });

    // Send the reorder event
    handleColumnSelectionChange({
      items: newOrder.map(node => node.column),
      operationType: 'REORDER'
    });
  };
  
  // Render appropriate buttons based on type
  if (type === 'available') {
    return (
      <div className="available-actions">
        <button onClick={handleSelectAll}>Select All Available</button>
        <button 
          onClick={handleClearSelection} 
          disabled={state.selectedAvailableIds.length === 0}
        >
          Clear Selection
        </button>
      </div>
    );
  } else {
    return (
      <div className="selected-actions">
        <button onClick={handleSelectAll}>Select All Selected</button>
        <button 
          onClick={handleClearSelection} 
          disabled={state.selectedSelectedIds.length === 0}
        >
          Clear Selection
        </button>
        <button 
          onClick={handleClearAllSelected} 
          disabled={state.selectedColumns.length === 0}
        >
          Clear All
        </button>
        <button 
          onClick={() => handleMoveUpDown('up')} 
          disabled={state.selectedSelectedIds.length === 0}
        >
          Move Up
        </button>
        <button 
          onClick={() => handleMoveUpDown('down')} 
          disabled={state.selectedSelectedIds.length === 0}
        >
          Move Down
        </button>
      </div>
    );
  }
};

export default ActionButtons;
