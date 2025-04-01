// src/components/GroupPanel/components/SelectedFlatPanel.tsx
import React from 'react';
import { SelectedFlatPanelProps } from '../../types';
import GroupItem from './GroupItem';

const SelectedFlatPanel: React.FC<SelectedFlatPanelProps> = ({
  selectedGroups,
  selectedItems,
  draggedItemId,
  dropTarget,
  dropIndicatorIndex,
  selectedPanelRef,
  onSelect,
  onMoveToAvailable,
  onMoveUp,
  onMoveDown,
  onClearAll,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  return (
    <div className="panel-section selected-columns">
      <div className="panel-header">
        <h3>Selected Groups</h3>
        <div className="column-count">
          {selectedGroups.length} groups
        </div>
      </div>
      <div className="panel-content">
        <div 
          ref={selectedPanelRef}
          className={`columns-list-container ${dropTarget === 'selected' ? 'drop-target-active' : ''}`}
          onDragOver={(e) => onDragOver(e, 'selected')}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'selected')}
        >
          <div className="columns-list">
            {/* Drop indicator at the top */}
            {dropIndicatorIndex === 0 && (
              <div className="drop-indicator"></div>
            )}
            
            {selectedGroups.map((item, index) => (
              <React.Fragment key={item.field as string}>
                <GroupItem
                  item={item}
                  index={index}
                  isAvailable={false}
                  isSelected={selectedItems.includes(item.field as string)}
                  isDragging={item.field === draggedItemId}
                  onSelect={onSelect}
                  onDoubleClick={() => onMoveToAvailable([item.field as string])}
                  onDragStart={(e, item) => onDragStart(e, item, false)}
                />
                {/* Drop indicator after this item */}
                {dropIndicatorIndex === index + 1 && (
                  <div className="drop-indicator"></div>
                )}
              </React.Fragment>
            ))}
            
            {/* If list is empty, show drop indicator in empty state */}
            {selectedGroups.length === 0 && dropIndicatorIndex === 0 && (
              <div className="drop-indicator"></div>
            )}
          </div>
        </div>
      </div>
      <div className="panel-footer">
        <button 
          onClick={() => onMoveToAvailable(selectedItems)} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedGroups.some(col => col.field === id))}
        >
          &lt; Remove from Selected
        </button>
        <button 
          onClick={onMoveUp} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedGroups.some(col => col.field === id))}
        >
          Move Up
        </button>
        <button 
          onClick={onMoveDown} 
          disabled={selectedItems.length === 0 || !selectedItems.some(id => selectedGroups.some(col => col.field === id))}
        >
          Move Down
        </button>
        <button 
          onClick={onClearAll} 
          disabled={selectedGroups.length === 0}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default SelectedFlatPanel;