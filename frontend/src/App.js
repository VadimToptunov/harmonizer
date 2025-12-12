import React, { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { Save, Brightness4, Brightness7, HelpOutline } from '@mui/icons-material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import getTheme from './theme/theme';
import OnboardingTour from './components/OnboardingTour';
import './App.css';

// Lazy load heavy components for better initial load time
const SheetMusicView = lazy(() => import('./components/SheetMusicView'));

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [themeMode, setThemeMode] = useState('light');
  const [showRomanNumerals, setShowRomanNumerals] = useState(true);
  const [showInversions, setShowInversions] = useState(true);
  const [showFiguredBass, setShowFiguredBass] = useState(true);
  const [staffCount, setStaffCount] = useState(2);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Memoize theme to avoid unnecessary recalculations
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  
  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem('harmonizer_onboarding_completed');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

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
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ minHeight: '56px !important', px: 2 }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, fontSize: '1.1rem' }}>
              🎵 Harmonizer - Professional Music Editor
            </Typography>
            <Tooltip title="Help & Tutorial">
              <IconButton onClick={() => setShowOnboarding(true)} color="inherit" sx={{ mr: 1 }}>
                <HelpOutline />
              </IconButton>
            </Tooltip>
            <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleTheme} color="inherit" sx={{ mr: 1 }}>
                {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
            <Button
              color="inherit"
              startIcon={<Save />}
              onClick={() => handleSave({})}
              sx={{ ml: 1 }}
            >
              Save
            </Button>
          </Toolbar>
        </AppBar>
        
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          }>
            <SheetMusicView
              showRomanNumerals={showRomanNumerals}
              showInversions={showInversions}
              showFiguredBass={showFiguredBass}
              staffCount={staffCount}
              onSave={handleSave}
              onExport={handleExport}
            />
          </Suspense>
        </Box>
        
        <OnboardingTour 
          open={showOnboarding} 
          onClose={() => setShowOnboarding(false)} 
        />
      </div>
    </ThemeProvider>
  );
}

export default App;

