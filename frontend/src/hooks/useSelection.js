import { useState, useCallback } from 'react';

/**
 * Custom hook for managing note selection
 */
export const useSelection = () => {
  const [selectedIndices, setSelectedIndices] = useState([]);

  const selectNote = useCallback((index) => {
    setSelectedIndices([index]);
  }, []);

  const addToSelection = useCallback((index) => {
    setSelectedIndices(prev => [...prev, index]);
  }, []);

  const toggleSelection = useCallback((index) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }, []);

  const selectAll = useCallback((totalCount) => {
    setSelectedIndices(Array.from({ length: totalCount }, (_, i) => i));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIndices([]);
  }, []);

  const selectRange = useCallback((start, end) => {
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    setSelectedIndices(Array.from({ length: max - min + 1 }, (_, i) => min + i));
  }, []);

  const isSelected = useCallback((index) => {
    return selectedIndices.includes(index);
  }, [selectedIndices]);

  return {
    selectedIndices,
    selectNote,
    addToSelection,
    toggleSelection,
    selectAll,
    clearSelection,
    selectRange,
    isSelected,
    hasSelection: selectedIndices.length > 0
  };
};

