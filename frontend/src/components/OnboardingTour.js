import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import {
  MusicNote,
  Keyboard,
  TouchApp,
  Settings,
  AutoFixHigh,
} from '@mui/icons-material';

/**
 * Interactive onboarding tour for new users
 * Shows key features and keyboard shortcuts
 */
const OnboardingTour = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      label: 'Welcome',
      icon: <MusicNote fontSize="large" />,
      content: {
        title: '🎵 Welcome to Harmonizer!',
        description: 'Professional music notation editor with intelligent harmony rules.',
        features: [
          'Sibelius-style keyboard input',
          'Real-time note preview',
          'Automatic voice leading validation',
          'Export to PDF and MusicXML',
        ],
      },
    },
    {
      label: 'Adding Notes',
      icon: <TouchApp fontSize="large" />,
      content: {
        title: '🖱️ Adding Notes',
        description: 'Click on the staff to add notes. Hover to see note positions.',
        features: [
          'Click anywhere on the staff',
          'Blue line shows note position',
          'Select duration before clicking',
          'Add accidentals with # ♭ n buttons',
        ],
      },
    },
    {
      label: 'Keyboard Shortcuts',
      icon: <Keyboard fontSize="large" />,
      content: {
        title: '⌨️ Keyboard Shortcuts',
        description: 'Work faster with professional keyboard shortcuts.',
        features: [
          '1-6: Select note duration (whole, half, quarter, eighth, 16th, 32nd)',
          '# ♭ n: Add accidentals (sharp, flat, natural)',
          'r: Toggle rest',
          't: Toggle tie',
          '. (dot): Add dot',
          'Ctrl+Z / Ctrl+Shift+Z: Undo / Redo',
          'Ctrl+C / Ctrl+V: Copy / Paste',
        ],
      },
    },
    {
      label: 'Advanced Features',
      icon: <AutoFixHigh fontSize="large" />,
      content: {
        title: '✨ Advanced Features',
        description: 'Professional tools for complex scores.',
        features: [
          'Transpose: Shift notes up/down',
          'Respell: Change enharmonic spelling',
          'Chord mode: Add multiple notes at once',
          'Dynamics & Articulations',
          'Tuplets (triplets, quintuplets, etc.)',
          'Multiple staves and voices',
        ],
      },
    },
    {
      label: 'Settings & Export',
      icon: <Settings fontSize="large" />,
      content: {
        title: '⚙️ Settings & Export',
        description: 'Customize your workflow and export your work.',
        features: [
          'Dark/Light theme toggle',
          'Zoom in/out for better visibility',
          'Export to PDF',
          'Export to MusicXML',
          'Upload existing MusicXML files',
          'Adjust key signature, time signature, tempo',
        ],
      },
    },
  ];

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onClose();
      localStorage.setItem('harmonizer_onboarding_completed', 'true');
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('harmonizer_onboarding_completed', 'true');
  };

  const currentStep = steps[activeStep];

  return (
    <Dialog 
      open={open} 
      onClose={handleSkip} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {currentStep.icon}
          <Typography variant="h6" component="span">
            Getting Started with Harmonizer
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.50', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
            {currentStep.content.title}
          </Typography>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary' }}>
            {currentStep.content.description}
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            {currentStep.content.features.map((feature, idx) => (
              <Box 
                key={idx} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  mb: 1.5,
                  p: 1,
                  bgcolor: 'white',
                  borderRadius: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <Box 
                  sx={{ 
                    minWidth: 24, 
                    minHeight: 24, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    mr: 1.5,
                    mt: 0.3,
                  }}
                >
                  {idx + 1}
                </Box>
                <Typography variant="body2" sx={{ flex: 1, lineHeight: 1.6 }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {activeStep === steps.length - 1 && (
          <Paper 
            elevation={0} 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: 'success.50', 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'success.main',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
              🎉 You're ready to start composing!
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
              You can always access help by clicking the "?" icon in the toolbar.
            </Typography>
          </Paper>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleSkip} sx={{ mr: 'auto' }}>
          Skip Tutorial
        </Button>
        <Button 
          onClick={handleBack} 
          disabled={activeStep === 0}
        >
          Back
        </Button>
        <Button 
          variant="contained" 
          onClick={handleNext}
          sx={{ minWidth: 100 }}
        >
          {activeStep === steps.length - 1 ? 'Get Started' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OnboardingTour;

