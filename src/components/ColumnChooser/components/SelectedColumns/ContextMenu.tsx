import React from 'react';
import { useColumnChooser } from '../../context/ColumnChooserContext';
import { useGroupManagement } from '../../hooks/useGroupManagement';

const ContextMenu: React.FC = () => {
  const { state } = useColumnChooser();
  const { 
    contextMenu, 
    handleContextMenuAction 
  } = useGroupManagement();
  
  if (!contextMenu.visible) return null;
  
  return (
    <div 
      className="context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {contextMenu.targetType === 'column' ? (
        <>
          <div 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('createGroup')}
          >
            Create Group
          </div>
          
          {/* Add to Existing Group submenu */}
          {state.selectedGroups.length > 0 && (
            <div className="context-menu-submenu">
              <div className="context-menu-item with-submenu">
                Add to Group
              </div>
              <div className="submenu">
                {state.selectedGroups.map(group => (
                  <div 
                    key={group.id}
                    className="context-menu-item"
                    onClick={() => handleContextMenuAction(`addToGroup:${group.id}`)}
                  >
                    {group.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Check if column is in a group */}
          {state.selectedGroups.some(g => 
            g.children.includes(contextMenu.targetId!)
          ) && (
            <>
              <div 
                className="context-menu-item"
                onClick={() => handleContextMenuAction('removeFromGroup')}
              >
                Remove from Group
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('renameGroup')}
          >
            Rename Group
          </div>
          <div 
            className="context-menu-item"
            onClick={() => handleContextMenuAction('removeGroup')}
          >
            Remove Group
          </div>
        </>
      )}
    </div>
  );
};

export default ContextMenu;
