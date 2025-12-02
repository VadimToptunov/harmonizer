import React, { useRef, useEffect } from 'react';
import { Paper, Typography } from '@mui/material';
import Vex from 'vexflow';

/**
 * Component for displaying full sheet music with multiple staves,
 * figured bass, and Roman numeral analysis
 */
const SheetMusicDisplay = ({ 
  musicData, 
  showRomanNumerals = true, 
  showInversions = true, 
  showFiguredBass = true,
  width = 800 
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!musicData || !containerRef.current) return;

    renderSheetMusic(musicData, {
      showRomanNumerals,
      showInversions,
      showFiguredBass,
      width
    });
  }, [musicData, showRomanNumerals, showInversions, showFiguredBass, width]);

  const renderSheetMusic = (data, options) => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    
    const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    // Determine number of staves (usually 2 for SATB)
    const numStaves = data.staff1 ? 2 : 1;
    const staves = [];
    let yPos = 20;
    const staffWidth = width - 40;
    const staffSpacing = 150;

    // Create staves
    for (let i = 0; i < numStaves; i++) {
      const staffKey = i === 0 ? 'staff1' : 'staff2';
      const staffData = data[staffKey];
      
      if (!staffData) continue;

      const stave = new Stave(20, yPos, staffWidth);
      
      // Add clef
      if (i === 0) {
        stave.addClef('treble');
      } else {
        stave.addClef('bass');
      }

      // Add time signature
      if (data.metadata?.timeSignature) {
        const { beats, beatType } = data.metadata.timeSignature;
        stave.addTimeSignature(`${beats}/${beatType}`);
      }

      // Add key signature
      // Convert fifths to VexFlow format
      if (data.metadata?.key) {
        const { fifths } = data.metadata.key;
        if (fifths !== 0) {
          // VexFlow accepts key names or positive integers for sharps
          // For flats, we need to use key names
          const fifthsToKey = {
            1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#',
            '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb'
          };
          const keyName = fifthsToKey[fifths] || fifthsToKey[String(fifths)];
          if (keyName) {
            try {
              stave.addKeySignature(keyName);
            } catch (e) {
              // Fallback: use fifths for sharps only
              if (fifths > 0) {
                stave.addKeySignature(fifths);
              }
            }
          } else if (fifths > 0) {
            stave.addKeySignature(fifths);
          }
        }
      }

      stave.setContext(context).draw();
      
      // Get all voices for this staff
      const voices = Object.keys(staffData.voices || {});
      const voiceObjects = [];
      
      voices.forEach(voiceKey => {
        const notes = staffData.voices[voiceKey];
        if (!notes || notes.length === 0) return;

        // Group notes by measure/time
        const notesByTime = groupNotesByTime(notes);
        
        const staveNotes = [];
        notesByTime.forEach(({ notes: timeNotes, time }) => {
          if (timeNotes.length === 0) return;

          // Handle chords (multiple notes at same time)
          if (timeNotes.length > 1) {
            const chordKeys = timeNotes.map(n => midiToVexFlowNote(n.midi));
            const staveNote = new StaveNote({
              clef: i === 0 ? 'treble' : 'bass',
              keys: chordKeys,
              duration: getDurationString(timeNotes[0].duration, data.metadata?.divisions || 256)
            });
            
            // Add accidentals if needed
            timeNotes.forEach((note, idx) => {
              if (note.pitch.alter !== 0) {
                const accidental = note.pitch.alter === 1 ? '#' : 'b';
                staveNote.addAccidental(idx, new Accidental(accidental));
              }
            });
            
            staveNotes.push(staveNote);
          } else {
            const note = timeNotes[0];
            const noteKey = midiToVexFlowNote(note.midi);
            const staveNote = new StaveNote({
              clef: i === 0 ? 'treble' : 'bass',
              keys: [noteKey],
              duration: getDurationString(note.duration, data.metadata?.divisions || 256)
            });
            
            if (note.pitch.alter !== 0) {
              const accidental = note.pitch.alter === 1 ? '#' : 'b';
              staveNote.addAccidental(0, new Accidental(accidental));
            }
            
            staveNotes.push(staveNote);
          }
        });

        if (staveNotes.length > 0) {
          const voiceObj = new Voice({ 
            num_beats: staveNotes.length * 4, 
            beat_value: 4 
          });
          voiceObj.addTickables(staveNotes);
          voiceObjects.push(voiceObj);
        }
      });

      if (voiceObjects.length > 0) {
        new Formatter().joinVoices(voiceObjects).format(voiceObjects, staffWidth - 100);
        voiceObjects.forEach(voice => voice.draw(context, stave));
      }

      // Add directions (Roman numerals, figured bass)
      if (data.directions && i === 1) { // Usually on bass staff
        data.directions.forEach(dir => {
          if (dir.staff === i + 1) {
            const xPos = 20 + (dir.offset / (data.metadata?.divisions || 256)) * 50;
            
            if (options.showRomanNumerals && dir.type === 'roman') {
              // Draw Roman numeral as text
              context.setFont('Arial', 12, 'bold');
              context.fillStyle = '#000000';
              context.fillText(dir.text, xPos, stave.getYForLine(12));
            }
            
            if (options.showFiguredBass && dir.type === 'figured') {
              // Draw figured bass as text
              context.setFont('Arial', 10, 'italic');
              context.fillStyle = '#000000';
              context.fillText(dir.text, xPos, stave.getYForLine(14));
            }
          }
        });
      }

      staves.push({ stave, yPos });
      yPos += staffSpacing;
    }

    // Set renderer size
    renderer.resize(width, yPos + 20);
  };

  const groupNotesByTime = (notes) => {
    const grouped = {};
    notes.forEach(note => {
      const time = note.time || 0;
      if (!grouped[time]) {
        grouped[time] = [];
      }
      grouped[time].push(note);
    });
    
    return Object.keys(grouped)
      .map(time => ({ time: parseInt(time), notes: grouped[time] }))
      .sort((a, b) => a.time - b.time);
  };

  const midiToVexFlowNote = (midi) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  };

  const getDurationString = (duration, divisions) => {
    // Convert duration to note type
    const quarter = divisions;
    if (duration === quarter) return 'q';
    if (duration === quarter * 2) return 'h';
    if (duration === quarter * 4) return 'w';
    if (duration === quarter / 2) return '8';
    if (duration === quarter / 4) return '16';
    if (duration === quarter * 3) return 'h';
    if (duration === quarter * 1.5) return 'qd';
    return 'q'; // Default to quarter
  };

  if (!musicData) {
    return (
      <Paper sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No music data to display
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, overflow: 'auto' }}>
      <div ref={containerRef} style={{ width: '100%', minHeight: '400px' }} />
    </Paper>
  );
};

export default SheetMusicDisplay;

