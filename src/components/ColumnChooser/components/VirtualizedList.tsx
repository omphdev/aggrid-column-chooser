import React, { useMemo, useCallback, useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useDrag as useCustomDrag } from '../context/DragContext';

// Props for virtualized list items
export interface ListItemData<T> {
  items: T[];
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  dropIndicatorIndex: number;
}

// Props for virtualized list component
interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemHeight?: number;
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  className?: string;
  dropIndicatorIndex?: number;
  onScroll?: (scrollTop: number) => void;
}

// Generic virtualized list component
function VirtualizedList<T>({
  items,
  height,
  itemHeight = 36,
  renderItem,
  className = '',
  dropIndicatorIndex = -1,
  onScroll
}: VirtualizedListProps<T>) {
  // List ref to manipulate the list directly
  const listRef = useRef<List>(null);
  
  // Access drag context to get drop indicator state
  const { dragState } = useCustomDrag();
  
  // Use the provided dropIndicatorIndex or get it from dragState
  const actualDropIndex = dropIndicatorIndex >= 0 ? dropIndicatorIndex : dragState.dropIndicatorIndex;
  
  // Row renderer function
  const Row = useCallback(({ index, style, data }: { 
    index: number; 
    style: React.CSSProperties; 
    data: ListItemData<T> 
  }) => {
    // Show drop indicator above this row if it matches the drop index
    const showIndicator = data.dropIndicatorIndex === index;
    
    return (
      <div style={style}>
        {showIndicator && (
          <div 
            className="drop-indicator" 
            style={{ 
              height: '2px',
              backgroundColor: '#2196f3',
              margin: '0',
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              zIndex: 5,
              boxShadow: '0 0 3px rgba(33, 150, 243, 0.5)'
            }} 
          />
        )}
        {data.renderItem({ item: data.items[index], index, style: {} })}
      </div>
    );
  }, []);
  
  // Memoize the list item data
  const itemData = useMemo(() => ({
    items,
    renderItem,
    dropIndicatorIndex: actualDropIndex
  }), [items, renderItem, actualDropIndex]);
  
  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [onScroll]);
  
  return (
    <div className={`virtualized-list-container ${className}`} style={{ height: height || '100%', overflow: 'hidden', position: 'relative' }}>
      <AutoSizer>
        {({ width, height }: { width: number; height: number }) => (
          <List
            ref={listRef}
            width={width}
            height={height}
            itemCount={items.length}
            itemSize={itemHeight}
            itemData={itemData}
            onScroll={handleScroll}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
      
      {/* Drop indicator for the very bottom of the list */}
      {actualDropIndex === items.length && items.length > 0 && (
        <div 
          style={{ 
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#2196f3',
            zIndex: 5,
            boxShadow: '0 0 3px rgba(33, 150, 243, 0.5)'
          }} 
        />
      )}
    </div>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;