import { useState, useEffect } from 'react';
import { ColumnGroup, ColumnGroupAction, ExtendedColDef } from '../../types';

export interface UseColumnGroupsProps {
  initialColumnGroups: ColumnGroup[];
  onColumnGroupChanged: (headerName: string, action: ColumnGroupAction, replacementName?: string) => void;
  columnDefs?: ExtendedColDef[];
}

export function useColumnGroups({
  initialColumnGroups,
  onColumnGroupChanged,
  columnDefs = []
}: UseColumnGroupsProps) {
  // State for column groups (maintain local copy to manipulate)
  const [columnGroups, setColumnGroups] = useState<ColumnGroup[]>(initialColumnGroups || []);
  
  // Helper function to get all group paths from columns
  const getAllGroupPaths = (columns: ExtendedColDef[]) => {
    const allGroups = new Set<string>();
    columns.forEach(col => {
      if (col.groupPath) {
        col.groupPath.forEach((_, index) => {
          const path = col.groupPath!.slice(0, index + 1).join('.');
          allGroups.add(path);
        });
      }
    });
    return allGroups;
  };

  // State for expanded groups in available columns
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const allGroups = new Set<string>();
    
    // Add groups from initialColumnGroups
    initialColumnGroups?.forEach(group => {
      allGroups.add(group.headerName);
      // Add all parent paths for nested groups
      let path = '';
      group.headerName.split('.').forEach(segment => {
        path = path ? `${path}.${segment}` : segment;
        allGroups.add(path);
      });
    });

    // Add groups from column groupPaths
    const columnGroupPaths = getAllGroupPaths(columnDefs);
    columnGroupPaths.forEach(path => allGroups.add(path));
    
    return allGroups;
  });
  
  // State for expanded groups in selected columns
  const [expandedSelectedGroups, setExpandedSelectedGroups] = useState<Set<string>>(() => {
    const allGroups = new Set<string>();
    
    // Try to get expanded groups from localStorage
    const savedExpandedGroups = localStorage.getItem('expandedSelectedGroups');
    if (savedExpandedGroups) {
      const parsed = JSON.parse(savedExpandedGroups);
      parsed.forEach((group: string) => allGroups.add(group));
      return allGroups;
    }
    
    // If no saved state, add all groups from initialColumnGroups
    initialColumnGroups?.forEach(group => {
      allGroups.add(group.headerName);
      // Add all parent paths for nested groups
      let path = '';
      group.headerName.split('.').forEach(segment => {
        path = path ? `${path}.${segment}` : segment;
        allGroups.add(path);
      });
    });

    // Add all groups from column groupPaths
    const columnGroupPaths = getAllGroupPaths(columnDefs);
    columnGroupPaths.forEach(path => allGroups.add(path));
    
    // Save initial state to localStorage
    localStorage.setItem('expandedSelectedGroups', JSON.stringify(Array.from(allGroups)));
    
    return allGroups;
  });

  // Update groups when initialColumnGroups change
  useEffect(() => {
    setColumnGroups(initialColumnGroups || []);
  }, [initialColumnGroups]);

  // Listen for expandSelectedGroups events
  useEffect(() => {
    const handleExpandGroups = (event: CustomEvent) => {
      const { groups } = event.detail;
      const newExpandedGroups = new Set(expandedSelectedGroups);
      groups.forEach(group => newExpandedGroups.add(group));
      setExpandedSelectedGroups(newExpandedGroups);
    };

    window.addEventListener('expandSelectedGroups', handleExpandGroups as EventListener);
    return () => {
      window.removeEventListener('expandSelectedGroups', handleExpandGroups as EventListener);
    };
  }, [expandedSelectedGroups]);
  
  // Update localStorage when expandedSelectedGroups changes
  useEffect(() => {
    localStorage.setItem('expandedSelectedGroups', JSON.stringify(Array.from(expandedSelectedGroups)));
  }, [expandedSelectedGroups]);
  
  // Function to toggle group expansion in available panel
  const toggleGroup = (e: React.MouseEvent, groupPath: string) => {
    // Stop propagation to prevent other event handlers from firing
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedGroups);
    
    if (newExpandedGroups.has(groupPath)) {
      newExpandedGroups.delete(groupPath);
    } else {
      newExpandedGroups.add(groupPath);
    }
    
    setExpandedGroups(newExpandedGroups);
  };

  // Function to toggle group expansion in selected panel
  const toggleSelectedGroup = (e: React.MouseEvent, groupName: string) => {
    // Stop propagation to prevent other event handlers from firing
    e.stopPropagation();
    
    const newExpandedGroups = new Set(expandedSelectedGroups);
    
    if (newExpandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    
    setExpandedSelectedGroups(newExpandedGroups);
  };
  
  // Function to add columns to an existing group in the selected panel
  const addToSelectedGroup = (groupName: string, columnIds: string[]) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Find the group
    const groupIndex = columnGroups.findIndex(g => g.headerName === groupName);
    
    if (groupIndex === -1) return;
    
    // Update the group
    const newColumnGroups = [...columnGroups];
    newColumnGroups[groupIndex] = {
      ...newColumnGroups[groupIndex],
      children: Array.from(new Set([...newColumnGroups[groupIndex].children, ...columnIds]))
    };
    
    // Update local state
    setColumnGroups(newColumnGroups);
    
    // Notify parent about the group change
    onColumnGroupChanged(groupName, 'UPDATE', groupName);
  };

  // Function to remove columns from a group in the selected panel
  const removeFromSelectedGroup = (groupName: string, columnIds: string[]) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Find the group
    const groupIndex = columnGroups.findIndex(g => g.headerName === groupName);
    
    if (groupIndex === -1) return;
    
    // Update the group
    const newColumnGroups = [...columnGroups];
    const newChildren = newColumnGroups[groupIndex].children.filter(field => !columnIds.includes(field));
    
    if (newChildren.length === 0) {
      // Group is now empty, remove it
      newColumnGroups.splice(groupIndex, 1);
      onColumnGroupChanged(groupName, 'REMOVE');
    } else {
      // Update group with new children
      newColumnGroups[groupIndex] = {
        ...newColumnGroups[groupIndex],
        children: newChildren
      };
      onColumnGroupChanged(groupName, 'UPDATE', groupName);
    }
    
    // Update local state
    setColumnGroups(newColumnGroups);
  };

  // Function to create a new column group in the selected panel
  const createSelectedColumnGroup = (groupName: string, columnIds: string[]) => {
    if (!groupName || columnIds.length === 0) return;
    
    // Create a new group
    const newGroup: ColumnGroup = {
      headerName: groupName,
      children: columnIds
    };
    
    // Check if a group with this name already exists
    const existingGroupIndex = columnGroups.findIndex(g => g.headerName === groupName);
    let newColumnGroups: ColumnGroup[] = [];
    
    if (existingGroupIndex !== -1) {
      // Update existing group
      newColumnGroups = [...columnGroups];
      newColumnGroups[existingGroupIndex] = {
        ...newColumnGroups[existingGroupIndex],
        children: Array.from(new Set([...newColumnGroups[existingGroupIndex].children, ...columnIds]))
      };
    } else {
      // Add new group
      newColumnGroups = [...columnGroups, newGroup];
    }
    
    // Update local state
    setColumnGroups(newColumnGroups);
    
    // Expand the group by default
    const newExpandedGroups = new Set(expandedSelectedGroups);
    newExpandedGroups.add(groupName);
    setExpandedSelectedGroups(newExpandedGroups);
    
    // Notify parent about the group change
    if (existingGroupIndex !== -1) {
      onColumnGroupChanged(groupName, 'UPDATE', groupName);
    } else {
      onColumnGroupChanged(groupName, 'UPDATE', groupName);
    }
  };
  
  return {
    columnGroups,
    setColumnGroups,
    expandedGroups,
    setExpandedGroups,
    expandedSelectedGroups,
    setExpandedSelectedGroups,
    toggleGroup,
    toggleSelectedGroup,
    addToSelectedGroup,
    removeFromSelectedGroup,
    createSelectedColumnGroup
  };
}