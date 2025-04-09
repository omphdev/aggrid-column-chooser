import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Props for virtualized list items
export interface ListItemData<T> {
  items: T[];
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  dropIndicatorIndex?: number;
  groupDropIndicatorIndices?: Record<string, number>;
}

// Props for virtualized list component
interface VirtualizedListProps<T> {
  items: T[];
  height?: number;
  itemHeight?: number;
  renderItem: (props: { item: T; index: number; style: React.CSSProperties }) => React.ReactNode;
  className?: string;
  dropIndicatorIndex?: number;
  groupDropIndicatorIndices?: Record<string, number>;
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
  groupDropIndicatorIndices = {},
  onScroll
}: VirtualizedListProps<T>) {
  // Row renderer function
  const Row = useCallback(({ index, style, data }: { index: number; style: React.CSSProperties; data: ListItemData<T> }) => {
    const item = data.items[index];
    
    // Check if we need to render a drop indicator
    const showDropIndicator = index === data.dropIndicatorIndex;
    
    return (
      <div style={style}>
        {showDropIndicator && (
          <div 
            className="drop-indicator" 
            style={{ 
              height: '3px', 
              background: '#4a90e2', 
              margin: '3px 0',
              boxShadow: '0 0 4px rgba(74, 144, 226, 0.5)',
              animation: 'pulse 1.5s infinite'
            }} 
          />
        )}
        {data.renderItem({ item, index, style: {} })}
      </div>
    );
  }, []);
  
  // Memoize the list item data
  const itemData = useMemo(() => ({
    items,
    renderItem,
    dropIndicatorIndex,
    groupDropIndicatorIndices
  }), [items, renderItem, dropIndicatorIndex, groupDropIndicatorIndices]);
  
  // Handle scroll events
  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    if (onScroll) {
      onScroll(scrollOffset);
    }
  }, [onScroll]);
  
  // Calculate extra item count for drop indicators
  const extraItemCount = useMemo(() => {
    let count = 0;
    if (dropIndicatorIndex >= 0) count++;
    return count;
  }, [dropIndicatorIndex]);
  
  return (
    <div className={`virtualized-list-container ${className}`} style={{ height: height || '100%', overflow: 'hidden' }}>
      <AutoSizer>
        {({ width, height }: { width: number; height: number }) => (
          <List
            width={width}
            height={height}
            itemCount={items.length + extraItemCount}
            itemSize={itemHeight}
            itemData={itemData}
            onScroll={handleScroll}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;