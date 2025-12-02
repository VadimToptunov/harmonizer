import React, { useState } from 'react';
import { Box, TextField, Button, IconButton, Typography } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

/**
 * Component for editing directions (Roman numerals, figured bass)
 */
const DirectionEditor = ({ directions = [], onDirectionsChange, staff = 2 }) => {
  const [newDirection, setNewDirection] = useState({ text: '', type: 'roman', offset: 0 });

  const handleAdd = () => {
    if (!newDirection.text.trim()) return;

    const direction = {
      ...newDirection,
      staff,
      voice: 1
    };

    onDirectionsChange([...directions, direction]);
    setNewDirection({ text: '', type: 'roman', offset: 0 });
  };

  const handleDelete = (index) => {
    const newDirections = directions.filter((_, i) => i !== index);
    onDirectionsChange(newDirections);
  };

  const handleTypeChange = (index, newType) => {
    const newDirections = [...directions];
    newDirections[index].type = newType;
    onDirectionsChange(newDirections);
  };

  return (
    <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom>
        Directions (Roman Numerals / Figured Bass)
      </Typography>
      
      {directions.map((dir, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
          <TextField
            size="small"
            value={dir.text}
            onChange={(e) => {
              const newDirections = [...directions];
              newDirections[index].text = e.target.value;
              onDirectionsChange(newDirections);
            }}
            sx={{ flex: 1 }}
          />
          <select
            value={dir.type}
            onChange={(e) => handleTypeChange(index, e.target.value)}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="roman">Roman Numeral</option>
            <option value="figured">Figured Bass</option>
            <option value="text">Text</option>
          </select>
          <TextField
            size="small"
            type="number"
            label="Offset"
            value={dir.offset || 0}
            onChange={(e) => {
              const newDirections = [...directions];
              newDirections[index].offset = parseInt(e.target.value) || 0;
              onDirectionsChange(newDirections);
            }}
            sx={{ width: 100 }}
          />
          <IconButton size="small" onClick={() => handleDelete(index)} color="error">
            <Delete />
          </IconButton>
        </Box>
      ))}

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <TextField
          size="small"
          placeholder="I, V, 6, 6/4, etc."
          value={newDirection.text}
          onChange={(e) => setNewDirection({ ...newDirection, text: e.target.value })}
          sx={{ flex: 1 }}
        />
        <select
          value={newDirection.type}
          onChange={(e) => setNewDirection({ ...newDirection, type: e.target.value })}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="roman">Roman Numeral</option>
          <option value="figured">Figured Bass</option>
          <option value="text">Text</option>
        </select>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add
        </Button>
      </Box>
    </Box>
  );
};

export default DirectionEditor;

