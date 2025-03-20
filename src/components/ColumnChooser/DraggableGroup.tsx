import React, { useState, useRef } from 'react';
import { ColumnGroup, ColumnItem } from '../../types';

interface DraggableGroupProps {
  group: ColumnGroup;
  onReorder: (groupId: string, targetId: string, insertBefore: boolean) => void;
  renderHeader: (groupId: string) => React.ReactNode;
  renderContent?: (groupId: string) => React.ReactNode;
}

interface DraggableGroupsProps {
  groups: ColumnGroup[];
  columns: ColumnItem[];
  selectedIds: string[];
  onReorder: (groupId: string, targetId: string, insertBefore: boolean) => void;
  renderHeader: (groupId: string) => React.ReactNode;
  renderContent?: (groupId: string) => React.ReactNode;
  onAddToGroup: (columnIds: string[], groupId: string) => void;
  onRemoveFromGroup: (columnIds: string[], groupId: string) => void;
  moveItemsToAvailable: (ids: string[], dropPosition: { targetId?: string, insertBefore: boolean }) => void;
}

/**
 * Single draggable group component
 */
export const DraggableGroup: React.FC<DraggableGroupProps> = ({
  group,
  onReorder,
  renderHeader,
  renderContent
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragPosition, setDragPosition] = useState<'top' | 'bottom' | null>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  
  const handleDragStart = (e: React.DragEvent) => {
    // Set drag data
    const dragData = {
      type: 'group',
      groupId: group.id,
      source: 'selected'
    };
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    // Add visual feedback
    if (groupRef.current) {
      groupRef.current.classList.add('dragging');
      
      // Clean up on drag end
      const handleDragEnd = () => {
        if (groupRef.current) {
          groupRef.current.classList.remove('dragging');
        }
        document.removeEventListener('dragend', handleDragEnd);
      };
      
      document.addEventListener('dragend', handleDragEnd);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Try to read data, but continue if it fails due to browser security
    let isOwnGroup = false;
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      isOwnGroup = data.groupId === group.id;
    } catch (err) {
      // Some browsers don't allow reading data on dragover
    }
    
    // Don't allow dropping on itself
    if (isOwnGroup) return;
    
    // Determine drop position (top/bottom)
    if (groupRef.current) {
      const rect = groupRef.current.getBoundingClientRect();
      const mouseY = e.clientY;
      const threshold = rect.top + rect.height * 0.5;
      
      if (mouseY < threshold) {
        setDragPosition('top');
      } else {
        setDragPosition('bottom');
      }
    }
    
    setIsDragOver(true);
  };
  
  const handleDragLeave = () => {
    setIsDragOver(false);
    setDragPosition(null);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setDragPosition(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      // Only handle group drops
      if (data.type === 'group' && data.groupId !== group.id) {
        onReorder(data.groupId, group.id, dragPosition === 'top');
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };
  
  return (
    <div 
      ref={groupRef}
      className={`draggable-group ${isDragOver ? 'drag-over' : ''} ${dragPosition ? `drag-${dragPosition}` : ''}`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        position: 'relative',
        marginBottom: '12px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        overflow: 'hidden',
        transition: 'box-shadow 0.3s, border-color 0.3s',
        cursor: 'grab',
        backgroundColor: '#fff',
        boxShadow: isDragOver ? '0 0 0 2px rgba(24, 144, 255, 0.3)' : 'none',
        borderColor: isDragOver ? '#1890ff' : '#d9d9d9'
      }}
    >
      {/* Visual indicators for drop position */}
      {isDragOver && dragPosition === 'top' && (
        <div 
          className="drop-indicator top"
          style={{
            position: 'absolute',
            top: -2,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: '#1890ff',
            zIndex: 10
          }}
        />
      )}
      
      {/* Group header */}
      {renderHeader(group.id)}
      
      {/* Group content */}
      {renderContent && renderContent(group.id)}
      
      {/* Bottom drop indicator */}
      {isDragOver && dragPosition === 'bottom' && (
        <div 
          className="drop-indicator bottom"
          style={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: 4,
            backgroundColor: '#1890ff',
            zIndex: 10
          }}
        />
      )}
    </div>
  );
};

/**
 * Container for draggable groups
 */
export const DraggableGroups: React.FC<DraggableGroupsProps> = ({
  groups,
  columns,
  selectedIds,
  onReorder,
  renderHeader,
  renderContent,
  onAddToGroup,
  onRemoveFromGroup,
  moveItemsToAvailable
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Handle drop at the container level
  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    setIsDragOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      
      if (data.source === 'available' && data.ids && data.ids.length > 0) {
        // Handle drops from available columns
        console.log('Drop from available to ungrouped:', data.ids);
        // This would be handled by the parent
      }
    } catch (err) {
      console.error('Error handling container drop:', err);
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={`draggable-groups-container ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleContainerDrop}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        padding: '8px 0',
        minHeight: groups.length === 0 ? '100px' : 'auto',
        border: isDragOver ? '2px dashed #1890ff' : '2px dashed transparent',
        transition: 'border-color 0.3s',
        borderRadius: '4px'
      }}
    >
      {groups.map(group => (
        <DraggableGroup
          key={group.id}
          group={group}
          onReorder={onReorder}
          renderHeader={renderHeader}
          renderContent={renderContent}
        />
      ))}
      
      {groups.length === 0 && (
        <div 
          className="empty-groups-message"
          style={{
            textAlign: 'center',
            color: '#999',
            padding: '20px',
            fontSize: '14px'
          }}
        >
          Drag columns here to create a group
        </div>
      )}
    </div>
  );
};

export default DraggableGroups;