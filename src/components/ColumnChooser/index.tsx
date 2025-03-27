import React, { useCallback, useState } from 'react';
import { ColumnItem, ColumnGroup } from '../../types';
import AvailableColumns from './AvailableColumns';
import SelectedColumns from './SelectedColumns';
import useColumnManagement from '../../hooks/useColumnManagement';
import './ColumnChooser.css';

interface ColumnChooserProps {
  availableColumns: ColumnItem[];
  selectedColumns: ColumnItem[];
  isFlatView: boolean;
  columnGroups: ColumnGroup[];
  onSelectedColumnsChange: (columnIds: string[]) => void;
  onColumnGroupsChange: (columnGroups: ColumnGroup[]) => void;
}

const ColumnChooser: React.FC<ColumnChooserProps> = ({
  availableColumns,
  selectedColumns,
  isFlatView,
  columnGroups,
  onSelectedColumnsChange,
  onColumnGroupsChange
}) => {
  // Local state for search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOnlyAvailable, setSearchOnlyAvailable] = useState(true);
  
  // Use the column management hook for all operations
  const columnManagement = useColumnManagement({
    availableColumns,
    selectedColumns,
    isFlatView,
    columnGroups,
    onSelectedColumnsChange,
    onColumnGroupsChange
  });
  
  // Handle search term change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  // Handle search filter toggle
  const handleSearchFilterToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchOnlyAvailable(e.target.checked);
  }, []);
  
  return (
    <div className="column-chooser">
      <div className="column-chooser-header">
        <h3 className="column-chooser-title">Column Chooser</h3>
        
        <div className="column-chooser-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={handleSearchChange}
              className={"search-input"}
            />
            <label className={"search-toggle"}>
              <input
                type="checkbox"
                checked={searchOnlyAvailable}
                onChange={handleSearchFilterToggle}
                className={"checkbox"}
              />
              <span>Filter only on available</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="column-chooser-panels">
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
        />
        
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
        />
      </div>
    </div>
  );
};

export default React.memo(ColumnChooser);
