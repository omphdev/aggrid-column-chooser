import React, { useState, useRef, useEffect } from 'react';
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
  onGroupColumnsChanged: (groupId: string, columnIds: string[]) => void;
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
  onGroupColumnsChanged,
  searchQuery,
  setSearchQuery
}: SelectedColumnsPanelProps) => {
  // State for tracking drag and drop operations
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<number | null>(null);
  const [isDraggingOverGroup, setIsDraggingOverGroup] = useState(false);
  
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
  
  // Refs for nodes
  const nodeRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const panelRef = useRef<HTMLDivElement>(null);

  // Effect to add/remove document-level event listeners for drag end
  useEffect(() => {
    const handleDragEnd = () => {
      setDragOverGroupId(null);
      setDropPosition(null);
      setIsDraggingOverGroup(false);
    };

    document.addEventListener('dragend', handleDragEnd);
    return () => {
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Get columns that belong to a group
  const getGroupColumns = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return columns.filter(col => group.children.includes(col.id));
  };

  // Get column IDs in a group
  const getGroupColumnIds = (groupId: string): string[] => {
    const group = groups.find(g => g.id === groupId);
    return group ? [...group.children] : [];
  };

  // Get columns that don't belong to any group
  const getUngroupedColumns = () => {
    const groupedColumnIds = groups.flatMap(g => g.children);
    return columns.filter(col => !groupedColumnIds.includes(col.id));
  };

  // Handle node selection
  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      setSelectedIds(prev => 
        prev.includes(nodeId) 
          ? prev.filter(id => id !== nodeId) 
          : [...prev, nodeId]
      );
    } else if (event.shiftKey && selectedIds.length > 0) {
      // Range selection
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const allColumnIds = columns.map(col => col.id);
      const lastSelectedIndex = allColumnIds.indexOf(lastSelectedId);
      const currentIndex = allColumnIds.indexOf(nodeId);
      
      if (lastSelectedIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex);
        const rangeIds = allColumnIds.slice(start, end + 1);
        
        setSelectedIds([...new Set([...selectedIds, ...rangeIds])]);
      }
    } else {
      // Single selection
      setSelectedIds([nodeId]);
    }
  };

  // Handle drag start for columns and groups
  const handleDragStart = (nodeId: string, isGroup: boolean, event: React.DragEvent, parentGroupId?: string) => {
    event.stopPropagation();
    
    // If dragging a column not in current selection, select only that column
    if (!isGroup && !selectedIds.includes(nodeId)) {
      setSelectedIds([nodeId]);
    }
    
    // Create drag data and store parent group for columns in groups
    const dragData: DragItem = {
      id: nodeId,
      type: isGroup ? 'group' : 'column',
      source: 'selected',
      parentId: parentGroupId,
      selectedIds: selectedIds.includes(nodeId) ? selectedIds : [nodeId]
    };
    
    // Store drag data in dataTransfer
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    
    // Set drag image
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
    
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
    
    // Notify parent of drag start
    onDragStart(dragData);
  };

  // Handle drag over for group
  const handleDragOverGroup = (event: React.DragEvent, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsDraggingOverGroup(true);
    setDragOverGroupId(groupId);
    onDragOver(event, groupId);
    
    // Add visual feedback
    const groupElement = event.currentTarget as HTMLElement;
    groupElement.classList.add('group-drop-target');
  };

  // Handle drag over for column within group
  const handleDragOverGroupColumn = (event: React.DragEvent, columnId: string, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsDraggingOverGroup(true);
    setDragOverGroupId(groupId);
    
    // Calculate position within group
    const groupColumns = getGroupColumns(groupId);
    const columnIndex = groupColumns.findIndex(col => col.id === columnId);
    
    // Determine if we're dropping before or after this column
    const columnElement = nodeRefs.current[columnId];
    if (columnElement) {
      const rect = columnElement.getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;
      const position = event.clientY < middleY 
        ? columnIndex 
        : columnIndex + 1;
      
      setDropPosition(position);
      onDragOver(event, columnId, position);
    }
  };

  // Handle drag over for ungrouped column
  const handleDragOverColumn = (event: React.DragEvent, columnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Reset group-related drag state
    setIsDraggingOverGroup(false);
    setDragOverGroupId(null);
    
    // Calculate position in ungrouped area
    const ungroupedColumns = getUngroupedColumns();
    const columnIndex = ungroupedColumns.findIndex(col => col.id === columnId);
    
    // Determine if we're dropping before or after this column
    const columnElement = nodeRefs.current[columnId];
    if (columnElement) {
      const rect = columnElement.getBoundingClientRect();
      const middleY = rect.top + rect.height / 2;
      const position = event.clientY < middleY 
        ? columnIndex 
        : columnIndex + 1;
      
      setDropPosition(position);
      onDragOver(event, columnId, position);
    }
  };

  // Handle drag over for the entire panel
  const handlePanelDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    
    // Reset group-related drag state
    setIsDraggingOverGroup(false);
    setDragOverGroupId(null);
    
    // Position at the end of ungrouped columns
    const position = getUngroupedColumns().length;
    setDropPosition(position);
    onDragOver(event, 'empty-selected-panel', position);
  };

  // Handle drop on group
  const handleDropOnGroup = (event: React.DragEvent, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Remove visual feedback
    const groupElement = event.currentTarget as HTMLElement;
    groupElement.classList.remove('group-drop-target');
    
    // Get drag data from dataTransfer
    let dragData: DragItem | null = null;
    try {
      const dataString = event.dataTransfer.getData('application/json');
      if (dataString) {
        dragData = JSON.parse(dataString);
      }
    } catch (e) {
      console.error('Failed to parse drag data:', e);
    }
    
    // Fall back to component state if dataTransfer is empty
    const item = dragData || draggedItem;
    if (!item) return;
    
    if (item.type === 'column') {
      // Handle dropping a column on a group
      const selectedIds = item.selectedIds || [item.id];
      
      // If from another group, remove from that group first
      if (item.parentId && item.parentId !== groupId) {
        onRemoveFromGroup(item.parentId, selectedIds);
      }
      
      // If from available panel, add to selected columns first
      if (item.source === 'available') {
        onDrop({
          id: groupId,
          type: 'selected',
          parentId: groupId
        });
      } else {
        // Add to this group
        const updatedChildren = [...getGroupColumnIds(groupId)];
        
        // If dropping at a specific position within the group
        if (dropPosition !== null && dragOverGroupId === groupId) {
          // Add at specific position
          updatedChildren.push(...selectedIds.filter(id => !updatedChildren.includes(id)));
          onGroupColumnsChanged(groupId, updatedChildren);
        } else {
          // Append to the end
          updatedChildren.push(...selectedIds.filter(id => !updatedChildren.includes(id)));
          onGroupColumnsChanged(groupId, updatedChildren);
        }
      }
    } else if (item.type === 'group' && item.id !== groupId) {
      // Handle dropping a group onto another group (merge)
      const sourceGroup = groups.find(g => g.id === item.id);
      if (sourceGroup) {
        // Add source group columns to target group
        const updatedChildren = [
          ...getGroupColumnIds(groupId),
          ...sourceGroup.children
        ];
        
        onGroupColumnsChanged(groupId, updatedChildren);
        onRemoveGroup(item.id);
      }
    }
    
    // Reset drag states
    setDropPosition(null);
    setDragOverGroupId(null);
    setIsDraggingOverGroup(false);
  };

  // Handle drop on column within group
  const handleDropOnGroupColumn = (event: React.DragEvent, columnId: string, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Get drag data from dataTransfer
    let dragData: DragItem | null = null;
    try {
      const dataString = event.dataTransfer.getData('application/json');
      if (dataString) {
        dragData = JSON.parse(dataString);
      }
    } catch (e) {
      console.error('Failed to parse drag data:', e);
    }
    
    // Fall back to component state if dataTransfer is empty
    const item = dragData || draggedItem;
    if (!item) return;
    
    if (item.type === 'column') {
      // Handle dropping a column on another column within a group
      const selectedIds = item.selectedIds || [item.id];
      
      // If from another group, remove from that group first
      if (item.parentId && item.parentId !== groupId) {
        onRemoveFromGroup(item.parentId, selectedIds);
      }
      
      // If from available panel, add to selected columns first
      if (item.source === 'available') {
        onDrop({
          id: columnId,
          type: 'selected',
          parentId: groupId,
          index: dropPosition ?? undefined
        });
      } else {
        // Handle reordering or adding to group
        const groupColumnIds = getGroupColumnIds(groupId);
        
        // If already in this group, reorder
        if (item.parentId === groupId) {
          // Remove the dragged items
          const remainingIds = groupColumnIds.filter(id => !selectedIds.includes(id));
          
          // Insert at the drop position
          if (dropPosition !== null) {
            remainingIds.splice(dropPosition, 0, ...selectedIds);
            onGroupColumnsChanged(groupId, remainingIds);
          }
        } else {
          // Add to this group at specific position
          const updatedIds = [...groupColumnIds];
          
          // Insert at the drop position
          if (dropPosition !== null) {
            updatedIds.splice(dropPosition, 0, ...selectedIds.filter(id => !updatedIds.includes(id)));
            onGroupColumnsChanged(groupId, updatedIds);
          } else {
            // Add to the end if no specific position
            updatedIds.push(...selectedIds.filter(id => !updatedIds.includes(id)));
            onGroupColumnsChanged(groupId, updatedIds);
          }
        }
      }
    }
    
    // Reset drag states
    setDropPosition(null);
    setDragOverGroupId(null);
    setIsDraggingOverGroup(false);
  };

  // Handle drop on ungrouped column
  const handleDropOnColumn = (event: React.DragEvent, columnId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Get drag data from dataTransfer
    let dragData: DragItem | null = null;
    try {
      const dataString = event.dataTransfer.getData('application/json');
      if (dataString) {
        dragData = JSON.parse(dataString);
      }
    } catch (e) {
      console.error('Failed to parse drag data:', e);
    }
    
    // Fall back to component state if dataTransfer is empty
    const item = dragData || draggedItem;
    if (!item) return;
    
    if (item.type === 'column') {
      // If this column is from a group, remove it from the group
      if (item.parentId) {
        const selectedIds = item.selectedIds || [item.id];
        onRemoveFromGroup(item.parentId, selectedIds);
      }
    }
    
    // Standard drop handling
    onDrop({
      id: columnId,
      type: 'selected',
      index: dropPosition ?? undefined
    });
    
    // Reset drag states
    setDropPosition(null);
    setDragOverGroupId(null);
  };

  // Handle drop on the entire panel
  const handlePanelDrop = (event: React.DragEvent) => {
    event.preventDefault();
    
    // Get drag data from dataTransfer
    let dragData: DragItem | null = null;
    try {
      const dataString = event.dataTransfer.getData('application/json');
      if (dataString) {
        dragData = JSON.parse(dataString);
      }
    } catch (e) {
      console.error('Failed to parse drag data:', e);
    }
    
    // Fall back to component state if dataTransfer is empty
    const item = dragData || draggedItem;
    if (!item) return;
    
    if (item.type === 'column' && item.parentId) {
      // If dropping a grouped column to ungrouped area, remove from group
      const selectedIds = item.selectedIds || [item.id];
      onRemoveFromGroup(item.parentId, selectedIds);
    }
    
    // Standard drop handling
    onDrop({
      id: 'empty-selected-panel',
      type: 'selected',
      index: dropPosition ?? undefined
    });
    
    // Reset drag states
    setDropPosition(null);
    setDragOverGroupId(null);
  };

  // Handle double click
  const handleDoubleClick = (event: React.MouseEvent, nodeId: string, groupId?: string) => {
    event.stopPropagation();
    
    if (groupId) {
      // If double-clicking a column in a group, remove it from the group
      onRemoveFromGroup(groupId, [nodeId]);
    } else {
      // Standard double-click handling
      onDoubleClick(nodeId, 'selected');
    }
  };

  // Context menu handlers
  const handleContextMenu = (event: React.MouseEvent, nodeId: string, type: 'column' | 'group') => {
    event.preventDefault();
    event.stopPropagation();
    
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

  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

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
          const group = groups.find(g => g.children.includes(contextMenu.targetId!));
          if (group) {
            onRemoveFromGroup(group.id, [contextMenu.targetId]);
          }
        } else if (selectedIds.length > 0) {
          const columnGroups = new Map<string, string[]>();
          
          selectedIds.forEach(colId => {
            const group = groups.find(g => g.children.includes(colId));
            if (group) {
              const columns = columnGroups.get(group.id) || [];
              columns.push(colId);
              columnGroups.set(group.id, columns);
            }
          });
          
          columnGroups.forEach((colIds, groupId) => {
            onRemoveFromGroup(groupId, colIds);
          });
        }
        break;
      default:
        if (action.startsWith('addToGroup:')) {
          const groupId = action.split(':')[1];
          onAddToGroup(groupId);
        }
    }
  };

  // Dialog handlers
  const handleCreateGroupSubmit = () => {
    if (groupDialogName.trim()) {
      onCreateGroup(groupDialogName.trim());
      setGroupDialogName('');
      setShowCreateGroupDialog(false);
    }
  };

  const handleRenameGroupSubmit = () => {
    if (groupDialogName.trim() && targetGroupId) {
      onUpdateGroup(targetGroupId, groupDialogName.trim());
      setGroupDialogName('');
      setTargetGroupId(null);
      setShowRenameGroupDialog(false);
    }
  };

  const handleDialogCancel = () => {
    setGroupDialogName('');
    setTargetGroupId(null);
    setShowCreateGroupDialog(false);
    setShowRenameGroupDialog(false);
  };

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
        onDoubleClick={(e) => handleDoubleClick(e, column.id, groupId)}
        onContextMenu={(e) => handleContextMenu(e, column.id, 'column')}
        draggable
        onDragStart={(e) => handleDragStart(column.id, false, e, groupId)}
        onDragOver={(e) => inGroup 
          ? handleDragOverGroupColumn(e, column.id, groupId!) 
          : handleDragOverColumn(e, column.id)
        }
        onDrop={(e) => inGroup 
          ? handleDropOnGroupColumn(e, column.id, groupId!) 
          : handleDropOnColumn(e, column.id)
        }
      >
        <span className="column-reorder-handle">≡</span>
        <span className="column-name">{column.name}</span>
      </div>
    );
  };

  // Render a group
  const renderGroup = (group: SelectedGroup) => {
    const groupColumns = getGroupColumns(group.id);
    const isDropTarget = dropTarget === group.id || dragOverGroupId === group.id;
    const isDragging = draggedItem?.id === group.id && draggedItem.source === 'selected';
    
    return (
      <div
        key={group.id}
        ref={el => { nodeRefs.current[group.id] = el; }}
        className={`selected-group ${isDropTarget ? 'drop-target' : ''} ${isDragging ? 'dragging' : ''}`}
        onContextMenu={(e) => handleContextMenu(e, group.id, 'group')}
        onDragOver={(e) => handleDragOverGroup(e, group.id)}
        onDrop={(e) => handleDropOnGroup(e, group.id)}
      >
        <div 
          className="group-header"
          draggable
          onDragStart={(e) => handleDragStart(group.id, true, e)}
        >
          <span className="group-reorder-handle">≡</span>
          <span className="group-name">{group.name}</span>
          <span className="group-count">({groupColumns.length})</span>
        </div>
        <div className="group-columns">
          {/* Render drop indicator at start position if needed */}
          {isDraggingOverGroup && dragOverGroupId === group.id && dropPosition === 0 && (
            <div className="drop-indicator"></div>
          )}
          
          {/* Render group columns with drop indicators */}
          {groupColumns.map((col, index) => (
            <React.Fragment key={col.id}>
              {renderColumnNode(col, true, group.id)}
              {/* Render drop indicator after this column if needed */}
              {isDraggingOverGroup && dragOverGroupId === group.id && dropPosition === index + 1 && (
                <div className="drop-indicator"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Filter groups based on search
  const filteredGroups = groups.filter(group => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Check if group name matches
    if (group.name.toLowerCase().includes(searchLower)) return true;
    
    // Check if any columns in the group match
    const groupColumns = getGroupColumns(group.id);
    return groupColumns.some(col => 
      col.name.toLowerCase().includes(searchLower)
    );
  });

  // Filter ungrouped columns based on search
  const filteredUngroupedColumns = getUngroupedColumns()
    .filter(col => !searchQuery || col.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
        ref={panelRef}
        className="panel-content"
        onClick={closeContextMenu}
        onDragOver={handlePanelDragOver}
        onDrop={handlePanelDrop}
      >
        {columns.length === 0 ? (
          <div className="empty-message">No columns selected</div>
        ) : (
          <>
            {/* Render groups */}
            {filteredGroups.map(renderGroup)}
            
            {/* Render ungrouped columns with drop indicators */}
            {!isDraggingOverGroup && dropPosition === 0 && filteredUngroupedColumns.length > 0 && (
              <div className="drop-indicator"></div>
            )}
            
            {filteredUngroupedColumns.map((col, index) => (
              <React.Fragment key={col.id}>
                {renderColumnNode(col, false)}
                {/* Render drop indicator after this column if needed */}
                {!isDraggingOverGroup && dropPosition === index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </React.Fragment>
            ))}
            
            {/* Add indicator at the end if needed */}
            {!isDraggingOverGroup && 
             dropPosition === filteredUngroupedColumns.length && 
             filteredUngroupedColumns.length > 0 && (
              <div className="drop-indicator"></div>
            )}
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
        
        {/* Dialogs */}
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