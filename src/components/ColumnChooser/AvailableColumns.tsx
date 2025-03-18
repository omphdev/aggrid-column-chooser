// src/components/ColumnChooser/AvailableColumns.tsx
import React from 'react';
import { AvailableColumnsProps } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';
import TreeView from '../TreeView';

/**
 * Component for displaying available columns in the column chooser
 */
export const AvailableColumns: React.FC<AvailableColumnsProps> = ({
  title = "Available Columns"
}) => {
  const {
    availableColumns,
    selectedAvailableCount,
    toggleExpandAvailable,
    toggleSelectAvailable,
    selectAllAvailable,
    clearSelectionAvailable,
    handleAvailableItemDragStart,
    handleDropToAvailable,
    handleDragOver
  } = useColumnContext();

  return (
    <div className="column-chooser-panel">
      <TreeView 
        items={availableColumns}
        onDragStart={handleAvailableItemDragStart}
        onDrop={handleDropToAvailable}
        onDragOver={handleDragOver}
        title={title}
        toggleExpand={toggleExpandAvailable}
        toggleSelect={toggleSelectAvailable}
        onSelectAll={selectAllAvailable}
        onClearSelection={clearSelectionAvailable}
        selectedCount={selectedAvailableCount}
      />
    </div>
  );
};

export default AvailableColumns;