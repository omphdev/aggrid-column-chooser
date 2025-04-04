// src/components/ColumnPanel/components/AvailablePanel.tsx
import React, { useRef, useMemo } from 'react';
import { ExtendedColDef } from '../../types';
import VirtualTree from './VirtualTree';
import { useTreeData } from '../hooks/useTreeData';
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
  // Use the tree data hook to manage the virtualized tree
  const { treeData, visibleNodes } = useTreeData({
    columns: availableColumns,
    expandedGroups,
    isSelectedPanel: false
  });
  
  // Content ref to get dimensions
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Calculate container height for the virtualized list
  const listHeight = useMemo(() => {
    return contentRef.current?.clientHeight || 300;
  }, [contentRef.current?.clientHeight]);
  
  // Handle double-click to move column to selected
  const handleDoubleClick = (columnId: string) => {
    onMoveToSelected([columnId]);
  };
  
  return (
    <div className="panel-section available-columns">
      <div className="panel-header">
        <h3>Available Columns</h3>
        <div className="column-count">
          {availableColumns.length} columns
        </div>
      </div>
      <div className="panel-content" ref={contentRef}>
        <div 
          ref={availablePanelRef}
          className={`columns-list-container ${dropTarget === 'available' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'available')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'available')}
          onContextMenu={(e) => onContextMenu(e)}
        >
          <div className="columns-list">
            <VirtualTree
              treeData={treeData}
              visibleNodes={visibleNodes}
              selectedItems={selectedItems}
              expandedGroups={expandedGroups}
              toggleGroup={onToggleGroup}
              onSelect={onSelect}
              onDoubleClick={handleDoubleClick}
              onContextMenu={onContextMenu}
              onDragStart={(e, node, isAvailable) => onDragStart(e as React.DragEvent<HTMLDivElement>, node, isAvailable)}
              onGroupDragStart={(e, groupPath) => onGroupDragStart(e as React.DragEvent<HTMLDivElement>, groupPath)}
              draggedColumnId={draggedColumnId}
              draggedGroupPath={draggedGroupPath}
              groupDropTarget={groupDropTarget}
              dropIndicatorIndex={-1}
              isSelectedPanel={false}
              height={listHeight}
              width="100%"
            />
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