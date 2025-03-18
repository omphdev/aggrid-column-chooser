// src/components/ColumnChooser/SelectedColumns.tsx
import React from 'react';
import { SelectedColumnsProps } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';
import TreeView from '../TreeView';

/**
 * Component for displaying selected columns in the column chooser
 */
export const SelectedColumns: React.FC<SelectedColumnsProps> = ({
  title = "Selected Columns",
  flatView,
  showGroupLabels = true
}) => {
  const {
    selectedColumns,
    selectedSelectedCount,
    toggleExpandSelected,
    toggleSelectSelected,
    selectAllSelected,
    clearSelectionSelected,
    handleSelectedItemDragStart,
    handleDropToSelected,
    handleDragOver,
    handleSelectedItemReorder,
    isFlatView
  } = useColumnContext();

  // Use the context's flatView value if prop is not provided
  const useFlatView = flatView !== undefined ? flatView : isFlatView;

  return (
    <div className="column-chooser-panel">
      <TreeView 
        items={selectedColumns}
        onDragStart={handleSelectedItemDragStart}
        onDrop={handleDropToSelected}
        onDragOver={handleDragOver}
        title={title}
        toggleExpand={toggleExpandSelected}
        toggleSelect={toggleSelectSelected}
        onSelectAll={selectAllSelected}
        onClearSelection={clearSelectionSelected}
        selectedCount={selectedSelectedCount}
        flatView={useFlatView}
        showGroupLabels={showGroupLabels}
        onItemReorder={handleSelectedItemReorder}
      />
    </div>
  );
};

export default SelectedColumns;