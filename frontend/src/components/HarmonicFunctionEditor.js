import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Add, Delete, Edit, Check, Close } from '@mui/icons-material';

/**
 * Editor for harmonic functions (T, S, D notation)
 */
const HarmonicFunctionEditor = ({ value = [], onChange, keySignature = 'C' }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogFunc, setDialogFunc] = useState({
    type: 'T',
    position: '',
    extra: [],
    alterations: {},
    isMinor: false
  });

  const keyToPc = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6,
    'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
    'Db': 1, 'Eb': 3, 'Gb': 6, 'Ab': 8, 'Bb': 10
  };

  const parseFunction = (funcStr) => {
    const trimmed = funcStr.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^([TSDN]|Ch)(\{.*\})?$/);
    if (!match) return null;

    const type = match[1];
    const params = match[2] ? match[2].slice(1, -1) : '';

    const result = { type, position: '', extra: [], alterations: {}, isMinor: false };

    if (params) {
      params.split(';').forEach(param => {
        const trimmedParam = param.trim();
        if (trimmedParam.includes(':')) {
          const [key, val] = trimmedParam.split(':').map(s => s.trim());
          if (key === 'position') {
            result.position = val;
          } else if (key === 'extra') {
            result.extra = val.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
          } else if (key === 'alterations') {
            // Parse alterations
            val.split(',').forEach(alt => {
              const [interval, altType] = alt.split(':').map(s => s.trim());
              if (interval && altType) {
                result.alterations[parseInt(interval)] = altType;
              }
            });
          }
        } else if (trimmedParam === 'minor') {
          result.isMinor = true;
        }
      });
    }

    return result;
  };

  const formatFunction = (func) => {
    let str = func.type;
    const parts = [];

    if (func.position) parts.push(`position: ${func.position}`);
    if (func.extra && func.extra.length > 0) {
      parts.push(`extra: ${func.extra.join(', ')}`);
    }
    if (func.alterations && Object.keys(func.alterations).length > 0) {
      const altStr = Object.entries(func.alterations)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      parts.push(`alterations: {${altStr}}`);
    }
    if (func.isMinor) parts.push('minor');

    if (parts.length > 0) {
      str += `{${parts.join('; ')}}`;
    } else {
      str += '{}';
    }

    return str;
  };

  const handleAdd = () => {
    setDialogFunc({ type: 'T', position: '', extra: [], alterations: {}, isMinor: false });
    setDialogOpen(true);
  };

  const handleSaveDialog = () => {
    const funcStr = formatFunction(dialogFunc);
    onChange([...value, funcStr]);
    setDialogOpen(false);
  };

  const handleEdit = (index) => {
    const funcStr = value[index];
    const parsed = parseFunction(funcStr);
    if (parsed) {
      setDialogFunc(parsed);
      setEditingIndex(index);
      setDialogOpen(true);
    }
  };

  const handleUpdateDialog = () => {
    const funcStr = formatFunction(dialogFunc);
    const newValue = [...value];
    newValue[editingIndex] = funcStr;
    onChange(newValue);
    setDialogOpen(false);
    setEditingIndex(null);
  };

  const handleDelete = (index) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleQuickAdd = (type) => {
    onChange([...value, `${type}{}`]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ mr: 1 }}>Quick add:</Typography>
        <Button size="small" variant="outlined" onClick={() => handleQuickAdd('T')}>T</Button>
        <Button size="small" variant="outlined" onClick={() => handleQuickAdd('S')}>S</Button>
        <Button size="small" variant="outlined" onClick={() => handleQuickAdd('D')}>D</Button>
        <Button size="small" variant="outlined" onClick={() => handleQuickAdd('D')}>D7</Button>
        <Button size="small" variant="outlined" onClick={handleAdd} startIcon={<Add />}>
          Custom
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {value.map((func, index) => (
          <Chip
            key={index}
            label={func}
            onDelete={() => handleDelete(index)}
            onClick={() => handleEdit(index)}
            color="primary"
            variant="outlined"
            sx={{ cursor: 'pointer' }}
          />
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingIndex !== null ? 'Edit Harmonic Function' : 'Add Harmonic Function'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Function Type</InputLabel>
              <Select
                value={dialogFunc.type}
                onChange={(e) => setDialogFunc({ ...dialogFunc, type: e.target.value })}
              >
                <MenuItem value="T">Tonic (T)</MenuItem>
                <MenuItem value="S">Subdominant (S)</MenuItem>
                <MenuItem value="D">Dominant (D)</MenuItem>
                <MenuItem value="N">Neapolitan (N)</MenuItem>
                <MenuItem value="Ch">Chopin (Ch)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Position (Inversion)"
              value={dialogFunc.position}
              onChange={(e) => setDialogFunc({ ...dialogFunc, position: e.target.value })}
              placeholder="1, 2, 3 or empty for root"
              helperText="1 = first inversion, 2 = second inversion, 3 = third inversion"
            />

            <TextField
              label="Extra Tones"
              value={dialogFunc.extra.join(', ')}
              onChange={(e) => {
                const extra = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                setDialogFunc({ ...dialogFunc, extra });
              }}
              placeholder="7, 9"
              helperText="Comma-separated: 7 for seventh, 9 for ninth"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={dialogFunc.isMinor}
                  onChange={(e) => setDialogFunc({ ...dialogFunc, isMinor: e.target.checked })}
                />
              }
              label="Minor variant"
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Preview:</Typography>
              <Paper sx={{ p: 1, bgcolor: 'grey.100' }}>
                <Typography variant="body1" fontFamily="monospace">
                  {formatFunction(dialogFunc)}
                </Typography>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={editingIndex !== null ? handleUpdateDialog : handleSaveDialog}
            variant="contained"
            startIcon={editingIndex !== null ? <Edit /> : <Add />}
          >
            {editingIndex !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HarmonicFunctionEditor;

