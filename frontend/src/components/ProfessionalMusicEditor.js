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
  const eventHandlersRef = useRef({ handlers: null, svg: null });
  
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
  
  // Sibelius-style modes
  const [inputMode, setInputMode] = useState('selection'); // 'note', 'selection', 'playback'
  const [noteInputActive, setNoteInputActive] = useState(false);
  const [currentInputPosition, setCurrentInputPosition] = useState(0); // Position for note input
  const [magneticLayout, setMagneticLayout] = useState(true); // Auto-formatting
  
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
  
  // Context menu (right-click)
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  
  // Properties panel
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);

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
    // More precise calculation for note placement
    // VexFlow staff: y=40 is top of staff, each line is 10px apart
    const staffTop = 40;
    const lineSpacing = 10; // VexFlow default line spacing
    const spaceHeight = lineSpacing / 2; // Half line = one semitone
    
    // Calculate which line/space (0 = top line, negative = above, positive = below)
    // Note: y is already in SVG coordinates accounting for zoom
    const relativeY = y - staffTop;
    const lineNumber = relativeY / spaceHeight; // Use exact division, not rounded
    
    let midi;
    if (clef === 'bass') {
      // Bass clef: F3 (MIDI 53) is on 4th line (line 4)
      // Top line (line 0) = E3 (MIDI 52), 4th line = F3 (MIDI 53)
      // Each line/space = 1 semitone
      const baseMidi = 52; // E3 on top line
      midi = baseMidi + lineNumber;
    } else if (clef === 'alto') {
      // Alto clef: C4 (MIDI 60) is on middle line (line 2)
      // lineNumber is in semitone units (spaceHeight = 5px per semitone)
      // Middle line is at 2 * lineSpacing = 20px = 4 * spaceHeight
      const baseMidi = 60; // C4 on middle line
      const baseLine = 4; // Middle line in semitone units (2 * lineSpacing / spaceHeight = 4)
      midi = baseMidi + (lineNumber - baseLine);
    } else if (clef === 'tenor') {
      // Tenor clef: C4 (MIDI 60) is on 4th line
      // 4th line is at 4 * lineSpacing = 40px = 8 * spaceHeight
      const baseMidi = 60; // C4 on 4th line
      const baseLine = 8; // 4th line in semitone units (4 * lineSpacing / spaceHeight = 8)
      midi = baseMidi + (lineNumber - baseLine);
    } else {
      // Treble clef: E4 (MIDI 64) is on first line (top line)
      // Top line (line 0) = E4 (MIDI 64)
      // Each line/space = 1 semitone
      const baseMidi = 64; // E4 on top line
      midi = baseMidi + lineNumber;
    }
    
    return Math.max(21, Math.min(108, Math.round(midi)));
  }, [zoom]);
  
  // Get note position on staff for visual feedback
  const midiToY = useCallback((midi, clef) => {
    const staffTop = 40;
    const lineSpacing = 10;
    const spaceHeight = lineSpacing / 2; // Half line = one semitone
    
    let y;
    if (clef === 'bass') {
      // Bass clef: E3 (MIDI 52) is on top line
      const baseMidi = 52; // E3 on top line
      const semitonesFromBase = midi - baseMidi;
      y = staffTop + semitonesFromBase * spaceHeight;
    } else if (clef === 'alto') {
      // Alto clef: C4 (MIDI 60) is on middle line (line 2)
      const baseMidi = 60; // C4 on middle line
      const semitonesFromBase = midi - baseMidi;
      y = staffTop + 2 * lineSpacing + semitonesFromBase * spaceHeight;
    } else if (clef === 'tenor') {
      // Tenor clef: C4 (MIDI 60) is on 4th line
      const baseMidi = 60; // C4 on 4th line
      const semitonesFromBase = midi - baseMidi;
      y = staffTop + 4 * lineSpacing + semitonesFromBase * spaceHeight;
    } else {
      // Treble clef: E4 (MIDI 64) is on top line
      const baseMidi = 64; // E4 on top line
      const semitonesFromBase = midi - baseMidi;
      y = staffTop + semitonesFromBase * spaceHeight;
    }
    
    return y;
  }, []);

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
    const measureWidth = measures > 0 ? (staffWidth - 20) / measures : staffWidth - 20;

    // Render multiple measures - connect them properly (no gaps)
    for (let measure = 0; measure < measures; measure++) {
      const xPos = 10 + measure * measureWidth;
      const staveWidth = measureWidth;
      const stave = new Stave(xPos, 40, staveWidth);
      
      // Connect measures - draw bar line between them (except first measure)
      if (measure > 0) {
        // Draw bar line between measures
        context.setStrokeStyle('#000000');
        context.setLineWidth(1.5);
        context.beginPath();
        context.moveTo(xPos, 40);
        context.lineTo(xPos, 100);
        context.stroke();
      }
      
      // Draw final bar line on last measure
      if (measure === measures - 1) {
        context.setStrokeStyle('#000000');
        context.setLineWidth(1.5);
        context.beginPath();
        context.moveTo(xPos + staveWidth, 40);
        context.lineTo(xPos + staveWidth, 100);
        context.stroke();
      }
      
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
          new Formatter().joinVoices([voice]).format([voice], measureWidth - 40);
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

    // Note: Event handlers are added in a separate useEffect to prevent memory leaks

    renderer.resize(720 * (zoom / 100), 150 * (zoom / 100));
  }, [notes, clef, keySignature, timeSignature, selectedNoteIndices, measures, zoom, showGrid, autoBeam, currentDuration, currentDot, currentTie, currentArticulation, readOnly, groupNotesForBeaming, getAutoAccidental, midiToVexFlowNote]);

  // Add interactive handlers for intuitive note input - separate useEffect to prevent memory leaks
  useEffect(() => {
    if (readOnly || !containerRef.current) return;
    
    // Wait for SVG to be rendered
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const svg = container.querySelector('svg');
      if (!svg) return;
      
      // Remove previous handlers if they exist
      if (eventHandlersRef.current.handlers && eventHandlersRef.current.svg) {
        const { handleMouseMove, handleMouseLeave, handleClick, handleContextMenu } = eventHandlersRef.current.handlers;
        eventHandlersRef.current.svg.removeEventListener('mousemove', handleMouseMove);
        eventHandlersRef.current.svg.removeEventListener('mouseleave', handleMouseLeave);
        eventHandlersRef.current.svg.removeEventListener('click', handleClick);
        eventHandlersRef.current.svg.removeEventListener('contextmenu', handleContextMenu);
      }
      
      svg.style.cursor = 'crosshair';
      
      // Visual feedback on hover
      let hoverLine = null;
      let hoverNoteLabel = null;
      
      const handleMouseMove = (e) => {
        // Get SVG coordinates properly
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const svgPoint = svg.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        
        const ctm = svg.getScreenCTM();
        if (ctm) {
          svgPoint.x = (svgPoint.x - ctm.e) / ctm.a;
          svgPoint.y = (svgPoint.y - ctm.f) / ctm.d;
        } else {
          const rect = svg.getBoundingClientRect();
          svgPoint.x = (e.clientX - rect.left) / (zoom / 100);
          svgPoint.y = (e.clientY - rect.top) / (zoom / 100);
        }
        
        const y = svgPoint.y;
        
        // Only show feedback in staff area
        if (y >= 30 && y <= 120) {
          const midi = yToMidi(y, clef);
          const noteY = midiToY(midi, clef);
          const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const octave = Math.floor(midi / 12) - 1;
          const noteName = noteNames[midi % 12];
          const fullNoteName = `${noteName}${octave}`;
          
          // Remove old indicators
          if (hoverLine) hoverLine.remove();
          if (hoverNoteLabel) {
            if (hoverNoteLabel._bg) hoverNoteLabel._bg.remove();
            hoverNoteLabel.remove();
          }
          
          // Create hover line
          hoverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hoverLine.setAttribute('x1', '10');
          hoverLine.setAttribute('x2', '700');
          hoverLine.setAttribute('y1', noteY);
          hoverLine.setAttribute('y2', noteY);
          hoverLine.setAttribute('stroke', '#2196F3');
          hoverLine.setAttribute('stroke-width', '3');
          hoverLine.setAttribute('stroke-dasharray', '8,4');
          hoverLine.setAttribute('opacity', '0.8');
          hoverLine.setAttribute('pointer-events', 'none');
          svg.appendChild(hoverLine);
          
          // Create note name label
          const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          labelBg.setAttribute('x', '10');
          labelBg.setAttribute('y', noteY - 18);
          labelBg.setAttribute('width', '60');
          labelBg.setAttribute('height', '16');
          labelBg.setAttribute('fill', 'white');
          labelBg.setAttribute('stroke', '#2196F3');
          labelBg.setAttribute('stroke-width', '1');
          labelBg.setAttribute('rx', '3');
          labelBg.setAttribute('opacity', '0.9');
          labelBg.setAttribute('pointer-events', 'none');
          svg.appendChild(labelBg);
          
          hoverNoteLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          hoverNoteLabel.setAttribute('x', '15');
          hoverNoteLabel.setAttribute('y', noteY - 5);
          hoverNoteLabel.setAttribute('fill', '#2196F3');
          hoverNoteLabel.setAttribute('font-size', '13');
          hoverNoteLabel.setAttribute('font-weight', 'bold');
          hoverNoteLabel.setAttribute('pointer-events', 'none');
          hoverNoteLabel.textContent = fullNoteName;
          svg.appendChild(hoverNoteLabel);
          hoverNoteLabel._bg = labelBg;
        } else {
          if (hoverLine) { hoverLine.remove(); hoverLine = null; }
          if (hoverNoteLabel) { 
            if (hoverNoteLabel._bg) hoverNoteLabel._bg.remove();
            hoverNoteLabel.remove(); 
            hoverNoteLabel = null; 
          }
        }
      };
      
      const handleMouseLeave = () => {
        if (hoverLine) { hoverLine.remove(); hoverLine = null; }
        if (hoverNoteLabel) { 
          if (hoverNoteLabel._bg) hoverNoteLabel._bg.remove();
          hoverNoteLabel.remove(); 
          hoverNoteLabel = null; 
        }
      };
      
      // Context menu handler (right-click)
      const handleContextMenu = (e) => {
        e.preventDefault();
        
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const rect = svg.getBoundingClientRect();
        const svgPoint = svg.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        
        const ctm = svg.getScreenCTM();
        if (ctm) {
          svgPoint.x = (svgPoint.x - ctm.e) / ctm.a;
          svgPoint.y = (svgPoint.y - ctm.f) / ctm.d;
        } else {
          svgPoint.x = (e.clientX - rect.left) / (zoom / 100);
          svgPoint.y = (e.clientY - rect.top) / (zoom / 100);
        }
        
        const y = svgPoint.y;
        if (y >= 30 && y <= 120) {
          const midi = yToMidi(y, clef);
          // Find if there's a note at this position (check all notes)
          let clickedNoteIndex = -1;
          let minDistance = Infinity;
          
          notes.forEach((note, idx) => {
            const noteY = midiToY(note.midi, clef);
            const distance = Math.abs(noteY - y);
            if (distance < 8 && distance < minDistance) { // 8px tolerance
              minDistance = distance;
              clickedNoteIndex = idx;
            }
          });
          
          if (clickedNoteIndex !== -1) {
            setSelectedNoteIndices([clickedNoteIndex]);
            setContextMenuAnchor({ x: e.clientX, y: e.clientY });
          } else {
            // Show context menu for empty space
            setContextMenuAnchor({ x: e.clientX, y: e.clientY });
          }
        }
      };
      
      const handleClick = (e) => {
        if (isDragging) return;
        
        // Close context menu on left click
        if (contextMenuAnchor) {
          setContextMenuAnchor(null);
        }
        
        // Get SVG element and its viewBox/transform
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const rect = svg.getBoundingClientRect();
        const svgPoint = svg.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        
        // Transform to SVG coordinates accounting for zoom
        const ctm = svg.getScreenCTM();
        if (ctm) {
          svgPoint.x = (svgPoint.x - ctm.e) / ctm.a;
          svgPoint.y = (svgPoint.y - ctm.f) / ctm.d;
        } else {
          // Fallback if no transform
          svgPoint.x = (e.clientX - rect.left) / (zoom / 100);
          svgPoint.y = (e.clientY - rect.top) / (zoom / 100);
        }
        
        const y = svgPoint.y;
        
        // Check if click is in staff area (approximately y=40 to y=100 for staff)
        if (y >= 30 && y <= 120) {
          const midi = yToMidi(y, clef);
          
          // Ctrl/Cmd+Click for chord input (Sibelius style)
          if (e.ctrlKey || e.metaKey) {
            if (selectedNoteIndices.length > 0) {
              // Add to existing chord
              const lastSelected = selectedNoteIndices[selectedNoteIndices.length - 1];
              const newNotes = [...notes];
              if (!newNotes[lastSelected].chord) {
                newNotes[lastSelected] = {
                  ...newNotes[lastSelected],
                  chord: true,
                  notes: [newNotes[lastSelected].midi, midi]
                };
              } else {
                newNotes[lastSelected] = {
                  ...newNotes[lastSelected],
                  notes: [...(newNotes[lastSelected].notes || []), midi]
                };
              }
              addToHistory(newNotes);
              return;
            }
          }
          
          if (currentChord) {
            if (chordNotes.length === 0) {
              setChordNotes([midi]);
              const newNote = {
                midi,
                notes: [midi],
                chord: true,
                duration: currentDuration,
                accidental: currentAccidental,
                dot: currentDot,
                tie: currentTie,
                dynamic: currentDynamic,
                articulation: currentArticulation
              };
              const newNotes = [...notes, newNote];
              addToHistory(newNotes);
              setSelectedNoteIndices([newNotes.length - 1]);
            } else {
              const updatedChordNotes = [...chordNotes, midi];
              setChordNotes(updatedChordNotes);
              const newNotes = [...notes];
              const lastIndex = newNotes.length - 1;
              if (newNotes[lastIndex] && newNotes[lastIndex].chord) {
                newNotes[lastIndex] = {
                  ...newNotes[lastIndex],
                  notes: updatedChordNotes,
                  midi: updatedChordNotes[0]
                };
                addToHistory(newNotes);
              }
            }
          } else {
            const newNote = {
              midi,
              duration: currentDuration,
              accidental: currentAccidental,
              rest: currentRest,
              tie: currentTie,
              dot: currentDot,
              tuplet: currentTuplet ? { num: 3, den: 2 } : null,
              dynamic: currentDynamic,
              articulation: currentArticulation,
              ornament: currentOrnament
            };
            
            const newNotes = [...notes, newNote];
            addToHistory(newNotes);
            setSelectedNoteIndices([newNotes.length - 1]);
            
            if (currentTie) setCurrentTie(false);
          }
        }
      };
      
      // Store handlers and SVG reference
      eventHandlersRef.current = {
        handlers: { handleMouseMove, handleMouseLeave, handleClick, handleContextMenu },
        svg: svg
      };
      
      // Add event listeners
      svg.addEventListener('mousemove', handleMouseMove);
      svg.addEventListener('mouseleave', handleMouseLeave);
      svg.addEventListener('click', handleClick);
      svg.addEventListener('contextmenu', handleContextMenu);
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (eventHandlersRef.current.handlers && eventHandlersRef.current.svg) {
        const { handleMouseMove, handleMouseLeave, handleClick, handleContextMenu } = eventHandlersRef.current.handlers;
        eventHandlersRef.current.svg.removeEventListener('mousemove', handleMouseMove);
        eventHandlersRef.current.svg.removeEventListener('mouseleave', handleMouseLeave);
        eventHandlersRef.current.svg.removeEventListener('click', handleClick);
        eventHandlersRef.current.svg.removeEventListener('contextmenu', handleContextMenu);
        eventHandlersRef.current = { handlers: null, svg: null };
      }
    };
  }, [readOnly, zoom, clef, yToMidi, midiToY, isDragging, currentChord, chordNotes, currentDuration, currentAccidental, currentDot, currentTie, currentRest, currentTuplet, currentDynamic, currentArticulation, currentOrnament, notes, addToHistory, setSelectedNoteIndices, setChordNotes]);

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
      
      // Sibelius-style QWERTY note input (A-G for notes)
      if (noteInputActive || inputMode === 'note') {
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
        
        if (qwertyToNote[e.key.toLowerCase()] !== undefined) {
          e.preventDefault();
          const midi = qwertyToNote[e.key.toLowerCase()];
          // Adjust for octave (Shift = octave up, Ctrl = octave down)
          let adjustedMidi = midi;
          if (e.shiftKey) adjustedMidi += 12;
          if (e.ctrlKey || e.metaKey) adjustedMidi -= 12;
          
          const newNote = {
            midi: adjustedMidi,
            duration: currentDuration,
            accidental: currentAccidental,
            rest: false,
            tie: currentTie,
            dot: currentDot,
            tuplet: currentTuplet ? { num: 3, den: 2 } : null,
            dynamic: currentDynamic,
            articulation: currentArticulation,
            ornament: currentOrnament
          };
          
          // Insert at current position or append
          const insertPos = noteInputActive ? currentInputPosition : notes.length;
          const newNotes = [...notes];
          newNotes.splice(insertPos, 0, newNote);
          
          // Update position for next note
          if (noteInputActive) {
            setCurrentInputPosition(insertPos + 1);
          }
          
          addToHistory(newNotes);
          setSelectedNoteIndices([insertPos]);
          
          // Auto-advance position
          if (magneticLayout) {
            // Auto-format after input
            setTimeout(() => {
              // Trigger re-render for formatting
            }, 0);
          }
          
          if (currentTie) setCurrentTie(false);
          return;
        }
      }
      
      // Toggle note input mode (N key - Sibelius style)
      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setNoteInputActive(!noteInputActive);
          setInputMode(noteInputActive ? 'selection' : 'note');
          if (!noteInputActive) {
            setCurrentInputPosition(notes.length);
          }
          return;
        }
      }
      
      // Accidental shortcuts
      if (e.key === '#') {
        e.preventDefault();
        setCurrentAccidental('#');
      } else if (e.key === 'b' && !noteInputActive) {
        e.preventDefault();
        setCurrentAccidental('b');
      } else if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCurrentAccidental('n');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setCurrentAccidental(null);
        setNoteInputActive(false);
        setInputMode('selection');
      }
      
      // Duration shortcuts (numbers)
      if (e.key >= '1' && e.key <= '6') {
        const durationMap = { '1': 'w', '2': 'h', '3': 'q', '4': '8', '5': '16', '6': '32' };
        setCurrentDuration(durationMap[e.key]);
      }
      
      // Rest shortcut
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setCurrentRest(!currentRest);
      }
      
      // Tie shortcut
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setCurrentTie(!currentTie);
      }
      
      // Dot shortcut
      if (e.key === '.') {
        e.preventDefault();
        setCurrentDot(!currentDot);
      }
      
      // Delete
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
  }, [readOnly, undo, redo, copyNotes, pasteNotes, selectAll, selectNone, selectedNoteIndices, notes, addToHistory, currentRest, currentTie, currentDot, noteInputActive, inputMode, currentInputPosition, currentDuration, currentAccidental, currentTuplet, currentDynamic, currentArticulation, currentOrnament, magneticLayout, addToHistory]);

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
          border: selectedNoteIndices.length > 0 && !readOnly ? '2px solid #4CAF50' : '1px solid #e0e0e0',
          position: 'relative'
        }}
      >
        {/* Note Input Indicator */}
        {noteInputActive && (
          <Box sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'primary.main',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            zIndex: 10
          }}>
            Note Input Active (Press N to exit)
          </Box>
        )}
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

            {/* Note Properties Toolbar - Enhanced for Intuitive Use */}
            <Box sx={{ 
              mb: 1, 
              display: 'flex', 
              gap: 1, 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              p: 1.5, 
              bgcolor: 'primary.50', 
              borderRadius: 2,
              border: '2px solid',
              borderColor: 'primary.200'
            }}>
              {/* Instructions - Enhanced for Intuitive Use */}
              <Box sx={{ 
                width: '100%', 
                mb: 1, 
                p: 1.5, 
                bgcolor: 'info.light', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.main'
              }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: 'info.dark' }}>
                  💡 Как использовать:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • <strong>Кликните мышкой</strong> на нотоносце, чтобы добавить ноту
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • <strong>Наведите мышь</strong> на нотоносец - увидите позицию ноты (синяя линия)
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • <strong>Клавиатура:</strong> # (диез), b (бемоль), n (бекар), 1-6 (длительности), r (пауза), t (лига), . (точка)
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    • Выберите длительность и альтерацию <strong>перед кликом</strong>, или используйте клавиатуру
                  </Typography>
                </Box>
              </Box>
              
              {/* Durations - Enhanced with keyboard hints */}
              <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>Длительность (1-6):</Typography>
              {durationOptions.map(({ value, title }, index) => (
                <Tooltip key={value} title={`${title} - Нажмите ${index + 1}`}>
                  <span>
                    <NoteDurationButton
                      duration={value}
                      isSelected={currentDuration === value}
                      onClick={() => setCurrentDuration(value)}
                      title={title}
                    />
                  </span>
                </Tooltip>
              ))}

              <Divider orientation="vertical" flexItem />
              
              {/* Dot - Enhanced */}
              <Tooltip title="Dot (Press .)">
                <Chip
                  label="•"
                  size="medium"
                  onClick={() => setCurrentDot(!currentDot)}
                  color={currentDot ? 'primary' : 'default'}
                  sx={{ 
                    fontSize: '20px',
                    fontWeight: currentDot ? 'bold' : 'normal'
                  }}
                />
              </Tooltip>

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

              {/* Accidentals - Enhanced with better UI */}
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>Альтерация:</Typography>
              <Tooltip title="Диез (#) - Нажмите #">
                <IconButton
                  size="small"
                  onClick={() => setCurrentAccidental('#')}
                  color={currentAccidental === '#' ? 'primary' : 'default'}
                  sx={{
                    border: currentAccidental === '#' ? '2px solid' : '1px solid',
                    borderColor: currentAccidental === '#' ? 'primary.main' : 'divider',
                    minWidth: 40,
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}
                >
                  #
                </IconButton>
              </Tooltip>
              <Tooltip title="Бемоль (b) - Нажмите b">
                <IconButton
                  size="small"
                  onClick={() => setCurrentAccidental('b')}
                  color={currentAccidental === 'b' ? 'primary' : 'default'}
                  sx={{
                    border: currentAccidental === 'b' ? '2px solid' : '1px solid',
                    borderColor: currentAccidental === 'b' ? 'primary.main' : 'divider',
                    minWidth: 40,
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}
                >
                  ♭
                </IconButton>
              </Tooltip>
              <Tooltip title="Бекар (♮) - Нажмите n">
                <IconButton
                  size="small"
                  onClick={() => setCurrentAccidental('n')}
                  color={currentAccidental === 'n' ? 'primary' : 'default'}
                  sx={{
                    border: currentAccidental === 'n' ? '2px solid' : '1px solid',
                    borderColor: currentAccidental === 'n' ? 'primary.main' : 'divider',
                    minWidth: 40,
                    fontWeight: 'bold',
                    fontSize: '18px'
                  }}
                >
                  ♮
                </IconButton>
              </Tooltip>
              <Tooltip title="Без альтерации - Нажмите Escape">
                <IconButton
                  size="small"
                  onClick={() => setCurrentAccidental(null)}
                  color={currentAccidental === null ? 'primary' : 'default'}
                  sx={{
                    border: currentAccidental === null ? '2px solid' : '1px solid',
                    borderColor: currentAccidental === null ? 'primary.main' : 'divider',
                    minWidth: 40
                  }}
                >
                  Clear
                </IconButton>
              </Tooltip>

              <Divider orientation="vertical" flexItem />
              
              {/* Rest/Tie - Enhanced */}
              <Tooltip title="Пауза - Нажмите R">
                <Chip
                  label="♩ Пауза"
                  size="medium"
                  onClick={() => setCurrentRest(!currentRest)}
                  color={currentRest ? 'primary' : 'default'}
                  sx={{ 
                    fontWeight: currentRest ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}
                />
              </Tooltip>
              <Tooltip title="Лига - Нажмите T">
                <Chip
                  label="⌒ Лига"
                  size="medium"
                  onClick={() => setCurrentTie(!currentTie)}
                  color={currentTie ? 'primary' : 'default'}
                  sx={{ 
                    fontWeight: currentTie ? 'bold' : 'normal',
                    fontSize: '13px'
                  }}
                />
              </Tooltip>
              <Tooltip title="Точка - Нажмите .">
                <Chip
                  label="• Точка"
                  size="medium"
                  onClick={() => setCurrentDot(!currentDot)}
                  color={currentDot ? 'primary' : 'default'}
                  sx={{ 
                    fontWeight: currentDot ? 'bold' : 'normal',
                    fontSize: '18px'
                  }}
                />
              </Tooltip>

              <Divider orientation="vertical" flexItem />
              
              {/* Chord Mode - Enhanced */}
              <Divider orientation="vertical" flexItem />
              <Tooltip title="Режим аккорда: Кликните несколько раз, чтобы добавить ноты в аккорд">
                <Chip
                  label="🎹 Аккорд"
                  size="medium"
                  icon={<MusicNote />}
                  onClick={() => {
                    setCurrentChord(!currentChord);
                    if (!currentChord) {
                      setChordNotes([]);
                    }
                  }}
                  color={currentChord ? 'primary' : 'default'}
                  sx={{ 
                    fontWeight: currentChord ? 'bold' : 'normal'
                  }}
                />
              </Tooltip>
              {currentChord && (
                <Typography variant="caption" sx={{ color: currentChord ? 'primary.main' : 'text.secondary', fontWeight: 'bold' }}>
                  {chordNotes.length > 0 ? `${chordNotes.length} нот(ы) в аккорде` : 'Кликните на нотоносце для добавления нот'}
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
        
        {/* Staff Container with Visual Feedback */}
        <Box 
          ref={containerRef} 
          sx={{ 
            width: '100%', 
            overflow: 'auto',
            position: 'relative',
            minHeight: '200px',
            bgcolor: 'white',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            '&:hover': {
              borderColor: 'primary.main'
            }
          }}
        >
          {/* Helper text when empty */}
          {notes.length === 0 && !readOnly && (
            <Box sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'text.secondary',
              pointerEvents: 'none',
              zIndex: 1,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              p: 2,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'primary.main'
            }}>
              <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                🎵 Click here to add notes
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                Move your mouse over the staff to see note positions
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Keyboard shortcuts: # (sharp), b (flat), n (natural), 1-6 (durations), r (rest), t (tie), . (dot)
              </Typography>
            </Box>
          )}
        </Box>
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
      
      {/* Context Menu (Right-click) */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenuAnchor
            ? { top: contextMenuAnchor.y, left: contextMenuAnchor.x }
            : undefined
        }
        open={Boolean(contextMenuAnchor)}
        onClose={() => setContextMenuAnchor(null)}
      >
        {selectedNoteIndices.length > 0 ? (
          <>
            <MenuItem onClick={() => {
              if (selectedNoteIndices.length > 0) {
                const newNotes = notes.filter((_, i) => !selectedNoteIndices.includes(i));
                addToHistory(newNotes);
                setSelectedNoteIndices([]);
              }
              setContextMenuAnchor(null);
            }}>
              <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
            </MenuItem>
            <MenuItem onClick={() => {
              copyNotes();
              setContextMenuAnchor(null);
            }}>
              <ContentCopy fontSize="small" sx={{ mr: 1 }} /> Copy
            </MenuItem>
            <MenuItem onClick={() => {
              setShowPropertiesPanel(true);
              setContextMenuAnchor(null);
            }}>
              <Settings fontSize="small" sx={{ mr: 1 }} /> Properties
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              transposeNotes(1);
              setContextMenuAnchor(null);
            }}>Transpose Up (+1)</MenuItem>
            <MenuItem onClick={() => {
              transposeNotes(-1);
              setContextMenuAnchor(null);
            }}>Transpose Down (-1)</MenuItem>
            <MenuItem onClick={() => {
              transposeNotes(12);
              setContextMenuAnchor(null);
            }}>Transpose Up Octave (+12)</MenuItem>
            <MenuItem onClick={() => {
              transposeNotes(-12);
              setContextMenuAnchor(null);
            }}>Transpose Down Octave (-12)</MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={() => {
              setNoteInputActive(true);
              setInputMode('note');
              setContextMenuAnchor(null);
            }}>
              <MusicNote fontSize="small" sx={{ mr: 1 }} /> Start Note Input
            </MenuItem>
            <MenuItem onClick={() => {
              pasteNotes();
              setContextMenuAnchor(null);
            }}>
              <ContentPaste fontSize="small" sx={{ mr: 1 }} /> Paste
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Properties Panel (Sibelius-style) */}
      {showPropertiesPanel && selectedNoteIndices.length > 0 && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 280,
            maxHeight: '80vh',
            overflow: 'auto',
            zIndex: 1300,
            p: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Properties
            </Typography>
            <IconButton size="small" onClick={() => setShowPropertiesPanel(false)}>
              <Remove fontSize="small" />
            </IconButton>
          </Box>
          
          {selectedNoteIndices.length === 1 && notes[selectedNoteIndices[0]] && (() => {
            const note = notes[selectedNoteIndices[0]];
            return (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Duration</InputLabel>
                  <Select
                    value={note.duration || currentDuration}
                    onChange={(e) => {
                      const newNotes = [...notes];
                      newNotes[selectedNoteIndices[0]] = { ...note, duration: e.target.value };
                      addToHistory(newNotes);
                    }}
                  >
                    <MenuItem value="w">Whole (1)</MenuItem>
                    <MenuItem value="h">Half (2)</MenuItem>
                    <MenuItem value="q">Quarter (3)</MenuItem>
                    <MenuItem value="8">Eighth (4)</MenuItem>
                    <MenuItem value="16">Sixteenth (5)</MenuItem>
                    <MenuItem value="32">32nd (6)</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth size="small">
                  <InputLabel>Accidental</InputLabel>
                  <Select
                    value={note.accidental || 'none'}
                    onChange={(e) => {
                      const newNotes = [...notes];
                      newNotes[selectedNoteIndices[0]] = { 
                        ...note, 
                        accidental: e.target.value === 'none' ? null : e.target.value 
                      };
                      addToHistory(newNotes);
                    }}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="#">Sharp (#)</MenuItem>
                    <MenuItem value="b">Flat (b)</MenuItem>
                    <MenuItem value="n">Natural (n)</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={note.dot || false}
                      onChange={(e) => {
                        const newNotes = [...notes];
                        newNotes[selectedNoteIndices[0]] = { ...note, dot: e.target.checked };
                        addToHistory(newNotes);
                      }}
                    />
                  }
                  label="Dotted"
                />
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={note.tie || false}
                      onChange={(e) => {
                        const newNotes = [...notes];
                        newNotes[selectedNoteIndices[0]] = { ...note, tie: e.target.checked };
                        addToHistory(newNotes);
                      }}
                    />
                  }
                  label="Tied"
                />
                
                <TextField
                  label="MIDI Note"
                  type="number"
                  size="small"
                  value={note.midi}
                  onChange={(e) => {
                    const newNotes = [...notes];
                    newNotes[selectedNoteIndices[0]] = { ...note, midi: parseInt(e.target.value) };
                    addToHistory(newNotes);
                  }}
                  inputProps={{ min: 0, max: 127 }}
                />
              </Box>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
};

export default ProfessionalMusicEditor;

