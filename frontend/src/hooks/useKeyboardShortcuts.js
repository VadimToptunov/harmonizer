import { useEffect } from 'react';

/**
 * Custom hook for managing keyboard shortcuts in the music editor
 * Sibelius-style keyboard navigation
 */
export const useKeyboardShortcuts = ({
  // Editing
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  
  // Note input
  onNoteInput,
  onDurationChange,
  onAccidentalChange,
  onRestToggle,
  onTieToggle,
  onDotToggle,
  onToggleNoteInputMode,
  
  // State
  isNoteInputActive,
  readOnly = false,
  enabled = true,
}) => {
  useEffect(() => {
    if (!enabled || readOnly) return;

    const handleKeyPress = (e) => {
      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              onRedo?.();
            } else {
              onUndo?.();
            }
            break;
          case 'c':
            e.preventDefault();
            onCopy?.();
            break;
          case 'v':
            e.preventDefault();
            onPaste?.();
            break;
          case 'a':
            e.preventDefault();
            onSelectAll?.();
            break;
          default:
            break;
        }
        return;
      }

      // Sibelius-style QWERTY note input (when note input is active)
      if (isNoteInputActive || e.key === 'n' || e.key === 'N') {
        const qwertyToNote = {
          'a': 60, 'A': 60, // C4
          's': 62, 'S': 62, // D4
          'd': 64, 'D': 64, // E4
          'f': 65, 'F': 65, // F4
          'g': 67, 'G': 67, // G4
          'h': 69, 'H': 69, // A4
          'j': 71, 'J': 71, // B4
          'w': 61, 'W': 61, // C#4
          'e': 63, 'E': 63, // D#4
          't': 66, 'T': 66, // F#4
          'y': 68, 'Y': 68, // G#4
          'u': 70, 'U': 70, // A#4
        };

        if (e.key === 'n' || e.key === 'N') {
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            onToggleNoteInputMode?.();
            return;
          }
        }

        if (isNoteInputActive && qwertyToNote[e.key] !== undefined) {
          e.preventDefault();
          let midi = qwertyToNote[e.key];
          
          // Octave modifiers
          if (e.shiftKey) midi += 12; // Octave up
          if (e.altKey) midi -= 12; // Octave down
          
          onNoteInput?.(midi);
          return;
        }
      }

      // Duration shortcuts (1-6)
      if (e.key >= '1' && e.key <= '6') {
        const durationMap = { '1': 'w', '2': 'h', '3': 'q', '4': '8', '5': '16', '6': '32' };
        onDurationChange?.(durationMap[e.key]);
        return;
      }

      // Accidental shortcuts
      if (e.key === '#') {
        e.preventDefault();
        onAccidentalChange?.('#');
        return;
      }
      if (e.key === 'b' && !isNoteInputActive) {
        e.preventDefault();
        onAccidentalChange?.('b');
        return;
      }

      // Rest shortcut
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRestToggle?.();
        return;
      }

      // Tie shortcut
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        onTieToggle?.();
        return;
      }

      // Dot shortcut
      if (e.key === '.') {
        e.preventDefault();
        onDotToggle?.();
        return;
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Escape - clear/cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onAccidentalChange?.(null);
        if (isNoteInputActive) {
          onToggleNoteInputMode?.();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [
    enabled,
    readOnly,
    isNoteInputActive,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDelete,
    onSelectAll,
    onNoteInput,
    onDurationChange,
    onAccidentalChange,
    onRestToggle,
    onTieToggle,
    onDotToggle,
    onToggleNoteInputMode,
  ]);
};

