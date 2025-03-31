import React from 'react';

interface ContextMenuProps {
  position: { x: number, y: number } | null;
  targetGroup: string | null;
  inSelectedPanel: boolean;
  onCreateGroup: () => void;
  onRemoveFromGroup?: () => void;
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  targetGroup,
  inSelectedPanel,
  onCreateGroup,
  onRemoveFromGroup,
  onClose
}) => {
  if (!position) return null;

  return (
    <>
      <div 
        className="context-menu"
        style={{
          position: 'fixed',
          top: position.y,
          left: position.x,
          zIndex: 1000
        }}
      >
        {/* Context menu items for available panel */}
        {!inSelectedPanel && (
          <div className="context-menu-item" onClick={onCreateGroup}>
            {targetGroup ? `Add to ${targetGroup.split('.').pop()}` : 'Create New Group'}
          </div>
        )}

        {/* Context menu items for selected panel */}
        {inSelectedPanel && (
          <>
            <div className="context-menu-item" onClick={onCreateGroup}>
              {targetGroup ? `Add to ${targetGroup}` : 'Create New Group'}
            </div>
            {targetGroup && onRemoveFromGroup && (
              <div className="context-menu-item" onClick={onRemoveFromGroup}>
                Remove from {targetGroup}
              </div>
            )}
          </>
        )}

        <div className="context-menu-item" onClick={onClose}>
          Cancel
        </div>
      </div>

      {/* Overlay to close context menu when clicking outside */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
        onClick={onClose}
      />
    </>
  );
};

export default ContextMenu;