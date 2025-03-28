import { TreeNode, ExtendedColDef } from '../types';

/**
 * Builds a tree structure from column definitions based on their groupPath
 */
export function buildColumnTree(
  columnDefs: ExtendedColDef[], 
  selectedColumnIds: string[]
): TreeNode[] {
  const tree: TreeNode[] = [];
  const nodeMap: { [path: string]: TreeNode } = {};

  // Create a helper function to ensure a path exists in the tree
  const ensurePathExists = (pathSegments: string[], parentPath: string[] = []): TreeNode => {
    if (pathSegments.length === 0) return { id: '', name: '', children: [], isGroup: false };

    const currentSegment = pathSegments[0];
    const currentPath = [...parentPath, currentSegment];
    const currentPathString = currentPath.join('/');

    if (!nodeMap[currentPathString]) {
      const newNode: TreeNode = {
        id: currentPathString,
        name: currentSegment,
        children: [],
        isGroup: true,
        isExpanded: true,
        parentPath
      };

      nodeMap[currentPathString] = newNode;

      // Add to parent or to root
      if (parentPath.length === 0) {
        tree.push(newNode);
      } else {
        const parentPathString = parentPath.join('/');
        const parentNode = nodeMap[parentPathString];
        if (parentNode) {
          parentNode.children.push(newNode);
        }
      }
    }

    if (pathSegments.length > 1) {
      return ensurePathExists(pathSegments.slice(1), currentPath);
    }

    return nodeMap[currentPathString];
  };

  // Filter out columns that are already selected
  const availableColumns = columnDefs.filter(
    col => !selectedColumnIds.includes(col.id!)
  );

  // Populate the tree with available columns
  availableColumns.forEach(col => {
    const groupPath = col.groupPath || [];
    
    if (groupPath.length === 0) {
      // If no group path, add directly to the root
      tree.push({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        children: [],
        column: col,
        isGroup: false
      });
    } else {
      // Ensure the path exists and add the column as a leaf node
      const parentNode = ensurePathExists(groupPath);
      parentNode.children.push({
        id: col.id!,
        name: col.headerName || col.field || 'Unnamed Column',
        children: [],
        column: col,
        isGroup: false
      });
    }
  });

  return filterEmptyGroups(tree);
}

/**
 * Recursively filters out empty groups
 */
export function filterEmptyGroups(nodes: TreeNode[]): TreeNode[] {
  return nodes.filter(node => {
    if (node.isGroup) {
      node.children = filterEmptyGroups(node.children);
      return node.children.length > 0;
    }
    return true;
  });
}

/**
 * Filters tree based on search query
 */
export function filterTree(nodes: TreeNode[], searchQuery: string): TreeNode[] {
  if (!searchQuery) return nodes;

  const searchLower = searchQuery.toLowerCase();
  
  const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .map(node => {
        if (node.isGroup) {
          const filteredChildren = filterNodes(node.children);
          if (filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
              isExpanded: true // Auto-expand groups with matching children
            };
          }
          // If group name matches, include the whole group
          if (node.name.toLowerCase().includes(searchLower)) {
            return { ...node, isExpanded: true };
          }
          return null;
        } else {
          // Leaf node - check if name matches
          if (node.name.toLowerCase().includes(searchLower)) {
            return node;
          }
          return null;
        }
      })
      .filter((node): node is TreeNode => node !== null);
  };

  return filterNodes(nodes);
}

/**
 * Counts leaf nodes (actual columns, not groups)
 */
export function countLeafNodes(nodes: TreeNode[]): number {
  let count = 0;
  nodes.forEach(node => {
    if (!node.isGroup) {
      count++;
    } else {
      count += countLeafNodes(node.children);
    }
  });
  return count;
}

/**
 * Finds all leaf nodes (actual columns) in a tree
 */
export function findAllLeafNodes(nodes: TreeNode[]): ExtendedColDef[] {
  const leafNodes: ExtendedColDef[] = [];
  
  const traverse = (nodeList: TreeNode[]) => {
    nodeList.forEach(node => {
      if (!node.isGroup && node.column) {
        leafNodes.push(node.column);
      } else if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  
  traverse(nodes);
  return leafNodes;
}

/**
 * Finds all leaf nodes in a specific group
 */
export function findGroupLeafNodes(groupId: string, nodes: TreeNode[]): ExtendedColDef[] {
  for (const node of nodes) {
    if (node.id === groupId && node.isGroup) {
      return findAllLeafNodes(node.children);
    }
    if (node.children.length > 0) {
      const found = findGroupLeafNodes(groupId, node.children);
      if (found.length > 0) return found;
    }
  }
  return [];
}

/**
 * Finds a specific node by its ID in the tree
 */
export function findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}
