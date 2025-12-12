import { useState, useCallback } from 'react';

/**
 * Custom hook for note input state management
 * Handles duration, accidental, articulation, etc.
 */
export const useNoteInput = () => {
  const [duration, setDuration] = useState('q'); // quarter note
  const [accidental, setAccidental] = useState(null);
  const [rest, setRest] = useState(false);
  const [dot, setDot] = useState(false);
  const [tie, setTie] = useState(false);
  const [tuplet, setTuplet] = useState(null);
  const [dynamic, setDynamic] = useState(null);
  const [articulation, setArticulation] = useState(null);
  const [ornament, setOrnament] = useState(null);
  const [inputMode, setInputMode] = useState('selection'); // 'selection', 'note', 'chord'
  const [chordNotes, setChordNotes] = useState([]);

  const createNote = useCallback((midi) => {
    return {
      midi,
      duration,
      accidental,
      rest,
      dot,
      tie,
      tuplet,
      dynamic,
      articulation,
      ornament
    };
  }, [duration, accidental, rest, dot, tie, tuplet, dynamic, articulation, ornament]);

  const createChord = useCallback((midiNotes) => {
    return {
      chord: true,
      notes: midiNotes,
      duration,
      dot,
      tuplet,
      dynamic,
      articulation
    };
  }, [duration, dot, tuplet, dynamic, articulation]);

  const reset = useCallback(() => {
    setAccidental(null);
    setRest(false);
    setDot(false);
    setTie(false);
    setTuplet(null);
    setDynamic(null);
    setArticulation(null);
    setOrnament(null);
    setChordNotes([]);
  }, []);

  const toggleChordMode = useCallback(() => {
    setInputMode(prev => prev === 'chord' ? 'selection' : 'chord');
    setChordNotes([]);
  }, []);

  return {
    // State
    duration,
    accidental,
    rest,
    dot,
    tie,
    tuplet,
    dynamic,
    articulation,
    ornament,
    inputMode,
    chordNotes,
    
    // Setters
    setDuration,
    setAccidental,
    setRest,
    setDot,
    setTie,
    setTuplet,
    setDynamic,
    setArticulation,
    setOrnament,
    setInputMode,
    setChordNotes,
    
    // Helpers
    createNote,
    createChord,
    reset,
    toggleChordMode,
    isChordMode: inputMode === 'chord',
    isNoteInputMode: inputMode === 'note'
  };
};

