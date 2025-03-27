import React, { useState } from 'react';
import { TreeNode, DragItem } from './types';
import './ColumnChooser.css';

interface AvailableColumnsPanelProps {
  columns: TreeNode[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onDragStart: (item: DragItem) => void;
  onDragOver: (event: React.DragEvent, targetId: string, position?: number) => void;
  onDrop: (target: { id: string, type: 'available' | 'selected', parentId?: string, index?: number }) => void;
  dropTarget: string | null;
  draggedItem: DragItem | null;
  onDoubleClick: (id: string, source: 'available' | 'selected', isGroup?: boolean) => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const AvailableColumnsPanel = ({ 
  columns,
  selectedIds, 
  setSelectedIds,
  onDragStart,
  onDragOver,
  onDrop,
  dropTarget,
  draggedItem, 
  onDoubleClick,
  searchQuery,
  setSearchQuery
}: AvailableColumnsPanelProps) => {
  // State for expanded/collapsed groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Toggle group expansion
  const toggleGroup = (groupId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle node selection with multi-select support
  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+click: Toggle selection of clicked node
      setSelectedIds(prev => {
        if (prev.includes(nodeId)) {
          return prev.filter(id => id !== nodeId);
        } else {
          return [...prev, nodeId];
        }
      });
    } else if (event.shiftKey && selectedIds.length > 0) {
      // Shift+click: Select range
      // For tree structures, we'll simplify and just select all nodes between 
      // the last selected node and the current node in the flattened tree
      
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
      
      flattenTree(columns);
      
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const lastSelectedIndex = flattenedIds.indexOf(lastSelectedId);
      const currentIndex = flattenedIds.indexOf(nodeId);
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        
        const rangeIds = flattenedIds.slice(start, end + 1);
        
        setSelectedIds(prev => {
          // Combine previous selection with range, ensuring no duplicates
          const combined = [...new Set([...prev, ...rangeIds])];
          return combined;
        });
      }
    } else {
      // Regular click: Select only the clicked node
      setSelectedIds([nodeId]);
    }
  };

  // Handle drag start for both columns and groups
  const handleDragStart = (nodeId: string, isGroup: boolean, event: React.DragEvent) => {
    event.stopPropagation();
    
    // If dragging a node that's not in the current selection, select only that node
    if (!selectedIds.includes(nodeId)) {
      setSelectedIds([nodeId]);
    }
    
    onDragStart({
      id: nodeId,
      type: isGroup ? 'group' : 'column',
      source: 'available'
    });
    
    // Set drag image (optional)
    if (event.dataTransfer) {
      const ghostElement = document.createElement('div');
      ghostElement.classList.add('drag-ghost');
      
      if (selectedIds.length > 1 && selectedIds.includes(nodeId)) {
        ghostElement.textContent = `${selectedIds.length} columns`;
      } else {
        const node = findNodeById(columns, nodeId);
        ghostElement.textContent = node?.name || (isGroup ? 'Group' : 'Column');
      }
      
      document.body.appendChild(ghostElement);
      event.dataTransfer.setDragImage(ghostElement, 0, 0);
      
      // Clean up ghost element after drag
      setTimeout(() => {
        document.body.removeChild(ghostElement);
      }, 0);
    }
  };

  // Find a node by its ID in the tree
  const findNodeById = (nodes: TreeNode[], id: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    onDragOver(event, nodeId);
  };

  // Handle drag over for the entire panel
  const handlePanelDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    onDragOver(event, 'available-panel');
  };

  // Handle drop
  const handleDrop = (event: React.DragEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    onDrop({
      id: nodeId,
      type: 'available'
    });
  };

  // Handle drop for the entire panel
  const handlePanelDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    onDrop({
      id: 'available-panel',
      type: 'available'
    });
  };

  // Handle double click
  const handleDoubleClick = (event: React.MouseEvent, nodeId: string, isGroup: boolean) => {
    event.stopPropagation();
    onDoubleClick(nodeId, 'available', isGroup);
  };

  // Count leaf nodes (actual columns, not groups)
  const countLeafNodes = (nodes: TreeNode[]): number => {
    let count = 0;
    nodes.forEach(node => {
      if (!node.isGroup) {
        count++;
      } else {
        count += countLeafNodes(node.children);
      }
    });
    return count;
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Render a tree node
  const renderNode = (node: TreeNode, level: number) => {
    const isExpanded = node.isExpanded || expandedGroups.has(node.id);
    const isSelected = selectedIds.includes(node.id);
    const isDropTarget = dropTarget === node.id;
    const isDragging = draggedItem?.id === node.id && draggedItem.source === 'available';
    
    return (
      <div key={node.id} className="tree-node-container">
        <div
          className={`tree-node ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
          style={{ paddingLeft: `${level * 16}px` }}
          onClick={(e) => handleNodeClick(node.id, e)}
          onDoubleClick={(e) => handleDoubleClick(e, node.id, node.isGroup)}
          draggable={true} // Make both columns and groups draggable
          onDragStart={(e) => handleDragStart(node.id, node.isGroup, e)}
          onDragOver={(e) => handleDragOver(e, node.id)}
          onDrop={(e) => handleDrop(e, node.id)}
        >
          {node.isGroup ? (
            <>
              <span 
                className={`tree-toggle ${isExpanded ? 'expanded' : 'collapsed'}`}
                onClick={(e) => toggleGroup(node.id, e)}
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
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="column-panel available-panel">
      <div className="panel-header">
        <h4>Available Columns</h4>
        <span className="column-count">{countLeafNodes(columns)}</span>
      </div>
      
      <div className="panel-search">
        <input
          type="text"
          placeholder="Search available columns..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      
      <div 
        className="panel-content"
        onDragOver={handlePanelDragOver}
        onDrop={handlePanelDrop}
      >
        {columns.length === 0 ? (
          <div className="empty-message">No columns available</div>
        ) : (
          columns.map((node, idx) => renderNode(node, idx))
        )}
      </div>
    </div>
  );
};

export default AvailableColumnsPanel;