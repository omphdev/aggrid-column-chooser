import React, { useState } from 'react';
import ColumnPanel from './ColumnPanel';
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
        {/* Additional panel tabs can be added here */}
      </div>
      <div className="panel-content">
        {renderPanel()}
      </div>
    </div>
  );
};

export default ConfigurationPanel;