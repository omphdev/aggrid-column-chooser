// src/components/ColumnPanel/components/VirtualTree.tsx
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { ExtendedColDef, ColumnGroup } from '../../types';
import ColumnItem from './ColumnItem';
import GroupHeader from './GroupHeader';
import { getAllColumnsInGroup } from '../utils/treeUtils';

// Type for tree node
export interface TreeNode {
  id: string;
  type: 'group' | 'column';
  data: any;
  level: number;
  expanded?: boolean;
  isLast?: boolean;
  parent?: string;
  children?: string[];
  isVisible?: boolean;
}

// Props for the VirtualTree component
export interface VirtualTreeProps {
  treeData: TreeNode[];
  visibleNodes: TreeNode[];
  selectedItems: string[];
  expandedGroups: Set<string>;
  toggleGroup: (e: React.MouseEvent, nodeId: string) => void;
  onSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  onDoubleClick: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, groupPath?: string, inSelectedPanel?: boolean, groupName?: string) => void;
  onDragStart: (e: React.DragEvent, node: any, isAvailable: boolean) => void;
  onGroupDragStart?: (e: React.DragEvent, groupPath: string) => void;
  draggedColumnId: string | null;
  draggedGroupPath: string | null;
  groupDropTarget: string | null;
  dropIndicatorIndex: number;
  isSelectedPanel?: boolean;
  height: number;
  width: number | string;
}

// Row renderer for the virtual list
const Row: React.FC<ListChildComponentProps> = ({ index, style, data }) => {
  const {
    nodes,
    selectedItems,
    expandedGroups,
    toggleGroup,
    onSelect,
    onDoubleClick,
    onContextMenu,
    onDragStart,
    onGroupDragStart,
    draggedColumnId,
    draggedGroupPath,
    groupDropTarget,
    dropIndicatorIndex,
    isSelectedPanel
  } = data;

  const node = nodes[index];
  
  // Render different components based on node type
  if (node.type === 'group') {
    const isExpanded = expandedGroups.has(node.id);
    const isDropTarget = groupDropTarget === node.id;
    const isDragging = draggedGroupPath === node.id;
    
    // Count columns in this group
    const columnCount = node.children?.length || 0;
    
    return (
      <div style={style} className="group-container">
        <GroupHeader
          groupName={node.data.headerName || node.id.split('.').pop()}
          isExpanded={isExpanded}
          columnCount={columnCount}
          isDropTarget={isDropTarget}
          isDragging={isDragging}
          level={node.level}
          className={isSelectedPanel ? "selected-group-header" : "group-header"}
          onToggle={(e) => toggleGroup(e, node.id)}
          onDragStart={(e) => onGroupDragStart && onGroupDragStart(e, node.id)}
          onContextMenu={(e) => onContextMenu(e, node.id, isSelectedPanel, node.id)}
        />
        
        {/* Drop indicator if needed */}
        {dropIndicatorIndex === index + 1 && (
          <div className="drop-indicator" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}></div>
        )}
      </div>
    );
  } else if (node.type === 'column') {
    const isSelected = selectedItems.includes(node.id);
    const isDragging = node.id === draggedColumnId;
    
    return (
      <div style={style}>
        <ColumnItem
          column={node.data}
          index={index}
          isAvailable={!isSelectedPanel}
          isSelected={isSelected}
          isDragging={isDragging}
          onSelect={onSelect}
          onDoubleClick={onDoubleClick}
          onContextMenu={(e) => onContextMenu(e, node.parent, isSelectedPanel, node.parent)}
          onDragStart={(e, column) => onDragStart(e, column, !isSelectedPanel)}
          className={node.parent && isSelectedPanel ? "indented" : ""}
          style={node.parent && isSelectedPanel ? { paddingLeft: `${(node.level) * 20}px` } : undefined}
        />
        
        {/* Drop indicator if needed */}
        {dropIndicatorIndex === index + 1 && (
          <div className="drop-indicator" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}></div>
        )}
      </div>
    );
  }
  
  // Fallback - shouldn't happen
  return <div style={style}>Unknown node type</div>;
};

// Main VirtualTree component
const VirtualTree: React.FC<VirtualTreeProps> = ({
  treeData,
  visibleNodes,
  selectedItems,
  expandedGroups,
  toggleGroup,
  onSelect,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onGroupDragStart,
  draggedColumnId,
  draggedGroupPath,
  groupDropTarget,
  dropIndicatorIndex,
  isSelectedPanel = false,
  height,
  width
}) => {
  // Reference to the List component
  const listRef = useRef<List>(null);
  
  // Scroll to the item when it's selected
  useEffect(() => {
    if (listRef.current && selectedItems.length === 1) {
      const selectedIndex = visibleNodes.findIndex(node => node.id === selectedItems[0]);
      if (selectedIndex !== -1) {
        listRef.current.scrollToItem(selectedIndex, 'smart');
      }
    }
  }, [selectedItems, visibleNodes]);
  
  return (
    <List
      ref={listRef}
      height={height}
      width={width}
      itemCount={visibleNodes.length}
      itemSize={32} // Standard height for rows
      itemData={{
        nodes: visibleNodes,
        selectedItems,
        expandedGroups,
        toggleGroup,
        onSelect,
        onDoubleClick,
        onContextMenu,
        onDragStart,
        onGroupDragStart,
        draggedColumnId,
        draggedGroupPath,
        groupDropTarget,
        dropIndicatorIndex,
        isSelectedPanel
      }}
    >
      {Row}
    </List>
  );
};

