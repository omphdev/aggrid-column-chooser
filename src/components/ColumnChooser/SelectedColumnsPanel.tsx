import React, { useState, useRef } from 'react';
import { SelectedNode, SelectedGroup, DragItem } from './types';
import './ColumnChooser.css';

interface SelectedColumnsPanelProps {
  columns: SelectedNode[];
  groups: SelectedGroup[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  onDragStart: (item: DragItem) => void;
  onDragOver: (event: React.DragEvent, targetId: string, position?: number) => void;
  onDrop: (target: { id: string, type: 'available' | 'selected', parentId?: string, index?: number }) => void;
  dropTarget: string | null;
  draggedItem: DragItem | null;
  onDoubleClick: (id: string, source: 'available' | 'selected', isGroup?: boolean) => void;
  onCreateGroup: (name: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, newName: string) => void;
  onAddToGroup: (groupId: string) => void;
  onRemoveFromGroup: (groupId: string, columnIds: string[]) => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const SelectedColumnsPanel = ({ 
  columns,
  groups,
  selectedIds,
  setSelectedIds,
  onDragStart,
  onDragOver,
  onDrop,
  dropTarget,
  draggedItem,
  onDoubleClick,
  onCreateGroup,
  onRemoveGroup,
  onUpdateGroup,
  onAddToGroup,
  onRemoveFromGroup,
  searchQuery,
  setSearchQuery
}: SelectedColumnsPanelProps) => {
  // State for context menu
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetId?: string;
    targetType?: 'column' | 'group';
  }>({
    visible: false,
    x: 0,
    y: 0
  });

  // State for group dialogs
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showRenameGroupDialog, setShowRenameGroupDialog] = useState(false);
  const [groupDialogName, setGroupDialogName] = useState('');
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);
  
  // Refs for drag position
  const lastYRef = useRef<number>(0);
  const nodeRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  
  // State for drop position
  const [dropPosition, setDropPosition] = useState<number | null>(null);

  // Get columns that belong to a group
  const getGroupColumns = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return columns.filter(col => group.children.includes(col.id));
  };

  // Get columns that don't belong to any group
  const getUngroupedColumns = () => {
    const groupedColumnIds = groups.flatMap(g => g.children);
    return columns.filter(col => !groupedColumnIds.includes(col.id));
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
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      
      // Find indices in the flattened list of all columns
      const allColumnIds = columns.map(col => col.id);
      const lastSelectedIndex = allColumnIds.indexOf(lastSelectedId);
      const currentIndex = allColumnIds.indexOf(nodeId);
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        
        const rangeIds = allColumnIds.slice(start, end + 1);
        
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

  // Handle drag start
  const handleDragStart = (nodeId: string, isGroup: boolean, event: React.DragEvent) => {
    event.stopPropagation();
    
    // If dragging a node that's not in the current selection, select only that node
    if (!isGroup && !selectedIds.includes(nodeId)) {
      setSelectedIds([nodeId]);
    }
    
    onDragStart({
      id: nodeId,
      type: isGroup ? 'group' : 'column',
      source: 'selected'
    });
    
    // Set initial drag position
    lastYRef.current = event.clientY;
    
    // Set drag image (optional)
    if (event.dataTransfer) {
      const ghostElement = document.createElement('div');
      ghostElement.classList.add('drag-ghost');
      
      if (!isGroup && selectedIds.length > 1 && selectedIds.includes(nodeId)) {
        ghostElement.textContent = `${selectedIds.length} columns`;
      } else if (isGroup) {
        const group = groups.find(g => g.id === nodeId);
        ghostElement.textContent = group?.name || 'Group';
      } else {
        const column = columns.find(col => col.id === nodeId);
        ghostElement.textContent = column?.name || 'Column';
      }
      
      document.body.appendChild(ghostElement);
      event.dataTransfer.setDragImage(ghostElement, 0, 0);
      
      // Clean up ghost element after drag
      setTimeout(() => {
        document.body.removeChild(ghostElement);
      }, 0);
    }
  };

  // Calculate drop position
  const calculateDropPosition = (event: React.DragEvent, columns: SelectedNode[]) => {
    if (columns.length === 0) return 0;
    
    // Find the closest column based on Y position
    const mouseY = event.clientY;
    let closestIndex = 0;
    let closestDistance = Infinity;
    
    columns.forEach((col, index) => {
      const node = nodeRefs.current[col.id];
      if (node) {
        const rect = node.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const distance = Math.abs(mouseY - midY);
        
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
          
          // Determine if we should insert before or after this node
          if (mouseY < midY) {
            // Insert before
            setDropPosition(index);
          } else {
            // Insert after
            setDropPosition(index + 1);
          }
        }
      }
    });
    
    return dropPosition !== null ? dropPosition : columns.length;
  };

  // Handle drag over
  const handleDragOver = (event: React.DragEvent, nodeId: string, parentId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Calculate drop position
    const position = calculateDropPosition(event, getUngroupedColumns());
    
    onDragOver(event, nodeId, position);
  };

  // Handle drag over for the entire panel
  const handlePanelDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    
    // Calculate drop position for empty panel or at the end
    const position = columns.length === 0 ? 0 : columns.length;
    
    onDragOver(event, 'empty-selected-panel', position);
  };

  // Handle drop
  const handleDrop = (event: React.DragEvent, nodeId: string, parentId?: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    onDrop({
      id: nodeId,
      type: 'selected',
      parentId,
      index: dropPosition ?? undefined
    });
    
    setDropPosition(null);
  };

  // Handle drop for the entire panel
  const handlePanelDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    onDrop({
      id: 'empty-selected-panel',
      type: 'selected',
      index: columns.length === 0 ? 0 : columns.length
    });
    
    setDropPosition(null);
  };

  // Handle double click
  const handleDoubleClick = (event: React.MouseEvent, nodeId: string) => {
    event.stopPropagation();
    onDoubleClick(nodeId, 'selected');
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent, nodeId: string, type: 'column' | 'group') => {
    event.preventDefault();
    event.stopPropagation();
    
    // If right-clicking on a column that's not in the current selection, select only that column
    if (type === 'column' && !selectedIds.includes(nodeId)) {
      setSelectedIds([nodeId]);
    }
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      targetId: nodeId,
      targetType: type
    });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // Handle context menu actions
  const handleContextMenuAction = (action: string) => {
    closeContextMenu();
    
    switch (action) {
      case 'createGroup':
        setShowCreateGroupDialog(true);
        break;
      case 'removeGroup':
        if (contextMenu.targetId) {
          onRemoveGroup(contextMenu.targetId);
        }
        break;
      case 'renameGroup':
        if (contextMenu.targetId) {
          const group = groups.find(g => g.id === contextMenu.targetId);
          if (group) {
            setGroupDialogName(group.name);
            setTargetGroupId(group.id);
            setShowRenameGroupDialog(true);
          }
        }
        break;
      case 'removeFromGroup':
        if (contextMenu.targetId && contextMenu.targetType === 'column') {
          // Find the group this column belongs to
          const group = groups.find(g => g.children.includes(contextMenu.targetId!));
          if (group) {
            onRemoveFromGroup(group.id, [contextMenu.targetId]);
          }
        } else if (selectedIds.length > 0) {
          // If multiple columns are selected, find the groups they belong to
          const columnGroups = new Map<string, string[]>();
          
          selectedIds.forEach(colId => {
            const group = groups.find(g => g.children.includes(colId));
            if (group) {
              const columns = columnGroups.get(group.id) || [];
              columns.push(colId);
              columnGroups.set(group.id, columns);
            }
          });
          
          // Remove columns from their respective groups
          columnGroups.forEach((colIds, groupId) => {
            onRemoveFromGroup(groupId, colIds);
          });
        }
        break;
      default:
        // Check if the action is adding to a group
        if (action.startsWith('addToGroup:')) {
          const groupId = action.split(':')[1];
          onAddToGroup(groupId);
        }
    }
  };

  // Handle create group submission
  const handleCreateGroupSubmit = () => {
    if (groupDialogName.trim()) {
      onCreateGroup(groupDialogName.trim());
      setGroupDialogName('');
      setShowCreateGroupDialog(false);
    }
  };

  // Handle rename group submission
  const handleRenameGroupSubmit = () => {
    if (groupDialogName.trim() && targetGroupId) {
      onUpdateGroup(targetGroupId, groupDialogName.trim());
      setGroupDialogName('');
      setTargetGroupId(null);
      setShowRenameGroupDialog(false);
    }
  };

  // Handle dialog cancel
  const handleDialogCancel = () => {
    setGroupDialogName('');
    setTargetGroupId(null);
    setShowCreateGroupDialog(false);
    setShowRenameGroupDialog(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Render a column node
  const renderColumnNode = (column: SelectedNode, inGroup: boolean, groupId?: string) => {
    const isSelected = selectedIds.includes(column.id);
    const isDropTarget = dropTarget === column.id;
    const isDragging = draggedItem?.id === column.id && draggedItem.source === 'selected';
    
    return (
      <div
        key={column.id}
        ref={el => { nodeRefs.current[column.id] = el; }}
        className={`selected-column ${isSelected ? 'selected' : ''} ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''} ${inGroup ? 'in-group' : ''}`}
        onClick={(e) => handleNodeClick(column.id, e)}
        onDoubleClick={(e) => handleDoubleClick(e, column.id)}
        onContextMenu={(e) => handleContextMenu(e, column.id, 'column')}
        draggable
        onDragStart={(e) => handleDragStart(column.id, false, e)}
        onDragOver={(e) => handleDragOver(e, column.id, groupId)}
        onDrop={(e) => handleDrop(e, column.id, groupId)}
      >
        <span className="column-name">{column.name}</span>
      </div>
    );
  };

  // Render a group
  const renderGroup = (group: SelectedGroup) => {
    const groupColumns = getGroupColumns(group.id);
    const isDropTarget = dropTarget === group.id;
    const isDragging = draggedItem?.id === group.id && draggedItem.source === 'selected';
    
    return (
      <div
        key={group.id}
        ref={el => { nodeRefs.current[group.id] = el; }}
        className={`selected-group ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
        onContextMenu={(e) => handleContextMenu(e, group.id, 'group')}
        draggable
        onDragStart={(e) => handleDragStart(group.id, true, e)}
        onDragOver={(e) => handleDragOver(e, group.id)}
        onDrop={(e) => handleDrop(e, group.id)}
      >
        <div className="group-header">
          <span className="group-name">{group.name}</span>
          <span className="group-count">({groupColumns.length})</span>
        </div>
        <div className="group-columns">
          {groupColumns.map(col => renderColumnNode(col, true, group.id))}
        </div>
      </div>
    );
  };

  // Filter groups based on search
  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return true;
    
    // Check if group name matches search
    if (group.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    
    // Check if any columns in the group match search
    const groupColumns = getGroupColumns(group.id);
    return groupColumns.some(col => 
      col.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="column-panel selected-panel">
      <div className="panel-header">
        <h4>Selected Columns</h4>
        <span className="column-count">{columns.length}</span>
      </div>
      
      <div className="panel-search">
        <input
          type="text"
          placeholder="Search selected columns..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
      </div>
      
      <div 
        className="panel-content"
        onClick={closeContextMenu}
        onDragOver={handlePanelDragOver}
        onDrop={handlePanelDrop}
      >
        {columns.length === 0 ? (
          <div className="empty-message">No columns selected</div>
        ) : (
          <>
            {filteredGroups.map(renderGroup)}
            {getUngroupedColumns()
              .filter(col => !searchQuery || col.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(col => renderColumnNode(col, false))}
          </>
        )}
        
        {/* Context Menu */}
        {contextMenu.visible && (
          <div 
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.targetType === 'column' ? (
              <>
                <div 
                  className="context-menu-item"
                  onClick={() => handleContextMenuAction('createGroup')}
                >
                  Create Group
                </div>
                
                {/* Add to Existing Group submenu */}
                {groups.length > 0 && (
                  <div className="context-menu-submenu">
                    <div className="context-menu-item with-submenu">
                      Add to Group
                    </div>
                    <div className="submenu">
                      {groups.map(group => (
                        <div 
                          key={group.id}
                          className="context-menu-item"
                          onClick={() => handleContextMenuAction(`addToGroup:${group.id}`)}
                        >
                          {group.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Check if column is in a group */}
                {groups.some(g => g.children.includes(contextMenu.targetId!)) && (
                  <div 
                    className="context-menu-item"
                    onClick={() => handleContextMenuAction('removeFromGroup')}
                  >
                    Remove from Group
                  </div>
                )}
              </>
            ) : (
              <>
                <div 
                  className="context-menu-item"
                  onClick={() => handleContextMenuAction('renameGroup')}
                >
                  Rename Group
                </div>
                <div 
                  className="context-menu-item"
                  onClick={() => handleContextMenuAction('removeGroup')}
                >
                  Remove Group
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Create Group Dialog */}
        {showCreateGroupDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h4>Create Group</h4>
              <input
                type="text"
                value={groupDialogName}
                onChange={(e) => setGroupDialogName(e.target.value)}
                placeholder="Group name"
                autoFocus
              />
              <div className="dialog-actions">
                <button onClick={handleCreateGroupSubmit}>Create</button>
                <button onClick={handleDialogCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Rename Group Dialog */}
        {showRenameGroupDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h4>Rename Group</h4>
              <input
                type="text"
                value={groupDialogName}
                onChange={(e) => setGroupDialogName(e.target.value)}
                placeholder="Group name"
                autoFocus
              />
              <div className="dialog-actions">
                <button onClick={handleRenameGroupSubmit}>Rename</button>
                <button onClick={handleDialogCancel}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedColumnsPanel;