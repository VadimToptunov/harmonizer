import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Paper, Box, Typography, IconButton, Tooltip, Button, Menu, MenuItem, Chip, Select, FormControl, InputLabel } from '@mui/material';
import { 
  Undo, Redo, ContentCopy, ContentPaste, Restore, 
  ZoomIn, ZoomOut, PlayArrow, Pause, Stop,
  Add, Delete, SwapHoriz, MusicNote, VolumeUp, Autorenew
} from '@mui/icons-material';
import Vex from 'vexflow';
import { INSTRUMENTS, getInstrumentsByCategory } from './InstrumentSelector';
import NoteDurationButton from './NoteDurationButton';

/**
 * Advanced music editor with maximum functionality
 */
const AdvancedMusicEditor = ({
  staffId,
  clef = 'treble',
  keySignature = 'C',
  timeSignature = '4/4',
  notes = [],
  onNotesChange,
  readOnly = false,
  showLabels = true,
  staffLabel = '',
  measures = 1,
  tempo = 120
}) => {
  const containerRef = useRef(null);
  const [selectedNoteIndices, setSelectedNoteIndices] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragNoteIndex, setDragNoteIndex] = useState(null);
  
  // Note properties
  const [currentDuration, setCurrentDuration] = useState('q');
  const [currentAccidental, setCurrentAccidental] = useState(null);
  const [currentRest, setCurrentRest] = useState(false);
  const [currentTie, setCurrentTie] = useState(false);
  const [currentDot, setCurrentDot] = useState(false);
  const [currentTriplet, setCurrentTriplet] = useState(false);
  const [currentDynamic, setCurrentDynamic] = useState(null);
  const [currentArticulation, setCurrentArticulation] = useState(null);
  const [currentChord, setCurrentChord] = useState(false);
  const [chordNotes, setChordNotes] = useState([]);
  
  // Advanced features
  const [zoom, setZoom] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [respellMenuAnchor, setRespellMenuAnchor] = useState(null);
  
  // Undo/redo system
  const [history, setHistory] = useState([notes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState(null);
  
  // Selection and editing
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [transposeMenuAnchor, setTransposeMenuAnchor] = useState(null);

  // Update history when notes change externally
  useEffect(() => {
    if (notes !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(notes);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [notes]);

  const addToHistory = useCallback((newNotes) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNotes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    onNotesChange(newNotes);
  }, [history, historyIndex, onNotesChange]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onNotesChange(history[newIndex]);
    }
  }, [history, historyIndex, onNotesChange]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onNotesChange(history[newIndex]);
    }
  }, [history, historyIndex, onNotesChange]);

  const copyNotes = useCallback(() => {
    if (selectedNoteIndices.length > 0) {
      const copied = selectedNoteIndices.map(i => notes[i]);
      setClipboard(copied);
    } else if (selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      const copied = notes.slice(start, end + 1);
      setClipboard(copied);
    }
  }, [selectedNoteIndices, notes, selectionStart, selectionEnd]);

  const pasteNotes = useCallback(() => {
    if (clipboard && clipboard.length > 0) {
      const newNotes = [...notes, ...clipboard.map(n => ({ ...n }))];
      addToHistory(newNotes);
      setSelectedNoteIndices(
        Array.from({ length: clipboard.length }, (_, i) => notes.length + i)
      );
    }
  }, [clipboard, notes, addToHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedNoteIndices.length > 0) {
      const sortedIndices = [...selectedNoteIndices].sort((a, b) => b - a);
      const newNotes = notes.filter((_, i) => !sortedIndices.includes(i));
      addToHistory(newNotes);
      setSelectedNoteIndices([]);
    } else if (selectionStart !== null && selectionEnd !== null) {
      const start = Math.min(selectionStart, selectionEnd);
      const end = Math.max(selectionStart, selectionEnd);
      const newNotes = notes.filter((_, i) => i < start || i > end);
      addToHistory(newNotes);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [selectedNoteIndices, notes, selectionStart, selectionEnd, addToHistory]);

  const transposeNotes = useCallback((semitones) => {
    const indices = selectedNoteIndices.length > 0 
      ? selectedNoteIndices 
      : (selectionStart !== null && selectionEnd !== null
          ? Array.from({ length: selectionEnd - selectionStart + 1 }, (_, i) => selectionStart + i)
          : []);
    
    if (indices.length === 0) return;
    
    const newNotes = [...notes];
    indices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest && !newNotes[i].chord) {
        if (newNotes[i].midi) {
          const newMidi = Math.max(21, Math.min(108, newNotes[i].midi + semitones));
          newNotes[i] = { ...newNotes[i], midi: newMidi };
        } else if (newNotes[i].chord && newNotes[i].notes) {
          // Transpose chord
          newNotes[i] = {
            ...newNotes[i],
            notes: newNotes[i].notes.map(midi => 
              Math.max(21, Math.min(108, midi + semitones))
            )
          };
        }
      }
    });
    addToHistory(newNotes);
    setTransposeMenuAnchor(null);
  }, [selectedNoteIndices, notes, selectionStart, selectionEnd, addToHistory]);

  const respellNotes = useCallback((enharmonic) => {
    // Respell notes: change accidentals (e.g., C# -> Db)
    const indices = selectedNoteIndices.length > 0 
      ? selectedNoteIndices 
      : (selectionStart !== null && selectionEnd !== null
          ? Array.from({ length: selectionEnd - selectionStart + 1 }, (_, i) => selectionStart + i)
          : []);
    
    if (indices.length === 0) return;
    
    const newNotes = [...notes];
    indices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest && newNotes[i].midi) {
        const midi = newNotes[i].midi;
        const pitchClass = midi % 12;
        
        // Map pitch classes to enharmonic equivalents
        const enharmonicMap = {
          0: { sharp: null, flat: null }, // C
          1: { sharp: '#', flat: 'b' }, // C#/Db
          2: { sharp: null, flat: null }, // D
          3: { sharp: '#', flat: 'b' }, // D#/Eb
          4: { sharp: null, flat: null }, // E
          5: { sharp: null, flat: null }, // F
          6: { sharp: '#', flat: 'b' }, // F#/Gb
          7: { sharp: null, flat: null }, // G
          8: { sharp: '#', flat: 'b' }, // G#/Ab
          9: { sharp: null, flat: null }, // A
          10: { sharp: '#', flat: 'b' }, // A#/Bb
          11: { sharp: null, flat: null } // B
        };
        
        const currentAccidental = newNotes[i].accidental;
        const enharmonicOptions = enharmonicMap[pitchClass];
        
        if (enharmonic === 'sharp') {
          newNotes[i] = { ...newNotes[i], accidental: enharmonicOptions.sharp };
        } else if (enharmonic === 'flat') {
          newNotes[i] = { ...newNotes[i], accidental: enharmonicOptions.flat };
        } else if (enharmonic === 'natural') {
          newNotes[i] = { ...newNotes[i], accidental: null };
        }
      }
    });
    addToHistory(newNotes);
    setRespellMenuAnchor(null);
  }, [selectedNoteIndices, notes, selectionStart, selectionEnd, addToHistory]);

  const applyInstrument = useCallback((instrumentKey) => {
    const instrument = INSTRUMENTS[instrumentKey];
    if (!instrument) return;
    
    setSelectedInstrument(instrumentKey);
    
    // Update clef based on instrument
    // Note: This would need to be passed up to parent component
    // For now, we'll just store the instrument selection
    
    // Check if notes are within instrument range
    const outOfRange = notes.filter(note => {
      if (note.rest || note.chord) return false;
      const midi = note.midi || note;
      return midi < instrument.range.min || midi > instrument.range.max;
    });
    
    if (outOfRange.length > 0) {
      console.warn(`${outOfRange.length} notes are outside ${instrument.name} range (${instrument.range.min}-${instrument.range.max})`);
    }
  }, [notes]);

  const addChord = useCallback(() => {
    if (chordNotes.length > 0) {
      const chord = {
        chord: true,
        notes: [...chordNotes],
        duration: currentDuration,
        dot: currentDot,
        triplet: currentTriplet,
        dynamic: currentDynamic,
        articulation: currentArticulation
      };
      const newNotes = [...notes, chord];
      addToHistory(newNotes);
      setChordNotes([]);
      setCurrentChord(false);
    }
  }, [chordNotes, currentDuration, currentDot, currentTriplet, currentDynamic, currentArticulation, notes, addToHistory]);

  const addNoteToChord = useCallback((midi) => {
    setChordNotes([...chordNotes, midi]);
  }, [chordNotes]);

  // Duration mapping with dots and triplets
  const durationOptions = [
    { value: 'w', label: '𝅝', title: 'Whole note', beats: 4 },
    { value: 'h', label: '𝅗𝅥', title: 'Half note', beats: 2 },
    { value: 'q', label: '♩', title: 'Quarter note', beats: 1 },
    { value: '8', label: '♫', title: 'Eighth note', beats: 0.5 },
    { value: '16', label: '♬', title: 'Sixteenth note', beats: 0.25 },
    { value: '32', label: '𝅘𝅥𝅯', title: 'Thirty-second note', beats: 0.125 }
  ];

  const articulationOptions = [
    { value: 'staccato', label: 'Staccato', symbol: '•' },
    { value: 'tenuto', label: 'Tenuto', symbol: '—' },
    { value: 'accent', label: 'Accent', symbol: '>' },
    { value: 'marcato', label: 'Marcato', symbol: '^' },
    { value: 'fermata', label: 'Fermata', symbol: '𝄐' }
  ];

  const dynamicOptions = [
    { value: 'ppp', label: 'ppp' },
    { value: 'pp', label: 'pp' },
    { value: 'p', label: 'p' },
    { value: 'mp', label: 'mp' },
    { value: 'mf', label: 'mf' },
    { value: 'f', label: 'f' },
    { value: 'ff', label: 'ff' },
    { value: 'fff', label: 'fff' },
    { value: 'crescendo', label: 'Crescendo', symbol: '<' },
    { value: 'diminuendo', label: 'Diminuendo', symbol: '>' }
  ];

  useEffect(() => {
    if (containerRef.current) {
      renderStaff();
    }
  }, [notes, clef, keySignature, timeSignature, selectedNoteIndices, measures, zoom, showGrid]);

  const renderStaff = () => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Rest, StaveTie, Articulation, Dot } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);
    context.scale(zoom / 100, zoom / 100);

    const [beats, beatType] = timeSignature.split('/');
    const beatsPerMeasure = parseInt(beats);
    const staffWidth = 700 * (zoom / 100);
    const measureWidth = staffWidth / measures;

    // Render multiple measures
    for (let measure = 0; measure < measures; measure++) {
      const xPos = 10 + measure * measureWidth;
      const stave = new Stave(xPos, 40, measureWidth - 20);
      
      if (measure === 0) {
        if (clef === 'bass') {
          stave.addClef('bass');
        } else if (clef === 'alto') {
          stave.addClef('alto');
        } else if (clef === 'tenor') {
          stave.addClef('tenor');
        } else {
          stave.addClef('treble');
        }

        stave.addTimeSignature(`${beats}/${beatType}`);

        if (keySignature !== 'C') {
          const keyToFifths = {
            'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6
          };
          const fifths = keyToFifths[keySignature];
          
          if (fifths !== undefined) {
            stave.addKeySignature(fifths);
          } else {
            try {
              stave.addKeySignature(keySignature);
            } catch (e) {
              console.warn(`Could not add key signature: ${keySignature}`);
            }
          }
        }
      }

      stave.setContext(context).draw();

      // Draw grid if enabled
      if (showGrid && measure === 0) {
        context.setStrokeStyle('#e0e0e0');
        context.setLineWidth(0.5);
        for (let i = 0; i <= beatsPerMeasure * 4; i++) {
          const x = xPos + (i * (measureWidth / (beatsPerMeasure * 4)));
          context.beginPath();
          context.moveTo(x, 40);
          context.lineTo(x, 40 + 60);
          context.stroke();
        }
      }

      // Get notes for this measure
      const notesPerMeasure = Math.ceil(notes.length / measures);
      const measureStart = measure * notesPerMeasure;
      const measureEnd = Math.min((measure + 1) * notesPerMeasure, notes.length);
      const measureNotes = notes.slice(measureStart, measureEnd);

      if (measureNotes.length > 0) {
        const durationToBeats = (duration) => {
          const durationMap = {
            'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125
          };
          return durationMap[duration] || 1;
        };

        const staveNotes = measureNotes.map((note, localIndex) => {
          const globalIndex = measureStart + localIndex;
          const noteDuration = note.duration || currentDuration;
          const isSelected = selectedNoteIndices.includes(globalIndex);
          
          // Handle chord
          if (note.chord && note.notes) {
            const chordKeys = note.notes.map(midi => midiToVexFlowNote(midi));
            const staveNote = new StaveNote({
              clef: clef,
              keys: chordKeys,
              duration: noteDuration
            });

            if (note.dot) {
              staveNote.addDot(0);
            }

            if (note.articulation) {
              staveNote.addArticulation(0, new Articulation(note.articulation));
            }

            if (isSelected && !readOnly) {
              staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
            }

            return staveNote;
          }
          
          // Handle rest
          if (note.rest) {
            const rest = new Rest({
              duration: noteDuration
            });
            if (note.dot) {
              rest.addDot(0);
            }
            return rest;
          }

          // Regular note
          const noteName = midiToVexFlowNote(note.midi || note);
          const staveNote = new StaveNote({
            clef: clef,
            keys: [noteName],
            duration: noteDuration
          });

          if (note.accidental) {
            staveNote.addAccidental(0, new Accidental(note.accidental));
          }

          if (note.dot || currentDot) {
            staveNote.addDot(0);
          }

          if (note.tie || currentTie) {
            staveNote.addTie(0);
          }

          if (note.articulation || currentArticulation) {
            staveNote.addArticulation(0, new Articulation(note.articulation || currentArticulation));
          }

          if (isSelected && !readOnly) {
            staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
          }

          return staveNote;
        });

        const totalBeats = measureNotes.reduce((sum, note) => {
          const duration = note.duration || currentDuration;
          let beats = durationToBeats(duration);
          if (note.dot) beats *= 1.5;
          if (note.triplet) beats *= (2/3);
          return sum + beats;
        }, 0);

        const voiceBeats = totalBeats > 0 ? totalBeats : beatsPerMeasure;
        
        const voice = new Voice({ 
          num_beats: voiceBeats, 
          beat_value: parseInt(beatType) 
        });
        voice.addTickables(staveNotes);
        
        try {
          new Formatter().joinVoices([voice]).format([voice], measureWidth - 60);
          voice.draw(context, stave);
        } catch (e) {
          console.warn('Error formatting voice:', e);
        }

        // Add dynamics
        measureNotes.forEach((note, localIndex) => {
          if (note.dynamic) {
            context.setFont('Arial', 12, 'bold');
            context.fillStyle = '#000000';
            const globalIndex = measureStart + localIndex;
            const noteX = xPos + (localIndex * (measureWidth / measureNotes.length));
            context.fillText(note.dynamic, noteX, stave.getYForLine(8));
          }
        });
      }
    }

    // Add click and drag handlers
    if (!readOnly) {
      const svg = container.querySelector('svg');
      if (svg) {
        svg.style.cursor = 'pointer';
        svg.addEventListener('click', handleStaffClick);
        svg.addEventListener('mousedown', handleMouseDown);
        svg.addEventListener('mousemove', handleMouseMove);
        svg.addEventListener('mouseup', handleMouseUp);
      }
    }

    renderer.resize(720 * (zoom / 100), 150 * (zoom / 100));
  };

  const handleStaffClick = (event) => {
    if (readOnly || isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const midi = yToMidi(y, clef);
    if (midi !== null) {
      if (currentChord) {
        addNoteToChord(midi);
      } else {
        const newNote = {
          midi,
          duration: currentDuration,
          accidental: currentAccidental,
          rest: currentRest,
          tie: currentTie,
          dot: currentDot,
          triplet: currentTriplet,
          dynamic: currentDynamic,
          articulation: currentArticulation
        };
        
        const newNotes = [...notes, newNote];
        addToHistory(newNotes);
        setSelectedNoteIndices([newNotes.length - 1]);
      }
    }
  };

  const handleMouseDown = (event) => {
    if (readOnly) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    const clickedIndex = findNoteAtY(y);
    if (clickedIndex !== null) {
      if (event.shiftKey) {
        // Multi-select
        setSelectedNoteIndices([...selectedNoteIndices, clickedIndex]);
      } else {
        setIsDragging(true);
        setDragNoteIndex(clickedIndex);
        setDragStartY(y);
        setSelectedNoteIndices([clickedIndex]);
      }
    }
  };

  const handleMouseMove = (event) => {
    if (!isDragging || dragNoteIndex === null || readOnly) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const deltaY = y - dragStartY;

    const semitones = Math.round(deltaY / 5);
    if (semitones !== 0) {
      const newNotes = [...notes];
      const note = newNotes[dragNoteIndex];
      if (note && !note.rest && !note.chord && note.midi) {
        const newMidi = Math.max(21, Math.min(108, note.midi + semitones));
        newNotes[dragNoteIndex] = { ...note, midi: newMidi };
        addToHistory(newNotes);
        setDragStartY(y);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNoteIndex(null);
  };

  const findNoteAtY = (y) => {
    // Simplified - would need proper note position tracking
    return null;
  };

  const yToMidi = (y, clef) => {
    const staffTop = 40;
    const lineSpacing = 10;
    const relativeY = (y - staffTop) / (zoom / 100);
    const lineNumber = Math.round(relativeY / (lineSpacing / 2));
    
    let midi;
    if (clef === 'bass') {
      midi = 48 + (lineNumber - 0) * 0.5;
    } else {
      midi = 64 + (lineNumber - 0) * 0.5;
    }
    
    return Math.max(21, Math.min(108, Math.round(midi)));
  };

  const midiToVexFlowNote = (midi) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  };

  const playNotes = useCallback(() => {
    if (!notes || notes.length === 0) return;
    
    setIsPlaying(true);
    // Playback implementation would go here
    // Using Web Audio API similar to PlaybackController
  }, [notes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (readOnly) return;
      
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'c') {
          e.preventDefault();
          copyNotes();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteNotes();
        } else if (e.key === 'x') {
          e.preventDefault();
          copyNotes();
          deleteSelected();
        } else if (e.key === 'a') {
          e.preventDefault();
          setSelectedNoteIndices(notes.map((_, i) => i));
        }
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key === 'q' || e.key === 'Q') {
        setCurrentDuration('q');
      } else if (e.key === 'h' || e.key === 'H') {
        setCurrentDuration('h');
      } else if (e.key === 'w' || e.key === 'W') {
        setCurrentDuration('w');
      } else if (e.key === '8') {
        setCurrentDuration('8');
      } else if (e.key === 'r' || e.key === 'R') {
        setCurrentRest(!currentRest);
      } else if (e.key === 't' || e.key === 'T') {
        setCurrentTie(!currentTie);
      } else if (e.key === 'd' || e.key === 'D') {
        setCurrentDot(!currentDot);
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isPlaying) {
          setIsPlaying(false);
        } else {
          playNotes();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNoteIndices, readOnly, undo, redo, copyNotes, pasteNotes, deleteSelected, notes, currentRest, currentTie, currentDot, isPlaying, playNotes]);

  return (
    <Box sx={{ mb: 2 }}>
      {showLabels && staffLabel && (
        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold' }}>
          {staffLabel}
        </Typography>
      )}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 1, 
          backgroundColor: readOnly ? 'grey.50' : 'white',
          border: selectedNoteIndices.length > 0 && !readOnly ? '2px solid #4CAF50' : '1px solid #e0e0e0'
        }}
      >
        {/* Advanced Toolbar */}
        {!readOnly && (
          <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            {/* Undo/Redo */}
            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton size="small" onClick={undo} disabled={historyIndex === 0}>
                <Undo fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Shift+Z)">
              <IconButton size="small" onClick={redo} disabled={historyIndex === history.length - 1}>
                <Redo fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Copy/Paste/Cut */}
            <Tooltip title="Copy (Ctrl+C)">
              <IconButton size="small" onClick={copyNotes} disabled={selectedNoteIndices.length === 0 && selectionStart === null}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Paste (Ctrl+V)">
              <IconButton size="small" onClick={pasteNotes} disabled={!clipboard}>
                <ContentPaste fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cut (Ctrl+X)">
              <IconButton size="small" onClick={() => { copyNotes(); deleteSelected(); }} disabled={selectedNoteIndices.length === 0}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Instrument Selector */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Instrument</InputLabel>
              <Select
                value={selectedInstrument || ''}
                onChange={(e) => applyInstrument(e.target.value)}
                label="Instrument"
              >
                {Object.entries(getInstrumentsByCategory()).flatMap(([category, keys]) => [
                  <MenuItem key={`cat-${category}`} disabled>
                    <Typography variant="overline" sx={{ fontWeight: 'bold' }}>{category}</Typography>
                  </MenuItem>,
                  ...keys.map(key => {
                    const inst = INSTRUMENTS[key];
                    return (
                      <MenuItem key={key} value={key}>
                        {inst.name} ({inst.range.min}-{inst.range.max})
                        {inst.transposition !== 0 && ` [${inst.transposition > 0 ? '+' : ''}${inst.transposition}]`}
                      </MenuItem>
                    );
                  })
                ])}
              </Select>
            </FormControl>

            {/* Transpose */}
            <Button
              size="small"
              startIcon={<SwapHoriz />}
              onClick={(e) => setTransposeMenuAnchor(e.currentTarget)}
              disabled={selectedNoteIndices.length === 0 && selectionStart === null}
            >
              Transpose
            </Button>
            <Menu
              anchorEl={transposeMenuAnchor}
              open={Boolean(transposeMenuAnchor)}
              onClose={() => setTransposeMenuAnchor(null)}
            >
              <MenuItem onClick={() => transposeNotes(1)}>Up semitone (+1)</MenuItem>
              <MenuItem onClick={() => transposeNotes(-1)}>Down semitone (-1)</MenuItem>
              <MenuItem onClick={() => transposeNotes(2)}>Up whole tone (+2)</MenuItem>
              <MenuItem onClick={() => transposeNotes(-2)}>Down whole tone (-2)</MenuItem>
              <MenuItem onClick={() => transposeNotes(12)}>Up octave (+12)</MenuItem>
              <MenuItem onClick={() => transposeNotes(-12)}>Down octave (-12)</MenuItem>
              <MenuItem onClick={() => transposeNotes(7)}>Up perfect fifth (+7)</MenuItem>
              <MenuItem onClick={() => transposeNotes(-7)}>Down perfect fifth (-7)</MenuItem>
            </Menu>

            {/* Respell */}
            <Button
              size="small"
              startIcon={<Autorenew />}
              onClick={(e) => setRespellMenuAnchor(e.currentTarget)}
              disabled={selectedNoteIndices.length === 0 && selectionStart === null}
            >
              Respell
            </Button>
            <Menu
              anchorEl={respellMenuAnchor}
              open={Boolean(respellMenuAnchor)}
              onClose={() => setRespellMenuAnchor(null)}
            >
              <MenuItem onClick={() => respellNotes('sharp')}>Use sharps (#)</MenuItem>
              <MenuItem onClick={() => respellNotes('flat')}>Use flats (b)</MenuItem>
              <MenuItem onClick={() => respellNotes('natural')}>Remove accidentals</MenuItem>
            </Menu>

            {/* Zoom */}
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={() => setZoom(Math.min(zoom + 10, 200))}>
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>
            <Typography variant="caption">{zoom}%</Typography>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={() => setZoom(Math.max(zoom - 10, 50))}>
                <ZoomOut fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Playback */}
            <Tooltip title="Play (Space)">
              <IconButton size="small" onClick={playNotes} disabled={notes.length === 0}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Stop">
              <IconButton size="small" onClick={() => setIsPlaying(false)} disabled={!isPlaying}>
                <Stop fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Grid */}
            <Chip
              label="Grid"
              size="small"
              onClick={() => setShowGrid(!showGrid)}
              color={showGrid ? 'primary' : 'default'}
            />
            <Chip
              label="Snap"
              size="small"
              onClick={() => setSnapToGrid(!snapToGrid)}
              color={snapToGrid ? 'primary' : 'default'}
            />
          </Box>
        )}

        {/* Note Properties Toolbar */}
        {!readOnly && (
          <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
            {/* Durations */}
            <Typography variant="caption">Duration:</Typography>
            {durationOptions.map(({ value, title }) => (
              <NoteDurationButton
                key={value}
                duration={value}
                isSelected={currentDuration === value}
                onClick={() => setCurrentDuration(value)}
                title={title}
              />
            ))}

            {/* Dot */}
            <Chip
              label="•"
              size="small"
              onClick={() => setCurrentDot(!currentDot)}
              color={currentDot ? 'primary' : 'default'}
              sx={{ fontSize: '20px' }}
            />

            {/* Triplet */}
            <Chip
              label="3"
              size="small"
              onClick={() => setCurrentTriplet(!currentTriplet)}
              color={currentTriplet ? 'primary' : 'default'}
            />

            {/* Accidentals */}
            <Typography variant="caption" sx={{ ml: 1 }}>Accidental:</Typography>
            {[null, '#', 'b', 'n'].map(acc => (
              <button
                key={acc || 'nat'}
                onClick={() => setCurrentAccidental(acc)}
                style={{
                  padding: '4px 8px',
                  border: currentAccidental === acc ? '2px solid #1976d2' : '1px solid #ccc',
                  backgroundColor: currentAccidental === acc ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                {acc || '♮'}
              </button>
            ))}

            {/* Rest/Tie */}
            <Chip
              label="Rest"
              size="small"
              onClick={() => setCurrentRest(!currentRest)}
              color={currentRest ? 'primary' : 'default'}
            />
            <Chip
              label="Tie"
              size="small"
              onClick={() => setCurrentTie(!currentTie)}
              color={currentTie ? 'primary' : 'default'}
            />

            {/* Chord Mode */}
            <Chip
              label="Chord"
              size="small"
              icon={<MusicNote />}
              onClick={() => {
                setCurrentChord(!currentChord);
                if (!currentChord) {
                  setChordNotes([]);
                } else if (chordNotes.length > 0) {
                  addChord();
                }
              }}
              color={currentChord ? 'primary' : 'default'}
            />
            {currentChord && chordNotes.length > 0 && (
              <Typography variant="caption">
                {chordNotes.length} note{chordNotes.length > 1 ? 's' : ''}
              </Typography>
            )}

            {/* Dynamics */}
            <Typography variant="caption" sx={{ ml: 1 }}>Dynamic:</Typography>
            <select
              value={currentDynamic || ''}
              onChange={(e) => setCurrentDynamic(e.target.value || null)}
              style={{ padding: '4px', fontSize: '11px' }}
            >
              <option value="">None</option>
              {dynamicOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Articulations */}
            <Typography variant="caption" sx={{ ml: 1 }}>Articulation:</Typography>
            <select
              value={currentArticulation || ''}
              onChange={(e) => setCurrentArticulation(e.target.value || null)}
              style={{ padding: '4px', fontSize: '11px' }}
            >
              <option value="">None</option>
              {articulationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Box>
        )}
        
        <div ref={containerRef} style={{ width: '100%', overflow: 'auto' }} />
      </Paper>
    </Box>
  );
};

export default AdvancedMusicEditor;

