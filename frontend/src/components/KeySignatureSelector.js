import React, { useEffect, useRef } from 'react';
import { Box, Menu, MenuItem, Typography, Button } from '@mui/material';
import Vex from 'vexflow';

/**
 * Key signature selector with visual representation
 */
const KeySignatureSelector = ({ value, onChange, label = "Key Signature" }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const previewRef = useRef(null);
  const menuItemRefs = useRef({});

  const keys = [
    { name: 'C', fifths: 0, label: 'C Major / A Minor' },
    { name: 'G', fifths: 1, label: 'G Major / E Minor' },
    { name: 'D', fifths: 2, label: 'D Major / B Minor' },
    { name: 'A', fifths: 3, label: 'A Major / F# Minor' },
    { name: 'E', fifths: 4, label: 'E Major / C# Minor' },
    { name: 'B', fifths: 5, label: 'B Major / G# Minor' },
    { name: 'F#', fifths: 6, label: 'F# Major / D# Minor' },
    { name: 'F', fifths: -1, label: 'F Major / D Minor' },
    { name: 'Bb', fifths: -2, label: 'Bb Major / G Minor' },
    { name: 'Eb', fifths: -3, label: 'Eb Major / C Minor' },
    { name: 'Ab', fifths: -4, label: 'Ab Major / F Minor' },
    { name: 'Db', fifths: -5, label: 'Db Major / Bb Minor' },
    { name: 'Gb', fifths: -6, label: 'Gb Major / Eb Minor' }
  ];

  const renderKeySignature = (container, keyName, fifths) => {
    if (!container) return;

    container.innerHTML = '';
    const { Renderer, Stave } = Vex.Flow;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    const context = renderer.getContext();
    
    const stave = new Stave(0, 0, 60);
    stave.addClef('treble');
    
    if (fifths !== 0) {
      if (fifths > 0) {
        stave.addKeySignature(fifths);
      } else {
        // For flats, try using key name
        try {
          stave.addKeySignature(keyName);
        } catch (e) {
          // Fallback: skip if not supported
        }
      }
    }
    
    stave.setContext(context).draw();
    renderer.resize(60, 30);
  };

  useEffect(() => {
    const selectedKey = keys.find(k => k.name === value) || keys[0];
    if (previewRef.current) {
      renderKeySignature(previewRef.current, selectedKey.name, selectedKey.fifths);
    }
  }, [value]);

  useEffect(() => {
    // Render all menu items when menu opens
    if (anchorEl) {
      keys.forEach(key => {
        const ref = menuItemRefs.current[key.name];
        if (ref) {
          renderKeySignature(ref, key.name, key.fifths);
        }
      });
    }
  }, [anchorEl]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (key) => {
    onChange(key.name);
    handleClose();
  };

  const selectedKey = keys.find(k => k.name === value) || keys[0];

  return (
    <Box>
      <Button
        variant="outlined"
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: '140px',
          justifyContent: 'flex-start'
        }}
      >
        <div
          ref={previewRef}
          style={{ width: '60px', height: '30px' }}
        />
        <Typography variant="body2">{selectedKey.name}</Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 500,
            width: '280px'
          }
        }}
      >
        {keys.map((key) => (
          <MenuItem
            key={key.name}
            onClick={() => handleSelect(key)}
            selected={key.name === value}
            sx={{ py: 1.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <div
                ref={el => menuItemRefs.current[key.name] = el}
                style={{
                  width: '60px',
                  height: '30px',
                  border: '1px solid #eee',
                  borderRadius: '2px',
                  backgroundColor: '#fafafa'
                }}
              />
              <Box>
                <Typography variant="body2" fontWeight={key.name === value ? 'bold' : 'normal'}>
                  {key.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {key.label}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default KeySignatureSelector;

