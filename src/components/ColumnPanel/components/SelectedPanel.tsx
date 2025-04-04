// src/components/ColumnPanel/components/SelectedPanel.tsx
import React, { useRef, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { ExtendedColDef, ColumnGroup } from '../../types';
import ColumnItem from './ColumnItem';

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
  // Content ref to get dimensions
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Calculate container height for the virtualized list
  const listHeight = useMemo(() => {
    return contentRef.current?.clientHeight || 300;
  }, [contentRef.current?.clientHeight]);
  
  // Row renderer for the virtual list
  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const column = selectedColumns[index];
    const isSelected = selectedItems.includes(column.field);
    const isDragging = column.field === draggedColumnId;
    
    // Show drop indicator if needed
    const showDropIndicator = dropIndicatorIndex === index;
    const showDropIndicatorAfter = dropIndicatorIndex === index + 1;
    
    return (
      <div style={style}>
        {showDropIndicator && <div className="drop-indicator"></div>}
        
        <ColumnItem
          column={column}
          index={index}
          isAvailable={false}
          isSelected={isSelected}
          isDragging={isDragging}
          onSelect={onSelect}
          onDoubleClick={() => onMoveToAvailable([column.field])}
          onContextMenu={(e) => onContextMenu(e, undefined, true)}
          onDragStart={(e, column) => onDragStart(e, column, false)}
        />
        
        {showDropIndicatorAfter && <div className="drop-indicator"></div>}
      </div>
    );
  };
  
  // Handle double-click to move column to available
  const handleDoubleClick = (columnId: string) => {
    onMoveToAvailable([columnId]);
  };
  
  return (
    <div className="panel-section selected-columns">
      <div className="panel-header">
        <h3>Selected Columns</h3>
        <div className="column-count">
          {selectedColumns.length} columns
        </div>
      </div>
      <div className="panel-content" ref={contentRef}>
        <div 
          ref={selectedPanelRef}
          className={`columns-list-container ${dropTarget === 'selected' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'selected')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'selected')}
          onContextMenu={(e) => onContextMenu(e, undefined, true)}
        >
          <div className="columns-list">
            {selectedColumns.length === 0 ? (
              <div className="empty-list-message">
                No columns selected. Drag columns here from the available panel.
              </div>
            ) : (
              <List
                height={listHeight}
                width="100%"
                itemCount={selectedColumns.length}
                itemSize={32} // Standard height for rows
              >
                {Row}
              </List>
            )}
            
            {/* Show drop indicator at the end of the list if needed */}
            {dropIndicatorIndex === selectedColumns.length && (
              <div className="drop-indicator"></div>
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