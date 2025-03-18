// src/components/DragDrop/DropIndicator.tsx
import React from 'react';
import { DropIndicatorProps } from '../../types';

/**
 * Component to display a visual indicator during drag and drop operations
 * showing where an item will be dropped
 */
export const DropIndicator: React.FC<DropIndicatorProps> = ({
  top,
  left = 8,
  right = 8,
  text = 'Drop Here'
}) => (
  <div 
    className="drop-indicator"
    style={{
      position: 'absolute',
      left: `${left}px`,
      right: `${right}px`,
      top: `${top}px`,
      padding: '6px 8px',
      backgroundColor: 'rgba(24, 144, 255, 0.1)',
      border: '2px dashed #1890ff',
      borderRadius: '4px',
      color: '#1890ff',
      fontSize: '14px',
      fontStyle: 'italic',
      zIndex: 100,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      height: '32px',
      justifyContent: 'center'
    }}
  >
    <span>{text}</span>
  </div>
);

export default DropIndicator;