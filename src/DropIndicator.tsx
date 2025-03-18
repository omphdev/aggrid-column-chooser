// components/DropIndicator.tsx
import React from 'react';

export interface DropIndicatorProps {
  top: number;
  left?: number;
  right?: number;
  text?: string;
}

export const DropIndicator: React.FC<DropIndicatorProps> = ({
  top,
  left = 8,
  right = 8,
  text = 'Drop Here'
}) => (
  <div 
    className="drop-indicator-silhouette"
    style={{
      position: 'absolute',
      left: `${left}px`,
      right: `${right}px`,
      top: `${top}px`,
      padding: '6px 8px',
      backgroundColor: 'rgba(24, 144, 255, 0.1)',
      border: '1px dashed #1890ff',
      borderRadius: '4px',
      color: '#1890ff',
      fontSize: '14px',
      fontStyle: 'italic',
      opacity: 0.8,
      zIndex: 1000,
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    <span>{text}</span>
  </div>
);

