// src/components/ColumnGroupsIntegration/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ColumnDefinition, CustomColumnGroup } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';
import CustomGroupsManager from '../CustomGroupsManager';
import { ColumnDebugger } from '../../utils/debugUtils';
import './styles.css';

interface ColumnGroupsIntegrationProps {
  initialGroups?: CustomColumnGroup[];
  onGroupsChange?: (groups: CustomColumnGroup[]) => void;
  showDebugger?: boolean;
}

/**
 * Integration component for custom column groups feature
 */
const ColumnGroupsIntegration: React.FC<ColumnGroupsIntegrationProps> = ({
  initialGroups = [],
  onGroupsChange,
  showDebugger = false
}) => {
  const { 
    selectedColumns, 
    availableColumns, 
    getCustomGroups, 
    applyCustomGroups 
  } = useColumnContext();
  
  // State for the current groups
  const [customGroups, setCustomGroups] = useState<CustomColumnGroup[]>(initialGroups);
  
  // Initialize with the provided groups
  useEffect(() => {
    if (initialGroups && initialGroups.length > 0) {
      setCustomGroups(initialGroups);
      
      // Apply the groups to the grid
      if (applyCustomGroups) {
        applyCustomGroups(initialGroups);
      }
    }
  }, [initialGroups, applyCustomGroups]);

  // Handle changes to custom groups
  const handleGroupsChange = useCallback((groups: CustomColumnGroup[]) => {
    setCustomGroups(groups);
    
    // Update the grid
    if (applyCustomGroups) {
      applyCustomGroups(groups);
    }
    
    // Notify parent if needed
    if (onGroupsChange) {
      onGroupsChange(groups);
    }
  }, [applyCustomGroups, onGroupsChange]);

  // Get current groups from the context for debug display
  const currentGroups = getCustomGroups ? getCustomGroups() : customGroups;

  return <div className="column-groups-integration">
      <div className="integration-content">
        <CustomGroupsManager 
          onGroupsChange={handleGroupsChange} 
        />
        
        {showDebugger && (
          <ColumnDebugger 
            columns={selectedColumns || []}
            customGroups={currentGroups}
          />
        )}
      </div>
    </div>
};

export default ColumnGroupsIntegration;