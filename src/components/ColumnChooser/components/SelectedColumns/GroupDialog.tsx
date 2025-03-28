import React from 'react';
import { useGroupManagement } from '../../hooks/useGroupManagement';

interface GroupDialogProps {
  isCreateDialog: boolean;
}

const GroupDialog: React.FC<GroupDialogProps> = ({ isCreateDialog }) => {
  const { 
    groupDialogName,
    setGroupDialogName,
    handleCreateGroupSubmit,
    handleRenameGroupSubmit,
    handleDialogCancel
  } = useGroupManagement();
  
  const handleSubmit = () => {
    if (isCreateDialog) {
      handleCreateGroupSubmit(groupDialogName);
    } else {
      handleRenameGroupSubmit(groupDialogName);
    }
  };
  
  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h4>{isCreateDialog ? 'Create Group' : 'Rename Group'}</h4>
        <input
          type="text"
          value={groupDialogName}
          onChange={(e) => setGroupDialogName(e.target.value)}
          placeholder="Group name"
          autoFocus
        />
        <div className="dialog-actions">
          <button onClick={handleSubmit}>
            {isCreateDialog ? 'Create' : 'Rename'}
          </button>
          <button onClick={handleDialogCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default GroupDialog;