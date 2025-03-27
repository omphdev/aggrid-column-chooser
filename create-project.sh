#!/bin/bash

# Create config files
touch .eslintrc.json
touch .gitignore
touch .prettierrc
touch README.md
touch package.json
touch tsconfig.json

# Create public directory and files
mkdir -p public
touch public/index.html
touch public/manifest.json
touch public/robots.txt

# Create src directory and base files
mkdir -p src
touch src/App.css
touch src/App.tsx
touch src/index.css
touch src/index.tsx
touch src/react-app-env.d.ts

# Create components directory structure
mkdir -p src/components/ColumnChooser

# Create component files
touch src/components/ColumnChooser/types.ts
touch src/components/ColumnChooser/ToolGrid.tsx
touch src/components/ColumnChooser/ColumnChooser.tsx
touch src/components/ColumnChooser/AvailableColumnsPanel.tsx
touch src/components/ColumnChooser/SelectedColumnsPanel.tsx
touch src/components/ColumnChooser/ColumnChooser.css
touch src/components/ColumnChooser/index.ts
touch src/components/ColumnChooser/SampleUsage.tsx

echo "Project structure has been created successfully!"