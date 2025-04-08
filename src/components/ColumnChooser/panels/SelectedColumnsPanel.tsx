import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ColumnTreeNode, DragItemTypes, DragItem } from '../../../types';
import { useColumnChooser } from '../context/ColumnChooserContext';
import { useDrag as useCustomDrag } from '../context/DragContext';
import VirtualizedList from '../components/VirtualizedList';
import ColumnItem from '../components/ColumnItem';
import ColumnGroup from '../components/ColumnGroup';
import SearchBox from '../components/SearchBox';
import { organizeSelectedColumnsByGroups } from '../utils/columnUtils';

interface SelectedColumnsPanelProps {
  className?: string;
  onColumnsReceived?: (items: string[], targetIndex?: number) => void;
  onColumnsReordered?: (itemId: string, items: string[], targetIndex: number) => void;
}

const SelectedColumnsPanel: React.FC<SelectedColumnsPanelProps> = ({
  className = '',
  onColumnsReceived,
  onColumnsReordered
}) => {
  // Container ref
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
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
    setDropTarget,
    setDropIndicator,
    dragState
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
  
  // Calculate the drop index based on mouse Y position
  const calculateDropIndex = useCallback((clientY: number): number => {
    if (!listRef.current) return 0;
    
    const listRect = listRef.current.getBoundingClientRect();
    const relativeY = clientY - listRect.top;
    
    // Use fixed item height for consistent calculation
    const ITEM_HEIGHT = 36; // Must match the actual item height
    
    // Calculate raw index
    let dropIndex = Math.floor(relativeY / ITEM_HEIGHT);
    
    // If we're in the bottom half of an item, we should insert after it
    const positionInItem = relativeY % ITEM_HEIGHT;
    if (positionInItem > ITEM_HEIGHT / 2) {
      dropIndex += 1;
    }
    
    // Ensure index is within bounds
    dropIndex = Math.max(0, Math.min(dropIndex, organizedColumns.length));
    
    console.log(`Calculate drop index: Y=${relativeY}, position in row=${positionInItem}, index=${dropIndex}`);
    return dropIndex;
  }, [organizedColumns.length]);
  
  // Update refs for the list container
  useEffect(() => {
    // Find the virtualized list container if it's not directly available
    if (!listRef.current && containerRef.current) {
      listRef.current = containerRef.current.querySelector('.virtualized-list-container') as HTMLDivElement;
    }
  }, []);
  
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
  
  // Setup drop target for the panel
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, unknown, { isOver: boolean, canDrop: boolean }>({
    accept: [DragItemTypes.COLUMN, DragItemTypes.GROUP],
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop()
    }),
    hover: (item, monitor) => {
      // Only process if we're the direct target (not a nested drop target)
      if (!monitor.isOver({ shallow: true })) return;
      
      // Set the drop target in our custom state
      setDropTarget('selected');
      
      // Calculate and set drop indicator position
      const clientOffset = monitor.getClientOffset();
      if (clientOffset) {
        const dropIndex = calculateDropIndex(clientOffset.y);
        if (dropIndex !== dragState.dropIndicatorIndex) {
          setDropIndicator(dropIndex);
        }
      }
    },
    drop: (item, monitor) => {
      // Only process if we're the direct target (not a nested drop target)
      if (!monitor.isOver({ shallow: true })) return;
      
      // Calculate final drop index
      const clientOffset = monitor.getClientOffset();
      const dropIndex = clientOffset ? calculateDropIndex(clientOffset.y) : 0;
      
      console.log(`Drop in selected panel, item: ${item.id}, source: ${item.sourcePanel}, index: ${dropIndex}`);
      
      // Handle drop from available panel
      if (item.sourcePanel === 'available') {
        const itemsToMove = item.multiple && item.items ? item.items : [item.id];
        if (onColumnsReceived) {
          onColumnsReceived(itemsToMove, dropIndex);
        }
      }
      // Handle reordering within selected panel
      else if (item.sourcePanel === 'selected') {
        const itemsToReorder = item.multiple && item.items ? item.items : [item.id];
        if (onColumnsReordered) {
          onColumnsReordered(item.id, itemsToReorder, dropIndex);
        }
      }
      
      // Return information about where the drop occurred
      return { droppedOn: 'selected', dropIndex };
    }
  });
  
  // Connect the drop ref to the container ref
  const connectRef = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
    drop(el);
  }, [drop]);
  
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
      ref={connectRef}
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
      
      <div 
        className="panel-content"
        ref={el => {
          if (el) {
            listRef.current = el.querySelector('.virtualized-list-container') as HTMLDivElement;
          }
        }}
      >
        <VirtualizedList
          items={organizedColumns}
          renderItem={renderItem}
          dropIndicatorIndex={dragState.dropIndicatorIndex}
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