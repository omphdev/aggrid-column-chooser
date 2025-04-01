// src/components/ConfigurationPanel.tsx
import React, { useState } from 'react';
import ColumnPanel from './ColumnPanel';
import { GroupPanel1, GroupPanel2 } from './GroupPanel';
import { ConfigurationPanelProps } from './types';

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ columnDefs, configPanelParams }) => {
  const [activePanel, setActivePanel] = useState<string>('column');

  // Render the appropriate panel based on activePanel value
  const renderPanel = () => {
    switch (activePanel) {
      case 'column':
        return (
          <ColumnPanel
            columnDefs={columnDefs}
            columnGroups={configPanelParams.configPanel.columnGroups}
            onColumnChanged={configPanelParams.configPanel.onColumnChanged}
            onColumnGroupChanged={configPanelParams.configPanel.onColumnGroupChanged}
          />
        );
      case 'group-tab-1':
        return configPanelParams.groupPanel ? (
          <GroupPanel1
            groupsCols={configPanelParams.groupPanel.groupsCols}
            selectedGroups={configPanelParams.groupPanel.selectedGroups}
            onGroupChanged={configPanelParams.groupPanel.onGroupChanged}
          />
        ) : (
          <div>Group panel configuration not provided</div>
        );
      case 'group-tab-2':
        return configPanelParams.groupPanel ? (
          <GroupPanel2
            groupsCols={configPanelParams.groupPanel.groupsCols}
            selectedGroups={configPanelParams.groupPanel.selectedGroups}
            onGroupChanged={configPanelParams.groupPanel.onGroupChanged}
          />
        ) : (
          <div>Group panel configuration not provided</div>
        );
      default:
        return <div>No panel selected</div>;
    }
  };

  return (
    <div className="configuration-panel">
      <div className="panel-tabs">
        <button 
          className={`panel-tab ${activePanel === 'column' ? 'active' : ''}`}
          onClick={() => setActivePanel('column')}
        >
          Column Configuration
        </button>
        <button 
          className={`panel-tab ${activePanel === 'group-tab-1' ? 'active' : ''}`}
          onClick={() => setActivePanel('group-tab-1')}
        >
          Group Tab 1
        </button>
        <button 
          className={`panel-tab ${activePanel === 'group-tab-2' ? 'active' : ''}`}
          onClick={() => setActivePanel('group-tab-2')}
        >
          Group Tab 2
        </button>
      </div>
      <div className="panel-content">
        {renderPanel()}
      </div>
    </div>
  );
};

export default ConfigurationPanel;