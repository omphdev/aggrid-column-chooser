import React, { useMemo, useCallback, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ColumnTreeNode, DragItemTypes, DragItem } from '../../../types';
import { useColumnChooser } from '../context/ColumnChooserContext';
import { useDrag as useCustomDrag } from '../context/DragContext';
import VirtualizedList from '../components/VirtualizedList';
import ColumnItem from '../components/ColumnItem';
import ColumnGroup from '../components/ColumnGroup';
import SearchBox from '../components/SearchBox';
import { organizeColumnsIntoTree } from '../utils/columnUtils';

interface AvailableColumnsPanelProps {
  className?: string;
  onColumnsDrop?: (items: string[]) => void;
}

const AvailableColumnsPanel: React.FC<AvailableColumnsPanelProps> = ({ 
  className = '',
  onColumnsDrop
}) => {
  // Container ref
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Access contexts
  const { 
    state: { 
      availableColumns, 
      selectedItems, 
      expandedGroups,
      searchTerm
    },
    addToSelected,
    setSearchTerm
  } = useColumnChooser();
  
  const { 
    setDropTarget
  } = useCustomDrag();
  
  // Filter columns based on search term
  const filteredColumns = useMemo(() => {
    if (!searchTerm) return availableColumns;
    
    return availableColumns.filter(col => {
      const searchLower = searchTerm.toLowerCase();
      const headerNameLower = (col.headerName || col.field).toLowerCase();
      const fieldLower = col.field.toLowerCase();
      
      return headerNameLower.includes(searchLower) || fieldLower.includes(searchLower);
    });
  }, [availableColumns, searchTerm]);
  
  // Create tree structure for available columns
  const columnTree = useMemo(() => 
    organizeColumnsIntoTree(filteredColumns, expandedGroups),
    [filteredColumns, expandedGroups]
  );
  
  // Add to selected handler
  const handleAddToSelected = useCallback(() => {
    if (selectedItems.length === 0) return;
    
    // Only add items that are in available columns
    const availableSelectedItems = selectedItems.filter(id => 
      availableColumns.some(col => col.field === id)
    );
    
    if (availableSelectedItems.length > 0) {
      addToSelected(availableSelectedItems);
    }
  }, [selectedItems, availableColumns, addToSelected]);
  
  // Search handler
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, [setSearchTerm]);
  
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
      setDropTarget('available');
    },
    drop: (item, monitor) => {
      // Only process if we're the direct target (not a nested drop target)
      if (!monitor.isOver({ shallow: true })) return;
      
      console.log(`Drop in available panel, item: ${item.id}, source: ${item.sourcePanel}`);
      
      // Only handle drops from selected panel
      if (item.sourcePanel === 'selected') {
        const itemsToMove = item.multiple && item.items ? item.items : [item.id];
        if (onColumnsDrop) {
          onColumnsDrop(itemsToMove);
        }
      }
      
      // Return information about where the drop occurred
      return { droppedOn: 'available' };
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
          groupPath={item.id}
          columnCount={(item.children || []).length}
          isExpanded={expandedGroups.has(item.id)}
          level={item.level}
          isAvailable={true}
          style={style}
        />
      );
    } else if (item.type === 'column' && item.column) {
      return (
        <ColumnItem
          key={item.id}
          column={item.column}
          index={index}
          isAvailable={true}
          style={style}
        />
      );
    }
    return null;
  }, [expandedGroups]);
  
  return (
    <div 
      ref={connectRef}
      className={`available-columns-panel ${isOver && canDrop ? 'drop-target-active' : ''} ${className}`}
    >
      <div className="panel-header">
        <h3>Available Columns</h3>
        <div className="column-count">
          {availableColumns.length} columns
        </div>
      </div>
      
      <div className="panel-search">
        <SearchBox 
          value={searchTerm} 
          onChange={handleSearch} 
          placeholder="Search columns..." 
        />
      </div>
      
      <div className="panel-content">
        <VirtualizedList
          items={columnTree}
          renderItem={renderItem}
          className="available-columns-list"
        />
      </div>
      
      <div className="panel-footer">
        <button 
          onClick={handleAddToSelected} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => availableColumns.some(col => col.field === id))}
          className="action-button"
        >
          Add to Selected &gt;
        </button>
      </div>
    </div>
  );
};

export default React.memo(AvailableColumnsPanel);