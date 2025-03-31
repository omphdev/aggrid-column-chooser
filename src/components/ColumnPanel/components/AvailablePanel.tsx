import React from 'react';
import { ExtendedColDef } from '../../types';
import GroupHeader from './GroupHeader';
import ColumnItem from './ColumnItem';
import { getAllColumnsInGroup } from '../utils/treeUtils';

interface AvailablePanelProps {
  availableColumns: ExtendedColDef[];
  selectedItems: string[];
  expandedGroups: Set<string>;
  draggedColumnId: string | null;
  draggedGroupPath: string | null;
  groupDropTarget: string | null;
  dropTarget: string | null;
  availablePanelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onMoveToSelected: (columnIds: string[]) => void;
  onCreateGroup: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => void;
  onGroupDragStart: (e: React.DragEvent<HTMLDivElement>, groupPath: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string) => void;
  onContextMenu: (e: React.MouseEvent, groupPath?: string) => void;
  onToggleGroup: (e: React.MouseEvent, groupPath: string) => void;
}

const AvailablePanel: React.FC<AvailablePanelProps> = ({
  availableColumns,
  selectedItems,
  expandedGroups,
  draggedColumnId,
  draggedGroupPath,
  groupDropTarget,
  dropTarget,
  availablePanelRef,
  onSelect,
  onMoveToSelected,
  onCreateGroup,
  onDragStart,
  onGroupDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onContextMenu,
  onToggleGroup
}) => {
  // Function to create tree structure from columns
  const organizeColumnsIntoTree = (columns: ExtendedColDef[]) => {
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
                isAvailable={true}
                isSelected={selectedItems.includes(col.field)}
                isDragging={col.field === draggedColumnId}
                onSelect={onSelect}
                onDoubleClick={() => onMoveToSelected([col.field])}
                onContextMenu={(e) => onContextMenu(e)}
                onDragStart={(e, column) => onDragStart(e, column, true)}
              />
            ));
          } else {
            const currentPath = [...path, key];
            const pathString = currentPath.join('.');
            const isExpanded = expandedGroups.has(pathString);
            const isDropTarget = groupDropTarget === pathString;
            const isDragging = draggedGroupPath === pathString;
            
            // Count columns in this group
            const columnsInGroup = getAllColumnsInGroup(availableColumns, pathString);
            const columnCount = columnsInGroup.length;
            
            return (
              <div key={pathString} className="group-container">
                <GroupHeader
                  groupName={key}
                  isExpanded={isExpanded}
                  columnCount={columnCount}
                  isDropTarget={isDropTarget}
                  isDragging={isDragging}
                  level={level}
                  className="group-header"
                  onToggle={(e) => onToggleGroup(e, pathString)}
                  onDragStart={(e) => onGroupDragStart(e, pathString)}
                  onContextMenu={(e) => onContextMenu(e, pathString)}
                  onDragOver={(e) => onDragOver(e, 'available', pathString)}
                  onDrop={(e) => onDrop(e, 'available', pathString)}
                />
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
          className={`columns-list-container ${dropTarget === 'available' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'available')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'available')}
          onContextMenu={(e) => onContextMenu(e)}
        >
          <div className="columns-list">
            {renderTreeNode(availableColumnsTree)}
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <button 
          onClick={() => onMoveToSelected(selectedItems)} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => availableColumns.some(col => col.field === id))}
        >
          Add to Selected &gt;
        </button>
        {selectedItems.length > 0 && selectedItems.some(id => availableColumns.some(col => col.field === id)) && (
          <button onClick={onCreateGroup}>
            Create Group
          </button>
        )}
      </div>
    </div>
  );
};

export default AvailablePanel;