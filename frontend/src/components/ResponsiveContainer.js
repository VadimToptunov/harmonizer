import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

/**
 * Responsive container that adapts layout for mobile/tablet/desktop
 * Provides breakpoint-aware styling
 */
const ResponsiveContainer = ({ children, sx = {}, ...props }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Responsive padding and layout adjustments
  const responsiveSx = {
    p: isMobile ? 1 : isTablet ? 2 : 3,
    ...sx,
  };

  return (
    <Box 
      sx={responsiveSx} 
      {...props}
      data-device={isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}
    >
      {children}
    </Box>
  );
};

export default ResponsiveContainer;

/**
 * Hook to get current device type
 */
export const useDeviceType = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
};

