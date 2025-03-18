// src/components/ColumnChooser/index.tsx
import React, { useState, useEffect } from 'react';
import { ColumnChooserProps } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';
import AvailableColumns from './AvailableColumns';
import SelectedColumns from './SelectedColumns';
import './styles.css';

/**
 * Main column chooser component with both available and selected column panels
 */
export const ColumnChooser: React.FC<ColumnChooserProps> = ({
  onSelectedColumnsChange
}) => {
  // State for flat view toggle
  const [selectedColumnsFlat, setSelectedColumnsFlat] = useState(false);
  
  // Get the setIsFlatView function from context
  const { setIsFlatView } = useColumnContext();
  
  // Update the context when the flat view toggle changes
  useEffect(() => {
    setIsFlatView(selectedColumnsFlat);
  }, [selectedColumnsFlat, setIsFlatView]);
  
  return (
    <div className="column-chooser-container">
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '10px'
        }}>
          <h3>Column Chooser</h3>
          
          <label className="flat-view-toggle">
            <input
              type="checkbox"
              checked={selectedColumnsFlat}
              onChange={(e) => setSelectedColumnsFlat(e.target.checked)}
            />
            Flat View
          </label>
        </div>
        
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          height: '300px'
        }}>
          <AvailableColumns />
          <SelectedColumns flatView={selectedColumnsFlat} />
        </div>
      </div>
    </div>
  );
};

export default ColumnChooser;