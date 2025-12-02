import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import SheetMusicView from './components/SheetMusicView';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [showRomanNumerals, setShowRomanNumerals] = useState(true);
  const [showInversions, setShowInversions] = useState(true);
  const [showFiguredBass, setShowFiguredBass] = useState(true);
  const [staffCount, setStaffCount] = useState(2);

  const handleSave = async (staffData) => {
    // Convert staff data to format for backend
    const voices = {
      S: staffData.staff1?.voices?.soprano?.map(n => n.midi || n) || [],
      A: staffData.staff1?.voices?.alto?.map(n => n.midi || n) || [],
      T: staffData.staff2?.voices?.tenor?.map(n => n.midi || n) || [],
      B: staffData.staff2?.voices?.bass?.map(n => n.midi || n) || []
    };

    try {
      const response = await fetch(`${API_URL}/api/harmonize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bass_line: voices.B,
          exercise_type: 'bass_figured'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Harmonization result:', data);
        // Handle result - could update staffData with solution
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleExport = async (staffData) => {
    // Export to PDF via backend
    const voices = {
      S: staffData.staff1?.voices?.soprano?.map(n => n.midi || n) || [],
      A: staffData.staff1?.voices?.alto?.map(n => n.midi || n) || [],
      T: staffData.staff2?.voices?.tenor?.map(n => n.midi || n) || [],
      B: staffData.staff2?.voices?.bass?.map(n => n.midi || n) || []
    };

    try {
      const response = await fetch(`${API_URL}/api/export-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voices: [voices],
          settings: {
            show_roman_numerals: showRomanNumerals,
            show_inversions: showInversions,
            show_figured_bass: showFiguredBass,
            staff_count: staffCount
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'harmony_exercise.pdf';
        link.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };

  return (
    <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Harmony Exercise Solver - Professional Music Editor
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <SheetMusicView
          showRomanNumerals={showRomanNumerals}
          showInversions={showInversions}
          showFiguredBass={showFiguredBass}
          staffCount={staffCount}
          onSave={handleSave}
          onExport={handleExport}
        />
      </Box>
    </div>
  );
}

export default App;

