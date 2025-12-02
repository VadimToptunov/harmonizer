import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PlayArrow, Pause, Stop, VolumeUp } from '@mui/icons-material';

/**
 * Playback controller for music playback
 */
const PlaybackController = ({ notes = [], tempo = 120, clef = 'treble' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioContextRef = useRef(null);
  const scheduledNotesRef = useRef([]);

  useEffect(() => {
    // Initialize Web Audio API
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore errors if already closed
          console.warn('AudioContext close error:', e);
        }
      }
    };
  }, []);

  const midiToFrequency = (midi) => {
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const playNote = (midi, duration, startTime) => {
    if (!audioContextRef.current) return;

    // Validate inputs
    if (typeof midi !== 'number' || !isFinite(midi) || midi < 0 || midi > 127) {
      console.warn(`Invalid MIDI value: ${midi}`);
      return;
    }

    if (typeof duration !== 'number' || !isFinite(duration) || duration <= 0) {
      console.warn(`Invalid duration: ${duration}`);
      return;
    }

    if (typeof startTime !== 'number' || !isFinite(startTime) || startTime < 0) {
      console.warn(`Invalid startTime: ${startTime}`);
      return;
    }

    const frequency = midiToFrequency(midi);
    
    // Validate frequency
    if (!isFinite(frequency) || frequency <= 0 || frequency > 20000) {
      console.warn(`Invalid frequency: ${frequency} for MIDI ${midi}`);
      return;
    }

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    const safeStartTime = Math.max(0, startTime);
    const safeDuration = Math.max(0.01, duration);

    gainNode.gain.setValueAtTime(0, safeStartTime);
    gainNode.gain.linearRampToValueAtTime(volume, safeStartTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, safeStartTime + safeDuration);

    oscillator.start(safeStartTime);
    oscillator.stop(safeStartTime + safeDuration);

    scheduledNotesRef.current.push(oscillator);
  };

  const playAllNotes = () => {
    if (!audioContextRef.current || notes.length === 0) return;

    const currentTime = audioContextRef.current.currentTime;
    const secondsPerBeat = 60 / (tempo > 0 && isFinite(tempo) ? tempo : 120);
    
    let timeOffset = 0;

    notes.forEach((note, index) => {
      if (note.rest || note.chord) {
        // Skip rest or chord (chords need special handling)
        const duration = getDurationInBeats(note.duration || 'q');
        timeOffset += duration * secondsPerBeat;
        return;
      }

      // Handle chord notes
      if (note.chord && note.notes && Array.isArray(note.notes)) {
        const duration = getDurationInBeats(note.duration || 'q') * secondsPerBeat;
        note.notes.forEach(chordMidi => {
          if (typeof chordMidi === 'number' && isFinite(chordMidi)) {
            playNote(chordMidi, duration, currentTime + timeOffset);
          }
        });
        timeOffset += duration;
        return;
      }

      // Regular note
      const midi = typeof note.midi === 'number' ? note.midi : (typeof note === 'number' ? note : null);
      
      if (midi === null || !isFinite(midi)) {
        console.warn(`Skipping invalid note at index ${index}:`, note);
        return;
      }

      const duration = getDurationInBeats(note.duration || 'q') * secondsPerBeat;
      
      if (isFinite(duration) && duration > 0) {
        playNote(midi, duration, currentTime + timeOffset);
        timeOffset += duration;
      }
    });
  };

  const getDurationInBeats = (duration) => {
    const durationMap = {
      'w': 4,
      'h': 2,
      'q': 1,
      '8': 0.5,
      '16': 0.25
    };
    return durationMap[duration] || 1;
  };

  const handlePlay = () => {
    if (isPlaying) {
      handlePause();
      return;
    }

    setIsPlaying(true);
    setCurrentNoteIndex(0);
    
    // Resume audio context if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    playAllNotes();
  };

  const handlePause = () => {
    setIsPlaying(false);
    scheduledNotesRef.current.forEach(oscillator => {
      try {
        oscillator.stop();
      } catch (e) {
        // Ignore errors
      }
    });
    scheduledNotesRef.current = [];
  };

  const handleStop = () => {
    handlePause();
    setCurrentNoteIndex(0);
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Playback
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <IconButton 
          color="primary" 
          onClick={handlePlay}
          disabled={notes.length === 0}
        >
          {isPlaying ? <Pause /> : <PlayArrow />}
        </IconButton>
        <IconButton 
          onClick={handleStop}
          disabled={!isPlaying && currentNoteIndex === 0}
        >
          <Stop />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <VolumeUp fontSize="small" />
          <Slider
            value={volume}
            onChange={(e, newValue) => setVolume(newValue)}
            min={0}
            max={1}
            step={0.1}
            sx={{ width: 150 }}
          />
          <Typography variant="caption">{Math.round(volume * 100)}%</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          Tempo: {tempo} BPM
        </Typography>
      </Box>
    </Box>
  );
};

export default PlaybackController;

