import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Box, Paper } from '@mui/material';
import AutoSizer from 'react-virtualized-auto-sizer';

/**
 * Virtualized list for rendering large scores efficiently
 * Only renders visible staves, improving performance for large files
 * 
 * Install dependencies:
 * npm install react-window react-virtualized-auto-sizer
 */
const VirtualizedStaffList = ({
  staves,
  renderStaff,
  staffHeight = 200,
  overscanCount = 2,
}) => {
  // Memoize row renderer to avoid recreating on every render
  const Row = useCallback(({ index, style }) => {
    const staff = staves[index];
    
    return (
      <Box style={style} sx={{ p: 1 }}>
        <Paper elevation={1} sx={{ p: 2, height: staffHeight - 16 }}>
          {renderStaff(staff, index)}
        </Paper>
      </Box>
    );
  }, [staves, renderStaff, staffHeight]);

  // Memoize list data to optimize re-renders
  const itemData = useMemo(() => ({
    staves,
    renderStaff,
  }), [staves, renderStaff]);

  if (!staves || staves.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        No staves to display
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            height={height}
            itemCount={staves.length}
            itemSize={staffHeight}
            width={width}
            overscanCount={overscanCount}
            itemData={itemData}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </Box>
  );
};

export default React.memo(VirtualizedStaffList);

/**
 * Hook for managing virtualized staff state
 * Provides utilities for working with large scores
 */
export const useVirtualizedStaves = (allStaves, threshold = 20) => {
  // Determine if virtualization should be used
  const shouldVirtualize = allStaves.length > threshold;

  // Group staves by measure for efficient rendering
  const groupedStaves = useMemo(() => {
    if (!allStaves || allStaves.length === 0) return [];
    
    // Group logic depends on your data structure
    // This is a simple example
    return allStaves;
  }, [allStaves]);

  return {
    staves: groupedStaves,
    shouldVirtualize,
    itemCount: groupedStaves.length,
  };
};

