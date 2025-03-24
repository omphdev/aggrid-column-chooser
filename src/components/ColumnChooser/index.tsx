// src/components/ColumnChooser/index.jsx
import React, { useState } from 'react';
import { columnChooserStyles } from '../../styles/ColumnChooserStyles';
import { createClasses, cx } from '../../utils/styleUtils';
import AvailableColumns from './AvailableColumns';
import SelectedColumns from './SelectedColumns';
import useColumnManagement from '../../hooks/useColumnManagement';

// Create classes from styles
const classes = createClasses(columnChooserStyles, 'cc');

const ColumnChooser = ({
  availableColumns,
  selectedColumns,
  isFlatView,
  columnGroups,
  onSelectedColumnsChange,
  onColumnGroupsChange
}) => {
  // Use the column management hook for all operations
  const columnManagement = useColumnManagement({
    availableColumns,
    selectedColumns,
    isFlatView,
    columnGroups,
    onSelectedColumnsChange,
    onColumnGroupsChange
  });
  
  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <h3 className={classes.title}>Column Chooser</h3>
        
        <div className={classes.controls}>
          <div className={classes.searchContainer}>
            <input
              type="text"
              placeholder="Search columns..."
              value={columnManagement.searchTerm}
              onChange={(e) => columnManagement.setSearchTerm(e.target.value)}
              className={classes.searchInput}
            />
            <label className={classes.searchToggle}>
              <input
                type="checkbox"
                checked={columnManagement.searchOnlyAvailable}
                onChange={(e) => columnManagement.setSearchOnlyAvailable(e.target.checked)}
                className={classes.checkbox}
              />
              <span>Filter only on available</span>
            </label>
          </div>

          <label className={classes.flatViewToggle}>
            <input
              type="checkbox"
              checked={isFlatView}
              onChange={(e) => columnManagement.setFlatView(e.target.checked)}
              className={classes.checkbox}
            />
            <span>Available Columns Tree View</span>
          </label>
        </div>
      </div>
      
      <div className={classes.panels}>
        <div className={classes.panelContainer}>
          <AvailableColumns 
            columns={columnManagement.filteredAvailableColumns}
            selectedIds={columnManagement.selectedAvailableIds}
            leafCount={columnManagement.availableLeafCount}
            toggleExpand={columnManagement.toggleExpandAvailable}
            toggleSelect={columnManagement.toggleSelectAvailable}
            selectAll={columnManagement.selectAllAvailable}
            clearSelection={columnManagement.clearSelectionAvailable}
            getSelectedCount={columnManagement.getSelectedAvailableCount}
            moveItemsToSelected={columnManagement.moveItemsToSelected}
            moveItemsToAvailable={columnManagement.moveItemsToAvailable}
            onDoubleClick={columnManagement.moveItemToSelected}
            classes={classes}
          />
        </div>
        
        <div className={classes.panelContainer}>
          <SelectedColumns 
            columns={columnManagement.filteredSelectedColumns}
            selectedIds={columnManagement.selectedSelectedIds}
            leafCount={columnManagement.selectedLeafCount}
            toggleSelect={columnManagement.toggleSelectSelected}
            selectAll={columnManagement.selectAllSelected}
            clearSelection={columnManagement.clearSelectionSelected}
            getSelectedCount={columnManagement.getSelectedSelectedCount}
            moveItemsToAvailable={columnManagement.moveItemsToAvailable}
            moveItemsToSelected={columnManagement.moveItemsToSelected}
            reorderItems={columnManagement.reorderSelectedItems}
            moveSelectedUp={columnManagement.moveSelectedUp}
            moveSelectedDown={columnManagement.moveSelectedDown}
            clearSelected={columnManagement.clearSelected}
            onDoubleClick={columnManagement.moveItemToAvailable}
            columnGroups={columnGroups}
            onColumnGroupsChange={columnManagement.updateColumnGroups}
            onAddToGroup={columnManagement.addColumnsToGroup}
            onRemoveFromGroup={columnManagement.removeColumnsFromGroup}
            onCreateGroup={columnManagement.createColumnGroup}
            onDeleteGroup={columnManagement.deleteColumnGroup}
            onRenameGroup={columnManagement.renameColumnGroup}
            onReorderGroups={columnManagement.reorderColumnGroups}
            classes={classes}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ColumnChooser);