// Function to convert flat data to tree structure
export const convertToTreeData = (
  columns: ExtendedColDef[],
  expandedGroups: Set<string>,
  isSelectedPanel: boolean = false,
  columnGroups: ColumnGroup[] = []
): { treeData: TreeNode[], visibleNodes: TreeNode[] } => {
  const treeData: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();
  
  // Create a mapping of group IDs to their children for faster lookup
  const groupChildren = new Map<string, string[]>();
  
  if (isSelectedPanel && columnGroups.length > 0) {
    // For selected panel, use the column groups
    columnGroups.forEach(group => {
      const groupNode: TreeNode = {
        id: group.headerName,
        type: 'group',
        data: group,
        level: 0,
        expanded: expandedGroups.has(group.headerName),
        children: []
      };
      
      treeData.push(groupNode);
      nodeMap.set(group.headerName, groupNode);
      groupChildren.set(group.headerName, []);
    });
    
    // Add columns to their respective groups
    columns.forEach(column => {
      const inGroup = columnGroups.find(group => group.children.includes(column.field));
      
      if (inGroup) {
        const columnNode: TreeNode = {
          id: column.field,
          type: 'column',
          data: column,
          level: 1,
          parent: inGroup.headerName
        };
        
        nodeMap.set(column.field, columnNode);
        
        // Add to group's children
        const children = groupChildren.get(inGroup.headerName) || [];
        children.push(column.field);
        groupChildren.set(inGroup.headerName, children);
      } else {
        // Standalone column not in any group
        const columnNode: TreeNode = {
          id: column.field,
          type: 'column',
          data: column,
          level: 0
        };
        
        treeData.push(columnNode);
        nodeMap.set(column.field, columnNode);
      }
    });
    
    // Update group nodes with their children
    groupChildren.forEach((children, groupId) => {
      const groupNode = nodeMap.get(groupId);
      if (groupNode) {
        groupNode.children = children;
      }
    });
  } else {
    // For available panel, use the groupPath
    // First, collect all unique group paths
    const groupPaths = new Set<string>();
    
    columns.forEach(column => {
      if (column.groupPath && column.groupPath.length > 0) {
        let currentPath = '';
        column.groupPath.forEach((segment, index) => {
          const newPath = currentPath ? `${currentPath}.${segment}` : segment;
          if (index < column.groupPath!.length - 1) {
            groupPaths.add(newPath);
          }
          currentPath = newPath;
        });
      }
    });
    
    // Create group nodes
    Array.from(groupPaths).sort().forEach(path => {
      const segments = path.split('.');
      const level = segments.length - 1;
      const parentPath = segments.slice(0, -1).join('.');
      
      const groupNode: TreeNode = {
        id: path,
        type: 'group',
        data: { headerName: segments[level] },
        level,
        expanded: expandedGroups.has(path),
        parent: parentPath || undefined,
        children: []
      };
      
      treeData.push(groupNode);
      nodeMap.set(path, groupNode);
      groupChildren.set(path, []);
    });
    
    // Add columns to their groups
    columns.forEach(column => {
      if (column.groupPath && column.groupPath.length > 0) {
        // Find the parent group path (all segments except the last one)
        const parentSegments = column.groupPath.slice(0, -1);
        const parentPath = parentSegments.join('.');
        
        if (parentPath) {
          const columnNode: TreeNode = {
            id: column.field,
            type: 'column',
            data: column,
            level: parentSegments.length,
            parent: parentPath
          };
          
          nodeMap.set(column.field, columnNode);
          
          // Add to group's children
          const children = groupChildren.get(parentPath) || [];
          children.push(column.field);
          groupChildren.set(parentPath, children);
        } else {
          // No parent group (shouldn't happen but just in case)
          const columnNode: TreeNode = {
            id: column.field,
            type: 'column',
            data: column,
            level: 0
          };
          
          treeData.push(columnNode);
          nodeMap.set(column.field, columnNode);
        }
      } else {
        // Standalone column not in any group
        const columnNode: TreeNode = {
          id: column.field,
          type: 'column',
          data: column,
          level: 0
        };
        
        treeData.push(columnNode);
        nodeMap.set(column.field, columnNode);
      }
    });
    
    // Update group nodes with their children
    groupChildren.forEach((children, groupId) => {
      const groupNode = nodeMap.get(groupId);
      if (groupNode) {
        groupNode.children = children;
      }
    });
  }
  
  // Calculate visible nodes (expanded groups and their children)
  const visibleNodes: TreeNode[] = [];
  
  // Helper function to add visible nodes recursively
  const addVisibleNodes = (nodeId: string, isParentVisible: boolean) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    // A node is visible if its parent is visible (or it has no parent)
    // and if it's a group, it must be expanded to show its children
    const isNodeVisible = isParentVisible;
    
    if (isNodeVisible) {
      visibleNodes.push(node);
    }
    
    // For groups, check if expanded
    if (node.type === 'group' && node.children && node.children.length > 0) {
      const isExpanded = expandedGroups.has(node.id);
      
      if (isExpanded && isNodeVisible) {
        // Add all children nodes
        node.children.forEach(childId => {
          addVisibleNodes(childId, true);
        });
      }
    }
  };
  
  // Start with top-level nodes
  treeData.filter(node => !node.parent).forEach(node => {
    addVisibleNodes(node.id, true);
  });
  
  return { treeData, visibleNodes };
};

export default VirtualTree;