import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Toolbar,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Settings,
  PlayArrow,
  Stop
} from '@mui/icons-material';
import EnhancedStaffEditor from './EnhancedStaffEditor';
import AdvancedMusicEditor from './AdvancedMusicEditor';
import ProfessionalMusicEditor from './ProfessionalMusicEditor';
import DirectionEditor from './DirectionEditor';
import PlaybackController from './PlaybackController';
import KeySignatureSelector from './KeySignatureSelector';
import HarmonicFunctionEditor from './HarmonicFunctionEditor';
import { parseMusicXML, organizeNotesForRendering } from './MusicXMLParser';
import SheetMusicDisplay from './SheetMusicDisplay';

/**
 * Main sheet music view - Professional music editor interface
 */
const SheetMusicView = ({
  showRomanNumerals = true,
  showInversions = true,
  showFiguredBass = true,
  staffCount = 2, // 2 or 4
  onExport,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  // Musical settings
  const [keySignature, setKeySignature] = useState('Bb');
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tempo, setTempo] = useState(120);
  const [measures, setMeasures] = useState(1);
  
  // Staff data - organized by staff and voice
  const [staffData, setStaffData] = useState({
    staff1: { // Treble staff
      voices: {
        soprano: [],
        alto: []
      }
    },
    staff2: { // Bass staff
      voices: {
        tenor: [],
        bass: []
      }
    }
  });

  // Directions (Roman numerals, figured bass)
  const [directions, setDirections] = useState([]);
  
  // Harmonic functions
  const [harmonicFunctions, setHarmonicFunctions] = useState([]);

  // Loaded MusicXML data
  const [loadedMusicData, setLoadedMusicData] = useState(null);

  const handleStaffNotesChange = (staffKey, voiceKey, newNotes) => {
    setStaffData(prev => ({
      ...prev,
      [staffKey]: {
        ...prev[staffKey],
        voices: {
          ...prev[staffKey].voices,
          [voiceKey]: newNotes
        }
      }
    }));
  };

  const handleUploadMusicXML = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = await parseMusicXML(text);
      const organized = organizeNotesForRendering(parsed);
      
      setLoadedMusicData({
        ...parsed,
        ...organized
      });

      // Update settings from parsed data
      if (parsed.metadata) {
        if (parsed.metadata.key) {
          const { fifths } = parsed.metadata.key;
          const keyMap = {
            0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#',
            '-1': 'F', '-2': 'Bb', '-3': 'Eb', '-4': 'Ab', '-5': 'Db', '-6': 'Gb'
          };
          setKeySignature(keyMap[fifths] || 'C');
        }
        if (parsed.metadata.timeSignature) {
          const { beats, beatType } = parsed.metadata.timeSignature;
          setTimeSignature(`${beats}/${beatType}`);
        }
      }

      // Update staff data
      if (organized.staff1) {
        setStaffData(prev => ({
          ...prev,
          staff1: organized.staff1,
          staff2: organized.staff2 || prev.staff2
        }));
      }

      // Update directions
      if (organized.directions) {
        setDirections(organized.directions);
      }

      setUploadDialogOpen(false);
    } catch (error) {
      console.error('Error parsing MusicXML:', error);
      alert('Error loading MusicXML file: ' + error.message);
    }
  };

  const handleExportMusicXML = () => {
    // Convert staff data to MusicXML format
    const musicXML = generateMusicXML();
    const blob = new Blob([musicXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'harmony_exercise.musicxml';
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateMusicXML = () => {
    // Generate MusicXML from current staff data
    // This is a simplified version - full implementation would be more complex
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.0">
  <part-list>
    <score-part id="P1">
      <part-name>Choir</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>256</divisions>
        <key>
          <fifths>${getKeyFifths(keySignature)}</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>${timeSignature.split('/')[0]}</beats>
          <beat-type>${timeSignature.split('/')[1]}</beat-type>
        </time>
        <staves>2</staves>
        <clef number="1">
          <sign>G</sign>
          <line>2</line>
        </clef>
        <clef number="2">
          <sign>F</sign>
          <line>4</line>
        </clef>
      </attributes>`;

    // Add notes for each voice
    const allNotes = [];
    Object.keys(staffData.staff1.voices).forEach(voiceKey => {
      staffData.staff1.voices[voiceKey].forEach((note, index) => {
        allNotes.push({ ...note, voice: voiceKey === 'soprano' ? 1 : 2, staff: 1, time: index * 256 });
      });
    });
    Object.keys(staffData.staff2.voices).forEach(voiceKey => {
      staffData.staff2.voices[voiceKey].forEach((note, index) => {
        allNotes.push({ ...note, voice: voiceKey === 'tenor' ? 7 : 8, staff: 2, time: index * 256 });
      });
    });

    allNotes.sort((a, b) => a.time - b.time).forEach(note => {
      xml += `
      <note>
        <pitch>
          <step>${midiToStep(note.midi)}</step>
          ${getAlter(note.midi) !== 0 ? `<alter>${getAlter(note.midi)}</alter>` : ''}
          <octave>${Math.floor(note.midi / 12) - 1}</octave>
        </pitch>
        <duration>256</duration>
        <voice>${note.voice}</voice>
        <type>quarter</type>
        <staff>${note.staff}</staff>
      </note>`;
    });

    // Add directions
    directions.forEach(dir => {
      xml += `
      <direction>
        <direction-type>
          <words>${dir.text}</words>
        </direction-type>
        <voice>${dir.voice || 1}</voice>
        <staff>${dir.staff || 1}</staff>
      </direction>`;
    });

    xml += `
    </measure>
  </part>
</score-partwise>`;

    return xml;
  };

  const getKeyFifths = (key) => {
    const keyMap = {
      'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6,
      'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6
    };
    return keyMap[key] || 0;
  };

  const midiToStep = (midi) => {
    const steps = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    return steps[midi % 12];
  };

  const getAlter = (midi) => {
    const alters = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
    return alters[midi % 12];
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Compact Toolbar */}
      <Paper elevation={1} sx={{ borderRadius: 0 }}>
        <Toolbar variant="dense" sx={{ minHeight: '48px !important', gap: 1, px: 2 }}>
          <IconButton size="small" onClick={() => setUploadDialogOpen(true)} title="Upload MusicXML">
            <Upload fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleExportMusicXML} title="Download MusicXML">
            <Download fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton size="small" onClick={() => setZoom(prev => Math.max(prev - 10, 50))} title="Zoom Out">
            <ZoomOut fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ minWidth: '45px', textAlign: 'center' }}>
            {zoom}%
          </Typography>
          <IconButton size="small" onClick={() => setZoom(prev => Math.min(prev + 10, 200))} title="Zoom In">
            <ZoomIn fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <IconButton size="small" onClick={() => setShowSettings(true)} title="Settings">
            <Settings fontSize="small" />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Save />}
            onClick={() => onSave && onSave(staffData)}
            sx={{ textTransform: 'none' }}
          >
            Save
          </Button>
        </Toolbar>
      </Paper>

      {/* Main content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)} 
          sx={{ 
            mb: 3,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48
            }
          }}
        >
          <Tab label="Edit" />
          <Tab label="Harmonic Functions" />
          <Tab label="View" />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Playback Controller */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <PlaybackController 
                notes={staffData.staff2.voices.bass}
                tempo={tempo}
                clef="bass"
              />
            </Paper>

            {/* Staff 1 - Treble (Soprano & Alto) */}
            {staffCount === 4 && (
              <>
                <ProfessionalMusicEditor
                  staffId="soprano"
                  clef="treble"
                  keySignature={keySignature}
                  timeSignature={timeSignature}
                  notes={staffData.staff1.voices.soprano}
                  onNotesChange={(notes) => handleStaffNotesChange('staff1', 'soprano', notes)}
                  onKeySignatureChange={setKeySignature}
                  staffLabel="Soprano"
                  showLabels={true}
                  measures={measures}
                  tempo={tempo}
                />
                <ProfessionalMusicEditor
                  staffId="alto"
                  clef="treble"
                  keySignature={keySignature}
                  timeSignature={timeSignature}
                  notes={staffData.staff1.voices.alto}
                  onNotesChange={(notes) => handleStaffNotesChange('staff1', 'alto', notes)}
                  onKeySignatureChange={setKeySignature}
                  staffLabel="Alto"
                  showLabels={true}
                  measures={measures}
                  tempo={tempo}
                />
              </>
            )}

            {/* Staff 2 - Bass (Tenor & Bass) */}
            {staffCount === 4 && (
              <EnhancedStaffEditor
                staffId="tenor"
                clef="treble"
                keySignature={keySignature}
                timeSignature={timeSignature}
                notes={staffData.staff2.voices.tenor}
                onNotesChange={(notes) => handleStaffNotesChange('staff2', 'tenor', notes)}
                onKeySignatureChange={setKeySignature}
                staffLabel="Tenor"
                showLabels={true}
                measures={measures}
              />
            )}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                Bass
              </Typography>
              <EnhancedStaffEditor
                staffId="bass"
                clef="bass"
                keySignature={keySignature}
                timeSignature={timeSignature}
                notes={staffData.staff2.voices.bass}
                onNotesChange={(notes) => handleStaffNotesChange('staff2', 'bass', notes)}
                onKeySignatureChange={setKeySignature}
                staffLabel=""
                showLabels={false}
                measures={measures}
              />
            </Paper>
            
            {/* Direction Editor for figured bass and Roman numerals */}
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Directions (Roman Numerals / Figured Bass)
              </Typography>
              <DirectionEditor
                directions={directions}
                onDirectionsChange={setDirections}
                staff={2}
              />
            </Paper>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Paper elevation={0} sx={{ p: 3, mb: 2, bgcolor: 'white', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Harmonic Functions Editor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter harmonic functions using notation like T{'{'}{'}'}, D{'{'}extra: 7{'}'}, S{'{'}position: 3{'}'}
              </Typography>
              <HarmonicFunctionEditor
                value={harmonicFunctions}
                onChange={setHarmonicFunctions}
                keySignature={keySignature}
              />
            </Paper>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={async () => {
                  try {
                    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                    const response = await fetch(`${apiUrl}/api/harmonize-functions`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        functions: harmonicFunctions,
                        key_signature: keySignature
                      })
                    });
                    const data = await response.json();
                    if (data.success) {
                      // Update staff data with solution
                      // Implementation depends on response format
                    }
                  } catch (error) {
                    console.error('Error solving harmonic functions:', error);
                  }
                }}
                disabled={harmonicFunctions.length === 0}
              >
                Solve
              </Button>
              <Button
                variant="outlined"
                onClick={() => setHarmonicFunctions([])}
              >
                Clear
              </Button>
            </Box>
          </Box>
        )}

        {activeTab === 2 && loadedMusicData && (
          <SheetMusicDisplay
            musicData={loadedMusicData}
            showRomanNumerals={showRomanNumerals}
            showInversions={showInversions}
            showFiguredBass={showFiguredBass}
            width={800 * (zoom / 100)}
          />
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload MusicXML File</DialogTitle>
        <DialogContent>
          <input
            type="file"
            accept=".musicxml,.xml"
            onChange={handleUploadMusicXML}
            style={{ marginTop: '16px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Score Settings</DialogTitle>
        <DialogContent>
          <TextField
            label="Key Signature"
            select
            fullWidth
            value={keySignature}
            onChange={(e) => setKeySignature(e.target.value)}
            sx={{ mt: 2 }}
            SelectProps={{
              native: true
            }}
          >
            {['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'].map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </TextField>
          <TextField
            label="Time Signature"
            select
            fullWidth
            value={timeSignature}
            onChange={(e) => setTimeSignature(e.target.value)}
            sx={{ mt: 2 }}
            SelectProps={{
              native: true
            }}
          >
            {['4/4', '3/4', '2/4', '6/8', '9/8', '12/8'].map(ts => (
              <option key={ts} value={ts}>{ts}</option>
            ))}
          </TextField>
          <TextField
            label="Tempo (BPM)"
            type="number"
            fullWidth
            value={tempo}
            onChange={(e) => setTempo(parseInt(e.target.value))}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Number of Measures"
            type="number"
            fullWidth
            value={measures}
            onChange={(e) => setMeasures(Math.max(1, parseInt(e.target.value) || 1))}
            sx={{ mt: 2 }}
            inputProps={{ min: 1, max: 32 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSettings(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SheetMusicView;

