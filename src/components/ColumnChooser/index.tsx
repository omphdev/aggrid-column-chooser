import React, { useEffect } from 'react';
import { useColumnContext } from '../../contexts/ColumnContext';
import AvailableColumns from './AvailableColumns';
import SelectedColumns from './SelectedColumns';
import './ColumnChooser.css';

interface ColumnChooserProps {
  onSelectedColumnsChange?: (columns: any[]) => void;
}

const ColumnChooser: React.FC<ColumnChooserProps> = ({
  onSelectedColumnsChange
}) => {
  const {
    state,
    setFlatView
  } = useColumnContext();
  
  const { selectedColumns, isFlatView } = state;
  
  // Notify parent of changes to selected columns
  useEffect(() => {
    if (onSelectedColumnsChange) {
      onSelectedColumnsChange(selectedColumns);
    }
  }, [selectedColumns, onSelectedColumnsChange]);
  
  return (
    <div className="column-chooser">
      <div className="column-chooser-header">
        <h3 className="column-chooser-title">Column Chooser</h3>
        
        <label className="flat-view-toggle">
          <input
            type="checkbox"
            checked={isFlatView}
            onChange={(e) => setFlatView(e.target.checked)}
          />
          <span>Available Columns Tree View</span>
        </label>
      </div>
      
      <div className="column-chooser-panels">
        <AvailableColumns />
        <SelectedColumns />
      </div>
    </div>
  );

};

export default React.memo(ColumnChooser);