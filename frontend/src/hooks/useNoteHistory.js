import { useState, useCallback } from 'react';

/**
 * Custom hook for managing undo/redo history for notes
 * Optimized with proper state management
 */
export const useNoteHistory = (initialNotes = []) => {
  const [history, setHistory] = useState([initialNotes]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const currentNotes = history[historyIndex];

  const addToHistory = useCallback((newNotes) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newNotes);
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
    }
  }, [historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
    }
  }, [historyIndex, history.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const reset = useCallback((notes) => {
    setHistory([notes]);
    setHistoryIndex(0);
  }, []);

  return {
    currentNotes,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset
  };
};

