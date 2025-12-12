import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import Vex from 'vexflow';
import { useNoteHistory } from '../hooks/useNoteHistory';
import { useSelection } from '../hooks/useSelection';
import { useClipboard } from '../hooks/useClipboard';
import { useNoteInput } from '../hooks/useNoteInput';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import EditorToolbar from './EditorToolbar';
import NotePropertiesToolbar from './NotePropertiesToolbar';

/**
 * Optimized music editor using custom hooks and React.memo
 * Significantly smaller and more maintainable than ProfessionalMusicEditor
 */
const OptimizedMusicEditor = React.memo(({
  staffId,
  clef = 'treble',
  keySignature = 'C',
  timeSignature = '4/4',
  notes: externalNotes = [],
  onNotesChange,
  onKeySignatureChange,
  readOnly = false,
  showLabels = true,
  staffLabel = '',
  measures = 1,
  tempo = 120,
}) => {
  const containerRef = useRef(null);
  const eventHandlersRef = useRef({ handlers: null, svg: null });
  
  // Custom hooks for state management
  const { currentNotes, addToHistory, undo, redo, canUndo, canRedo } = useNoteHistory(externalNotes);
  const { selectedIndices, selectNote, selectAll, clearSelection, isSelected, hasSelection } = useSelection();
  const { copy, paste, hasContent: hasClipboard } = useClipboard();
  const noteInput = useNoteInput();
  
  // UI state
  const [zoom, setZoom] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [noteInputActive, setNoteInputActive] = useState(false);

  // Sync external notes with internal history
  useEffect(() => {
    if (JSON.stringify(currentNotes) !== JSON.stringify(externalNotes)) {
      onNotesChange?.(currentNotes);
    }
  }, [currentNotes, externalNotes, onNotesChange]);

  // Memoize MIDI to VexFlow conversion
  const midiToVexFlowNote = useCallback((midi) => {
    if (typeof midi !== 'number' || isNaN(midi)) return 'C/4';
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  }, []);

  // Coordinate conversion functions
  const yToMidi = useCallback((y, clef) => {
    const staffTop = 40;
    const lineSpacing = 10;
    const spaceHeight = lineSpacing / 2;
    const relativeY = y - staffTop;
    const lineNumber = relativeY / spaceHeight;
    
    let midi;
    if (clef === 'bass') {
      midi = 52 + lineNumber; // E3 on top line
    } else if (clef === 'alto') {
      midi = 60 + (lineNumber - 4); // C4 on middle line
    } else if (clef === 'tenor') {
      midi = 60 + (lineNumber - 8); // C4 on 4th line
    } else {
      midi = 64 + lineNumber; // E4 on top line (treble)
    }
    
    return Math.max(21, Math.min(108, Math.round(midi)));
  }, []);

  const midiToY = useCallback((midi, clef) => {
    const staffTop = 40;
    const lineSpacing = 10;
    const spaceHeight = lineSpacing / 2;
    
    let y;
    if (clef === 'bass') {
      y = staffTop + (midi - 52) * spaceHeight;
    } else if (clef === 'alto') {
      y = staffTop + 2 * lineSpacing + (midi - 60) * spaceHeight;
    } else if (clef === 'tenor') {
      y = staffTop + 4 * lineSpacing + (midi - 60) * spaceHeight;
    } else {
      y = staffTop + (midi - 64) * spaceHeight;
    }
    
    return y;
  }, []);

  // Handler functions
  const handleAddNote = useCallback((midi) => {
    const newNote = noteInput.createNote(midi);
    const newNotes = [...currentNotes, newNote];
    addToHistory(newNotes);
    
    if (noteInput.tie) noteInput.setTie(false);
  }, [currentNotes, addToHistory, noteInput]);

  const handleCopy = useCallback(() => {
    const selectedNotes = selectedIndices.map(i => currentNotes[i]);
    copy(selectedNotes);
  }, [selectedIndices, currentNotes, copy]);

  const handlePaste = useCallback(() => {
    const pastedNotes = paste();
    if (pastedNotes) {
      const newNotes = [...currentNotes, ...pastedNotes];
      addToHistory(newNotes);
    }
  }, [currentNotes, addToHistory, paste]);

  const handleDelete = useCallback(() => {
    if (hasSelection) {
      const newNotes = currentNotes.filter((_, i) => !selectedIndices.includes(i));
      addToHistory(newNotes);
      clearSelection();
    }
  }, [hasSelection, currentNotes, selectedIndices, addToHistory, clearSelection]);

  const handleTranspose = useCallback((semitones) => {
    if (!hasSelection) return;
    
    const newNotes = [...currentNotes];
    selectedIndices.forEach(i => {
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
  }, [hasSelection, currentNotes, selectedIndices, addToHistory]);

  const handleRespell = useCallback((enharmonic) => {
    if (!hasSelection) return;
    
    const newNotes = [...currentNotes];
    selectedIndices.forEach(i => {
      if (newNotes[i] && !newNotes[i].rest && newNotes[i].midi) {
        const midi = newNotes[i].midi;
        const pitchClass = midi % 12;
        
        const enharmonicMap = {
          1: { sharp: '#', flat: 'b' },
          3: { sharp: '#', flat: 'b' },
          6: { sharp: '#', flat: 'b' },
          8: { sharp: '#', flat: 'b' },
          10: { sharp: '#', flat: 'b' },
        };
        
        const options = enharmonicMap[pitchClass];
        if (options) {
          if (enharmonic === 'sharp' && options.sharp) {
            newNotes[i] = { ...newNotes[i], accidental: options.sharp };
          } else if (enharmonic === 'flat' && options.flat) {
            newNotes[i] = { ...newNotes[i], accidental: options.flat };
          }
        }
        if (enharmonic === 'natural') {
          newNotes[i] = { ...newNotes[i], accidental: null };
        }
      }
    });
    addToHistory(newNotes);
  }, [hasSelection, currentNotes, selectedIndices, addToHistory]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo,
    onCopy: handleCopy,
    onPaste: handlePaste,
    onDelete: handleDelete,
    onSelectAll: () => selectAll(currentNotes.length),
    onNoteInput: handleAddNote,
    onDurationChange: noteInput.setDuration,
    onAccidentalChange: noteInput.setAccidental,
    onRestToggle: () => noteInput.setRest(!noteInput.rest),
    onTieToggle: () => noteInput.setTie(!noteInput.tie),
    onDotToggle: () => noteInput.setDot(!noteInput.dot),
    onToggleNoteInputMode: () => setNoteInputActive(!noteInputActive),
    isNoteInputActive: noteInputActive,
    readOnly,
    enabled: true,
  });

  // Render staff with VexFlow
  const renderStaff = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Beam } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);
    context.scale(zoom / 100, zoom / 100);

    const [beats, beatType] = timeSignature.split('/');
    const beatsPerMeasure = parseInt(beats, 10) || 4;
    const beatTypeNum = parseInt(beatType, 10) || 4;
    const staffWidth = 700 * (zoom / 100);
    const measureWidth = measures > 0 ? (staffWidth - 20) / measures : staffWidth - 20;

    // Render measures
    for (let measure = 0; measure < measures; measure++) {
      const xPos = 10 + measure * measureWidth;
      const stave = new Stave(xPos, 40, measureWidth);
      
      if (measure === 0) {
        stave.addClef(clef);
        stave.addTimeSignature(`${beats}/${beatType}`);
        
        if (keySignature !== 'C') {
          try {
            const keyToFifths = { 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6, 'F': -1, 'Bb': -2 };
            const fifths = keyToFifths[keySignature];
            if (fifths !== undefined) {
              stave.addKeySignature(fifths);
            }
          } catch (e) {
            console.warn(`Could not add key signature: ${keySignature}`);
          }
        }
      }

      stave.setContext(context).draw();

      // Draw grid
      if (showGrid && !readOnly) {
        context.setStrokeStyle('#e0e0e0');
        context.setLineWidth(0.5);
        for (let i = 0; i <= beatsPerMeasure * 4; i++) {
          const x = xPos + (i * (measureWidth / (beatsPerMeasure * 4)));
          context.beginPath();
          context.moveTo(x, 40);
          context.lineTo(x, 100);
          context.stroke();
        }
      }

      // Get notes for this measure
      const notesPerMeasure = Math.ceil(currentNotes.length / measures);
      const measureStart = measure * notesPerMeasure;
      const measureEnd = Math.min((measure + 1) * notesPerMeasure, currentNotes.length);
      const measureNotes = currentNotes.slice(measureStart, measureEnd);

      if (measureNotes.length > 0) {
        const staveNotes = measureNotes.map((note, localIndex) => {
          const globalIndex = measureStart + localIndex;
          const noteDuration = note.duration || noteInput.duration;
          const selected = isSelected(globalIndex);
          
          // Handle chord
          if (note.chord && note.notes) {
            const chordKeys = note.notes.map(midiToVexFlowNote);
            const staveNote = new StaveNote({
              clef: clef,
              keys: chordKeys,
              duration: noteDuration
            });
            
            if (note.dot) staveNote.addDot(0);
            if (selected && !readOnly) {
              staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
            }
            
            return staveNote;
          }
          
          // Handle rest
          if (note.rest) {
            const rest = new Vex.Flow.StaveNote({
              clef: clef,
              keys: ['b/4'],
              duration: noteDuration + 'r'
            });
            if (note.dot) rest.addDot(0);
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
          if (note.dot) staveNote.addDot(0);
          if (selected && !readOnly) {
            staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
          }

          return staveNote;
        });

        // Auto-beam eighth notes and shorter
        const beamableNotes = [];
        staveNotes.forEach((note, idx) => {
          const duration = measureNotes[idx].duration || noteInput.duration;
          if ((duration === '8' || duration === '16') && !measureNotes[idx].rest) {
            beamableNotes.push(note);
          }
        });

        const voice = new Voice({ 
          num_beats: beatsPerMeasure, 
          beat_value: beatTypeNum
        });
        voice.addTickables(staveNotes);
        
        try {
          new Formatter().joinVoices([voice]).format([voice], measureWidth - 40);
          voice.draw(context, stave);
          
          // Add beams
          if (beamableNotes.length > 1) {
            const beam = new Beam(beamableNotes);
            beam.setContext(context).draw();
          }
        } catch (e) {
          console.warn('Error formatting voice:', e);
        }
      }
    }

    renderer.resize(720 * (zoom / 100), 150 * (zoom / 100));
  }, [currentNotes, clef, keySignature, timeSignature, selectedIndices, measures, zoom, showGrid, noteInput, readOnly, isSelected, midiToVexFlowNote]);

  useEffect(() => {
    if (containerRef.current && measures > 0) {
      renderStaff();
    }
  }, [renderStaff, measures]);

  // Interactive handlers
  useEffect(() => {
    if (readOnly || !containerRef.current) return;
    
    const timeoutId = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const svg = container.querySelector('svg');
      if (!svg) return;
      
      // Remove previous handlers
      if (eventHandlersRef.current.handlers && eventHandlersRef.current.svg) {
        const { handleMouseMove, handleMouseLeave, handleClick } = eventHandlersRef.current.handlers;
        eventHandlersRef.current.svg.removeEventListener('mousemove', handleMouseMove);
        eventHandlersRef.current.svg.removeEventListener('mouseleave', handleMouseLeave);
        eventHandlersRef.current.svg.removeEventListener('click', handleClick);
      }
      
      svg.style.cursor = 'crosshair';
      
      let hoverLine = null;
      let hoverLabel = null;
      
      const handleMouseMove = (e) => {
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const svgPoint = svg.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        
        const ctm = svg.getScreenCTM();
        if (ctm) {
          svgPoint.x = (svgPoint.x - ctm.e) / ctm.a;
          svgPoint.y = (svgPoint.y - ctm.f) / ctm.d;
        }
        
        const y = svgPoint.y;
        
        if (y >= 30 && y <= 120) {
          const midi = yToMidi(y, clef);
          const noteY = midiToY(midi, clef);
          const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const octave = Math.floor(midi / 12) - 1;
          const noteName = `${noteNames[midi % 12]}${octave}`;
          
          if (hoverLine) hoverLine.remove();
          if (hoverLabel) {
            if (hoverLabel._bg) hoverLabel._bg.remove();
            hoverLabel.remove();
          }
          
          hoverLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hoverLine.setAttribute('x1', '10');
          hoverLine.setAttribute('x2', '700');
          hoverLine.setAttribute('y1', noteY);
          hoverLine.setAttribute('y2', noteY);
          hoverLine.setAttribute('stroke', '#2196F3');
          hoverLine.setAttribute('stroke-width', '2');
          hoverLine.setAttribute('stroke-dasharray', '5,3');
          hoverLine.setAttribute('opacity', '0.7');
          hoverLine.setAttribute('pointer-events', 'none');
          svg.appendChild(hoverLine);
          
          const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          labelBg.setAttribute('x', '10');
          labelBg.setAttribute('y', noteY - 18);
          labelBg.setAttribute('width', '50');
          labelBg.setAttribute('height', '16');
          labelBg.setAttribute('fill', 'white');
          labelBg.setAttribute('stroke', '#2196F3');
          labelBg.setAttribute('rx', '3');
          labelBg.setAttribute('opacity', '0.9');
          labelBg.setAttribute('pointer-events', 'none');
          svg.appendChild(labelBg);
          
          hoverLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          hoverLabel.setAttribute('x', '15');
          hoverLabel.setAttribute('y', noteY - 5);
          hoverLabel.setAttribute('fill', '#2196F3');
          hoverLabel.setAttribute('font-size', '12');
          hoverLabel.setAttribute('font-weight', 'bold');
          hoverLabel.setAttribute('pointer-events', 'none');
          hoverLabel.textContent = noteName;
          svg.appendChild(hoverLabel);
          hoverLabel._bg = labelBg;
        }
      };
      
      const handleMouseLeave = () => {
        if (hoverLine) { hoverLine.remove(); hoverLine = null; }
        if (hoverLabel) { 
          if (hoverLabel._bg) hoverLabel._bg.remove();
          hoverLabel.remove(); 
          hoverLabel = null; 
        }
      };
      
      const handleClick = (e) => {
        const svg = container.querySelector('svg');
        if (!svg) return;
        
        const svgPoint = svg.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        
        const ctm = svg.getScreenCTM();
        if (ctm) {
          svgPoint.x = (svgPoint.x - ctm.e) / ctm.a;
          svgPoint.y = (svgPoint.y - ctm.f) / ctm.d;
        }
        
        const y = svgPoint.y;
        
        if (y >= 30 && y <= 120) {
          const midi = yToMidi(y, clef);
          handleAddNote(midi);
        }
      };
      
      eventHandlersRef.current = {
        handlers: { handleMouseMove, handleMouseLeave, handleClick },
        svg: svg
      };
      
      svg.addEventListener('mousemove', handleMouseMove);
      svg.addEventListener('mouseleave', handleMouseLeave);
      svg.addEventListener('click', handleClick);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      if (eventHandlersRef.current.handlers && eventHandlersRef.current.svg) {
        const { handleMouseMove, handleMouseLeave, handleClick } = eventHandlersRef.current.handlers;
        eventHandlersRef.current.svg.removeEventListener('mousemove', handleMouseMove);
        eventHandlersRef.current.svg.removeEventListener('mouseleave', handleMouseLeave);
        eventHandlersRef.current.svg.removeEventListener('click', handleClick);
        eventHandlersRef.current = { handlers: null, svg: null };
      }
    };
  }, [readOnly, zoom, clef, yToMidi, midiToY, handleAddNote]);

  return (
    <Box sx={{ mb: 2 }}>
      {showLabels && staffLabel && (
        <Typography variant="caption" sx={{ mb: 0.5, fontWeight: 'bold', display: 'block' }}>
          {staffLabel}
        </Typography>
      )}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 1, 
          backgroundColor: readOnly ? 'grey.50' : 'background.paper',
          border: hasSelection && !readOnly ? '2px solid #4CAF50' : '1px solid',
          borderColor: 'divider',
          position: 'relative'
        }}
      >
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
        
        {!readOnly && (
          <>
            <EditorToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
              hasClipboard={hasClipboard}
              hasSelection={hasSelection}
              onCopy={handleCopy}
              onPaste={handlePaste}
              onDelete={handleDelete}
              onTranspose={handleTranspose}
              onRespell={handleRespell}
              zoom={zoom}
              onZoomIn={() => setZoom(Math.min(zoom + 10, 200))}
              onZoomOut={() => setZoom(Math.max(zoom - 10, 50))}
              isPlaying={isPlaying}
              onPlayPause={() => setIsPlaying(!isPlaying)}
              canPlay={currentNotes.length > 0}
              onMoreClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              moreMenuAnchor={moreMenuAnchor}
              onMoreClose={() => setMoreMenuAnchor(null)}
            />
            
            <NotePropertiesToolbar
              duration={noteInput.duration}
              onDurationChange={noteInput.setDuration}
              dot={noteInput.dot}
              onDotToggle={() => noteInput.setDot(!noteInput.dot)}
              rest={noteInput.rest}
              onRestToggle={() => noteInput.setRest(!noteInput.rest)}
              tie={noteInput.tie}
              onTieToggle={() => noteInput.setTie(!noteInput.tie)}
              accidental={noteInput.accidental}
              onAccidentalChange={noteInput.setAccidental}
              tuplet={noteInput.tuplet}
              onTupletChange={noteInput.setTuplet}
              isChordMode={noteInput.isChordMode}
              onChordModeToggle={noteInput.toggleChordMode}
              chordNotesCount={noteInput.chordNotes.length}
              dynamic={noteInput.dynamic}
              onDynamicChange={noteInput.setDynamic}
              articulation={noteInput.articulation}
              onArticulationChange={noteInput.setArticulation}
              onOrnamentClick={noteInput.setOrnament}
            />
          </>
        )}
        
        <Box 
          ref={containerRef} 
          sx={{ 
            width: '100%', 
            overflow: 'auto',
            position: 'relative',
            minHeight: '200px',
            bgcolor: 'background.staff',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
            '&:hover': {
              borderColor: readOnly ? 'divider' : 'primary.main'
            }
          }}
        >
          {currentNotes.length === 0 && !readOnly && (
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
                🎵 Click to add notes
              </Typography>
              <Typography variant="body2">
                Hover to see note positions
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
});

OptimizedMusicEditor.displayName = 'OptimizedMusicEditor';

export default OptimizedMusicEditor;

