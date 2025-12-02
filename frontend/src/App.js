import React, { useState, useRef, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { Settings, Save, PlayArrow, Download } from '@mui/icons-material';
import Vex from 'vexflow';
import axios from 'axios';
import NoteEditor from './components/NoteEditor';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [staffCount, setStaffCount] = useState(4);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [keySignature, setKeySignature] = useState('C');
  const [showRomanNumerals, setShowRomanNumerals] = useState(true);
  const [showInversions, setShowInversions] = useState(true);
  const [showFiguredBass, setShowFiguredBass] = useState(false);
  const [voices, setVoices] = useState({
    S: [],
    A: [],
    T: [],
    B: []
  });
  const [solutionVoices, setSolutionVoices] = useState({
    S: [],
    A: [],
    T: [],
    B: []
  });
  const [exerciseType, setExerciseType] = useState('bass_figured');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const staffRefs = {
    original: useRef(null),
    solution: useRef(null)
  };

  const handleVoiceChange = (voice, newNotes) => {
    setVoices(prev => ({
      ...prev,
      [voice]: newNotes
    }));
  };

  useEffect(() => {
    renderStaves();
  }, [voices, solutionVoices, staffCount, timeSignature, keySignature]);

  const renderStaves = () => {
    // Render original staves
    if (staffRefs.original.current) {
      staffRefs.original.current.innerHTML = '';
      renderStaffSet(staffRefs.original.current, voices, 'original');
    }

    // Render solution staves
    if (staffRefs.solution.current) {
      staffRefs.solution.current.innerHTML = '';
      renderStaffSet(staffRefs.solution.current, solutionVoices, 'solution');
    }
  };

  const renderStaffSet = (container, voiceData, type) => {
    const { Renderer, Stave, StaveNote, Voice, Formatter } = Vex.Flow;
    
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    const voicesToRender = staffCount === 4 
      ? ['S', 'A', 'T', 'B'] 
      : ['S', 'B'];

    let yPos = 10;
    const staves = [];

    voicesToRender.forEach((voice, index) => {
      const stave = new Stave(10, yPos, 600);
      
      // Set clef
      if (voice === 'B' || (staffCount === 2 && index === 1)) {
        stave.addClef('bass');
      } else {
        stave.addClef('treble');
      }

      // Add time signature
      const [num, den] = timeSignature.split('/');
      stave.addTimeSignature(`${num}/${den}`);
      
      // Add key signature
      if (keySignature !== 'C') {
        stave.addKeySignature(keySignature);
      }

      stave.setContext(context).draw();
      staves.push({ stave, voice, yPos });
      yPos += 120;
    });

    // Add notes
    staves.forEach(({ stave, voice }) => {
      const notes = voiceData[voice] || [];
      if (notes.length > 0) {
        const staveNotes = notes.map(note => {
          const noteName = midiToNoteName(note);
          return new StaveNote({
            clef: voice === 'B' ? 'bass' : 'treble',
            keys: [noteName],
            duration: 'q'
          });
        });

        const voiceObj = new Voice({ num_beats: notes.length, beat_value: 4 });
        voiceObj.addTickables(staveNotes);
        new Formatter().joinVoices([voiceObj]).format([voiceObj], 500);
        voiceObj.draw(context, stave);
      }
    });
  };

  const midiToNoteName = (midi) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = noteNames[midi % 12];
    return `${note}/${octave}`;
  };

  const handleHarmonize = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/harmonize`, {
        bass_line: voices.B,
        exercise_type: exerciseType
      });

      if (response.data.success) {
        const result = response.data.voices;
        const newSolution = {
          S: result.map(v => v.S),
          A: result.map(v => v.A),
          T: result.map(v => v.T),
          B: result.map(v => v.B)
        };
        setSolutionVoices(newSolution);
      }
    } catch (error) {
      console.error('Error harmonizing:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/export-pdf`, {
        voices: [voices, solutionVoices],
        settings: {
          tempo,
          time_signature: timeSignature,
          key_signature: keySignature,
          show_roman_numerals: showRomanNumerals,
          show_inversions: showInversions,
          show_figured_bass: showFiguredBass,
          staff_count: staffCount
        }
      });

      if (response.data.success) {
        // Download PDF
        window.open(`${API_URL}${response.data.pdf_url}`, '_blank');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error exporting PDF: ' + error.message);
    }
  };

  const addNote = (voice, note) => {
    setVoices(prev => ({
      ...prev,
      [voice]: [...prev[voice], note]
    }));
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Harmony Exercise Solver
          </Typography>
          <IconButton color="inherit" onClick={() => setShowSettings(!showSettings)}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Settings Panel */}
          {showSettings && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Staff Count</InputLabel>
                      <Select
                        value={staffCount}
                        onChange={(e) => setStaffCount(e.target.value)}
                      >
                        <MenuItem value={2}>2 Staves</MenuItem>
                        <MenuItem value={4}>4 Staves</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      label="Tempo"
                      type="number"
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Time Signature</InputLabel>
                      <Select
                        value={timeSignature}
                        onChange={(e) => setTimeSignature(e.target.value)}
                      >
                        <MenuItem value="4/4">4/4</MenuItem>
                        <MenuItem value="3/4">3/4</MenuItem>
                        <MenuItem value="2/4">2/4</MenuItem>
                        <MenuItem value="6/8">6/8</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Key Signature</InputLabel>
                      <Select
                        value={keySignature}
                        onChange={(e) => setKeySignature(e.target.value)}
                      >
                        <MenuItem value="C">C</MenuItem>
                        <MenuItem value="G">G</MenuItem>
                        <MenuItem value="D">D</MenuItem>
                        <MenuItem value="A">A</MenuItem>
                        <MenuItem value="E">E</MenuItem>
                        <MenuItem value="B">B</MenuItem>
                        <MenuItem value="F#">F#</MenuItem>
                        <MenuItem value="F">F</MenuItem>
                        <MenuItem value="Bb">Bb</MenuItem>
                        <MenuItem value="Eb">Eb</MenuItem>
                        <MenuItem value="Ab">Ab</MenuItem>
                        <MenuItem value="Db">Db</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Exercise Type</InputLabel>
                      <Select
                        value={exerciseType}
                        onChange={(e) => setExerciseType(e.target.value)}
                      >
                        <MenuItem value="bass_figured">Bass Line</MenuItem>
                        <MenuItem value="melody">Melody</MenuItem>
                        <MenuItem value="counterpoint">Counterpoint</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showRomanNumerals}
                          onChange={(e) => setShowRomanNumerals(e.target.checked)}
                        />
                      }
                      label="Show Roman Numerals"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showInversions}
                          onChange={(e) => setShowInversions(e.target.checked)}
                        />
                      }
                      label="Show Inversions"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={showFiguredBass}
                          onChange={(e) => setShowFiguredBass(e.target.checked)}
                        />
                      }
                      label="Show Figured Bass"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Note Editors */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Edit Notes</Typography>
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                <Tab label="Original" />
                <Tab label="Solution" />
              </Tabs>
              
              {activeTab === 0 && (
                <Box sx={{ mt: 2 }}>
                  {staffCount === 4 ? (
                    <>
                      <NoteEditor
                        voice="S"
                        notes={voices.S}
                        onNotesChange={(notes) => handleVoiceChange('S', notes)}
                        clef="treble"
                      />
                      <NoteEditor
                        voice="A"
                        notes={voices.A}
                        onNotesChange={(notes) => handleVoiceChange('A', notes)}
                        clef="treble"
                      />
                      <NoteEditor
                        voice="T"
                        notes={voices.T}
                        onNotesChange={(notes) => handleVoiceChange('T', notes)}
                        clef="bass"
                      />
                      <NoteEditor
                        voice="B"
                        notes={voices.B}
                        onNotesChange={(notes) => handleVoiceChange('B', notes)}
                        clef="bass"
                      />
                    </>
                  ) : (
                    <>
                      <NoteEditor
                        voice="S"
                        notes={voices.S}
                        onNotesChange={(notes) => handleVoiceChange('S', notes)}
                        clef="treble"
                      />
                      <NoteEditor
                        voice="B"
                        notes={voices.B}
                        onNotesChange={(notes) => handleVoiceChange('B', notes)}
                        clef="bass"
                      />
                    </>
                  )}
                </Box>
              )}
              
              {activeTab === 1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Solution will appear here after solving
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Original Staff */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Original</Typography>
              <div ref={staffRefs.original} style={{ minHeight: '400px' }} />
            </Paper>
          </Grid>

          {/* Solution Staff */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Solution</Typography>
              <div ref={staffRefs.solution} style={{ minHeight: '400px' }} />
            </Paper>
          </Grid>

          {/* Controls */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleHarmonize}
              >
                Solve
              </Button>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportPDF}
              >
                Export PDF
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}

export default App;

