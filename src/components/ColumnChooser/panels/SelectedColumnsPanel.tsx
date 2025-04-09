import React, { useMemo, useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ColumnTreeNode, DragItemTypes, DragItem } from '../../../types';
import { useColumnChooser } from '../context/ColumnChooserContext';
import { useDrag as useCustomDrag } from '../context/DragContext';
import VirtualizedList from '../components/VirtualizedList';
import ColumnItem from '../components/ColumnItem';
import ColumnGroup from '../components/ColumnGroup';
import SearchBox from '../components/SearchBox';
import { organizeSelectedColumnsByGroups, calculateDropIndex } from '../utils/columnUtils';

interface SelectedColumnsPanelProps {
  className?: string;
  onDrop?: (dragItem: DragItem, dropResult: any) => void;
}

const SelectedColumnsPanel: React.FC<SelectedColumnsPanelProps> = ({
  className = '',
  onDrop
}) => {
  // Container ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Access contexts
  const { 
    state: { 
      selectedColumns, 
      selectedItems, 
      columnGroups,
      expandedSelectedGroups,
      searchTerm
    },
    removeFromSelected,
    moveUp,
    moveDown,
    clearAll,
    createGroup,
    setSearchTerm
  } = useColumnChooser();
  
  const { 
    dragState, 
    setDropTarget,
    setDropIndicator,
    endDrag
  } = useCustomDrag();
  
  // Filter columns based on search term
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return selectedColumns;
    
    return selectedColumns.filter(col => {
      const searchLower = searchTerm.toLowerCase();
      const headerNameLower = (col.headerName || col.field).toLowerCase();
      const fieldLower = col.field.toLowerCase();
      
      return headerNameLower.includes(searchLower) || fieldLower.includes(searchLower);
    });
  }, [selectedColumns, searchTerm]);
  
  // Organize selected columns with groups
  const organizedColumns = useMemo(() => 
    organizeSelectedColumnsByGroups(filteredColumns, columnGroups, expandedSelectedGroups),
    [filteredColumns, columnGroups, expandedSelectedGroups]
  );
  
  // Calculate drop index based on mouse position
  const calculateMouseDropIndex = useCallback((clientOffset: {x: number, y: number} | null) => {
    if (!containerRef.current || !clientOffset) return -1;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const relativeY = clientOffset.y - containerRect.top;
    
    // Try to find the virtualized list container
    const listContainer = containerRef.current.querySelector('.virtualized-list-container');
    if (!listContainer) return -1;
    
    const listRect = (listContainer as HTMLElement).getBoundingClientRect();
    const listRelativeY = clientOffset.y - listRect.top;
    
    // Calculate which index the item should be dropped at
    return calculateDropIndex(
      listRelativeY,
      organizedColumns,
      dragState.dragItem?.id || '',
      dragState.dragItem?.items || []
    );
  }, [organizedColumns, dragState.dragItem]);
  
  // Remove selected handler
  const handleRemoveSelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    // Only remove items that are in selected columns
    const selectedColumnsItems = selectedItems.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (selectedColumnsItems.length > 0) {
      removeFromSelected(selectedColumnsItems);
    }
  }, [selectedItems, selectedColumns, removeFromSelected]);
  
  // Create group handler
  const handleCreateGroup = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    // Only create group with items that are in selected columns
    const selectedColumnsItems = selectedItems.filter(id => 
      selectedColumns.some(col => col.field === id)
    );
    
    if (selectedColumnsItems.length > 0) {
      // Prompt for group name
      const groupName = prompt('Enter group name:');
      if (groupName) {
        createGroup(groupName, selectedColumnsItems);
      }
    }
  }, [selectedItems, selectedColumns, createGroup]);
  
  // Search handler
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, [setSearchTerm]);
  
  // Move items up handler
  const handleMoveUp = useCallback(() => {
    if (selectedItems.length === 0) return;
    moveUp(selectedItems);
  }, [selectedItems, moveUp]);
  
  // Move items down handler
  const handleMoveDown = useCallback(() => {
    if (selectedItems.length === 0) return;
    moveDown(selectedItems);
  }, [selectedItems, moveDown]);
  
  // Setup react-dnd drop for the panel
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean, canDrop: boolean }>({
    accept: [DragItemTypes.COLUMN, DragItemTypes.GROUP],
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    }),
    hover: (item, monitor) => {
      if (isOver) {
        console.log("Hovering over selected panel");
        setDropTarget('selected');
        
        // Calculate and set drop indicator position
        const dropIndex = calculateMouseDropIndex(monitor.getClientOffset());
        if (dropIndex !== dragState.dropIndicatorIndex) {
          console.log("Setting drop indicator at index:", dropIndex);
          setDropIndicator(dropIndex);
        }
      }
    },
    drop: (item, monitor) => {
      console.log("Dropped on selected panel", item);
      
      // Prevent event bubbling if already handled
      if (monitor.didDrop()) {
        return;
      }
      
      const dropResult = { 
        droppedOnPanel: true,
        targetPanel: 'selected',
        dropIndex: dragState.dropIndicatorIndex
      };
      
      // Call the onDrop callback if provided
      if (onDrop) {
        onDrop(item, dropResult);
      }
      
      // Reset drag state
      endDrag();
      
      return dropResult;
    }
  });
  
  // Combined ref
  const combinedRef = (el: HTMLDivElement) => {
    containerRef.current = el;
    dropRef(el);
  };
  
  // Render item for virtualized list
  const renderItem = useCallback(({ item, index, style }: { 
    item: ColumnTreeNode; 
    index: number; 
    style: React.CSSProperties 
  }) => {
    if (item.type === 'group') {
      return (
        <ColumnGroup
          key={item.id}
          groupName={item.name}
          columnCount={(item.children || []).length}
          isExpanded={expandedSelectedGroups.has(item.id)}
          level={item.level}
          isAvailable={false}
          style={style}
        />
      );
    } else if (item.type === 'column' && item.column) {
      return (
        <ColumnItem
          key={item.id}
          column={item.column}
          index={index}
          isAvailable={false}
          style={style}
          className={item.parentPath ? 'indented' : ''}
        />
      );
    }
    return null;
  }, [expandedSelectedGroups]);
  
  return (
    <div 
      ref={combinedRef}
      className={`selected-columns-panel ${isOver && canDrop ? 'drop-target-active' : ''} ${className}`}
    >
      <div className="panel-header">
        <h3>Selected Columns</h3>
        <div className="column-count">
          {selectedColumns.length} columns
        </div>
      </div>
      
      <div className="panel-search">
        <SearchBox 
          value={searchTerm} 
          onChange={handleSearch} 
          placeholder="Search selected..." 
        />
      </div>
      
      <div className="panel-content">
        <VirtualizedList
          items={organizedColumns}
          renderItem={renderItem}
          dropIndicatorIndex={dragState.dropIndicatorIndex}
          groupDropIndicatorIndices={dragState.groupDropIndicatorIndices}
          className="selected-columns-list"
        />
      </div>
      
      <div className="panel-footer">
        <button 
          onClick={handleRemoveSelected} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
          className="action-button"
        >
          &lt; Remove
        </button>
        <button 
          onClick={handleMoveUp} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
          className="action-button"
        >
          Move Up
        </button>
        <button 
          onClick={handleMoveDown}
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))} 
          className="action-button"
        >
          Move Down
        </button>
        <button 
          onClick={handleCreateGroup}
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedColumns.some(col => col.field === id))}
          className="action-button"
        >
          Create Group
        </button>
        <button 
          onClick={clearAll}
          disabled={selectedColumns.length === 0}
          className="action-button clear-all"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default React.memo(SelectedColumnsPanel);