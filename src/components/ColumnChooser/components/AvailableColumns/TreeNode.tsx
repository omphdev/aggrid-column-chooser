// src/components/ColumnChooser/components/AvailableColumns/TreeNode.tsx
import React, { useRef } from 'react';
import { TreeNode } from '../../types';
import { countLeafNodes } from '../../utils/treeUtils';
import { useColumnChooser } from '../../context/ColumnChooserContext';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { handleNodeSelection } from '../../utils/columnUtils';

interface TreeNodeProps {
  node: TreeNode;
  level: number;
  expandedGroups: Set<string>;
  setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  level,
  expandedGroups,
  setExpandedGroups
}) => {
  // Get the node ref for drag operations
  const nodeRef = useRef<HTMLDivElement>(null);
  
  // Access state from context
  const { state, dispatch } = useColumnChooser();
  const { selectedAvailableIds } = state;
  
  // Get drag and drop handlers
  const { 
    draggedItem, 
    dropTarget,
    handleDragStart, 
    handleDragOver,
    handleDrop,
    handleDoubleClick
  } = useDragAndDrop();
  
  // Determine if this node is expanded
  const isExpanded = node.isExpanded || expandedGroups.has(node.id);
  
  // Determine if this node is selected, a drop target, or being dragged
  const isSelected = selectedAvailableIds.includes(node.id);
  const isDropTarget = dropTarget === node.id;
  const isDragging = draggedItem?.id === node.id && draggedItem.source === 'available';
  
  // Toggle group expansion
  const toggleGroup = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
  };
  
  // Handle node selection with multi-select support
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get all selectable node IDs in the flattened tree
    const flattenedIds: string[] = [];
    
    const flattenTree = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (!node.isGroup) {
          flattenedIds.push(node.id);
        }
        if (node.children.length > 0 && 
            (node.isExpanded || expandedGroups.has(node.id))) {
          flattenTree(node.children);
        }
      });
    };
    
    flattenTree([...state.availableColumns]);
    
    // Use the utility function to handle selection
    const newSelectedIds = handleNodeSelection(
      node.id,
      e,
      selectedAvailableIds,
      flattenedIds
    );
    
    // Update selected IDs
    dispatch({ 
      type: 'SET_SELECTED_AVAILABLE_IDS', 
      payload: newSelectedIds 
    });
  };
  
  // Handle double click
  const handleNodeDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleDoubleClick(node.id, 'available', node.isGroup);
  };
  
  // Handle drag start
  const handleNodeDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    handleDragStart(node.id, node.isGroup, e, undefined, 'available');
  };
  
  // Handle drag over
  const handleNodeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragOver(e, node.id);
  };
  
  // Handle drop
  const handleNodeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    handleDrop(e, {
      id: node.id,
      type: 'available'
    });
  };

  return (
    <div className="tree-node-container">
      <div
        ref={nodeRef}
        className={`tree-node ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{ paddingLeft: `${level * 16}px` }}
        onClick={handleClick}
        onDoubleClick={handleNodeDoubleClick}
        draggable={true}
        onDragStart={handleNodeDragStart}
        onDragOver={handleNodeDragOver}
        onDrop={handleNodeDrop}
      >
        {node.isGroup ? (
          <>
            <span 
              className={`tree-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}
              onClick={toggleGroup}
            >
              {isExpanded ? '−' : '+'}
            </span>
            <span className="tree-group-name">{node.name}</span>
            <span className="tree-group-count">({countLeafNodes(node.children)})</span>
          </>
        ) : (
          <span className="tree-leaf-name">{node.name}</span>
        )}
      </div>
      
      {node.isGroup && isExpanded && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              expandedGroups={expandedGroups}
              setExpandedGroups={setExpandedGroups}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Use React.memo to prevent unnecessary re-renders
export default React.memo(TreeNodeComponent);