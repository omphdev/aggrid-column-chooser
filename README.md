This project provides a customizable column chooser for AG Grid in React with TypeScript. It allows users to manage which columns are displayed in the grid through an intuitive drag-and-drop interface. The column chooser consists of two panels side by side - "Available Columns" and "Selected Columns" - allowing users to drag columns between panels and reorder columns within the selected panel.
Key Features

Unified Grid Component: A single component that combines AG Grid with the column chooser
Simplified API: Just pass columnDefs and handle callbacks for selected columns
Dual-panel column chooser: Available columns on one side, selected columns on the other
Tree view for available columns: Hierarchical organization of columns with groups that can be expanded/collapsed
Drag-and-drop functionality: Move columns between panels and reorder columns in the selected panel
Multiple selection: Select multiple columns at once with Ctrl/Cmd+click and Shift+click
Move buttons: Easily move selected columns up/down or clear all selected columns
Double-click support: Quickly move columns between panels with double-click
Empty group filtering: Automatically hides empty groups in the available column panel
Accurate column counting: Shows the correct count of leaf nodes (actual columns) excluding group headers
Column grouping: Selected columns can have custom groupings, and users can drag and drop out of the groups
Persistent state: Maintains selection state when column definitions change

Usage
Basic Integration
<ToolGrid 
  columnDefs={yourColumnDefs}
  rowData={yourData}
  onColumnChanged={handleSelectedColumns}
  onColumnGroupsChanged={handleColumnGroups}
/>

Interactive Features
The column chooser provides the following interactions:

Select columns: Click on a column to select it (Ctrl/Cmd+click for multiple, Shift+click for range)
Move columns: Drag from one panel to the other, or use double-click to quickly move
Reorder columns: In the selected panel, drag columns up or down to change their order
Expand/collapse groups: Click the +/- buttons in the available panel to expand or collapse groups
Bulk actions: Use the Select All, Clear Selection, and Clear All buttons for bulk operations
Manual reordering: Use the Up/Down arrow buttons to move selected columns in the grid
Create groups: Right-click on selected columns to create or add to groups
Edit groups: Rename, delete, or modify column groups

Implementation Details

Component-based architecture: Uses React components with proper state management
Props and callbacks: State flows through props down and callbacks up
Custom drag and drop: Implements custom drag and drop with visual feedback
Tree structure: Maintains hierarchical structure in available columns
Flat structure: Uses flat structure for selected columns
Dynamic updates: Updates the grid when columns are added, removed, or reordered
Group filtering: Filters out empty groups in available columns
Accurate counting: Counts only leaf nodes when displaying column counts
State persistence: Preserves selections when column definitions change

Advanced Features

Search functionality: Filter columns by name
Group management: Create, edit, and delete column groups
Multi-selection operations: Perform actions on multiple selected columns
Keyboard navigation: Use keyboard shortcuts for common operations
Visual feedback: Get clear visual feedback during drag and drop operations
Order preservation: Maintain column order when moving between panels

This implementation provides a clean, user-friendly interface for managing columns in AG Grid while maintaining a simple API for developers.