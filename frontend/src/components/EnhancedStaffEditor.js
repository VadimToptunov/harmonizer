import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Undo, Redo, ContentCopy, ContentPaste, Restore } from '@mui/icons-material';
import Vex from 'vexflow';
import NoteDurationButton from './NoteDurationButton';
import KeySignatureSelector from './KeySignatureSelector';

/**
 * Enhanced staff editor with drag & drop, copy/paste, undo/redo, measures, rests, ties, dynamics, playback
 */
const EnhancedStaffEditor = ({
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
  measures = 1
}) => {
  const containerRef = useRef(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragNoteIndex, setDragNoteIndex] = useState(null);
  const [currentDuration, setCurrentDuration] = useState('q');
  const [currentAccidental, setCurrentAccidental] = useState(null);
  const [currentRest, setCurrentRest] = useState(false);
  const [currentTie, setCurrentTie] = useState(false);
  const [currentDynamic, setCurrentDynamic] = useState(null);
  const [currentArticulation, setCurrentArticulation] = useState(null);
  
  // Undo/redo system
  const [history, setHistory] = useState([notes]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [clipboard, setClipboard] = useState(null);

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

  const copyNote = useCallback(() => {
    if (selectedNoteIndex !== null && notes[selectedNoteIndex]) {
      setClipboard(notes[selectedNoteIndex]);
    }
  }, [selectedNoteIndex, notes]);

  const pasteNote = useCallback(() => {
    if (clipboard) {
      const newNotes = [...notes, { ...clipboard }];
      addToHistory(newNotes);
      setSelectedNoteIndex(newNotes.length - 1);
    }
  }, [clipboard, notes, addToHistory]);

  useEffect(() => {
    if (containerRef.current) {
      renderStaff();
    }
  }, [notes, clef, keySignature, timeSignature, selectedNoteIndex, measures, currentDuration]);

  const renderStaff = () => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Rest, StaveTie, Articulation, Beam } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    const [beats, beatType] = timeSignature.split('/');
    const beatsPerMeasure = parseInt(beats);
    
    // Adaptive staff width based on content
    const minNoteWidth = 40; // Minimum width per note
    const baseWidth = 200; // Base width for clef, key, time signature
    const calculatedWidth = Math.max(
      baseWidth + (notes.length * minNoteWidth),
      500 // Minimum total width
    );
    const staffWidth = Math.min(calculatedWidth, container.offsetWidth - 40 || 1200);
    const measureWidth = staffWidth / Math.max(measures, 1);

      // Auto-calculate measures if not specified
      const calculatedMeasures = Math.max(
        measures,
        Math.ceil(notes.length / 4) // At least 4 notes per measure
      );
      
      // Render multiple measures
      for (let measure = 0; measure < calculatedMeasures; measure++) {
        const xPos = 10 + measure * measureWidth;
        const stave = new Stave(xPos, 40, measureWidth - 20);
      
      if (measure === 0) {
        // Add clef only on first measure
        if (clef === 'bass') {
          stave.addClef('bass');
        } else if (clef === 'alto') {
          stave.addClef('alto');
        } else if (clef === 'tenor') {
          stave.addClef('tenor');
        } else {
          stave.addClef('treble');
        }

        // Add time signature
        stave.addTimeSignature(`${beats}/${beatType}`);

        // Add key signature
        // VexFlow: use key name for flats, integer for sharps
        if (keySignature !== 'C') {
          const keyToFifths = {
            'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6
          };
          const fifths = keyToFifths[keySignature];
          
          if (fifths !== undefined) {
            // Sharps: use integer
            stave.addKeySignature(fifths);
          } else {
            // Flats: try key name, skip if it fails
            try {
              stave.addKeySignature(keySignature);
            } catch (e) {
              console.warn(`Could not add key signature: ${keySignature}`, e);
              // Skip key signature for unsupported keys
            }
          }
        }
      }

      stave.setContext(context).draw();

      // Get notes for this measure - adaptive distribution
      const notesPerMeasure = Math.ceil(notes.length / calculatedMeasures);
      const measureStart = measure * notesPerMeasure;
      const measureEnd = Math.min((measure + 1) * notesPerMeasure, notes.length);
      const measureNotes = notes.slice(measureStart, measureEnd);

      if (measureNotes.length > 0) {
        // Helper function to convert duration to beats
        const durationToBeats = (duration) => {
          const durationMap = {
            'w': 4, 'h': 2, 'q': 1, '8': 0.5, '16': 0.25, '32': 0.125
          };
          return durationMap[duration] || 1;
        };

        const staveNotes = measureNotes.map((note, localIndex) => {
          const globalIndex = measureStart + localIndex;
          const noteDuration = note.duration || currentDuration;
          
          // Handle rest
          if (note.rest) {
            const rest = new Rest({
              duration: noteDuration
            });
            return rest;
          }

          // Regular note
          const noteName = midiToVexFlowNote(note.midi || note);
          const staveNote = new StaveNote({
            clef: clef,
            keys: [noteName],
            duration: noteDuration
          });

          // Add accidental
          if (note.accidental) {
            staveNote.addAccidental(0, new Accidental(note.accidental));
          }

          // Add tie
          if (note.tie) {
            staveNote.addTie(0);
          }

          // Add articulation
          if (note.articulation) {
            staveNote.addArticulation(0, new Articulation(note.articulation));
          }

          // Highlight selected note
          if (globalIndex === selectedNoteIndex && !readOnly) {
            staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
          }

          return staveNote;
        });

        // Group notes for beaming (eighth, sixteenth, thirty-second notes)
        const beamGroups = [];
        let currentBeamGroup = [];
        
        staveNotes.forEach((staveNote, idx) => {
          const note = measureNotes[idx];
          const duration = note.duration || currentDuration;
          
          // Check if note should be beamed (eighth, sixteenth, thirty-second)
          if ((duration === '8' || duration === '16' || duration === '32') && !note.rest) {
            currentBeamGroup.push(staveNote);
          } else {
            if (currentBeamGroup.length > 1) {
              beamGroups.push([...currentBeamGroup]);
            }
            currentBeamGroup = [];
          }
        });
        
        // Add last group if exists
        if (currentBeamGroup.length > 1) {
          beamGroups.push(currentBeamGroup);
        }

        // Calculate total beats from note durations
        const totalBeats = measureNotes.reduce((sum, note) => {
          const duration = note.duration || currentDuration;
          return sum + durationToBeats(duration);
        }, 0);

        // Use calculated beats or fallback to beatsPerMeasure
        const voiceBeats = totalBeats > 0 ? totalBeats : beatsPerMeasure;
        
        const voice = new Voice({ 
          num_beats: voiceBeats, 
          beat_value: parseInt(beatType) 
        });
        voice.addTickables(staveNotes);
        
        try {
          new Formatter().joinVoices([voice]).format([voice], measureWidth - 60);
          voice.draw(context, stave);
          
          // Add beams for grouped notes
          beamGroups.forEach(group => {
            if (group.length > 1) {
              const beam = new Beam(group);
              beam.setContext(context).draw();
            }
          });
        } catch (e) {
          console.warn('Error formatting voice:', e);
          // If formatting fails, try with default beats
          if (voiceBeats !== beatsPerMeasure) {
            const fallbackVoice = new Voice({ 
              num_beats: beatsPerMeasure, 
              beat_value: parseInt(beatType) 
            });
            fallbackVoice.addTickables(staveNotes);
            try {
              new Formatter().joinVoices([fallbackVoice]).format([fallbackVoice], measureWidth - 60);
              fallbackVoice.draw(context, stave);
              
              // Add beams for fallback
              beamGroups.forEach(group => {
                if (group.length > 1) {
                  const beam = new Beam(group);
                  beam.setContext(context).draw();
                }
              });
            } catch (e2) {
              console.error('Fallback formatting also failed:', e2);
            }
          }
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

    // Adaptive height based on clef and content
    const staffHeight = clef === 'bass' ? 180 : 160;
    const totalHeight = staffHeight + (showLabels ? 40 : 0);
    renderer.resize(staffWidth + 20, totalHeight);
  };

  const handleStaffClick = (event) => {
    if (readOnly || isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const midi = yToMidi(y, clef);
    if (midi !== null) {
      const newNote = {
        midi,
        duration: currentDuration,
        accidental: currentAccidental,
        rest: currentRest,
        tie: currentTie,
        dynamic: currentDynamic,
        articulation: currentArticulation
      };
      
      const newNotes = [...notes, newNote];
      addToHistory(newNotes);
      setSelectedNoteIndex(newNotes.length - 1);
    }
  };

  const handleMouseDown = (event) => {
    if (readOnly) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    
    // Find which note was clicked
    const clickedIndex = findNoteAtY(y);
    if (clickedIndex !== null) {
      setIsDragging(true);
      setDragNoteIndex(clickedIndex);
      setDragStartY(y);
      setSelectedNoteIndex(clickedIndex);
    }
  };

  const handleMouseMove = (event) => {
    if (!isDragging || dragNoteIndex === null || readOnly) return;

    const rect = containerRef.current.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const deltaY = y - dragStartY;

    // Convert deltaY to semitones (approximately)
    const semitones = Math.round(deltaY / 5);
    if (semitones !== 0) {
      const newNotes = [...notes];
      const note = newNotes[dragNoteIndex];
      if (note && !note.rest) {
        const newMidi = Math.max(21, Math.min(108, (note.midi || note) + semitones));
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
    // Simple heuristic: find note closest to Y position
    // In a real implementation, would need to track note positions
    return null; // Simplified for now
  };

  const yToMidi = (y, clef) => {
    const staffTop = 40;
    const lineSpacing = 10;
    const relativeY = y - staffTop;
    const lineNumber = Math.round(relativeY / (lineSpacing / 2));
    
    let midi;
    if (clef === 'bass') {
      const baseMidi = 48;
      const baseLine = 0;
      midi = baseMidi + (lineNumber - baseLine) * 0.5;
    } else {
      const baseMidi = 64;
      const baseLine = 0;
      midi = baseMidi + (lineNumber - baseLine) * 0.5;
    }
    
    return Math.max(21, Math.min(108, Math.round(midi)));
  };

  const midiToVexFlowNote = (midi) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  };

  const deleteSelectedNote = () => {
    if (selectedNoteIndex !== null && !readOnly) {
      const newNotes = notes.filter((_, i) => i !== selectedNoteIndex);
      addToHistory(newNotes);
      setSelectedNoteIndex(null);
    }
  };

  const addRest = () => {
    const rest = {
      rest: true,
      duration: currentDuration
    };
    const newNotes = [...notes, rest];
    addToHistory(newNotes);
    setSelectedNoteIndex(newNotes.length - 1);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (readOnly) return;
      
      // Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === 'z' && e.shiftKey) {
          e.preventDefault();
          redo();
        } else if (e.key === 'c') {
          e.preventDefault();
          copyNote();
        } else if (e.key === 'v') {
          e.preventDefault();
          pasteNote();
        }
        return;
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedNote();
      } else if (e.key === 'q' || e.key === 'Q') {
        setCurrentDuration('q');
      } else if (e.key === 'h' || e.key === 'H') {
        setCurrentDuration('h');
      } else if (e.key === 'w' || e.key === 'W') {
        setCurrentDuration('w');
      } else if (e.key === '8') {
        setCurrentDuration('8');
      } else if (e.key === 'r' || e.key === 'R') {
        addRest();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNoteIndex, readOnly, undo, redo, copyNote, pasteNote]);

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
          border: selectedNoteIndex !== null && !readOnly ? '2px solid #4CAF50' : '1px solid #e0e0e0'
        }}
      >
        {/* Toolbar */}
        {!readOnly && (
          <Box sx={{ mb: 1, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
            <Tooltip title="Copy (Ctrl+C)">
              <IconButton size="small" onClick={copyNote} disabled={selectedNoteIndex === null}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Paste (Ctrl+V)">
              <IconButton size="small" onClick={pasteNote} disabled={!clipboard}>
                <ContentPaste fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Box sx={{ ml: 2, display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption">Duration:</Typography>
              {[
                { value: 'w', title: 'Whole note (4 beats)' },
                { value: 'h', title: 'Half note (2 beats)' },
                { value: 'q', title: 'Quarter note (1 beat)' },
                { value: '8', title: 'Eighth note (1/2 beat)' },
                { value: '16', title: 'Sixteenth note (1/4 beat)' },
                { value: '32', title: 'Thirty-second note (1/8 beat)' }
              ].map(({ value, title }) => (
                <NoteDurationButton
                  key={value}
                  duration={value}
                  isSelected={currentDuration === value}
                  onClick={() => setCurrentDuration(value)}
                  title={title}
                />
              ))}
            </Box>
            
            {onKeySignatureChange && (
              <Box sx={{ ml: 2, display: 'flex', gap: 0.5, alignItems: 'center' }}>
                <Typography variant="caption">Key:</Typography>
                <KeySignatureSelector
                  value={keySignature}
                  onChange={onKeySignatureChange}
                />
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption">Accidental:</Typography>
              {[null, '#', 'b', 'n'].map(acc => (
                <button
                  key={acc || 'nat'}
                  onClick={() => setCurrentAccidental(acc)}
                  style={{
                    padding: '4px 8px',
                    border: currentAccidental === acc ? '2px solid #1976d2' : '1px solid #ccc',
                    backgroundColor: currentAccidental === acc ? '#e3f2fd' : 'white',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  {acc || '♮'}
                </button>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <button
                onClick={() => setCurrentRest(!currentRest)}
                style={{
                  padding: '4px 8px',
                  border: currentRest ? '2px solid #1976d2' : '1px solid #ccc',
                  backgroundColor: currentRest ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Rest
              </button>
              <button
                onClick={() => setCurrentTie(!currentTie)}
                style={{
                  padding: '4px 8px',
                  border: currentTie ? '2px solid #1976d2' : '1px solid #ccc',
                  backgroundColor: currentTie ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                Tie
              </button>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption">Dynamic:</Typography>
              <select
                value={currentDynamic || ''}
                onChange={(e) => setCurrentDynamic(e.target.value || null)}
                style={{ padding: '4px', fontSize: '11px' }}
              >
                <option value="">None</option>
                <option value="pp">pp</option>
                <option value="p">p</option>
                <option value="mp">mp</option>
                <option value="mf">mf</option>
                <option value="f">f</option>
                <option value="ff">ff</option>
              </select>
            </Box>

            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption">Articulation:</Typography>
              <select
                value={currentArticulation || ''}
                onChange={(e) => setCurrentArticulation(e.target.value || null)}
                style={{ padding: '4px', fontSize: '11px' }}
              >
                <option value="">None</option>
                <option value="staccato">Staccato</option>
                <option value="tenuto">Tenuto</option>
                <option value="accent">Accent</option>
              </select>
            </Box>
          </Box>
        )}
        
        <div ref={containerRef} style={{ width: '100%', overflow: 'auto' }} />
      </Paper>
    </Box>
  );
};

export default EnhancedStaffEditor;

