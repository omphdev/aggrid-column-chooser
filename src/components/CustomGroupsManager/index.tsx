// src/components/CustomGroupsManager/index.tsx
import React, { useState, useEffect } from 'react';
import { CustomColumnGroup } from '../../types';
import { useColumnContext } from '../../contexts/ColumnContext';
import './styles.css';

interface CustomGroupsManagerProps {
  onGroupsChange?: (groups: CustomColumnGroup[]) => void;
}

/**
 * Component to manage custom column groups
 */
const CustomGroupsManager: React.FC<CustomGroupsManagerProps> = ({
  onGroupsChange
}) => {
  const { availableColumns, selectedColumns, getCustomGroups } = useColumnContext();
  const [editingGroup, setEditingGroup] = useState<CustomColumnGroup | null>(null);
  const [groups, setGroups] = useState<CustomColumnGroup[]>([]);
  const [groupName, setGroupName] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<{field: string, name: string}[]>([]);

  // Load current groups when the component mounts
  useEffect(() => {
    const currentGroups = getCustomGroups();
    setGroups(currentGroups);
  }, [getCustomGroups]);

  // Update available fields based on available columns
  useEffect(() => {
    const fields: {field: string, name: string}[] = [];
    
    const extractFields = (columns: any[]) => {
      columns.forEach(column => {
        if (column.field) {
          fields.push({
            field: column.field,
            name: column.name
          });
        }
        
        if (column.children && column.children.length > 0) {
          extractFields(column.children);
        }
      });
    };
    
    extractFields(availableColumns);
    setAvailableFields(fields);
  }, [availableColumns]);

  // Handle adding a new group
  const handleAddGroup = () => {
    if (!groupName) {
      alert('Please enter a group name');
      return;
    }
    
    if (selectedFields.length === 0) {
      alert('Please select at least one field');
      return;
    }
    
    const newGroup: CustomColumnGroup = {
      headerName: groupName,
      children: selectedFields,
      id: `custom-group-${Date.now()}`
    };
    
    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    
    // Notify parent of changes
    if (onGroupsChange) {
      onGroupsChange(updatedGroups);
    }
    
    // Reset form
    setGroupName('');
    setSelectedFields([]);
    setEditingGroup(null);
  };

  // Handle editing an existing group
  const handleEditGroup = (group: CustomColumnGroup) => {
    setEditingGroup(group);
    setGroupName(group.headerName);
    setSelectedFields([...group.children]);
  };

  // Handle updating an edited group
  const handleUpdateGroup = () => {
    if (!editingGroup) return;
    
    const updatedGroups = groups.map(group => {
      if (group.id === editingGroup.id) {
        return {
          ...group,
          headerName: groupName,
          children: selectedFields
        };
      }
      return group;
    });
    
    setGroups(updatedGroups);
    
    // Notify parent of changes
    if (onGroupsChange) {
      onGroupsChange(updatedGroups);
    }
    
    // Reset form
    setGroupName('');
    setSelectedFields([]);
    setEditingGroup(null);
  };

  // Handle removing a group
  const handleRemoveGroup = (groupId: string) => {
    const updatedGroups = groups.filter(group => group.id !== groupId);
    setGroups(updatedGroups);
    
    // Notify parent of changes
    if (onGroupsChange) {
      onGroupsChange(updatedGroups);
    }
  };

  // Handle field selection change
  const handleFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedFields(selected);
  };

  return (
    <div className="custom-groups-manager">
      <h3>Custom Column Groups</h3>
      
      {/* Group Form */}
      <div className="group-form">
        <div className="form-group">
          <label htmlFor="groupName">Group Name:</label>
          <input
            type="text"
            id="groupName"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="columns">Select Columns:</label>
          <select
            id="columns"
            multiple
            value={selectedFields}
            onChange={handleFieldChange}
            size={6}
          >
            {availableFields.map(field => (
              <option key={field.field} value={field.field}>
                {field.name}
              </option>
            ))}
          </select>
          <small>Hold Ctrl/Cmd to select multiple columns</small>
        </div>
        
        <div className="form-buttons">
          {editingGroup ? (
            <>
              <button onClick={handleUpdateGroup}>Update Group</button>
              <button onClick={() => {
                setEditingGroup(null);
                setGroupName('');
                setSelectedFields([]);
              }}>Cancel</button>
            </>
          ) : (
            <button onClick={handleAddGroup}>Add Group</button>
          )}
        </div>
      </div>
      
      {/* Groups List */}
      <div className="groups-list">
        <h4>Defined Groups</h4>
        {groups.length === 0 ? (
          <p>No custom groups defined yet</p>
        ) : (
          <ul>
            {groups.map(group => (
              <li key={group.id}>
                <div className="group-info">
                  <strong>{group.headerName}</strong>
                  <span>({group.children.length} columns)</span>
                  <div className="group-actions">
                    <button onClick={() => handleEditGroup(group)}>Edit</button>
                    <button onClick={() => handleRemoveGroup(group.id!)}>Remove</button>
                  </div>
                </div>
                <div className="group-columns">
                  {group.children.map(field => {
                    const fieldInfo = availableFields.find(f => f.field === field);
                    return (
                      <span key={field} className="field-chip">
                        {fieldInfo ? fieldInfo.name : field}
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default CustomGroupsManager;