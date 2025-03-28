import { useState, useCallback } from 'react';
import { useColumnChooser } from '../context/ColumnChooserContext';

/**
 * Custom hook for group management operations
 */
export function useGroupManagement() {
  const { state, dispatch } = useColumnChooser();
  
  // Local state for context menu and dialogs
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
  
  // Handle context menu
  const handleContextMenu = useCallback((
    event: React.MouseEvent, 
    nodeId: string, 
    type: 'column' | 'group'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (type === 'column' && !state.selectedSelectedIds.includes(nodeId)) {
      dispatch({ type: 'SET_SELECTED_SELECTED_IDS', payload: [nodeId] });
    }
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      targetId: nodeId,
      targetType: type
    });
  }, [state.selectedSelectedIds, dispatch]);
  
  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);
  
  // Handle context menu actions
  const handleContextMenuAction = useCallback((action: string) => {
    closeContextMenu();
    
    switch (action) {
      case 'createGroup':
        dispatch({ type: 'SHOW_CREATE_GROUP_DIALOG', payload: true });
        break;
      case 'removeGroup':
        if (contextMenu.targetId) {
          const group = state.selectedGroups.find(g => g.id === contextMenu.targetId);
          if (group) {
            dispatch({ 
              type: 'REMOVE_GROUP', 
              payload: contextMenu.targetId 
            });
          }
        }
        break;
      case 'renameGroup':
        if (contextMenu.targetId) {
          const group = state.selectedGroups.find(g => g.id === contextMenu.targetId);
          if (group) {
            dispatch({ type: 'SET_GROUP_DIALOG_NAME', payload: group.name });
            dispatch({ type: 'SET_TARGET_GROUP_ID', payload: group.id });
            dispatch({ type: 'SHOW_RENAME_GROUP_DIALOG', payload: true });
          }
        }
        break;
      case 'removeFromGroup':
        if (contextMenu.targetId && contextMenu.targetType === 'column') {
          const group = state.selectedGroups.find(g => g.children.includes(contextMenu.targetId!));
          if (group) {
            dispatch({
              type: 'REMOVE_FROM_GROUP',
              payload: { groupId: group.id, columnIds: [contextMenu.targetId] }
            });
          }
        } else if (state.selectedSelectedIds.length > 0) {
          const columnGroups = new Map<string, string[]>();
          
          state.selectedSelectedIds.forEach(colId => {
            const group = state.selectedGroups.find(g => g.children.includes(colId));
            if (group) {
              const columns = columnGroups.get(group.id) || [];
              columns.push(colId);
              columnGroups.set(group.id, columns);
            }
          });
          
          columnGroups.forEach((colIds, groupId) => {
            dispatch({
              type: 'REMOVE_FROM_GROUP',
              payload: { groupId, columnIds: colIds }
            });
          });
        }
        break;
      default:
        if (action.startsWith('addToGroup:')) {
          const groupId = action.split(':')[1];
          dispatch({
            type: 'ADD_TO_GROUP',
            payload: { groupId, columnIds: state.selectedSelectedIds }
          });
        }
    }
  }, [
    contextMenu, 
    state.selectedGroups, 
    state.selectedSelectedIds, 
    dispatch, 
    closeContextMenu
  ]);
  
  // Handle dialog submissions
  const handleCreateGroupSubmit = useCallback((name: string) => {
    if (name.trim()) {
      dispatch({
        type: 'CREATE_GROUP',
        payload: { name: name.trim(), columnIds: state.selectedSelectedIds }
      });
      dispatch({ type: 'SET_GROUP_DIALOG_NAME', payload: '' });
      dispatch({ type: 'SHOW_CREATE_GROUP_DIALOG', payload: false });
    }
  }, [state.selectedSelectedIds, dispatch]);
  
  const handleRenameGroupSubmit = useCallback((name: string) => {
    if (name.trim() && state.targetGroupId) {
      dispatch({
        type: 'UPDATE_GROUP',
        payload: { groupId: state.targetGroupId, newName: name.trim() }
      });
      dispatch({ type: 'SET_GROUP_DIALOG_NAME', payload: '' });
      dispatch({ type: 'SET_TARGET_GROUP_ID', payload: null });
      dispatch({ type: 'SHOW_RENAME_GROUP_DIALOG', payload: false });
    }
  }, [state.targetGroupId, dispatch]);
  
  const handleDialogCancel = useCallback(() => {
    dispatch({ type: 'SET_GROUP_DIALOG_NAME', payload: '' });
    dispatch({ type: 'SET_TARGET_GROUP_ID', payload: null });
    dispatch({ type: 'SHOW_CREATE_GROUP_DIALOG', payload: false });
    dispatch({ type: 'SHOW_RENAME_GROUP_DIALOG', payload: false });
  }, [dispatch]);
  
  return {
    contextMenu,
    showCreateGroupDialog: state.showCreateGroupDialog,
    showRenameGroupDialog: state.showRenameGroupDialog,
    groupDialogName: state.groupDialogName,
    targetGroupId: state.targetGroupId,
    handleContextMenu,
    closeContextMenu,
    handleContextMenuAction,
    handleCreateGroupSubmit,
    handleRenameGroupSubmit,
    handleDialogCancel,
    setGroupDialogName: (name: string) => dispatch({ 
      type: 'SET_GROUP_DIALOG_NAME', 
      payload: name 
    })
  };
}
