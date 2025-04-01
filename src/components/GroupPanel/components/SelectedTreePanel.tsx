import React from 'react';
import { ExtendedColDef } from '../../types';
import GroupHeader from '../../ColumnPanel/components/GroupHeader';
import ColumnItem from '../../ColumnPanel/components/ColumnItem';

interface SelectedTreePanelProps {
  selectedColumns: ExtendedColDef[];
  selectedItems: string[];
  expandedGroups: Set<string>;
  draggedColumnId: string | null;
  dropTarget: string | null;
  selectedPanelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onMoveToAvailable: (columnIds: string[]) => void;
  onClearAll: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onToggleGroup: (e: React.MouseEvent, groupPath: string) => void;
}

const SelectedTreePanel: React.FC<SelectedTreePanelProps> = ({
  selectedColumns,
  selectedItems,
  expandedGroups,
  draggedColumnId,
  dropTarget,
  selectedPanelRef,
  onSelect,
  onMoveToAvailable,
  onClearAll,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleGroup
}) => {
  // Function to create tree structure from columns
  const organizeColumnsIntoTree = (columns: ExtendedColDef[]) => {
    const tree: any = {};
    
    columns.forEach(col => {
      const groupPath = col.groupPath || [];
      // Exclude the last element (field name) from the group path
      const groupPathWithoutField = groupPath.slice(0, -1);
      
      let current = tree;
      
      groupPathWithoutField.forEach(group => {
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
  };

  // Function to count columns in a group
  const countColumnsInGroup = (node: any): number => {
    let count = node.columns ? node.columns.length : 0;
    
    Object.entries(node).forEach(([key, value]: [string, any]) => {
      if (key !== 'columns') {
        count += countColumnsInGroup(value);
      }
    });
    
    return count;
  };

  // Function to render tree nodes recursively
  const renderTreeNode = (node: any, path: string[] = [], level = 0) => {
    const entries = Object.entries(node);
    
    return (
      <>
        {entries.map(([key, value]: [string, any]) => {
          if (key === 'columns') {
            return (value as ExtendedColDef[]).map((col, idx) => (
              <ColumnItem
                key={col.field}
                column={col}
                index={idx}
                isAvailable={false}
                isSelected={selectedItems.includes(col.field)}
                isDragging={col.field === draggedColumnId}
                onSelect={onSelect}
                onDoubleClick={() => onMoveToAvailable([col.field])}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e, column) => onDragStart(e, column, false)}
              />
            ));
          } else {
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');
            const isExpanded = expandedGroups.has(pathString);
            
            // Count columns in this group
            const columnCount = countColumnsInGroup(value);
            
            // Only show the group if it contains columns
            if (columnCount === 0) return null;
            
            return (
              <div key={pathString} className="group-container-selected">
                <GroupHeader
                  groupName={key}
                  isExpanded={isExpanded}
                  columnCount={columnCount}
                  isDropTarget={false}
                  isDragging={false}
                  level={level}
                  className="selected-group-header"
                  onToggle={(e) => onToggleGroup(e, pathString)}
                  onDragStart={(e) => e.preventDefault()} // No drag for groups in selected panel
                  onContextMenu={(e) => e.preventDefault()}
                  onDragOver={(e) => onDragOver(e, 'selected', pathString)}
                  onDrop={(e) => onDrop(e, 'selected', pathString)}
                />
                {isExpanded && renderTreeNode(value, currentPath, level + 1)}
              </div>
            );
          }
        })}
      </>
    );
  };

  // Handle columns that don't have a group path
  const handleUngroupedColumns = () => {
    const ungroupedColumns = selectedColumns.filter(col => !col.groupPath || col.groupPath.length === 0);
    
    if (ungroupedColumns.length === 0) return null;
    
    return ungroupedColumns.map((col, idx) => (
      <ColumnItem
        key={col.field}
        column={col}
        index={idx}
        isAvailable={false}
        isSelected={selectedItems.includes(col.field)}
        isDragging={col.field === draggedColumnId}
        onSelect={onSelect}
        onDoubleClick={() => onMoveToAvailable([col.field])}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e, column) => onDragStart(e, column, false)}
      />
    ));
  };

  // Organize selected columns into a tree structure
  const selectedColumnsTree = organizeColumnsIntoTree(selectedColumns);

  return (
    <div className="panel-section selected-columns">
      <div className="panel-header">
        <h3>Selected Groups</h3>
        <div className="column-count">
          {selectedColumns.length} columns
        </div>
      </div>
      <div className="panel-content">
        <div 
          ref={selectedPanelRef}
          className={`columns-list-container ${dropTarget === 'selected' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'selected')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'selected')}
        >
          <div className="columns-list">
            {/* Render ungrouped columns first */}
            {handleUngroupedColumns()}
            
            {/* Render tree structure */}
            {renderTreeNode(selectedColumnsTree)}
            
            {/* Empty state message */}
            {selectedColumns.length === 0 && (
              <div className="empty-message">Drag groups or columns here</div>
            )}
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <button 
          onClick={() => onMoveToAvailable(selectedItems)} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
        >
          &lt; Remove from Selected
        </button>
        <button 
          onClick={onClearAll} 
          disabled={selectedColumns.length === 0}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default SelectedTreePanel;