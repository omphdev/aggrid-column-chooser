// src/components/ColumnChooser/ColumnChooser.tsx
import React from 'react';
import AvailableColumnsPanel from './components/AvailableColumns';
import SelectedColumnsPanel from './components/SelectedColumns';
import ActionButtons from './components/shared/ActionButtons';
import ErrorBoundary from './components/shared/ErrorBoundary';
import { ColumnChooserProvider } from './context/ColumnChooserContext';
import { TreeNode, SelectedNode, SelectedGroup, ColumnChangeEvent } from './types';
import './ColumnChooser.css';

interface ColumnChooserProps {
  availableColumns: TreeNode[];
  selectedColumns: SelectedNode[];
  selectedGroups: SelectedGroup[];
  onColumnSelectionChange: (event: ColumnChangeEvent) => void;
  onColumnGroupChange: (headerName: string, action: 'REMOVE' | 'UPDATE', replaceName?: string) => void;
}

const ColumnChooser: React.FC<ColumnChooserProps> = ({
  availableColumns,
  selectedColumns,
  selectedGroups,
  onColumnSelectionChange,
  onColumnGroupChange
}) => {
  return (
    <ErrorBoundary>
      <ColumnChooserProvider
        availableColumns={availableColumns}
        selectedColumns={selectedColumns}
        selectedGroups={selectedGroups}
        onColumnChanged={onColumnSelectionChange}
        onColumnGroupChanged={onColumnGroupChange}
      >
        <div className="column-chooser">
          <div className="column-chooser-header">
            <h3>Column Chooser</h3>
          </div>
          
          <div className="column-chooser-content">
            <div className="column-panels">
              <AvailableColumnsPanel />
              <SelectedColumnsPanel />
            </div>
            
            <div className="column-chooser-actions">
              <ActionButtons type="available" />
              <ActionButtons type="selected" />
            </div>
          </div>
        </div>
      </ColumnChooserProvider>
    </ErrorBoundary>
  );
};

export default ColumnChooser;