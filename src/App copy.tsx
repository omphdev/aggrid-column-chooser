import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-enterprise';
import { TreeView } from './TreeViews';

// Types for our column data structure
export interface ColumnItem {
  id: string;
  name: string;
  field: string;
  children?: ColumnItem[];
  expanded?: boolean;
  selected?: boolean;
}

export interface DragItem {
  id: string;
  type: string;
}

// Main App Component
const ColumnChooserDemo: React.FC = () => {
  // State for the main grid columns and data
  const [rowData, setRowData] = useState<any[]>([]);
  const [mainGridColumns, setMainGridColumns] = useState<ColDef[]>([]);
  
  // State for the column chooser
  const [availableColumns, setAvailableColumns] = useState<ColumnItem[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<ColumnItem[]>([]);
  
  // Grid API references
  const [mainGridApi, setMainGridApi] = useState<GridApi | null>(null);

  // Helper to toggle expand state of tree items
  const toggleExpand = useCallback((treeData: ColumnItem[], itemId: string): ColumnItem[] => {
    return treeData.map(item => {
      if (item.id === itemId) {
        return { ...item, expanded: !item.expanded };
      }
      if (item.children) {
        return {
          ...item,
          children: toggleExpand(item.children, itemId)
        };
      }
      return item;
    });
  }, []);

  // Toggle expand for available columns
  const toggleExpandAvailable = useCallback((itemId: string) => {
    setAvailableColumns(prev => toggleExpand(prev, itemId));
  }, [toggleExpand]);

  // Toggle expand for selected columns
  const toggleExpandSelected = useCallback((itemId: string) => {
    setSelectedColumns(prev => toggleExpand(prev, itemId));
  }, [toggleExpand]);

  // Mock column definitions with tree structure
  const allPossibleColumns: ColumnItem[] = useMemo(() => [
    {
      id: 'basic',
      name: 'Basic Information',
      field: '',
      expanded: true,
      children: [
        { id: 'id', name: 'ID', field: 'id' },
        { id: 'name', name: 'Name', field: 'name' },
        { id: 'email', name: 'Email', field: 'email' }
      ]
    },
    {
      id: 'address',
      name: 'Address',
      field: '',
      expanded: true,
      children: [
        { id: 'street', name: 'Street', field: 'street' },
        { id: 'city', name: 'City', field: 'city' },
        { id: 'state', name: 'State', field: 'state' },
        { id: 'zip', name: 'Zip Code', field: 'zip' }
      ]
    },
    {
      id: 'metrics',
      name: 'Metrics',
      field: '',
      expanded: true,
      children: [
        { id: 'sales', name: 'Sales', field: 'sales' },
        { id: 'profit', name: 'Profit', field: 'profit' },
        { id: 'cost', name: 'Cost', field: 'cost' }
      ]
    }
  ], []);

  // Mock data for the main grid
  const mockData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Person ${i + 1}`,
      email: `person${i + 1}@example.com`,
      street: `${100 + i} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
      zip: `${10000 + i * 100}`,
      sales: Math.round(Math.random() * 10000),
      profit: Math.round(Math.random() * 5000),
      cost: Math.round(Math.random() * 3000)
    }));
  }, []);

  // Initial setup
  useEffect(() => {
    // Set initial data
    setRowData(mockData);
    
    // Set up initial available columns (all possible columns with expanded state)
    setAvailableColumns(allPossibleColumns);
    
    // Set up initial selected columns (empty)
    setSelectedColumns([]);
    
    // Set up initial main grid columns (empty)
    updateMainGridColumns([]);
  }, [allPossibleColumns, mockData]);

  // Convert the flat list of selected column items to AG Grid column definitions
  const updateMainGridColumns = useCallback((selectedCols: ColumnItem[]) => {
    const flattenColumns = (columns: ColumnItem[]): ColDef[] => {
      return columns.reduce<ColDef[]>((acc, column) => {
        if (column.children && column.children.length > 0) {
          return [...acc, ...flattenColumns(column.children)];
        }
        
        if (column.field) {
          return [...acc, {
            field: column.field,
            headerName: column.name,
            sortable: true,
            filter: true
          }];
        }
        
        return acc;
      }, []);
    };

    const newColumns = flattenColumns(selectedCols);
    setMainGridColumns(newColumns);
  }, []);

  // Helper functions for tree data manipulation
  const findItemInTree = useCallback((items: ColumnItem[], itemId: string): ColumnItem | null => {
    for (const item of items) {
      if (item.id === itemId) {
        return item;
      }
      
      if (item.children) {
        const found = findItemInTree(item.children, itemId);
        if (found) return found;
      }
    }
    
    return null;
  }, []);

  const removeItemFromTree = useCallback((items: ColumnItem[], itemId: string): ColumnItem[] => {
    const result = items.filter(item => item.id !== itemId).map(item => {
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: removeItemFromTree(item.children, itemId)
        };
      }
      return item;
    });
    
    // Filter out any empty groups after removal
    return result.filter(item => !item.children || item.children.length > 0 || item.field);
  }, []);

  const deepCloneColumnItem = useCallback((item: ColumnItem): ColumnItem => {
    return {
      ...item,
      children: item.children ? item.children.map(deepCloneColumnItem) : undefined
    };
  }, []);

  // Helper function to insert item into tree
  const insertItemIntoTree = useCallback((items: ColumnItem[], item: ColumnItem) => {
    // Check if this is a child of any existing group
    for (const group of allPossibleColumns) {
      if (group.children && group.children.some(child => child.id === item.id)) {
        // Find or create the group in items
        let targetGroup = items.find(i => i.id === group.id);
        
        if (!targetGroup) {
          targetGroup = {
            id: group.id,
            name: group.name,
            field: group.field,
            expanded: true,
            children: []
          };
          items.push(targetGroup);
        }
        
        if (!targetGroup.children) {
          targetGroup.children = [];
        }
        
        // Add the item to the group if it's not already there
        if (!targetGroup.children.some(child => child.id === item.id)) {
          targetGroup.children.push(item);
        }
        
        return items;
      }
    }
    
    // This is a top-level item, add directly if not already there
    if (!items.some(existingItem => existingItem.id === item.id)) {
      items.push(item);
    }
    
    return items;
  }, [allPossibleColumns]);

  // Functions to get all selected items
  const getSelectedItems = useCallback((items: ColumnItem[]): string[] => {
    const selectedIds: string[] = [];
    
    const collectSelectedIds = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.selected) {
          selectedIds.push(item.id);
        }
        
        if (item.children && item.children.length > 0) {
          collectSelectedIds(item.children);
        }
      }
    };
    
    collectSelectedIds(items);
    return selectedIds;
  }, []);

  // State to track last selected item (for shift-click range selection)
  const [lastSelectedAvailableId, setLastSelectedAvailableId] = useState<string | null>(null);
  const [lastSelectedSelectedId, setLastSelectedSelectedId] = useState<string | null>(null);
  
  // Helper to find all item IDs in tree
  const getAllItemIds = useCallback((items: ColumnItem[]): { id: string, index: number }[] => {
    const result: { id: string, index: number }[] = [];
    let index = 0;
    
    const collectIds = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        result.push({ id: item.id, index: index++ });
        
        if (item.children && item.children.length > 0 && item.expanded) {
          collectIds(item.children);
        }
      }
    };
    
    collectIds(items);
    return result;
  }, []);
  
  // Toggle selection of a single item, with support for range selection
  const toggleSelectAvailable = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    setAvailableColumns(prev => {
      // For range selection, we need all visible items
      if (isRangeSelect && lastSelectedAvailableId) {
        const allItems = getAllItemIds(prev);
        const currentIndex = allItems.findIndex(item => item.id === itemId);
        const lastIndex = allItems.findIndex(item => item.id === lastSelectedAvailableId);
        
        if (currentIndex >= 0 && lastIndex >= 0) {
          const startIdx = Math.min(currentIndex, lastIndex);
          const endIdx = Math.max(currentIndex, lastIndex);
          const rangeIds = new Set(allItems.slice(startIdx, endIdx + 1).map(item => item.id));
          
          const updateSelectionRange = (items: ColumnItem[]): ColumnItem[] => {
            return items.map(item => {
              if (rangeIds.has(item.id)) {
                return { ...item, selected: true };
              }
              
              if (item.children && item.children.length > 0) {
                return {
                  ...item,
                  children: updateSelectionRange(item.children)
                };
              }
              
              // If not multi-select, deselect all items not in range
              if (!isMultiSelect && item.selected && !rangeIds.has(item.id)) {
                return { ...item, selected: false };
              }
              
              return item;
            });
          };
          
          setLastSelectedAvailableId(itemId);
          return updateSelectionRange(prev);
        }
      }
      
      // Regular selection (single or ctrl+click)
      const updateSelection = (items: ColumnItem[]): ColumnItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            // Toggle the current item
            return { ...item, selected: !item.selected };
          }
          
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateSelection(item.children)
            };
          }
          
          // If not multi-select, deselect all other items
          if (!isMultiSelect && item.selected) {
            return { ...item, selected: false };
          }
          
          return item;
        });
      };
      
      setLastSelectedAvailableId(itemId);
      return updateSelection(prev);
    });
  }, [lastSelectedAvailableId, getAllItemIds]);

  const toggleSelectSelected = useCallback((itemId: string, isMultiSelect: boolean, isRangeSelect: boolean) => {
    setSelectedColumns(prev => {
      // For range selection, we need all visible items
      if (isRangeSelect && lastSelectedSelectedId) {
        const allItems = getAllItemIds(prev);
        const currentIndex = allItems.findIndex(item => item.id === itemId);
        const lastIndex = allItems.findIndex(item => item.id === lastSelectedSelectedId);
        
        if (currentIndex >= 0 && lastIndex >= 0) {
          const startIdx = Math.min(currentIndex, lastIndex);
          const endIdx = Math.max(currentIndex, lastIndex);
          const rangeIds = new Set(allItems.slice(startIdx, endIdx + 1).map(item => item.id));
          
          const updateSelectionRange = (items: ColumnItem[]): ColumnItem[] => {
            return items.map(item => {
              if (rangeIds.has(item.id)) {
                return { ...item, selected: true };
              }
              
              if (item.children && item.children.length > 0) {
                return {
                  ...item,
                  children: updateSelectionRange(item.children)
                };
              }
              
              // If not multi-select, deselect all items not in range
              if (!isMultiSelect && item.selected && !rangeIds.has(item.id)) {
                return { ...item, selected: false };
              }
              
              return item;
            });
          };
          
          setLastSelectedSelectedId(itemId);
          return updateSelectionRange(prev);
        }
      }
      
      // Regular selection (single or ctrl+click)
      const updateSelection = (items: ColumnItem[]): ColumnItem[] => {
        return items.map(item => {
          if (item.id === itemId) {
            // Toggle the current item
            return { ...item, selected: !item.selected };
          }
          
          if (item.children && item.children.length > 0) {
            return {
              ...item,
              children: updateSelection(item.children)
            };
          }
          
          // If not multi-select, deselect all other items
          if (!isMultiSelect && item.selected) {
            return { ...item, selected: false };
          }
          
          return item;
        });
      };
      
      setLastSelectedSelectedId(itemId);
      return updateSelection(prev);
    });
  }, [lastSelectedSelectedId, getAllItemIds]);

  // Select all items
  const selectAllAvailable = useCallback(() => {
    setAvailableColumns(prev => {
      const updateSelection = (items: ColumnItem[]): ColumnItem[] => {
        return items.map(item => {
          const updatedItem = { ...item, selected: true };
          
          if (item.children && item.children.length > 0) {
            updatedItem.children = updateSelection(item.children);
          }
          
          return updatedItem;
        });
      };
      
      return updateSelection(prev);
    });
  }, []);

  const selectAllSelected = useCallback(() => {
    setSelectedColumns(prev => {
      const updateSelection = (items: ColumnItem[]): ColumnItem[] => {
        return items.map(item => {
          const updatedItem = { ...item, selected: true };
          
          if (item.children && item.children.length > 0) {
            updatedItem.children = updateSelection(item.children);
          }
          
          return updatedItem;
        });
      };
      
      return updateSelection(prev);
    });
  }, []);

  // Clear all selections
  const clearSelectionAvailable = useCallback(() => {
    setAvailableColumns(prev => {
      const updateSelection = (items: ColumnItem[]): ColumnItem[] => {
        return items.map(item => {
          const updatedItem = { ...item, selected: false };
          
          if (item.children && item.children.length > 0) {
            updatedItem.children = updateSelection(item.children);
          }
          
          return updatedItem;
        });
      };
      
      return updateSelection(prev);
    });
    setLastSelectedAvailableId(null);
  }, []);

  const clearSelectionSelected = useCallback(() => {
    setSelectedColumns(prev => {
      const updateSelection = (items: ColumnItem[]): ColumnItem[] => {
        return items.map(item => {
          const updatedItem = { ...item, selected: false };
          
          if (item.children && item.children.length > 0) {
            updatedItem.children = updateSelection(item.children);
          }
          
          return updatedItem;
        });
      };
      
      return updateSelection(prev);
    });
    setLastSelectedSelectedId(null);
  }, []);

  // Count selected items
  const countSelectedItems = useCallback((items: ColumnItem[]): number => {
    let count = 0;
    
    const countSelected = (itemList: ColumnItem[]) => {
      for (const item of itemList) {
        if (item.selected) {
          count++;
        }
        
        if (item.children && item.children.length > 0) {
          countSelected(item.children);
        }
      }
    };
    
    countSelected(items);
    return count;
  }, []);
  
  const selectedAvailableCount = useMemo(() => 
    countSelectedItems(availableColumns), [availableColumns, countSelectedItems]
  );
  
  const selectedSelectedCount = useMemo(() => 
    countSelectedItems(selectedColumns), [selectedColumns, countSelectedItems]
  );
  
  // Event handlers for drag and drop

  const handleAvailableItemDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    // Always set up data transfer with this item ID
    // For single item dragging without requiring selection first
    const itemIds = [item.id];
    
    // If the item is already selected, include other selected items too
    if (item.selected && countSelectedItems(availableColumns) > 1) {
      // Use all selected items
      const selectedIds = getSelectedItems(availableColumns);
      e.dataTransfer.setData('text/plain', JSON.stringify({
        ids: selectedIds,
        source: 'available'
      }));
    } else {
      // Just drag this one item, ignoring any other selections
      e.dataTransfer.setData('text/plain', JSON.stringify({
        ids: itemIds,
        source: 'available'
      }));
    }
  }, [availableColumns, getSelectedItems, countSelectedItems]);

  const handleSelectedItemDragStart = useCallback((e: React.DragEvent, item: ColumnItem) => {
    // Always set up data transfer with this item ID
    // For single item dragging without requiring selection first
    const itemIds = [item.id];
    
    // If the item is already selected, include other selected items too
    if (item.selected && countSelectedItems(selectedColumns) > 1) {
      // Use all selected items
      const selectedIds = getSelectedItems(selectedColumns);
      e.dataTransfer.setData('text/plain', JSON.stringify({
        ids: selectedIds,
        source: 'selected'
      }));
    } else {
      // Just drag this one item, ignoring any other selections
      e.dataTransfer.setData('text/plain', JSON.stringify({
        ids: itemIds,
        source: 'selected'
      }));
    }
  }, [selectedColumns, getSelectedItems, countSelectedItems]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropToSelected = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { ids: string[], source: string };
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Create new arrays to avoid mutation
        let newAvailable = [...availableColumns];
        let newSelected = [...selectedColumns];
        
        // Process each selected item
        for (const draggedItemId of data.ids) {
          const draggedItem = findItemInTree(availableColumns, draggedItemId);
          
          if (draggedItem) {
            // Clone the dragged item
            const clonedItem = deepCloneColumnItem(draggedItem);
            
            // Remove from available
            newAvailable = removeItemFromTree(newAvailable, draggedItemId);
            
            // Add to selected (using helper to preserve hierarchy)
            newSelected = insertItemIntoTree(newSelected, clonedItem);
          }
        }
        
        // Update states
        setAvailableColumns(newAvailable);
        setSelectedColumns(newSelected);
        
        // Update main grid
        updateMainGridColumns(newSelected);
        
        // Clear selections after drag
        clearSelectionAvailable();
        clearSelectionSelected();
      }
    } catch (err) {
      console.error('Error processing drag data:', err);
    }
  }, [availableColumns, selectedColumns, findItemInTree, removeItemFromTree, deepCloneColumnItem, insertItemIntoTree, updateMainGridColumns, clearSelectionAvailable, clearSelectionSelected]);

  const handleDropToAvailable = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain')) as { ids: string[], source: string };
      
      if (data.source === 'selected' && data.ids && data.ids.length > 0) {
        // Create new arrays to avoid mutation
        let newAvailable = [...availableColumns];
        let newSelected = [...selectedColumns];
        
        // Process each selected item
        for (const draggedItemId of data.ids) {
          const draggedItem = findItemInTree(selectedColumns, draggedItemId);
          
          if (draggedItem) {
            // Clone the dragged item
            const clonedItem = deepCloneColumnItem(draggedItem);
            
            // Remove from selected
            newSelected = removeItemFromTree(newSelected, draggedItemId);
            
            // Add to available (using helper to preserve hierarchy)
            newAvailable = insertItemIntoTree(newAvailable, clonedItem);
          }
        }
        
        // Update states
        setAvailableColumns(newAvailable);
        setSelectedColumns(newSelected);
        
        // Update main grid
        updateMainGridColumns(newSelected);
        
        // Clear selections after drag
        clearSelectionAvailable();
        clearSelectionSelected();
      }
    } catch (err) {
      console.error('Error processing drag data:', err);
    }
  }, [availableColumns, selectedColumns, findItemInTree, removeItemFromTree, deepCloneColumnItem, insertItemIntoTree, updateMainGridColumns, clearSelectionAvailable, clearSelectionSelected]);

  // Default column definitions for the main grid
  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
    sortable: true,
    filter: true
  }), []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
        <h2>Custom Column Chooser Demo</h2>
      </div>
      
      {/* Column Chooser Section */}
      <div style={{ display: 'flex', padding: '10px', gap: '10px', height: '300px' }}>
        <div style={{ flex: 1 }}>
          <h3>Column Chooser</h3>
          <div style={{ 
            display: 'flex', 
            height: '250px', 
            gap: '10px'
          }}>
            {/* Available Columns */}
            <div style={{ flex: 1, height: '100%' }}>
              <TreeView 
                items={availableColumns}
                onDragStart={handleAvailableItemDragStart}
                onDrop={handleDropToAvailable}
                onDragOver={handleDragOver}
                title="Available Columns"
                toggleExpand={toggleExpandAvailable}
                toggleSelect={toggleSelectAvailable}
                onSelectAll={selectAllAvailable}
                onClearSelection={clearSelectionAvailable}
                selectedCount={selectedAvailableCount}
              />
            </div>
            
            {/* Selected Columns */}
            <div style={{ flex: 1, height: '100%' }}>
              <TreeView 
                items={selectedColumns}
                onDragStart={handleSelectedItemDragStart}
                onDrop={handleDropToSelected}
                onDragOver={handleDragOver}
                title="Selected Columns"
                toggleExpand={toggleExpandSelected}
                toggleSelect={toggleSelectSelected}
                onSelectAll={selectAllSelected}
                onClearSelection={clearSelectionSelected}
                selectedCount={selectedSelectedCount}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Grid */}
      <div className="ag-theme-alpine" style={{ flex: 1, width: '100%' }}>
        <h3>Main Grid</h3>
        <AgGridReact
          rowData={rowData}
          columnDefs={mainGridColumns}
          defaultColDef={defaultColDef}
          onGridReady={(params: GridReadyEvent) => setMainGridApi(params.api)}
          animateRows={true}
          domLayout="autoHeight"
        />
      </div>
    </div>
  );
};

export default ColumnChooserDemo;