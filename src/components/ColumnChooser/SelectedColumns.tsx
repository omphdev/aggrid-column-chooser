import React, { useState } from 'react';
import { ColumnItem, ColumnGroup } from '../../types';
import TreeView from '../TreeView';
import './SelectedColumns.css';

interface SelectedColumnsProps {
  columns: ColumnItem[];
  selectedIds: string[];
  leafCount: number;
  toggleSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedCount: () => number;
  moveItemsToAvailable: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  reorderItems: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  moveSelectedUp: () => void;
  moveSelectedDown: () => void;
  clearSelected: () => void;
  onDoubleClick: (id: string) => void;
  moveItemsToSelected?: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
  title?: string;
  showGroupLabels?: boolean;
  columnGroups: ColumnGroup[];
  onColumnGroupsChange: (columnGroups: ColumnGroup[]) => void;
  onAddToGroup: (columnIds: string[], groupId: string) => void;
  onRemoveFromGroup: (columnIds: string[], groupId: string) => void;
  onCreateGroup: (name: string, columnIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onReorderGroups: (groupIds: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
}

const SelectedColumns: React.FC<SelectedColumnsProps> = ({
  columns,
  selectedIds,
  leafCount,
  toggleSelect,
  selectAll,
  clearSelection,
  getSelectedCount,
  moveItemsToAvailable,
  reorderItems,
  moveSelectedUp,
  moveSelectedDown,
  clearSelected,
  onDoubleClick,
  moveItemsToSelected,
  title = "Selected Columns",
  showGroupLabels = true,
  columnGroups,
  onColumnGroupsChange,
  onAddToGroup,
  onRemoveFromGroup,
  onCreateGroup,
  onDeleteGroup,
  onRenameGroup,
  onReorderGroups
}) => {
  // State for managing the group menu
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [groupMenuPosition, setGroupMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedForGrouping, setSelectedForGrouping] = useState<string[]>([]);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  // State for drag and drop targets
  const [groupDragTarget, setGroupDragTarget] = useState<string | null>(null);
  const [itemDragTarget, setItemDragTarget] = useState<string | null>(null);
  
  // Handle drag start - TreeView will handle the details
  const handleDragStart = (e: React.DragEvent, item: ColumnItem) => {
    console.log('Drag start in SelectedColumns for item:', item.id);
  };
  
  // Handle group drag start
  const handleGroupDragStart = (e: React.DragEvent, group: ColumnGroup) => {
    console.log('Drag start for group:', group.id);
    
    // Set the drag data for the group
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'group',
      groupId: group.id,
      source: 'selected'
    }));
  };
  
  // Handle drop - process drops from both panels and for groups
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // Get the drag data
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) {
        console.error('No drag data found');
        return;
      }
      
      const data = JSON.parse(dataText);
      console.log('Drop in selected columns:', data);
      
      // Get drop position from the event
      const positionedEvent = e as any;
      const dropPosition = positionedEvent.dropPosition || { insertBefore: true };
      
      if (data.type === 'group' && data.source === 'selected') {
        // Handle group reordering
        onReorderGroups([data.groupId], dropPosition);
        return;
      }
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Items coming from available panel
        console.log('Moving items from available to selected:', data.ids);
        
        if (moveItemsToSelected) {
          moveItemsToSelected(data.ids, dropPosition);
        }
      } else if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Reordering within selected panel
        console.log('Reordering within selected panel:', data.ids);
        reorderItems(data.ids, dropPosition);
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  // Handle drop on a group
  const handleDropOnGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    
    try {
      // Get the drag data
      const dataText = e.dataTransfer.getData('text/plain');
      if (!dataText) {
        console.error('No drag data found');
        return;
      }
      
      const data = JSON.parse(dataText);
      console.log('Drop on group:', groupId, data);
      
      // Handle adding columns to the group
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Handle group-to-group transfer if applicable
        if (data.sourceGroupId && data.sourceGroupId !== groupId) {
          // Move between groups - first remove from old group
          onRemoveFromGroup(data.ids, data.sourceGroupId);
          // Then add to new group
          onAddToGroup(data.ids, groupId);
        } else if (!data.sourceGroupId) {
          // Add from ungrouped to group
          onAddToGroup(data.ids, groupId);
        }
      } else if (data.source === 'available' && data.ids && data.ids.length > 0 && moveItemsToSelected) {
        // First move items to selected, then add to group
        moveItemsToSelected(data.ids, { insertBefore: false });
        // Need to wait for state update before adding to group
        setTimeout(() => onAddToGroup(data.ids, groupId), 100);
      }
    } catch (err) {
      console.error('Error processing drop on group:', err);
    }
  };
  
  // Handle double-click on an item
  const handleDoubleClick = (item: ColumnItem) => {
    onDoubleClick(item.id);
  };
  
  // Handle right-click on selected items (for group operations)
  const handleContextMenu = (e: React.MouseEvent, columnIds?: string[]) => {
    e.preventDefault();
    
    // If we have selected items or specific items passed in
    if (selectedIds.length > 0 || (columnIds && columnIds.length > 0)) {
      setShowGroupMenu(true);
      setGroupMenuPosition({ x: e.clientX, y: e.clientY });
      setSelectedForGrouping(columnIds || selectedIds);
    }
  };
  
  // Create a new group from selected columns
  const handleCreateGroup = () => {
    setShowGroupMenu(false);
    setShowCreateGroupDialog(true);
  };
  
  // Process new group creation
  const submitCreateGroup = () => {
    if (newGroupName.trim()) {
      onCreateGroup(newGroupName.trim(), selectedForGrouping);
      setNewGroupName('');
      setShowCreateGroupDialog(false);
    }
  };
  
  // Add selected columns to an existing group
  const handleAddToGroup = (groupId: string) => {
    onAddToGroup(selectedForGrouping, groupId);
    setShowGroupMenu(false);
  };
  
  // Remove columns from a group
  const handleRemoveFromGroup = (columnIds: string[], groupId: string) => {
    onRemoveFromGroup(columnIds, groupId);
  };
  
  // Start editing a group name
  const handleStartEditGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditingGroupName(currentName);
  };
  
  // Save the edited group name
  const handleSaveGroupName = () => {
    if (editingGroupId && editingGroupName.trim()) {
      onRenameGroup(editingGroupId, editingGroupName.trim());
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  };
  
  // Cancel editing a group name
  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };
  
  // Delete a group
  const handleDeleteGroup = (groupId: string) => {
    onDeleteGroup(groupId);
  };
  
  // Prepare data for display with groups
  // Convert flat columns + groups into a structure for display
  const prepareGroupedColumnsForDisplay = (): ColumnItem[] => {
    // Create a map for quick column lookup
    const columnMap = new Map<string, ColumnItem>();
    columns.forEach(col => columnMap.set(col.id, col));
    
    // Create a map to track which columns are in groups
    const columnToGroupMap = new Map<string, string>();
    columnGroups.forEach(group => {
      group.columnIds.forEach(colId => {
        columnToGroupMap.set(colId, group.id);
      });
    });
    
    // Prepare the result structure
    const result: ColumnItem[] = [];
    
    // Add groups as parent items
    columnGroups.forEach(group => {
      // Filter for valid column IDs (that exist in our columns)
      const groupColumnIds = group.columnIds.filter(id => columnMap.has(id));
      
      if (groupColumnIds.length > 0) {
        // Create a parent item for the group
        const groupItem: ColumnItem = {
          id: `group_${group.id}`,
          name: group.name,
          field: '', // Groups don't have fields
          children: groupColumnIds.map(id => columnMap.get(id)!),
          expanded: true,
          isGroup: true, // Flag to indicate this is a group
          groupId: group.id // Store the original group ID
        };
        
        result.push(groupItem);
      }
    });
    
    // Add ungrouped columns
    columns.forEach(col => {
      if (!columnToGroupMap.has(col.id)) {
        result.push({ ...col });
      }
    });
    
    return result;
  };
  
  // Get grouped columns for display
  const groupedColumns = prepareGroupedColumnsForDisplay();
  
  // Custom header with action buttons
  const renderCustomHeader = () => (
    <div className="selected-columns-header">
      <div className="header-title">
        <h3>{title}</h3>
        <div className="column-stats">
          <span className="column-count">{leafCount} columns</span>
          {getSelectedCount() > 0 && (
            <span className="selected-count">{getSelectedCount()} selected</span>
          )}
        </div>
      </div>
      
      <div className="header-actions">
        <div className="selection-actions">
          <button className="action-button" onClick={selectAll}>Select All</button>
          <button className="action-button" onClick={clearSelection}>Clear Selection</button>
          {getSelectedCount() > 0 && (
            <button 
              className="action-button group-btn" 
              onClick={() => handleContextMenu(new MouseEvent('contextmenu') as any, selectedIds)}
              title="Group operations"
            >
              Group...
            </button>
          )}
        </div>
        
        <div className="column-actions">
          <button 
            className="action-button move-up-btn" 
            onClick={moveSelectedUp}
            disabled={getSelectedCount() === 0}
            title="Move selected row(s) up"
          >
            <span>↑</span>
          </button>
          <button 
            className="action-button move-down-btn" 
            onClick={moveSelectedDown}
            disabled={getSelectedCount() === 0}
            title="Move selected row(s) down"
          >
            <span>↓</span>
          </button>
          <button 
            className="action-button clear-btn" 
            onClick={clearSelected}
            disabled={columns.length === 0}
            title="Clear all selected columns"
          >
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
  
  // Render the group menu (context menu)
  const renderGroupMenu = () => {
    if (!showGroupMenu) return null;
    
    return (
      <div 
        className="group-context-menu"
        style={{
          position: 'fixed',
          top: `${groupMenuPosition.y}px`,
          left: `${groupMenuPosition.x}px`,
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          padding: '8px 0'
        }}
      >
        <div 
          className="menu-item"
          onClick={handleCreateGroup}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Create new group
        </div>
        
        {columnGroups.length > 0 && (
          <>
            <div className="menu-divider" style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
            <div className="menu-label" style={{ padding: '4px 16px', color: '#666', fontSize: '12px' }}>
              Add to existing group:
            </div>
            {columnGroups.map(group => (
              <div 
                key={group.id}
                className="menu-item"
                onClick={() => handleAddToGroup(group.id)}
                style={{ padding: '8px 16px', cursor: 'pointer' }}
              >
                {group.name}
              </div>
            ))}
          </>
        )}
        
        <div className="menu-divider" style={{ height: '1px', backgroundColor: '#ddd', margin: '4px 0' }}></div>
        <div 
          className="menu-item"
          onClick={() => setShowGroupMenu(false)}
          style={{ padding: '8px 16px', cursor: 'pointer', color: '#999' }}
        >
          Cancel
        </div>
      </div>
    );
  };
  
  // Render create group dialog
  const renderCreateGroupDialog = () => {
    if (!showCreateGroupDialog) return null;
    
    return (
      <div className="modal-backdrop" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="modal-content" style={{
          backgroundColor: 'white',
          borderRadius: '4px',
          padding: '16px',
          minWidth: '300px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          <h3 style={{ margin: '0 0 16px' }}>Create Column Group</h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Group Name:</label>
            <input 
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              autoFocus
            />
          </div>
          <div style={{ textAlign: 'right' }}>
            <button 
              onClick={() => setShowCreateGroupDialog(false)}
              style={{
                padding: '8px 16px',
                marginRight: '8px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={submitCreateGroup}
              disabled={!newGroupName.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: newGroupName.trim() ? 1 : 0.5
              }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render a group header
  const renderGroupHeader = (groupId: string) => {
    const group = columnGroups.find(g => g.id === groupId);
    if (!group) return null;
    
    const isEditing = editingGroupId === group.id;
    const isBeingDraggedOver = groupDragTarget === group.id;
    
    return (
      <div 
        className={`group-header ${isBeingDraggedOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setGroupDragTarget(group.id);
        }}
        onDragLeave={() => {
          setGroupDragTarget(null);
        }}
      >
        {isEditing ? (
          <input 
            type="text"
            value={editingGroupName}
            onChange={(e) => setEditingGroupName(e.target.value)}
            autoFocus
            onBlur={handleSaveGroupName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveGroupName();
              if (e.key === 'Escape') handleCancelEditGroup();
            }}
          />
        ) : (
          <div 
            className="group-name"
            draggable
            onDragStart={(e) => handleGroupDragStart(e, group)}
            style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
          >
            <span className="group-move-handle">⋮⋮</span>
            <span>{group.name}</span>
            <span className="group-count">({group.columnIds.length})</span>
          </div>
        )}
        
        <div className="group-actions">
          {!isEditing && (
            <>
              <button 
                className="action-button"
                onClick={() => handleStartEditGroup(group.id, group.name)}
                title="Rename group"
                style={{ marginRight: '4px' }}
              >
                ✎
              </button>
              <button 
                className="action-button"
                onClick={() => handleDeleteGroup(group.id)}
                title="Delete group"
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  // Function to handle a column item being dropped on a group
  const handleColumnDropOnGroup = (groupId: string, columnIds: string[]) => {
    onAddToGroup(columnIds, groupId);
  };
  
  return (
    <div 
      className="selected-columns-container"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {renderCustomHeader()}
      
      <div className="selected-columns-content">
        <TreeView
          items={groupedColumns}
          selectedIds={selectedIds}
          title=""
          onDragStart={handleDragStart}
          onDrop={handleDrop}
          toggleExpand={() => {}} // Not needed for flat view
          toggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          selectedCount={getSelectedCount()}
          totalCount={leafCount}
          flatView={false} // Use hierarchical view for grouped columns
          showGroupLabels={showGroupLabels}
          source="selected"
          hideHeader={true}
          onDoubleClick={handleDoubleClick}
          enableReordering={true} // Enable reordering functionality
          renderGroupHeader={renderGroupHeader}
          onContextMenu={handleContextMenu}
          onDropOnGroup={handleColumnDropOnGroup}
          onRemoveFromGroup={handleRemoveFromGroup}
          moveItemsToSelected={moveItemsToSelected}
        />
      </div>
      
      {/* Render context menu for grouping */}
      {renderGroupMenu()}
      
      {/* Render create group dialog */}
      {renderCreateGroupDialog()}
    </div>
  );
};

export default React.memo(SelectedColumns);