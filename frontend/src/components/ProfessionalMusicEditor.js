import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paper, Box, Typography, IconButton, Tooltip, Button, Menu, MenuItem, Chip,
  Select, FormControl, InputLabel, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Tabs, Tab, Divider, Slider, Switch, FormControlLabel, Checkbox
} from '@mui/material';
import {
  Undo, Redo, ContentCopy, ContentPaste, Delete, SwapHoriz, MusicNote,
  ZoomIn, ZoomOut, PlayArrow, Pause, Stop, Settings, Add, Remove,
  FormatAlignLeft, FormatAlignCenter, FormatAlignRight, AutoFixHigh,
  Layers, FilterList, Search, MoreVert, Keyboard, GridOn, GridOff
} from '@mui/icons-material';
import Vex from 'vexflow';
import { INSTRUMENTS, getInstrumentsByCategory } from './InstrumentSelector';
import NoteDurationButton from './NoteDurationButton';
import KeySignatureSelector from './KeySignatureSelector';

/**
 * Professional music editor with maximum functionality
 */
const ProfessionalMusicEditor = ({
  staffId,
  clef = 'treble',
  keySignature = 'C',
  timeSignature = '4/4',
  notes = [],
  onNotesChange,
  onKeySignatureChange,
  readOnly = false,
  showLabels = true,
  staffLabel = '',
  measures = 1,
  tempo = 120,
  instrument = null
}) => {
  const containerRef = useRef(null);
  
  // Selection
  const [selectedNoteIndices, setSelectedNoteIndices] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Editing
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragNoteIndex, setDragNoteIndex] = useState(null);
  const [currentDuration, setCurrentDuration] = useState('q');
  const [currentAccidental, setCurrentAccidental] = useState(null);
  const [currentRest, setCurrentRest] = useState(false);
  const [currentTie, setCurrentTie] = useState(false);
  const [currentDot, setCurrentDot] = useState(false);
  const [currentTriplet, setCurrentTriplet] = useState(false);
  const [currentTuplet, setCurrentTuplet] = useState(null); // {type: 3, num: 2} for triplet
  const [currentDynamic, setCurrentDynamic] = useState(null);
  const [currentArticulation, setCurrentArticulation] = useState(null);
  const [currentOrnament, setCurrentOrnament] = useState(null);
  const [currentChord, setCurrentChord] = useState(false);
  const [chordNotes, setChordNotes] = useState([]);
  const [currentVoice, setCurrentVoice] = useState(1); // Multiple voices per staff
  
  // Advanced features
  const [zoom, setZoom] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [autoBeam, setAutoBeam] = useState(true);
  const [autoAccidentals, setAutoAccidentals] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(instrument);
  
  // Undo/redo
  const [history, setHistory] = useState([notes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState(null);
  
  // Menus
  const [transposeMenuAnchor, setTransposeMenuAnchor] = useState(null);
  const [respellMenuAnchor, setRespellMenuAnchor] = useState(null);
  const [tupletMenuAnchor, setTupletMenuAnchor] = useState(null);
  const [ornamentMenuAnchor, setOrnamentMenuAnchor] = useState(null);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  
  // Dialogs
  const [tupletDialogOpen, setTupletDialogOpen] = useState(false);
  const [customTuplet, setCustomTuplet] = useState({ num: 3, den: 2 });

  // Update history
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

  // Advanced selection
  const selectAll = useCallback(() => {
    setSelectedNoteIndices(notes.map((_, i) => i));
  }, [notes]);

  const selectNone = useCallback(() => {
    setSelectedNoteIndices([]);
  }, []);

  const selectByFilter = useCallback((filterFn) => {
    const indices = notes.map((note, i) => ({ note, i }))
      .filter(({ note }) => filterFn(note))
      .map(({ i }) => i);
    setSelectedNoteIndices(indices);
  }, [notes]);

  // Copy/Paste with advanced options
  const copyNotes = useCallback((withTransposition = false) => {
    if (selectedNoteIndices.length > 0) {
      const copied = selectedNoteIndices.map(i => ({ ...notes[i] }));
      setClipboard({ notes: copied, transposition: withTransposition ? 0 : null });
    }
  }, [selectedNoteIndices, notes]);

  const pasteNotes = useCallback((transposeBy = 0) => {
    if (clipboard && clipboard.notes && clipboard.notes.length > 0) {
      const newNotes = [...notes];
      clipboard.notes.forEach(copiedNote => {
        const newNote = { ...copiedNote };
        if (transposeBy !== 0 && newNote.midi) {
          newNote.midi = Math.max(21, Math.min(108, newNote.midi + transposeBy));
        }
        newNotes.push(newNote);
      });
      addToHistory(newNotes);
      setSelectedNoteIndices(
        Array.from({ length: clipboard.notes.length }, (_, i) => notes.length + i)
      );
    }
  }, [clipboard, notes, addToHistory]);

  // Advanced transpose
  const transposeNotes = useCallback((semitones, selectedOnly = true) => {
    const indices = selectedOnly && selectedNoteIndices.length > 0
      ? selectedNoteIndices
      : notes.map((_, i) => i);
    
    if (indices.length === 0) return;
    
    const newNotes = [...notes];
    indices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest) {
        if (newNotes[i].chord && newNotes[i].notes) {
          newNotes[i] = {
            ...newNotes[i],
            notes: newNotes[i].notes.map(midi =>
              Math.max(21, Math.min(108, midi + semitones))
            )
          };
        } else if (newNotes[i].midi) {
          const newMidi = Math.max(21, Math.min(108, newNotes[i].midi + semitones));
          newNotes[i] = { ...newNotes[i], midi: newMidi };
        }
      }
    });
    addToHistory(newNotes);
    setTransposeMenuAnchor(null);
  }, [selectedNoteIndices, notes, addToHistory]);

  // Respell with enharmonic equivalents
  const respellNotes = useCallback((enharmonic) => {
    if (selectedNoteIndices.length === 0) return;
    
    const newNotes = [...notes];
    selectedNoteIndices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest && newNotes[i].midi) {
        const midi = newNotes[i].midi;
        const pitchClass = midi % 12;
        
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
        
        const options = enharmonicMap[pitchClass];
        if (enharmonic === 'sharp' && options.sharp !== null) {
          newNotes[i] = { ...newNotes[i], accidental: options.sharp };
        } else if (enharmonic === 'flat' && options.flat !== null) {
          newNotes[i] = { ...newNotes[i], accidental: options.flat };
        } else if (enharmonic === 'natural') {
          newNotes[i] = { ...newNotes[i], accidental: null };
        }
      }
    });
    addToHistory(newNotes);
    setRespellMenuAnchor(null);
  }, [selectedNoteIndices, notes, addToHistory]);

  // Tuplet creation
  const createTuplet = useCallback((num, den) => {
    if (selectedNoteIndices.length === 0) return;
    
    const newNotes = [...notes];
    selectedNoteIndices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest) {
        newNotes[i] = {
          ...newNotes[i],
          tuplet: { num, den },
          duration: newNotes[i].duration || currentDuration
        };
      }
    });
    addToHistory(newNotes);
    setTupletDialogOpen(false);
  }, [selectedNoteIndices, notes, currentDuration, addToHistory]);

  // Ornaments
  const addOrnament = useCallback((ornamentType) => {
    if (selectedNoteIndices.length === 0) return;
    
    const newNotes = [...notes];
    selectedNoteIndices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest) {
        newNotes[i] = { ...newNotes[i], ornament: ornamentType };
      }
    });
    addToHistory(newNotes);
    setOrnamentMenuAnchor(null);
  }, [selectedNoteIndices, notes, addToHistory]);

  // Auto-beam grouping
  const groupNotesForBeaming = useCallback((measureNotes) => {
    if (!autoBeam) return [];
    
    const beamGroups = [];
    let currentGroup = [];
    
    measureNotes.forEach((note, idx) => {
      const duration = note.duration || currentDuration;
      const shouldBeam = (duration === '8' || duration === '16' || duration === '32') && !note.rest;
      
      if (shouldBeam) {
        currentGroup.push(idx);
      } else {
        if (currentGroup.length > 1) {
          beamGroups.push([...currentGroup]);
        }
        currentGroup = [];
      }
    });
    
    if (currentGroup.length > 1) {
      beamGroups.push(currentGroup);
    }
    
    return beamGroups;
  }, [autoBeam, currentDuration]);

  // Auto-accidentals based on key signature
  const getAutoAccidental = useCallback((midi, keySig) => {
    if (!autoAccidentals) return null;
    
    const pitchClass = midi % 12;
    const keyFifths = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6,
      'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6
    }[keySig] || 0;
    
    // Determine if note needs accidental based on key signature
    // This is simplified - full implementation would check previous notes in measure
    return null; // Let VexFlow handle it
  }, [autoAccidentals]);

  // Duration options with tuplets
  const durationOptions = [
    { value: 'w', label: '𝅝', title: 'Whole note (4 beats)', beats: 4 },
    { value: 'h', label: '𝅗𝅥', title: 'Half note (2 beats)', beats: 2 },
    { value: 'q', label: '♩', title: 'Quarter note (1 beat)', beats: 1 },
    { value: '8', label: '♫', title: 'Eighth note (1/2 beat)', beats: 0.5 },
    { value: '16', label: '♬', title: 'Sixteenth note (1/4 beat)', beats: 0.25 },
    { value: '32', label: '𝅘𝅥𝅯', title: 'Thirty-second note (1/8 beat)', beats: 0.125 }
  ];

  const articulationOptions = [
    { value: 'staccato', label: 'Staccato', symbol: '•' },
    { value: 'tenuto', label: 'Tenuto', symbol: '—' },
    { value: 'accent', label: 'Accent', symbol: '>' },
    { value: 'marcato', label: 'Marcato', symbol: '^' },
    { value: 'fermata', label: 'Fermata', symbol: '𝄐' },
    { value: 'staccatissimo', label: 'Staccatissimo', symbol: '▼' }
  ];

  const ornamentOptions = [
    { value: 'trill', label: 'Trill', symbol: 'tr' },
    { value: 'mordent', label: 'Mordent', symbol: '𝆖' },
    { value: 'turn', label: 'Turn', symbol: '𝆗' },
    { value: 'appoggiatura', label: 'Appoggiatura', symbol: '𝆘' },
    { value: 'acciaccatura', label: 'Acciaccatura', symbol: '𝆙' }
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

  const midiToVexFlowNote = useCallback((midi) => {
    if (typeof midi !== 'number' || isNaN(midi)) return 'C/4';
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  }, []);

  const yToMidi = useCallback((y, clef) => {
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
  }, [zoom]);

  // Render staff with all advanced features
  useEffect(() => {
    if (containerRef.current && measures > 0) {
      renderStaff();
    }
  }, [notes, clef, keySignature, timeSignature, selectedNoteIndices, measures, zoom, showGrid, autoBeam, currentDuration, currentDot, currentTie, currentArticulation, readOnly, groupNotesForBeaming, getAutoAccidental, midiToVexFlowNote]);

  const renderStaff = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Rest, Beam, Articulation, Dot, Tuplet } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);
    context.scale(zoom / 100, zoom / 100);

    const [beats, beatType] = timeSignature.split('/');
    const beatsPerMeasure = parseInt(beats, 10) || 4;
    const beatTypeNum = parseInt(beatType, 10) || 4;
    const staffWidth = 700 * (zoom / 100);
    const measureWidth = measures > 0 ? staffWidth / measures : staffWidth;

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

      // Draw grid
      if (showGrid) {
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
        const durationToBeats = (duration, tuplet = null) => {
          const durationMap = {
            'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125
          };
          let beats = durationMap[duration] || 1;
          if (tuplet) {
            beats = beats * (tuplet.den / tuplet.num);
          }
          return beats;
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

            if (note.dot || currentDot) {
              staveNote.addDot(0);
            }

            if (note.tuplet) {
              const tuplet = new Tuplet([staveNote], { num_notes: note.tuplet.num, beats_occupied: note.tuplet.den });
              // Tuplet handling would go here
            }

            if (note.articulation || currentArticulation) {
              staveNote.addArticulation(0, new Articulation(note.articulation || currentArticulation));
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
            if (note.dot || currentDot) {
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

          // Auto-accidental or manual
          const accidental = note.accidental || getAutoAccidental(note.midi, keySignature);
          if (accidental) {
            staveNote.addAccidental(0, new Accidental(accidental));
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

          if (note.ornament) {
            // Ornament rendering would go here
            // VexFlow doesn't have built-in ornaments, so we'd need custom rendering
          }

          if (isSelected && !readOnly) {
            staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
          }

          return staveNote;
        });

        // Auto-beam grouping
        const beamGroups = groupNotesForBeaming(measureNotes);
        const beamNoteObjects = beamGroups.map(group =>
          group.map(idx => staveNotes[idx]).filter(n => n)
        );

        const totalBeats = measureNotes.reduce((sum, note) => {
          const duration = note.duration || currentDuration;
          return sum + durationToBeats(duration, note.tuplet);
        }, 0);

        const voiceBeats = totalBeats > 0 ? totalBeats : beatsPerMeasure;
        
        const voice = new Voice({ 
          num_beats: voiceBeats, 
          beat_value: beatTypeNum
        });
        voice.addTickables(staveNotes);
        
        try {
          new Formatter().joinVoices([voice]).format([voice], measureWidth - 60);
          voice.draw(context, stave);
          
          // Add beams
          beamNoteObjects.forEach(group => {
            if (group.length > 1) {
              const beam = new Beam(group);
              beam.setContext(context).draw();
            }
          });
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

    renderer.resize(720 * (zoom / 100), 150 * (zoom / 100));
  }, [notes, clef, keySignature, timeSignature, selectedNoteIndices, measures, zoom, showGrid, autoBeam, currentDuration, currentDot, currentTie, currentArticulation, readOnly, groupNotesForBeaming, getAutoAccidental, midiToVexFlowNote]);

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
        } else if (e.key === 'a') {
          e.preventDefault();
          selectAll();
        } else if (e.key === 'd') {
          e.preventDefault();
          selectNone();
        }
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteIndices.length > 0) {
          const newNotes = notes.filter((_, i) => !selectedNoteIndices.includes(i));
          addToHistory(newNotes);
          setSelectedNoteIndices([]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [readOnly, undo, redo, copyNotes, pasteNotes, selectAll, selectNone, selectedNoteIndices, notes, addToHistory]);

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
        {/* Professional Toolbar */}
        {!readOnly && (
          <>
            {/* Main Toolbar */}
            <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              {/* Edit Operations */}
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

              <Divider orientation="vertical" flexItem />

              <Tooltip title="Copy (Ctrl+C)">
                <IconButton size="small" onClick={() => copyNotes()} disabled={selectedNoteIndices.length === 0}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Paste (Ctrl+V)">
                <IconButton size="small" onClick={() => pasteNotes()} disabled={!clipboard}>
                  <ContentPaste fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => {
                  if (selectedNoteIndices.length > 0) {
                    const newNotes = notes.filter((_, i) => !selectedNoteIndices.includes(i));
                    addToHistory(newNotes);
                    setSelectedNoteIndices([]);
                  }
                }} disabled={selectedNoteIndices.length === 0}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />

              {/* Transpose */}
              <Button
                size="small"
                startIcon={<SwapHoriz />}
                onClick={(e) => setTransposeMenuAnchor(e.currentTarget)}
                disabled={selectedNoteIndices.length === 0}
              >
                Transpose
              </Button>
              <Menu anchorEl={transposeMenuAnchor} open={Boolean(transposeMenuAnchor)} onClose={() => setTransposeMenuAnchor(null)}>
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
                startIcon={<AutoFixHigh />}
                onClick={(e) => setRespellMenuAnchor(e.currentTarget)}
                disabled={selectedNoteIndices.length === 0}
              >
                Respell
              </Button>
              <Menu anchorEl={respellMenuAnchor} open={Boolean(respellMenuAnchor)} onClose={() => setRespellMenuAnchor(null)}>
                <MenuItem onClick={() => respellNotes('sharp')}>Use sharps (#)</MenuItem>
                <MenuItem onClick={() => respellNotes('flat')}>Use flats (b)</MenuItem>
                <MenuItem onClick={() => respellNotes('natural')}>Remove accidentals</MenuItem>
              </Menu>

              <Divider orientation="vertical" flexItem />

              {/* Instrument */}
              {onKeySignatureChange && (
                <KeySignatureSelector
                  value={keySignature}
                  onChange={onKeySignatureChange}
                />
              )}

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

              <Divider orientation="vertical" flexItem />

              {/* Playback */}
              <Tooltip title="Play (Space)">
                <IconButton size="small" onClick={() => setIsPlaying(!isPlaying)} disabled={notes.length === 0}>
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              </Tooltip>

              {/* More Options */}
              <IconButton size="small" onClick={(e) => setMoreMenuAnchor(e.currentTarget)}>
                <MoreVert fontSize="small" />
              </IconButton>
              <Menu anchorEl={moreMenuAnchor} open={Boolean(moreMenuAnchor)} onClose={() => setMoreMenuAnchor(null)}>
                <MenuItem onClick={() => { setShowGrid(!showGrid); setMoreMenuAnchor(null); }}>
                  <FormControlLabel
                    control={<Switch checked={showGrid} />}
                    label="Show Grid"
                    sx={{ m: 0 }}
                  />
                </MenuItem>
                <MenuItem onClick={() => { setAutoBeam(!autoBeam); setMoreMenuAnchor(null); }}>
                  <FormControlLabel
                    control={<Switch checked={autoBeam} />}
                    label="Auto Beam"
                    sx={{ m: 0 }}
                  />
                </MenuItem>
                <MenuItem onClick={() => { setAutoAccidentals(!autoAccidentals); setMoreMenuAnchor(null); }}>
                  <FormControlLabel
                    control={<Switch checked={autoAccidentals} />}
                    label="Auto Accidentals"
                    sx={{ m: 0 }}
                  />
                </MenuItem>
              </Menu>
            </Box>

            {/* Note Properties Toolbar */}
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

              {/* Tuplet */}
              <Button
                size="small"
                onClick={(e) => setTupletMenuAnchor(e.currentTarget)}
                variant={currentTuplet ? 'contained' : 'outlined'}
              >
                Tuplet
              </Button>
              <Menu anchorEl={tupletMenuAnchor} open={Boolean(tupletMenuAnchor)} onClose={() => setTupletMenuAnchor(null)}>
                <MenuItem onClick={() => { setCurrentTuplet(true); createTuplet(3, 2); setTupletMenuAnchor(null); }}>
                  Triplet (3:2)
                </MenuItem>
                <MenuItem onClick={() => { setCurrentTuplet(true); createTuplet(5, 4); setTupletMenuAnchor(null); }}>
                  Quintuplet (5:4)
                </MenuItem>
                <MenuItem onClick={() => { setTupletDialogOpen(true); setTupletMenuAnchor(null); }}>
                  Custom...
                </MenuItem>
              </Menu>

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
                onClick={() => setCurrentChord(!currentChord)}
                color={currentChord ? 'primary' : 'default'}
              />

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

              {/* Ornaments */}
              <Button
                size="small"
                onClick={(e) => setOrnamentMenuAnchor(e.currentTarget)}
                variant={currentOrnament ? 'contained' : 'outlined'}
              >
                Ornament
              </Button>
              <Menu anchorEl={ornamentMenuAnchor} open={Boolean(ornamentMenuAnchor)} onClose={() => setOrnamentMenuAnchor(null)}>
                {ornamentOptions.map(opt => (
                  <MenuItem key={opt.value} onClick={() => { addOrnament(opt.value); setOrnamentMenuAnchor(null); }}>
                    {opt.label} ({opt.symbol})
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </>
        )}
        
        <div ref={containerRef} style={{ width: '100%', overflow: 'auto' }} />
      </Paper>

      {/* Custom Tuplet Dialog */}
      <Dialog open={tupletDialogOpen} onClose={() => setTupletDialogOpen(false)}>
        <DialogTitle>Create Custom Tuplet</DialogTitle>
        <DialogContent>
          <TextField
            label="Number of notes"
            type="number"
            value={customTuplet.num}
            onChange={(e) => setCustomTuplet({ ...customTuplet, num: parseInt(e.target.value) })}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Fits into (beats)"
            type="number"
            value={customTuplet.den}
            onChange={(e) => setCustomTuplet({ ...customTuplet, den: parseInt(e.target.value) })}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTupletDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => createTuplet(customTuplet.num, customTuplet.den)}>Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfessionalMusicEditor;

