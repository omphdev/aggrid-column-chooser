#!/bin/bash

# Create base directory structure
mkdir -p src/components/ColumnChooser/components/AvailableColumns
mkdir -p src/components/ColumnChooser/components/SelectedColumns
mkdir -p src/components/ColumnChooser/components/shared
mkdir -p src/components/ColumnChooser/context
mkdir -p src/components/ColumnChooser/hooks
mkdir -p src/components/ColumnChooser/utils

# Create files for Available Columns components
touch src/components/ColumnChooser/components/AvailableColumns/TreeNode.tsx
touch src/components/ColumnChooser/components/AvailableColumns/SearchBar.tsx
touch src/components/ColumnChooser/components/AvailableColumns/index.tsx

# Create files for Selected Columns components
touch src/components/ColumnChooser/components/SelectedColumns/GroupHeader.tsx
touch src/components/ColumnChooser/components/SelectedColumns/GroupContent.tsx
touch src/components/ColumnChooser/components/SelectedColumns/ColumnItem.tsx
touch src/components/ColumnChooser/components/SelectedColumns/GroupItem.tsx
touch src/components/ColumnChooser/components/SelectedColumns/UngroupedColumns.tsx
touch src/components/ColumnChooser/components/SelectedColumns/ContextMenu.tsx
touch src/components/ColumnChooser/components/SelectedColumns/GroupDialog.tsx
touch src/components/ColumnChooser/components/SelectedColumns/SearchBar.tsx
touch src/components/ColumnChooser/components/SelectedColumns/index.tsx

# Create files for shared components
touch src/components/ColumnChooser/components/shared/ActionButtons.tsx
touch src/components/ColumnChooser/components/shared/ErrorBoundary.tsx

# Create context file
touch src/components/ColumnChooser/context/ColumnChooserContext.tsx

# Create hooks files
touch src/components/ColumnChooser/hooks/useDragAndDrop.ts
touch src/components/ColumnChooser/hooks/useGroupManagement.ts
touch src/components/ColumnChooser/hooks/useSearch.ts

# Create utility files
touch src/components/ColumnChooser/utils/dragUtils.ts
touch src/components/ColumnChooser/utils/columnUtils.ts
touch src/components/ColumnChooser/utils/treeUtils.ts

# Create main component files
touch src/components/ColumnChooser/ColumnChooser.tsx
touch src/components/ColumnChooser/ToolGrid.tsx
touch src/components/ColumnChooser/types.ts
touch src/components/ColumnChooser/index.ts
touch src/components/ColumnChooser/SampleUsage.tsx

# Keep the CSS file
touch src/components/ColumnChooser/ColumnChooser.css

echo "New file structure has been created successfully!"