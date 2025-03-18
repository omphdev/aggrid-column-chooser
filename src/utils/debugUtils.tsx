// src/utils/debugUtils.tsx
import React from 'react';
import { ColumnItem, CustomColumnGroup, ColumnDebuggerProps } from '../types';

/**
 * Helper function to print the column tree structure for debugging
 * @param columns Column tree structure
 * @param indent Indentation level for nested display
 */
export const printColumnTree = (columns: ColumnItem[], indent: number = 0): string => {
  let output = '';
  
  columns.forEach(item => {
    const indentStr = '  '.repeat(indent);
    const type = item.field ? 'Field' : 'Group';
    const details = item.field ? `(field: ${item.field})` : `(${item.children?.length || 0} children)`;
    
    output += `${indentStr}${type}: ${item.name} ${details}\n`;
    
    if (item.children && item.children.length > 0) {
      output += printColumnTree(item.children, indent + 1);
    }
  });
  
  return output;
};

/**
 * Helper function to print custom groups structure for debugging
 * @param groups Custom groups definition
 */
export const printCustomGroups = (groups: CustomColumnGroup[]): string => {
  let output = '';
  
  groups.forEach(group => {
    output += `Group: ${group.headerName} (id: ${group.id})\n`;
    output += '  Columns:\n';
    
    group.children.forEach(field => {
      output += `    - ${field}\n`;
    });
    
    output += '\n';
  });
  
  return output;
};

/**
 * Helper component for debugging column structure
 */
export const ColumnDebugger: React.FC<ColumnDebuggerProps> = ({ columns, customGroups }) => {
  return (
    <div style={{ 
      padding: '10px', 
      margin: '10px 0', 
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>Column Structure Debug</h4>
      
      {customGroups && customGroups.length > 0 && (
        <>
          <details>
            <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
              Custom Groups ({customGroups.length})
            </summary>
            <pre style={{ margin: '10px 0' }}>
              {printCustomGroups(customGroups)}
            </pre>
          </details>
          <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        </>
      )}
      
      <details>
        <summary style={{ fontWeight: 'bold', cursor: 'pointer' }}>
          Column Tree Structure ({columns.length} root items)
        </summary>
        <pre style={{ margin: '10px 0' }}>
          {printColumnTree(columns)}
        </pre>
      </details>
    </div>
  );
};