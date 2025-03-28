import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ColumnPanelProps, ExtendedColDef, ColumnGroup, OperationType } from './types';

const ColumnPanel: React.FC<ColumnPanelProps> = ({ 
  columnDefs, 
  columnGroups, 
  onColumnChanged, 
  onColumnGroupChanged 
}) => {
  // State for available and selected columns
  const [availableColumns, setAvailableColumns] = useState<ExtendedColDef[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ExtendedColDef[]>([]);
  
  // State for selected items
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // State for expanded groups in available columns
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // State for drop indicator
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number>(-1);
  
  // Refs for the panels
  const availablePanelRef = useRef<HTMLDivElement>(null);
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  // Initialize columns on mount and when columnDefs change
  useEffect(() => {
    // Create initial available columns (columns with hide: true)
    setAvailableColumns(columnDefs.filter(col => col.hide === true));
    
    // Create initial selected columns (columns with hide: false or undefined)
    setSelectedColumns(columnDefs.filter(col => col.hide !== true));
    
    // Set first level groups as expanded by default
    const firstLevelGroups = new Set<string>();
    columnDefs.forEach(col => {
      if (col.groupPath && col.groupPath.length > 0) {
        firstLevelGroups.add(col.groupPath[0]);
      }
    });
    setExpandedGroups(firstLevelGroups);
  }, [columnDefs]);

  // Function to organize columns into a tree structure
  const organizeColumnsIntoTree = useCallback((columns: ExtendedColDef[]) => {
    const tree: any = {};
    
    columns.forEach(col => {
      const groupPath = col.groupPath || [];
      
      let current = tree;
      
      groupPath.forEach(group => {
        if (!current[group]) {
          current[group] = {};
        }
        current = current[group];
      });
      
      if (!current.columns) {
        current.columns = [];
      }
      
      current.columns.push(col);
    });
    
    return tree;
  }, []);

  // Function to toggle group expansion
  const toggleGroup = (groupPath: string) => {
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedGroups(newExpandedGroups);
  };

  // Function to handle selection of a column
  const handleSelect = (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    let newSelectedItems = [...selectedItems];
    
    if (isMultiSelect) {
      // Toggle selection for multi-select (Ctrl/Cmd+click)
      if (newSelectedItems.includes(columnId)) {
        newSelectedItems = newSelectedItems.filter(id => id !== columnId);
      } else {
        newSelectedItems.push(columnId);
      }
    } else if (isRangeSelect) {
      // Range selection (Shift+click)
      if (newSelectedItems.length > 0) {
        const lastSelectedId = newSelectedItems[newSelectedItems.length - 1];
        const allColumns = [...availableColumns, ...selectedColumns];
        
        const lastSelectedIndex = allColumns.findIndex(col => col.field === lastSelectedId);
        const currentIndex = allColumns.findIndex(col => col.field === columnId);
        
        if (lastSelectedIndex !== -1 && currentIndex !== -1) {
          const startIndex = Math.min(lastSelectedIndex, currentIndex);
          const endIndex = Math.max(lastSelectedIndex, currentIndex);
          
          const rangeIds = allColumns
            .slice(startIndex, endIndex + 1)
            .map(col => col.field);
            
          newSelectedItems = Array.from(new Set([...newSelectedItems, ...rangeIds]));
        }
      } else {
        newSelectedItems = [columnId];
      }
    } else {
      // Single selection (regular click)
      newSelectedItems = [columnId];
    }
    
    setSelectedItems(newSelectedItems);
  };

  // Function to move columns from available to selected
  const moveToSelected = (columnIds: string[] = selectedItems, targetIndex?: number) => {
    if (columnIds.length === 0) return;
    
    // Find columns in available that are selected
    const columnsToMove = availableColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from available
    const newAvailableColumns = availableColumns.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Update hide property for columns being moved
    const updatedColumnsToMove = columnsToMove.map(col => ({
      ...col,
      hide: false
    }));
    
    // Add columns to selected at the specified index or at the end
    let newSelectedColumns: ExtendedColDef[] = [...selectedColumns];
    
    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newSelectedColumns.length) {
      // Insert at specific index
      newSelectedColumns = [
        ...newSelectedColumns.slice(0, targetIndex),
        ...updatedColumnsToMove,
        ...newSelectedColumns.slice(targetIndex)
      ];
    } else {
      // Append to the end
      newSelectedColumns = [...newSelectedColumns, ...updatedColumnsToMove];
    }
    
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns(newSelectedColumns);
    setSelectedItems([]);
    
    onColumnChanged(newSelectedColumns, 'ADD');
  };

  // Function to move columns from selected to available
  const moveToAvailable = (columnIds: string[] = selectedItems) => {
    if (columnIds.length === 0) return;
    
    // Find columns in selected that are selected
    const columnsToMove = selectedColumns.filter(col => 
      columnIds.includes(col.field)
    );
    
    if (columnsToMove.length === 0) return;
    
    // Remove columns from selected
    const newSelectedColumns = selectedColumns.filter(col => 
      !columnIds.includes(col.field)
    );
    
    // Update hide property for columns being moved
    const updatedColumnsToMove = columnsToMove.map(col => ({
      ...col,
      hide: true
    }));
    
    // Add columns to available
    const newAvailableColumns = [...availableColumns, ...updatedColumnsToMove];
    
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns(newSelectedColumns);
    setSelectedItems([]);
    
    onColumnChanged(newSelectedColumns, 'REMOVED');
  };

  // Function to move selected columns up in the selected panel
  const moveUp = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedColumns = [...selectedColumns];
    const indices = selectedItems
      .map(id => newSelectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);
    
    // Can't move up if the first selected item is already at the top
    if (indices[0] === 0) return;
    
    // Move each selected item up one position
    indices.forEach(index => {
      const temp = newSelectedColumns[index];
      newSelectedColumns[index] = newSelectedColumns[index - 1];
      newSelectedColumns[index - 1] = temp;
    });
    
    setSelectedColumns(newSelectedColumns);
    onColumnChanged(newSelectedColumns, 'REORDERED');
  };

  // Function to move selected columns down in the selected panel
  const moveDown = () => {
    if (selectedItems.length === 0) return;
    
    const newSelectedColumns = [...selectedColumns];
    const indices = selectedItems
      .map(id => newSelectedColumns.findIndex(col => col.field === id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // Sort in descending order for moving down
    
    // Can't move down if the last selected item is already at the bottom
    if (indices[0] === newSelectedColumns.length - 1) return;
    
    // Move each selected item down one position
    indices.forEach(index => {
      const temp = newSelectedColumns[index];
      newSelectedColumns[index] = newSelectedColumns[index + 1];
      newSelectedColumns[index + 1] = temp;
    });
    
    setSelectedColumns(newSelectedColumns);
    onColumnChanged(newSelectedColumns, 'REORDERED');
  };

  // Function to clear all selected columns
  const clearAll = () => {
    // Update hide property for all selected columns
    const updatedColumns = selectedColumns.map(col => ({
      ...col,
      hide: true
    }));
    
    // Move all selected columns to available
    const newAvailableColumns = [...availableColumns, ...updatedColumns];
    
    setAvailableColumns(newAvailableColumns);
    setSelectedColumns([]);
    setSelectedItems([]);
    
    onColumnChanged([], 'REMOVED');
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => {
    e.dataTransfer.setData('columnId', column.field);
    e.dataTransfer.setData('sourcePanel', isAvailable ? 'available' : 'selected');
  };

  // IMPROVED: Direct calculation of drop index
  const calculateDropIndex = (e: React.DragEvent<HTMLDivElement>) => {
    // Get all column items directly from the selected panel
    const columnItems = selectedPanelRef.current?.querySelectorAll('.column-item');
    if (!columnItems || columnItems.length === 0) return 0;
    
    const mouseY = e.clientY;
    
    // Loop through each item and check if mouse is above its middle point
    for (let i = 0; i < columnItems.length; i++) {
      const itemRect = columnItems[i].getBoundingClientRect();
      const itemMiddle = itemRect.top + (itemRect.height / 2);
      
      if (mouseY < itemMiddle) {
        return i;
      }
    }
    
    // If mouse is below all items, drop at the end
    return columnItems.length;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, panel: string) => {
    e.preventDefault();
    
    if (panel === 'selected') {
      // Calculate drop index directly based on mouse position
      const index = calculateDropIndex(e);
      setDropIndicatorIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropIndicatorIndex(-1);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, panel: string) => {
    e.preventDefault();
    
    const columnId = e.dataTransfer.getData('columnId');
    const sourcePanel = e.dataTransfer.getData('sourcePanel');
    
    if (sourcePanel === 'available' && panel === 'selected') {
      // Use the calculated drop index
      moveToSelected([columnId], dropIndicatorIndex);
    } else if (sourcePanel === 'selected' && panel === 'available') {
      moveToAvailable([columnId]);
    }
    
    setDropIndicatorIndex(-1);
  };

  // Render column item
  const renderColumnItem = (column: ExtendedColDef, index: number, isAvailable: boolean) => {
    return (
      <div
        key={column.field}
        className={`column-item draggable ${selectedItems.includes(column.field) ? 'selected' : ''}`}
        onClick={(e) => handleSelect(
          column.field, 
          e.ctrlKey || e.metaKey, 
          e.shiftKey
        )}
        onDoubleClick={() => {
          handleSelect(column.field, false, false);
          isAvailable ? moveToSelected([column.field]) : moveToAvailable([column.field]);
        }}
        draggable
        onDragStart={(e) => handleDragStart(e, column, isAvailable)}
      >
        {column.headerName || column.field}
      </div>
    );
  };

  // Render tree structure for available columns
  const renderTreeNode = (node: any, path: string[] = [], level = 0) => {
    const entries = Object.entries(node);
    
    return (
      <>
        {entries.map(([key, value]: [string, any]) => {
          if (key === 'columns') {
            return (value as ExtendedColDef[]).map((col, idx) => renderColumnItem(col, idx, true));
          } else {
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');
            const isExpanded = expandedGroups.has(pathString);
            
            return (
              <div key={pathString}>
                <div
                  className="group-header"
                  style={{ paddingLeft: `${level * 20}px` }}
                  onClick={() => toggleGroup(pathString)}
                >
                  <span className="expand-icon">
                    {isExpanded ? '−' : '+'}
                  </span>
                  {key}
                </div>
                {isExpanded && renderTreeNode(value, currentPath, level + 1)}
              </div>
            );
          }
        })}
      </>
    );
  };

  // Organize available columns into a tree structure
  const availableColumnsTree = organizeColumnsIntoTree(availableColumns);

  return (
    <div className="column-panel">
      <div className="panel-container">
        <div className="panel-section available-columns">
          <div className="panel-header">
            <h3>Available Columns</h3>
            <div className="column-count">
              {availableColumns.length} columns
            </div>
          </div>
          <div className="panel-content">
            <div 
              ref={availablePanelRef}
              className="columns-list-container"
              onDragOver={(e) => handleDragOver(e, 'available')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'available')}
            >
              <div className="columns-list">
                {renderTreeNode(availableColumnsTree)}
              </div>
            </div>
          </div>
          <div className="panel-footer">
            <button 
              onClick={() => moveToSelected()} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => availableColumns.some(col => col.field === id))}
            >
              Add to Selected &gt;
            </button>
          </div>
        </div>
        
        <div className="panel-section selected-columns">
          <div className="panel-header">
            <h3>Selected Columns</h3>
            <div className="column-count">
              {selectedColumns.length} columns
            </div>
          </div>
          <div className="panel-content">
            <div 
              ref={selectedPanelRef}
              className="columns-list-container"
              onDragOver={(e) => handleDragOver(e, 'selected')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'selected')}
            >
              <div className="columns-list">
                {/* Drop indicator at the top */}
                {dropIndicatorIndex === 0 && (
                  <div className="drop-indicator"></div>
                )}
                
                {selectedColumns.map((column, index) => (
                  <React.Fragment key={column.field}>
                    {renderColumnItem(column, index, false)}
                    {/* Drop indicator after this item */}
                    {dropIndicatorIndex === index + 1 && (
                      <div className="drop-indicator"></div>
                    )}
                  </React.Fragment>
                ))}
                
                {/* If list is empty, show drop indicator in empty state */}
                {selectedColumns.length === 0 && dropIndicatorIndex === 0 && (
                  <div className="drop-indicator"></div>
                )}
              </div>
            </div>
          </div>
          <div className="panel-footer">
            <button 
              onClick={() => moveToAvailable()} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              &lt; Remove from Selected
            </button>
            <button 
              onClick={moveUp} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              Move Up
            </button>
            <button 
              onClick={moveDown} 
              disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
            >
              Move Down
            </button>
            <button 
              onClick={clearAll} 
              disabled={selectedColumns.length === 0}
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnPanel;