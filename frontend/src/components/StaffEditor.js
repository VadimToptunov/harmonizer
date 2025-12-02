import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import Vex from 'vexflow';

/**
 * Interactive staff editor - click to add notes, drag to move, etc.
 * Professional music notation editor functionality
 */
const StaffEditor = ({
  staffId,
  clef = 'treble',
  keySignature = 'C',
  timeSignature = '4/4',
  notes = [],
  onNotesChange,
  readOnly = false,
  showLabels = true,
  staffLabel = ''
}) => {
  const containerRef = useRef(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentDuration, setCurrentDuration] = useState('q'); // q, h, w, 8, 16
  const [currentAccidental, setCurrentAccidental] = useState(null); // null, '#', 'b', 'n'

  useEffect(() => {
    if (containerRef.current) {
      renderStaff();
    }
  }, [notes, clef, keySignature, timeSignature, selectedNoteIndex]);

  const renderStaff = () => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    const stave = new Stave(10, 40, 700);
    
    // Add clef
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
    const [beats, beatType] = timeSignature.split('/');
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

    stave.setContext(context).draw();

    // Render notes
    if (notes.length > 0) {
      const staveNotes = notes.map((note, index) => {
        const noteName = midiToVexFlowNote(note.midi || note);
        const staveNote = new StaveNote({
          clef: clef,
          keys: [noteName],
          duration: note.duration || currentDuration
        });

        // Add accidental if needed
        if (note.accidental) {
          staveNote.addAccidental(0, new Accidental(note.accidental));
        } else if (currentAccidental && index === selectedNoteIndex) {
          staveNote.addAccidental(0, new Accidental(currentAccidental));
        }

        // Highlight selected note
        if (index === selectedNoteIndex && !readOnly) {
          staveNote.setStyle({ fillStyle: '#4CAF50', strokeStyle: '#4CAF50' });
        }

        return staveNote;
      });

      const voice = new Voice({ num_beats: notes.length * 4, beat_value: 4 });
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], 650);
      voice.draw(context, stave);
    }

    // Add click handler for adding notes
    if (!readOnly) {
      const svg = container.querySelector('svg');
      if (svg) {
        svg.style.cursor = 'pointer';
        svg.addEventListener('click', handleStaffClick);
      }
    }

    renderer.resize(720, 150);
  };

  const handleStaffClick = (event) => {
    if (readOnly) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert click position to MIDI note
    const midi = yToMidi(y, clef);
    
    if (midi !== null) {
      const newNote = {
        midi,
        duration: currentDuration,
        accidental: currentAccidental
      };
      
      onNotesChange([...notes, newNote]);
      setSelectedNoteIndex(notes.length);
    }
  };

  const yToMidi = (y, clef) => {
    // Staff is at y=40, each line is ~10 pixels apart
    const staffTop = 40;
    const lineSpacing = 10;
    
    // Calculate which line/space was clicked
    const relativeY = y - staffTop;
    const lineNumber = Math.round(relativeY / (lineSpacing / 2));
    
    // Convert to MIDI based on clef
    // In VexFlow, staff lines are spaced 10 pixels apart
    // Each semitone = 5 pixels (half a line)
    let midi;
    if (clef === 'bass') {
      // Bass clef: F3 (MIDI 53) is on 4th line (line 4 = 40 + 3*10 = 70)
      // Line 0 = C3 (MIDI 48), line 4 = F3 (MIDI 53)
      const baseMidi = 48; // C3
      const baseLine = 0; // Top line of bass staff
      midi = baseMidi + (lineNumber - baseLine) * 0.5;
    } else {
      // Treble clef: E4 (MIDI 64) is on first line (line 0 = 40)
      // Line 0 = E4 (MIDI 64), line 4 = G4 (MIDI 67)
      const baseMidi = 64; // E4
      const baseLine = 0; // First line of treble staff
      midi = baseMidi + (lineNumber - baseLine) * 0.5;
    }
    
    return Math.max(21, Math.min(108, Math.round(midi))); // Clamp to valid MIDI range
  };

  const midiToVexFlowNote = (midi) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  };

  const handleNoteClick = (index) => {
    if (readOnly) return;
    setSelectedNoteIndex(index === selectedNoteIndex ? null : index);
  };

  const deleteSelectedNote = () => {
    if (selectedNoteIndex !== null && !readOnly) {
      const newNotes = notes.filter((_, i) => i !== selectedNoteIndex);
      onNotesChange(newNotes);
      setSelectedNoteIndex(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (readOnly) return;
      
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
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedNoteIndex, readOnly]);

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
        <div ref={containerRef} style={{ width: '100%', overflow: 'auto' }} />
        {!readOnly && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="caption">Duration:</Typography>
            {[
              { value: 'w', label: '𝅝', title: 'Whole note' },
              { value: 'h', label: '𝅗𝅥', title: 'Half note' },
              { value: 'q', label: '♩', title: 'Quarter note' },
              { value: '8', label: '♫', title: 'Eighth note' },
              { value: '16', label: '♬', title: 'Sixteenth note' }
            ].map(({ value, label, title }) => (
              <button
                key={value}
                onClick={() => setCurrentDuration(value)}
                title={title}
                style={{
                  padding: '4px 8px',
                  border: currentDuration === value ? '2px solid #1976d2' : '1px solid #ccc',
                  backgroundColor: currentDuration === value ? '#e3f2fd' : 'white',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontFamily: 'serif',
                  minWidth: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {label}
              </button>
            ))}
            <Typography variant="caption" sx={{ ml: 2 }}>Accidental:</Typography>
            {[null, '#', 'b', 'n'].map(acc => (
              <button
                key={acc || 'nat'}
                onClick={() => setCurrentAccidental(acc)}
                style={{
                  padding: '4px 8px',
                  border: currentAccidental === acc ? '2px solid #1976d2' : '1px solid #ccc',
                  backgroundColor: currentAccidental === acc ? '#e3f2fd' : 'white',
                  cursor: 'pointer'
                }}
              >
                {acc || '♮'}
              </button>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default StaffEditor;

