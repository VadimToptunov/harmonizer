import { useState, useCallback } from 'react';

/**
 * Custom hook for clipboard operations (copy/paste notes)
 */
export const useClipboard = () => {
  const [clipboard, setClipboard] = useState(null);

  const copy = useCallback((notes) => {
    if (!notes || notes.length === 0) return false;
    
    const copied = notes.map(note => ({ ...note }));
    setClipboard({ notes: copied, timestamp: Date.now() });
    return true;
  }, []);

  const paste = useCallback((transform = null) => {
    if (!clipboard || !clipboard.notes) return null;
    
    let pastedNotes = clipboard.notes.map(note => ({ ...note }));
    
    // Apply transformation if provided (e.g., transposition)
    if (transform && typeof transform === 'function') {
      pastedNotes = pastedNotes.map(transform);
    }
    
    return pastedNotes;
  }, [clipboard]);

  const hasContent = clipboard !== null && clipboard.notes && clipboard.notes.length > 0;

  const clear = useCallback(() => {
    setClipboard(null);
  }, []);

  return {
    copy,
    paste,
    hasContent,
    clear,
    clipboardSize: clipboard?.notes?.length || 0
  };
};

