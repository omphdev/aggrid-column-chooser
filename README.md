# AG Grid Column Chooser

A customizable column chooser for AG Grid in React with TypeScript.

## Features

- Unified Grid Component: A single component that combines AG Grid with the column chooser
- Simplified API: Just pass columnDefs and handle callbacks for selected columns
- Dual-panel column chooser: Available columns on one side, selected columns on the other
- Tree view for available columns: Hierarchical organization of columns with groups that can be expanded/collapsed
- Drag-and-drop functionality: Move columns between panels and reorder columns in the selected panel
- Multiple selection: Select multiple columns at once with Ctrl/Cmd+click and Shift+click
- Move buttons: Easily move selected columns up/down or clear all selected columns
- Double-click support: Quickly move columns between panels with double-click
- Empty group filtering: Automatically hides empty groups in the available column panel
- Accurate column counting: Shows the correct count of leaf nodes (actual columns) excluding group headers
- Column grouping: Selected columns can have custom groupings, and users can drag and drop out of the groups
- Persistent state: Maintains selection state when column definitions change

## Getting Started

### Prerequisites

- Node.js (v14.x or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Start the development server

```bash
npm start
# or
yarn start
```

## Usage

```tsx
import { 
  ToolGrid, 
  ExtendedColDef, 
  ColumnChangeEvent,
  ColumnGroup
} from './components/ColumnChooser';

// Define column definitions with groupPath
const columnDefs: ExtendedColDef[] = [
  { 
    field: 'id', 
    headerName: 'ID', 
    groupPath: ['System'] 
  },
  { 
    field: 'firstName', 
    headerName: 'First Name', 
    groupPath: ['Personal', 'Name'] 
  },
  // More columns...
];

// Sample data
const rowData = [
  // Your data records...
];

// Component usage
const YourComponent = () => {
  const handleColumnChanged = (event: ColumnChangeEvent) => {
    console.log('Column changed:', event);
    // Update your state as needed
  };

  const handleColumnGroupChanged = (
    headerName: string, 
    action: 'REMOVE' | 'UPDATE', 
    replaceName?: string
  ) => {
    console.log('Column group changed:', { headerName, action, replaceName });
    // Update your state as needed
  };

  return (
    <ToolGrid
      columnDefs={columnDefs}
      rowData={rowData}
      onColumnChanged={handleColumnChanged}
      onColumnGroupChanged={handleColumnGroupChanged}
    />
  );
};
```

## Project Structure

- `/src/components/ColumnChooser/` - Contains all component files
  - `types.ts` - TypeScript interfaces and types
  - `ToolGrid.tsx` - Main component that integrates AG Grid with the column chooser
  - `ColumnChooser.tsx` - Dual-panel column chooser component
  - `AvailableColumnsPanel.tsx` - Tree view for available columns
  - `SelectedColumnsPanel.tsx` - List view for selected columns with grouping
  - `ColumnChooser.css` - Styles for all components
  - `index.ts` - Exports all components
  - `SampleUsage.tsx` - Example usage

## License

MIT