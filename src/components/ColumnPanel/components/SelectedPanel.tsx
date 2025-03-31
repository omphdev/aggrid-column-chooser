import React from 'react';
import { ExtendedColDef, ColumnGroup } from '../../types';
import GroupHeader from './GroupHeader';
import ColumnItem from './ColumnItem';
import { organizeSelectedColumnsByGroups } from '../utils/treeUtils';

interface SelectedPanelProps {
  selectedColumns: ExtendedColDef[];
  selectedItems: string[];
  columnGroups: ColumnGroup[];
  expandedSelectedGroups: Set<string>;
  draggedColumnId: string | null;
  draggedColumnGroup: string | null;
  selectedGroupDropTarget: string | null;
  dropTarget: string | null;
  dropIndicatorIndex: number;
  groupDropIndicatorIndices: {[groupName: string]: number};
  selectedPanelRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (columnId: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onMoveToAvailable: (columnIds: string[]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClearAll: () => void;
  onCreateSelectedGroup: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, column: ExtendedColDef, isAvailable: boolean) => void;
  onSelectedGroupDragStart: (e: React.DragEvent<HTMLDivElement>, groupName: string) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, panel: string, groupPath?: string, groupName?: string) => void;
  onContextMenu: (e: React.MouseEvent, groupPath?: string, inSelectedPanel?: boolean, groupName?: string) => void;
  onToggleSelectedGroup: (e: React.MouseEvent, groupName: string) => void;
}

const SelectedPanel: React.FC<SelectedPanelProps> = ({
  selectedColumns,
  selectedItems,
  columnGroups,
  expandedSelectedGroups,
  draggedColumnId,
  draggedColumnGroup,
  selectedGroupDropTarget,
  dropTarget,
  dropIndicatorIndex,
  groupDropIndicatorIndices,
  selectedPanelRef,
  onSelect,
  onMoveToAvailable,
  onMoveUp,
  onMoveDown,
  onClearAll,
  onCreateSelectedGroup,
  onDragStart,
  onSelectedGroupDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onContextMenu,
  onToggleSelectedGroup
}) => {
  // Render selected columns with groups
  const renderSelectedColumns = () => {
    // Get organized structure with groups
    const organizedStructure = organizeSelectedColumnsByGroups(selectedColumns, columnGroups);
    
    return (
      <>
        {/* Drop indicator at the top */}
        {dropIndicatorIndex === 0 && (
          <div className="drop-indicator"></div>
        )}
        
        {organizedStructure.map((item, index) => {
          if (item.type === 'column') {
            // Render individual column
            return (
              <React.Fragment key={item.field}>
                <ColumnItem
                  column={item.column!}
                  index={index}
                  isAvailable={false}
                  isSelected={selectedItems.includes(item.field!)}
                  isDragging={item.field === draggedColumnId}
                  onSelect={onSelect}
                  onDoubleClick={() => onMoveToAvailable([item.field!])}
                  onContextMenu={(e) => onContextMenu(e, undefined, true)}
                  onDragStart={(e, column) => onDragStart(e, column, false)}
                />
                {/* Drop indicator after this item */}
                {dropIndicatorIndex === index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </React.Fragment>
            );
          } else if (item.type === 'group') {
            // Render column group
            const isExpanded = expandedSelectedGroups.has(item.headerName);
            const isDropTarget = selectedGroupDropTarget === item.headerName;
            const isDragging = draggedColumnGroup === item.headerName;
            const groupDropIndicatorIndex = groupDropIndicatorIndices[item.headerName];
            
            return (
              <div 
                key={item.headerName} 
                className={`group-container-selected ${isDragging ? 'dragging' : ''}`}
                data-group-name={item.headerName}
              >
                <GroupHeader
                  groupName={item.headerName}
                  isExpanded={isExpanded}
                  columnCount={item.columns?.length || 0}
                  isDropTarget={isDropTarget}
                  isDragging={isDragging}
                  className="selected-group-header"
                  onToggle={(e) => onToggleSelectedGroup(e, item.headerName)}
                  onDragStart={(e) => onSelectedGroupDragStart(e, item.headerName)}
                  onDragOver={(e) => onDragOver(e, 'selected', undefined, item.headerName)}
                  onDrop={(e) => onDrop(e, 'selected', undefined, item.headerName)}
                  onContextMenu={(e) => onContextMenu(e, undefined, true, item.headerName)}
                />
                
                {isExpanded && item.columns && (
                  <div className="group-columns-container">
                    {/* Drop indicator at the top of group columns if index is 0 */}
                    {groupDropIndicatorIndex === 0 && (
                      <div className="drop-indicator group-drop-indicator"></div>
                    )}
                    
                    {item.columns.map((column, colIndex) => (
                      <React.Fragment key={column.field}>
                        <ColumnItem
                          column={column}
                          index={colIndex}
                          isAvailable={false}
                          isSelected={selectedItems.includes(column.field)}
                          isDragging={column.field === draggedColumnId}
                          className="indented"
                          style={{ paddingLeft: '30px' }}
                          onSelect={onSelect}
                          onDoubleClick={() => onMoveToAvailable([column.field])}
                          onContextMenu={(e) => onContextMenu(e, undefined, true, item.headerName)}
                          onDragStart={(e, column) => onDragStart(e, column, false)}
                        />
                        
                        {/* Drop indicator after this column */}
                        {groupDropIndicatorIndex === colIndex + 1 && (
                          <div className="drop-indicator group-drop-indicator"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
                
                {/* Drop indicator after this group */}
                {dropIndicatorIndex === index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </div>
            );
          }
          
          return null;
        })}
        
        {/* If list is empty, show drop indicator in empty state */}
        {selectedColumns.length === 0 && dropIndicatorIndex === 0 && (
          <div className="drop-indicator"></div>
        )}
      </>
    );
  };

  return (
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
          className={`columns-list-container ${dropTarget === 'selected' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'selected')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'selected')}
          onContextMenu={(e) => onContextMenu(e, undefined, true)}
        >
          <div className="columns-list">
            {renderSelectedColumns()}
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
          onClick={onMoveUp} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
        >
          Move Up
        </button>
        <button 
          onClick={onMoveDown} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
        >
          Move Down
        </button>
        {selectedItems.length > 0 && selectedItems.some(id => selectedColumns.some(col => col.field === id)) && (
          <button onClick={onCreateSelectedGroup}>
            Create Group
          </button>
        )}
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

export default SelectedPanel;