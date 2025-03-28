import { ColDef, ColGroupDef } from 'ag-grid-community';
import { ExtendedColDef, SelectedNode, SelectedGroup } from '../types';

/**
 * Creates AG Grid column definitions with grouping
 */
export function createGridColumnDefs(
  selectedColumns: SelectedNode[], 
  selectedGroups: SelectedGroup[],
  normalizedColumnDefs: ExtendedColDef[]
): (ColDef | ColGroupDef)[] {
  // First, get all ungrouped columns
  const groupedColumnIds = selectedGroups.flatMap(g => g.children);
  const ungroupedColumns = selectedColumns
    .filter(col => !groupedColumnIds.includes(col.id))
    .map(node => ({
      ...node.column,
      hide: false
    }));
  
  // Create column group definitions
  const groupDefs: ColGroupDef[] = selectedGroups.map(group => {
    // Get columns for this group
    const groupColumns = selectedColumns
      .filter(col => group.children.includes(col.id))
      .map(node => ({
        ...node.column,
        hide: false
      }));
    
    // Ensure columns appear in the correct order in the group
    const orderedColumns: ColDef[] = [];
    group.children.forEach(childId => {
      const column = groupColumns.find(col => (col.id === childId || col.field === childId));
      if (column) {
        orderedColumns.push(column);
      }
    });
    
    return {
      headerName: group.name,
      children: orderedColumns
    };
  });
  
  // Combine group definitions with ungrouped columns
  const visibleColumnDefs = [...groupDefs, ...ungroupedColumns];
  
  // Add hidden columns (those in available)
  const hiddenColumns = normalizedColumnDefs
    .filter(col => !selectedColumns.find(selected => selected.id === col.id))
    .map(col => ({ ...col, hide: true }));
  
  return [...visibleColumnDefs, ...hiddenColumns];
}

/**
 * Handles node selection with multi-select support (ctrl/cmd+click, shift+click)
 */
export function handleNodeSelection(
  nodeId: string,
  event: React.MouseEvent,
  currentSelectedIds: string[],
  allNodeIds: string[]
): string[] {
  if (event.ctrlKey || event.metaKey) {
    // Toggle selection of clicked node
    if (currentSelectedIds.includes(nodeId)) {
      return currentSelectedIds.filter(id => id !== nodeId);
    } else {
      return [...currentSelectedIds, nodeId];
    }
  } else if (event.shiftKey && currentSelectedIds.length > 0) {
    // Select range
    const lastSelectedId = currentSelectedIds[currentSelectedIds.length - 1];
    const lastSelectedIndex = allNodeIds.indexOf(lastSelectedId);
    const currentIndex = allNodeIds.indexOf(nodeId);
    
    if (lastSelectedIndex !== -1 && currentIndex !== -1) {
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      const rangeIds = allNodeIds.slice(start, end + 1);
      
      // Combine previous selection with range, ensuring no duplicates
      return Array.from(new Set([...currentSelectedIds, ...rangeIds]));
    }
    return currentSelectedIds;
  } else {
    // Regular click: Select only the clicked node
    return [nodeId];
  }
}