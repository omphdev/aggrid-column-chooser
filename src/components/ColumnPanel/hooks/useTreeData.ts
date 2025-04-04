// src/components/ColumnPanel/hooks/useTreeData.ts
import { useState, useEffect, useMemo } from 'react';
import { ExtendedColDef, ColumnGroup } from '../../types';
import { TreeNode, convertToTreeData } from '../components/VirtualTree';

export interface UseTreeDataProps {
  columns: ExtendedColDef[];
  expandedGroups: Set<string>;
  isSelectedPanel?: boolean;
  columnGroups?: ColumnGroup[];
}

export const useTreeData = ({
  columns,
  expandedGroups,
  isSelectedPanel = false,
  columnGroups = []
}: UseTreeDataProps) => {
  // State for the tree data and visible nodes
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [visibleNodes, setVisibleNodes] = useState<TreeNode[]>([]);
  
  // Update tree data and visible nodes when dependencies change
  useEffect(() => {
    const { treeData, visibleNodes } = convertToTreeData(
      columns,
      expandedGroups,
      isSelectedPanel,
      columnGroups
    );
    
    setTreeData(treeData);
    setVisibleNodes(visibleNodes);
  }, [columns, expandedGroups, isSelectedPanel, columnGroups]);
  
  // Calculate flattened column list (columns in tree order)
  const flattenedColumns = useMemo(() => {
    return visibleNodes
      .filter(node => node.type === 'column')
      .map(node => node.data as ExtendedColDef);
  }, [visibleNodes]);
  
  // Calculate flattened group list (groups in tree order)
  const flattenedGroups = useMemo(() => {
    return visibleNodes
      .filter(node => node.type === 'group')
      .map(node => node.id);
  }, [visibleNodes]);
  
  // Function to get a node by ID
  const getNodeById = (id: string) => {
    return treeData.find(node => node.id === id);
  };
  
  // Function to get all child nodes of a group
  const getChildNodes = (groupId: string) => {
    const node = getNodeById(groupId);
    if (!node || node.type !== 'group' || !node.children) return [];
    
    return node.children.map(childId => getNodeById(childId)).filter(Boolean) as TreeNode[];
  };
  
  // Function to get all descendant nodes of a group (recursive)
  const getDescendantNodes = (groupId: string) => {
    const descendants: TreeNode[] = [];
    const node = getNodeById(groupId);
    
    if (!node || node.type !== 'group' || !node.children) return descendants;
    
    node.children.forEach(childId => {
      const childNode = getNodeById(childId);
      if (childNode) {
        descendants.push(childNode);
        
        if (childNode.type === 'group') {
          descendants.push(...getDescendantNodes(childNode.id));
        }
      }
    });
    
    return descendants;
  };
  
  // Function to get the parent node of a node
  const getParentNode = (nodeId: string) => {
    const node = getNodeById(nodeId);
    if (!node || !node.parent) return null;
    
    return getNodeById(node.parent);
  };
  
  // Function to get the index of a node in the visible nodes array
  const getVisibleNodeIndex = (nodeId: string) => {
    return visibleNodes.findIndex(node => node.id === nodeId);
  };
  
  return {
    treeData,
    visibleNodes,
    flattenedColumns,
    flattenedGroups,
    getNodeById,
    getChildNodes,
    getDescendantNodes,
    getParentNode,
    getVisibleNodeIndex
  };
};

export default useTreeData;