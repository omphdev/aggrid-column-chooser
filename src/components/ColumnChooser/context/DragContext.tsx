import React, { createContext, useContext, useReducer, useMemo, ReactNode, useCallback } from 'react';
import { DragItemTypes, DragItem } from '../../../types';

// Drag state interface
interface DragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dropTarget: 'available' | 'selected' | null;
  dropIndicatorIndex: number;
  groupDropTarget: string | null;
  selectedGroupDropTarget: string | null;
  groupDropIndicatorIndices: Record<string, number>;
}

// Action types for the reducer
type DragActionType = 
  | { type: 'START_DRAG', item: DragItem }
  | { type: 'END_DRAG' }
  | { type: 'SET_DROP_TARGET', target: 'available' | 'selected' | null }
  | { type: 'SET_DROP_INDICATOR', index: number }
  | { type: 'SET_GROUP_DROP_TARGET', groupPath: string | null }
  | { type: 'SET_SELECTED_GROUP_DROP_TARGET', groupName: string | null }
  | { type: 'SET_GROUP_DROP_INDICATOR', groupName: string, index: number }
  | { type: 'RESET_GROUP_DROP_INDICATORS' };

// Context interface
interface DragContextProps {
  dragState: DragState;
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  setDropTarget: (target: 'available' | 'selected' | null) => void;
  setDropIndicator: (index: number) => void;
  setGroupDropTarget: (groupPath: string | null) => void;
  setSelectedGroupDropTarget: (groupName: string | null) => void;
  setGroupDropIndicator: (groupName: string, index: number) => void;
  resetGroupDropIndicators: () => void;
}

// Create the context
const DragContext = createContext<DragContextProps | undefined>(undefined);

// The reducer function for drag state updates
function dragReducer(state: DragState, action: DragActionType): DragState {
  switch (action.type) {
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        dragItem: action.item
      };
    
    case 'END_DRAG':
      return {
        ...state,
        isDragging: false,
        dragItem: null,
        dropTarget: null,
        dropIndicatorIndex: -1,
        groupDropTarget: null,
        selectedGroupDropTarget: null,
        groupDropIndicatorIndices: {}
      };
    
    case 'SET_DROP_TARGET':
      return {
        ...state,
        dropTarget: action.target
      };
    
    case 'SET_DROP_INDICATOR':
      return {
        ...state,
        dropIndicatorIndex: action.index
      };
    
    case 'SET_GROUP_DROP_TARGET':
      return {
        ...state,
        groupDropTarget: action.groupPath
      };
    
    case 'SET_SELECTED_GROUP_DROP_TARGET':
      return {
        ...state,
        selectedGroupDropTarget: action.groupName
      };
    
    case 'SET_GROUP_DROP_INDICATOR':
      return {
        ...state,
        groupDropIndicatorIndices: {
          ...state.groupDropIndicatorIndices,
          [action.groupName]: action.index
        }
      };
    
    case 'RESET_GROUP_DROP_INDICATORS':
      return {
        ...state,
        groupDropIndicatorIndices: {}
      };
    
    default:
      return state;
  }
}

// Provider component
interface DragProviderProps {
  children: ReactNode;
}

export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  // Initialize state
  const initialState: DragState = {
    isDragging: false,
    dragItem: null,
    dropTarget: null,
    dropIndicatorIndex: -1,
    groupDropTarget: null,
    selectedGroupDropTarget: null,
    groupDropIndicatorIndices: {}
  };
  
  // Create reducer
  const [dragState, dispatch] = useReducer(dragReducer, initialState);
  
  // Callbacks
  const startDrag = useCallback((item: DragItem) => {
    dispatch({ type: 'START_DRAG', item });
  }, []);
  
  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);
  
  const setDropTarget = useCallback((target: 'available' | 'selected' | null) => {
    dispatch({ type: 'SET_DROP_TARGET', target });
  }, []);
  
  const setDropIndicator = useCallback((index: number) => {
    dispatch({ type: 'SET_DROP_INDICATOR', index });
  }, []);
  
  const setGroupDropTarget = useCallback((groupPath: string | null) => {
    dispatch({ type: 'SET_GROUP_DROP_TARGET', groupPath });
  }, []);
  
  const setSelectedGroupDropTarget = useCallback((groupName: string | null) => {
    dispatch({ type: 'SET_SELECTED_GROUP_DROP_TARGET', groupName });
  }, []);
  
  const setGroupDropIndicator = useCallback((groupName: string, index: number) => {
    dispatch({ type: 'SET_GROUP_DROP_INDICATOR', groupName, index });
  }, []);
  
  const resetGroupDropIndicators = useCallback(() => {
    dispatch({ type: 'RESET_GROUP_DROP_INDICATORS' });
  }, []);
  
  // Create memoized context value
  const contextValue = useMemo(() => ({
    dragState,
    startDrag,
    endDrag,
    setDropTarget,
    setDropIndicator,
    setGroupDropTarget,
    setSelectedGroupDropTarget,
    setGroupDropIndicator,
    resetGroupDropIndicators
  }), [
    dragState,
    startDrag,
    endDrag,
    setDropTarget,
    setDropIndicator,
    setGroupDropTarget,
    setSelectedGroupDropTarget,
    setGroupDropIndicator,
    resetGroupDropIndicators
  ]);
  
  return (
    <DragContext.Provider value={contextValue}>
      {children}
    </DragContext.Provider>
  );
};

// Custom hook to use the context
export function useDrag() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
}