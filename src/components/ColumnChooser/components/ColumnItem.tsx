import React, { useCallback, useMemo, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { DragItemTypes, ExtendedColDef, DragItem } from '../../../types';
import { useDrag as useCustomDrag } from '../context/DragContext';
import { useColumnChooser } from '../context/ColumnChooserContext';

interface ColumnItemProps {
  column: ExtendedColDef;
  index: number;
  isAvailable: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const ColumnItem: React.FC<ColumnItemProps> = ({
  column,
  index,
  isAvailable,
  style = {},
  className = ''
}) => {
  // Create a ref for the div element
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Access contexts
  const { startDrag } = useCustomDrag();
  const { 
    state: { selectedItems }, 
    selectItems, 
    addToSelected, 
    removeFromSelected 
  } = useColumnChooser();
  
  // Check if this column is selected
  const isSelected = useMemo(() => 
    selectedItems.includes(column.field), 
    [selectedItems, column.field]
  );
  
  // Handle selection
  const handleSelect = useCallback((e: React.MouseEvent) => {
    // Get modifier keys
    const isMultiSelect = e.ctrlKey || e.metaKey;
    const isRangeSelect = e.shiftKey;
    
    if (isMultiSelect) {
      // Toggle selection for this item
      if (isSelected) {
        selectItems(selectedItems.filter(id => id !== column.field));
      } else {
        selectItems([...selectedItems, column.field]);
      }
    } else if (isRangeSelect) {
      // For simplicity, just select this item in this implementation
      selectItems([column.field]);
    } else {
      // Single selection
      selectItems([column.field]);
    }
  }, [column.field, isSelected, selectItems, selectedItems]);
  
  // Handle double click to move item
  const handleDoubleClick = useCallback(() => {
    if (isAvailable) {
      addToSelected([column.field]);
    } else {
      removeFromSelected([column.field]);
    }
  }, [column.field, isAvailable, addToSelected, removeFromSelected]);
  
  // Setup react-dnd drag
  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: DragItemTypes.COLUMN,
    item: () => {
      // If this column is part of a multi-selection, drag all selected items
      const isMultiple = selectedItems.includes(column.field) && selectedItems.length > 1;
      
      // Create drag item with explicitly typed sourcePanel
      const dragItem: DragItem = {
        type: DragItemTypes.COLUMN,
        id: column.field,
        sourcePanel: isAvailable ? 'available' : 'selected',
        multiple: isMultiple,
        items: isMultiple ? selectedItems : [column.field]
      };
      
      // Notify our custom drag context
      startDrag(dragItem);
      
      return dragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: () => {
      // Could add handling for when drag ends with no drop
      console.log("Drag ended for column:", column.field);
    }
  });
  
  // Connect the drag ref to our element ref
  // This is the key fix for the TypeScript error
  const connectDragRef = useCallback((element: HTMLDivElement | null) => {
    // Connect the drag ref
    dragRef(element);
    // Also update our local ref
    if (elementRef.current !== element) {
      elementRef.current = element;
    }
  }, [dragRef]);
  
  // Combined styles
  const combinedStyles = {
    ...style,
    opacity: isDragging ? 0.5 : 1,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    margin: 0,
    height: 36,
    boxSizing: 'border-box' as 'border-box',
    borderBottom: '1px solid #f5f5f5',
    cursor: 'grab',
    backgroundColor: isSelected ? '#e3f2fd' : 'white',
    userSelect: 'none' as 'none'
  };
  
  // Combined class names
  const combinedClassNames = useMemo(() => {
    let classNames = 'column-item';
    if (isSelected) classNames += ' selected';
    if (isDragging) classNames += ' dragging';
    if (className) classNames += ` ${className}`;
    return classNames;
  }, [isSelected, isDragging, className]);
  
  return (
    <div
      ref={connectDragRef}
      className={combinedClassNames}
      style={combinedStyles}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      data-column-id={column.field}
      data-panel={isAvailable ? 'available' : 'selected'}
    >
      {column.headerName || column.field}
    </div>
  );
};

export default React.memo(ColumnItem);