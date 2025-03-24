// src/components/ColumnChooser/SelectedColumns.jsx
import React, { useState } from 'react';
import TreeView from '../TreeView';
import { cx } from '../../utils/styleUtils';

const SelectedColumns = ({
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
  onReorderGroups,
  classes
}) => {
  // State for managing the group menu
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [groupMenuPosition, setGroupMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedForGrouping, setSelectedForGrouping] = useState([]);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  
  // State for drag and drop targets
  const [groupDragTarget, setGroupDragTarget] = useState(null);
  const [itemDragTarget, setItemDragTarget] = useState(null);
  
  // Handle drag start - TreeView will handle the details
  const handleDragStart = (e, item) => {
    console.log('Drag start in SelectedColumns for item:', item.id);
  };
  
  // Handle group drag start
  const handleGroupDragStart = (e, group) => {
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
  const handleDrop = (e) => {
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
      const positionedEvent = e;
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
        
        // If the items are being dragged from a group
        if (data.sourceGroupId) {
          // First remove from the group
          onRemoveFromGroup(data.ids, data.sourceGroupId);
          // Then reorder in the selected panel
          reorderItems(data.ids, dropPosition);
        } else {
          // Normal reordering within selected panel
          reorderItems(data.ids, dropPosition);
        }
      }
    } catch (err) {
      console.error('Error processing drop:', err);
    }
  };
  
  // Handle drop on a group
  const handleDropOnGroup = (e, groupId) => {
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
  const handleDoubleClick = (item) => {
    onDoubleClick(item.id);
  };
  
  // Handle right-click on selected items (for group operations)
  const handleContextMenu = (e, columnIds) => {
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
  const handleAddToGroup = (groupId) => {
    onAddToGroup(selectedForGrouping, groupId);
    setShowGroupMenu(false);
  };
  
  // Remove columns from a group
  const handleRemoveFromGroup = (columnIds, groupId) => {
    onRemoveFromGroup(columnIds, groupId);
  };
  
  // Start editing a group name
  const handleStartEditGroup = (groupId, currentName) => {
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
  const handleDeleteGroup = (groupId) => {
    onDeleteGroup(groupId);
  };
  
  // Prepare data for display with groups
  // Convert flat columns + groups into a structure for display
  const prepareGroupedColumnsForDisplay = () => {
    // Create a map for quick column lookup
    const columnMap = new Map();
    columns.forEach(col => columnMap.set(col.id, col));
    
    // Create a map to track which columns are in groups
    const columnToGroupMap = new Map();
    columnGroups.forEach(group => {
      group.columnIds.forEach(colId => {
        columnToGroupMap.set(colId, group.id);
      });
    });
    
    // Create a map of group ID to group for quick lookup
    const groupMap = new Map();
    columnGroups.forEach(group => groupMap.set(group.id, group));
    
    // Process columns in their original order
    const result = [];
    const processedGroups = new Set();
    
    columns.forEach(col => {
      const groupId = columnToGroupMap.get(col.id);
      
      if (groupId) {
        // This column belongs to a group
        if (!processedGroups.has(groupId)) {
          // First time seeing this group, create the group definition
          const group = groupMap.get(groupId);
          const groupChildren = group.columnIds
            .filter(id => columnMap.has(id))
            .map(id => columnMap.get(id));
          
          // Create a parent item for the group
          const groupItem = {
            id: `group_${groupId}`,
            name: group.name,
            field: '', // Groups don't have fields
            children: groupChildren,
            expanded: true,
            isGroup: true, // Flag to indicate this is a group
            groupId: groupId // Store the original group ID
          };
          
          result.push(groupItem);
          processedGroups.add(groupId);
        }
      } else {
        // This is an ungrouped column
        result.push({ ...col });
      }
    });
    
    return result;
  };
  
  // Get grouped columns for display
  const groupedColumns = prepareGroupedColumnsForDisplay();
  
  // Custom header with action buttons
  const renderCustomHeader = () => (
    <div className={classes.selectedColumnsHeader}>
      <div className={classes.headerTitle}>
        <h3 className={classes.headerTitleText}>{title}</h3>
        <div className={classes.columnStats}>
          <span className={classes.columnCount}>{leafCount} columns</span>
          {getSelectedCount() > 0 && (
            <span className={classes.selectedCount}>{getSelectedCount()} selected</span>
          )}
        </div>
      </div>
      
      <div className={classes.headerActions}>
        <div className={classes.selectionActions}>
          <button 
            className={classes.actionButton} 
            onClick={selectAll}
          >
            Select All
          </button>
          <button 
            className={classes.actionButton} 
            onClick={clearSelection}
          >
            Clear Selection
          </button>
          {getSelectedCount() > 0 && (
            <button 
              className={cx(classes.actionButton, classes.groupBtn)}
              onClick={() => handleContextMenu(new MouseEvent('contextmenu'), selectedIds)}
              title="Group operations"
            >
              Group...
            </button>
          )}
        </div>
        
        <div className={classes.columnActions}>
          <button 
            className={cx(classes.actionButton, classes.moveUpBtn)}
            onClick={moveSelectedUp}
            disabled={getSelectedCount() === 0}
            title="Move selected row(s) up"
          >
            <span>↑</span>
          </button>
          <button 
            className={cx(classes.actionButton, classes.moveDownBtn)}
            onClick={moveSelectedDown}
            disabled={getSelectedCount() === 0}
            title="Move selected row(s) down"
          >
            <span>↓</span>
          </button>
          <button 
            className={cx(classes.actionButton, classes.clearBtn)}
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
        className={classes.groupContextMenu}
        style={{
          top: `${groupMenuPosition.y}px`,
          left: `${groupMenuPosition.x}px`,
        }}
      >
        <div 
          className={classes.menuItem}
          onClick={handleCreateGroup}
        >
          Create new group
        </div>
        
        {columnGroups.length > 0 && (
          <>
            <div className={classes.menuDivider}></div>
            <div className={classes.menuLabel}>
              Add to existing group:
            </div>
            {columnGroups.map(group => (
              <div 
                key={group.id}
                className={classes.menuItem}
                onClick={() => handleAddToGroup(group.id)}
              >
                {group.name}
              </div>
            ))}
          </>
        )}
        
        <div className={classes.menuDivider}></div>
        <div 
          className={classes.menuItemCancel}
          onClick={() => setShowGroupMenu(false)}
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
      <div className={classes.modalBackdrop}>
        <div className={classes.modalContent}>
          <h3 className={classes.modalTitle}>Create Column Group</h3>
          <div className={classes.formGroup}>
            <label className={classes.label}>Group Name:</label>
            <input 
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className={classes.textInput}
              autoFocus
            />
          </div>
          <div className={classes.modalActions}>
            <button 
              onClick={() => setShowCreateGroupDialog(false)}
              className={classes.modalCancelBtn}
            >
              Cancel
            </button>
            <button 
              onClick={submitCreateGroup}
              disabled={!newGroupName.trim()}
              className={classes.modalConfirmBtn}
              style={{ opacity: newGroupName.trim() ? 1 : 0.5 }}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render a group header
  const renderGroupHeader = (groupId) => {
    const group = columnGroups.find(g => g.id === groupId);
    if (!group) return null;
    
    const isEditing = editingGroupId === group.id;
    const isBeingDraggedOver = groupDragTarget === group.id;
    
    return (
      <div 
        className={cx(
          classes.groupHeader,
          isBeingDraggedOver ? classes.groupHeaderDragOver : ''
        )}
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
            className={classes.textInput}
          />
        ) : (
          <div 
            className={classes.groupName}
            draggable
            onDragStart={(e) => handleGroupDragStart(e, group)}
          >
            <span className={classes.groupMoveHandle}>⋮⋮</span>
            <span>{group.name}</span>
            <span className={classes.groupCount}>({group.columnIds.length})</span>
          </div>
        )}
        
        <div className={classes.groupActions}>
          {!isEditing && (
            <>
              <button 
                className={classes.actionButton}
                onClick={() => handleStartEditGroup(group.id, group.name)}
                title="Rename group"
                style={{ marginRight: '4px' }}
              >
                ✎
              </button>
              <button 
                className={classes.actionButton}
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
  const handleColumnDropOnGroup = (groupId, columnIds) => {
    onAddToGroup(columnIds, groupId);
  };
  
  return (
    <div 
      className={classes.selectedColumnsContainer}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {renderCustomHeader()}
      
      <div className={classes.selectedColumnsContent}>
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
          classes={classes}
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