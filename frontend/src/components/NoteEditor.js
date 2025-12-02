import React, { useState } from 'react';
import { Paper, Button, Grid, IconButton, Typography } from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';

const NoteEditor = ({ voice, notes, onNotesChange, clef = 'treble' }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const midiToNoteName = (midi) => {
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}${octave}`;
  };

  const noteNameToMidi = (name) => {
    // Parse "C4" format
    const match = name.match(/([A-G]#?)(\d+)/);
    if (!match) return 60; // Default to C4
    
    const noteName = match[1];
    const octave = parseInt(match[2]);
    const noteIndex = noteNames.indexOf(noteName);
    
    return (octave + 1) * 12 + noteIndex;
  };

  const addNote = (midi) => {
    onNotesChange([...notes, midi]);
  };

  const removeNote = (index) => {
    const newNotes = notes.filter((_, i) => i !== index);
    onNotesChange(newNotes);
  };

  const transposeNote = (index, semitones) => {
    const newNotes = [...notes];
    newNotes[index] = Math.max(0, Math.min(127, newNotes[index] + semitones));
    onNotesChange(newNotes);
  };

  const getDefaultNote = () => {
    // Default notes based on voice and clef
    const defaults = {
      'S': 72, // C5
      'A': 67, // G4
      'T': 60, // C4
      'B': 48  // C3
    };
    return defaults[voice] || 60;
  };

  const quickAddNotes = () => {
    const defaultNote = getDefaultNote();
    const quickNotes = [
      defaultNote,
      defaultNote + 2,
      defaultNote + 4,
      defaultNote + 5,
      defaultNote + 7
    ];
    onNotesChange([...notes, ...quickNotes]);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        {voice} Voice ({clef === 'bass' ? 'Bass Clef' : 'Treble Clef'})
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {notes.map((note, index) => (
              <Paper
                key={index}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  backgroundColor: selectedIndex === index ? 'primary.light' : 'grey.100',
                  '&:hover': { backgroundColor: 'primary.light' }
                }}
                onClick={() => setSelectedIndex(index === selectedIndex ? null : index)}
              >
                <Typography variant="body2">{midiToNoteName(note)}</Typography>
                {selectedIndex === index && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        transposeNote(index, 1);
                      }}
                    >
                      <ArrowUpward fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        transposeNote(index, -1);
                      }}
                    >
                      <ArrowDownward fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNote(index);
                        setSelectedIndex(null);
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </div>
                )}
              </Paper>
            ))}
          </div>
        </Grid>
        
        <Grid item xs={12}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Add />}
              onClick={() => addNote(getDefaultNote())}
            >
              Add Note
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={quickAddNotes}
            >
              Add Scale (5 notes)
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={() => onNotesChange([])}
            >
              Clear All
            </Button>
          </div>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default NoteEditor;

