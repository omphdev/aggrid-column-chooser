// src/components/types/VirtualTreeTypes.ts
import { TreeNode } from '../ColumnPanel/components/VirtualTree';

export interface VirtualTreeProps {
    treeData: TreeNode[];
    visibleNodes: TreeNode[];
    selectedItems: string[];
    expandedGroups: Set<string>;
    toggleGroup: (e: React.MouseEvent, nodeId: string) => void;
    onSelect: (id: string, isMultiSelect: boolean, isRangeSelect: boolean) => void;
    onDoubleClick: (id: string) => void;
    onContextMenu: (e: React.MouseEvent, groupPath?: string, inSelectedPanel?: boolean, groupName?: string) => void;
    onDragStart: (e: React.DragEvent<Element>, node: any, isAvailable: boolean) => void;
    onGroupDragStart?: (e: React.DragEvent<Element>, groupPath: string) => void;
    draggedColumnId: string | null;
    draggedGroupPath: string | null;
    groupDropTarget: string | null;
    dropIndicatorIndex: number;
    isSelectedPanel?: boolean;
    height: number;
    width: number | string;
  }