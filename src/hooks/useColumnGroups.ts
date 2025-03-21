import { useState, useCallback } from 'react';
import { ColumnItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseColumnGroupsProps {
  columnGroups: ColumnItem[];
  selectedColumns: ColumnItem[];
  onColumnGroupsChange: (groups: ColumnItem[]) => void;
}

export const useColumnGroups = ({
  columnGroups,
  selectedColumns,
  onColumnGroupsChange,
}: UseColumnGroupsProps) => {
  // Add columns to a group
  const addColumnsToGroup = useCallback((columnIds: string[], groupId: string) => {
    const group = columnGroups.find(g => g.id === groupId);
    if (!group) return;

    const validColumns = columnIds.filter(id => {
      const column = selectedColumns.find(c => c.id === id);
      return column && !group.children?.some(child => child.id === id);
    });

    if (validColumns.length === 0) return;

    const newGroup = {
      ...group,
      children: [
        ...(group.children || []),
        ...validColumns.map(id => selectedColumns.find(c => c.id === id)!),
      ],
    };

    onColumnGroupsChange(
      columnGroups.map(g => (g.id === groupId ? newGroup : g))
    );
  }, [columnGroups, selectedColumns, onColumnGroupsChange]);

  // Create a new group
  const createColumnGroup = useCallback((columnIds: string[], groupName: string) => {
    const validColumns = columnIds.filter(id => 
      selectedColumns.some(c => c.id === id)
    );

    if (validColumns.length === 0) return;

    const newGroup: ColumnItem = {
      id: uuidv4(),
      name: groupName,
      children: validColumns.map(id => 
        selectedColumns.find(c => c.id === id)!
      ),
    };

    onColumnGroupsChange([...columnGroups, newGroup]);
  }, [columnGroups, selectedColumns, onColumnGroupsChange]);

  // Remove columns from a group
  const removeColumnsFromGroup = useCallback((columnIds: string[], groupId: string) => {
    const group = columnGroups.find(g => g.id === groupId);
    if (!group) return;

    const newGroup = {
      ...group,
      children: group.children?.filter(child => !columnIds.includes(child.id)) || [],
    };

    // If group is empty, remove it
    if (newGroup.children.length === 0) {
      onColumnGroupsChange(columnGroups.filter(g => g.id !== groupId));
    } else {
      onColumnGroupsChange(
        columnGroups.map(g => (g.id === groupId ? newGroup : g))
      );
    }
  }, [columnGroups, onColumnGroupsChange]);

  // Rename a group
  const renameColumnGroup = useCallback((groupId: string, newName: string) => {
    onColumnGroupsChange(
      columnGroups.map(g => 
        g.id === groupId ? { ...g, name: newName } : g
      )
    );
  }, [columnGroups, onColumnGroupsChange]);

  // Delete a group
  const deleteColumnGroup = useCallback((groupId: string) => {
    onColumnGroupsChange(columnGroups.filter(g => g.id !== groupId));
  }, [columnGroups, onColumnGroupsChange]);

  // Reorder groups
  const reorderColumnGroups = useCallback((sourceIndex: number, targetIndex: number) => {
    const newGroups = [...columnGroups];
    const [removed] = newGroups.splice(sourceIndex, 1);
    newGroups.splice(targetIndex, 0, removed);
    onColumnGroupsChange(newGroups);
  }, [columnGroups, onColumnGroupsChange]);

  // Move columns between groups
  const moveColumnsBetweenGroups = useCallback((
    columnIds: string[],
    sourceGroupId: string,
    targetGroupId: string
  ) => {
    const sourceGroup = columnGroups.find(g => g.id === sourceGroupId);
    const targetGroup = columnGroups.find(g => g.id === targetGroupId);

    if (!sourceGroup || !targetGroup) return;

    const validColumns = columnIds.filter(id => 
      sourceGroup.children?.some(child => child.id === id)
    );

    if (validColumns.length === 0) return;

    // Remove from source group
    const newSourceGroup = {
      ...sourceGroup,
      children: sourceGroup.children?.filter(child => !validColumns.includes(child.id)) || [],
    };

    // Add to target group
    const newTargetGroup = {
      ...targetGroup,
      children: [
        ...(targetGroup.children || []),
        ...validColumns.map(id => sourceGroup.children?.find(child => child.id === id)!),
      ],
    };

    // Update groups
    const newGroups = columnGroups.map(g => {
      if (g.id === sourceGroupId) return newSourceGroup;
      if (g.id === targetGroupId) return newTargetGroup;
      return g;
    });

    // Remove empty source group if needed
    if (newSourceGroup.children.length === 0) {
      onColumnGroupsChange(newGroups.filter(g => g.id !== sourceGroupId));
    } else {
      onColumnGroupsChange(newGroups);
    }
  }, [columnGroups, onColumnGroupsChange]);

  return {
    addColumnsToGroup,
    createColumnGroup,
    removeColumnsFromGroup,
    renameColumnGroup,
    deleteColumnGroup,
    reorderColumnGroups,
    moveColumnsBetweenGroups,
  };
}; 