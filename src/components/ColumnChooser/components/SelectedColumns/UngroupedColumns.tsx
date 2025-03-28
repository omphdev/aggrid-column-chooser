import React from 'react';
import ColumnItem from './ColumnItem';
import { SelectedNode } from '../../types';

interface UngroupedColumnsProps {
  columns: SelectedNode[];
  isDraggingOverGroup: boolean;
  dropPosition: number | null;
}

const UngroupedColumns: React.FC<UngroupedColumnsProps> = ({
  columns,
  isDraggingOverGroup,
  dropPosition
}) => {
  return (
    <>
      {/* Render drop indicator at start position if needed */}
      {!isDraggingOverGroup && dropPosition === 0 && columns.length > 0 && (
        <div className="drop-indicator"></div>
      )}
      
      {/* Render ungrouped columns with drop indicators */}
      {columns.map((col, index) => (
        <React.Fragment key={col.id}>
          <ColumnItem 
            column={col}
            inGroup={false}
          />
          {/* Render drop indicator after this column if needed */}
          {!isDraggingOverGroup && dropPosition === index + 1 && (
            <div className="drop-indicator"></div>
          )}
        </React.Fragment>
      ))}
      
      {/* Add indicator at the end if needed */}
      {!isDraggingOverGroup && 
       dropPosition === columns.length && 
       columns.length > 0 && (
        <div className="drop-indicator"></div>
      )}
    </>
  );
};

export default React.memo(UngroupedColumns);
