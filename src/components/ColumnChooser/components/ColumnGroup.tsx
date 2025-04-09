import React, { useCallback, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragItemTypes, DragItem } from '../../../types';
import { useDrag as useCustomDrag } from '../context/DragContext';
import { useColumnChooser } from '../context/ColumnChooserContext';

interface ColumnGroupProps {
  groupName: string;
  groupPath?: string;
  columnCount: number;
  isExpanded: boolean;
  level?: number;
  isSelected?: boolean;
  isAvailable?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const ColumnGroup: React.FC<ColumnGroupProps> = ({
  groupName,
  groupPath,
  columnCount,
  isExpanded,
  level = 0,
  isSelected = false,
  isAvailable = true,
  style = {},
  className = ''
}) => {
  // Element ref
  const elementRef = useRef<HTMLDivElement>(null);
  
  // Access contexts
  const { startDrag, dragState, setGroupDropTarget } = useCustomDrag();
  
  const { 
    toggleGroup
  } = useColumnChooser();
  
  // Handler for toggle group expansion
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleGroup(groupPath || groupName, isAvailable ? 'available' : 'selected');
  }, [groupPath, groupName, isAvailable, toggleGroup]);
  
  // Check if this group is a current drop target
  const isDropTarget = useMemo(() => {
    if (isAvailable) {
      return dragState.groupDropTarget === (groupPath || groupName);
    } else {
      return dragState.selectedGroupDropTarget === groupName;
    }
  }, [dragState.groupDropTarget, dragState.selectedGroupDropTarget, groupPath, groupName, isAvailable]);
  
  // Setup react-dnd drag
  const [{ isDragging }, dragRef] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: DragItemTypes.GROUP,
    item: () => {
      // Create drag item with explicitly typed sourcePanel
      const dragItem: DragItem = {
        type: DragItemTypes.GROUP,
        id: groupPath || groupName,
        sourcePanel: isAvailable ? 'available' : 'selected'
      };
      
      // Notify our custom drag context
      startDrag(dragItem);
      
      // Log the drag start for debugging
      console.log("Starting to drag group:", groupName);
      
      return dragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: () => {
      // Could add handling for when drag ends with no drop
      console.log("Drag ended for group:", groupName);
    }
  });
  
  // Setup react-dnd drop
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, unknown, { isOver: boolean, canDrop: boolean }>({
    accept: [DragItemTypes.COLUMN, DragItemTypes.GROUP],
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    }),
    hover: (item, monitor) => {
      if (isOver) {
        // Log hover for debugging
        console.log("Hovering over group:", groupName);
        setGroupDropTarget(groupPath || groupName);
      }
    },
    drop: (item, monitor) => {
      // Log drop for debugging
      console.log("Dropped on group:", groupName);
      
      // Prevent event bubbling
      if (monitor.didDrop()) {
        return;
      }
      
      // Return data about the drop
      return { 
        groupDropped: true, 
        targetGroup: groupPath || groupName 
      };
    }
  });
  
  // Connect the drag and drop refs to our element ref
  // This is the key fix for the TypeScript error
  const connectRefs = useCallback((element: HTMLDivElement | null) => {
    // Connect the drag ref
    dragRef(element);
    // Connect the drop ref
    dropRef(element);
    // Also update our local ref
    if (elementRef.current !== element) {
      elementRef.current = element;
    }
  }, [dragRef, dropRef]);
  
  // Combined styles
  const combinedStyles = useMemo(() => ({
    ...style,
    paddingLeft: `${level * 20}px`,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  }), [style, level, isDragging]);
  
  // Combined class names
  const combinedClassNames = useMemo(() => {
    let classNames = 'group-header';
    if (isSelected) classNames += ' selected';
    if (isDragging) classNames += ' dragging';
    if (isDropTarget || (isOver && canDrop)) classNames += ' group-drop-target';
    if (className) classNames += ` ${className}`;
    return classNames;
  }, [isSelected, isDragging, isDropTarget, isOver, canDrop, className]);
  
  return (
    <div
      ref={connectRefs}
      className={combinedClassNames}
      style={combinedStyles}
      data-group-name={groupName}
      data-group-path={groupPath}
      data-panel={isAvailable ? 'available' : 'selected'}
    >
      <span 
        className="expand-icon"
        onClick={handleToggle}
      >
        {isExpanded ? '−' : '+'}
      </span>
      <span className="group-name">{groupName}</span>
      <span className="group-count">({columnCount})</span>
    </div>
  );
};

export default React.memo(ColumnGroup);