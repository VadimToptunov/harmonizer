import { createTheme } from '@mui/material/styles';

/**
 * Custom theme for the Harmonizer application
 * Supports light and dark mode with professional music notation aesthetics
 */

const getTheme = (mode) => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#64B5F6' : '#1976D2',
        light: isDark ? '#90CAF9' : '#42A5F5',
        dark: isDark ? '#1976D2' : '#1565C0',
        contrastText: '#fff',
      },
      secondary: {
        main: isDark ? '#FF8A65' : '#D32F2F',
        light: isDark ? '#FFAB91' : '#F44336',
        dark: isDark ? '#D32F2F' : '#C62828',
        contrastText: '#fff',
      },
      background: {
        default: isDark ? '#121212' : '#F5F5F5',
        paper: isDark ? '#1E1E1E' : '#FFFFFF',
        staff: isDark ? '#2A2A2A' : '#FAFAFA',
      },
      text: {
        primary: isDark ? '#E0E0E0' : '#212121',
        secondary: isDark ? '#B0B0B0' : '#757575',
      },
      staff: {
        line: isDark ? '#555555' : '#000000',
        grid: isDark ? '#333333' : '#E0E0E0',
        hover: isDark ? '#42A5F5' : '#2196F3',
        selected: isDark ? '#66BB6A' : '#4CAF50',
      },
      divider: isDark ? '#333333' : '#E0E0E0',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h6: {
        fontWeight: 600,
        fontSize: '1.1rem',
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
      caption: {
        fontSize: '0.75rem',
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 6,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#424242' : '#616161',
            fontSize: '0.75rem',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? '#333333' : '#E0E0E0'}`,
          },
        },
      },
    },
  });
};

export default getTheme;

