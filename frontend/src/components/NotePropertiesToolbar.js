import React from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Chip,
  Divider,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import { MusicNote } from '@mui/icons-material';
import NoteDurationButton from './NoteDurationButton';

/**
 * Optimized note properties toolbar
 * Handles note input parameters (duration, accidentals, etc.)
 */
const NotePropertiesToolbar = React.memo(({
  // Duration
  duration,
  onDurationChange,
  
  // Modifiers
  dot,
  onDotToggle,
  rest,
  onRestToggle,
  tie,
  onTieToggle,
  
  // Accidentals
  accidental,
  onAccidentalChange,
  
  // Tuplet
  tuplet,
  onTupletChange,
  
  // Chord mode
  isChordMode,
  onChordModeToggle,
  chordNotesCount,
  
  // Dynamic & Articulation
  dynamic,
  onDynamicChange,
  articulation,
  onArticulationChange,
  
  // Ornament
  onOrnamentClick,
}) => {
  const [tupletAnchor, setTupletAnchor] = React.useState(null);
  const [ornamentAnchor, setOrnamentAnchor] = React.useState(null);

  const durationOptions = [
    { value: 'w', label: '𝅝', title: 'Whole note (4 beats)', key: '1' },
    { value: 'h', label: '𝅗𝅥', title: 'Half note (2 beats)', key: '2' },
    { value: 'q', label: '♩', title: 'Quarter note (1 beat)', key: '3' },
    { value: '8', label: '♫', title: 'Eighth note (1/2 beat)', key: '4' },
    { value: '16', label: '♬', title: 'Sixteenth note (1/4 beat)', key: '5' },
    { value: '32', label: '𝅘𝅥𝅯', title: '32nd note (1/8 beat)', key: '6' },
  ];

  const articulationOptions = [
    { value: 'staccato', label: 'Staccato' },
    { value: 'tenuto', label: 'Tenuto' },
    { value: 'accent', label: 'Accent' },
    { value: 'marcato', label: 'Marcato' },
    { value: 'fermata', label: 'Fermata' },
  ];

  const dynamicOptions = [
    { value: 'ppp', label: 'ppp' },
    { value: 'pp', label: 'pp' },
    { value: 'p', label: 'p' },
    { value: 'mp', label: 'mp' },
    { value: 'mf', label: 'mf' },
    { value: 'f', label: 'f' },
    { value: 'ff', label: 'ff' },
    { value: 'fff', label: 'fff' },
  ];

  const ornamentOptions = [
    { value: 'trill', label: 'Trill' },
    { value: 'mordent', label: 'Mordent' },
    { value: 'turn', label: 'Turn' },
  ];

  return (
    <Box 
      sx={{ 
        mb: 1, 
        display: 'flex', 
        gap: 1, 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        p: 1.5, 
        bgcolor: 'primary.50', 
        borderRadius: 2,
        border: '2px solid',
        borderColor: 'primary.200'
      }}
    >
      {/* Instructions */}
      <Box sx={{ 
        width: '100%', 
        mb: 1, 
        p: 1.5, 
        bgcolor: 'info.light', 
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'info.main'
      }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: 'info.dark' }}>
          💡 Как использовать:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
          <Typography variant="caption">
            • <strong>Кликните</strong> на нотоносце для добавления ноты
          </Typography>
          <Typography variant="caption">
            • <strong>Клавиши:</strong> 1-6 (длительность), # ♭ n (альтерация), r (пауза), t (лига), . (точка)
          </Typography>
          <Typography variant="caption">
            • <strong>Выберите параметры</strong> перед добавлением ноты
          </Typography>
        </Box>
      </Box>
      
      {/* Durations */}
      <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
        Длительность ({durationOptions[0].key}-{durationOptions[durationOptions.length - 1].key}):
      </Typography>
      {durationOptions.map(({ value, title, key }) => (
        <Tooltip key={value} title={`${title} - Press ${key}`}>
          <span>
            <NoteDurationButton
              duration={value}
              isSelected={duration === value}
              onClick={() => onDurationChange(value)}
              title={title}
            />
          </span>
        </Tooltip>
      ))}

      <Divider orientation="vertical" flexItem />
      
      {/* Dot */}
      <Tooltip title="Точка (Press .)">
        <Chip
          label="•"
          size="medium"
          onClick={onDotToggle}
          color={dot ? 'primary' : 'default'}
          sx={{ 
            fontSize: '20px',
            fontWeight: dot ? 'bold' : 'normal',
            minWidth: 40
          }}
        />
      </Tooltip>

      {/* Tuplet */}
      <Button
        size="small"
        onClick={(e) => setTupletAnchor(e.currentTarget)}
        variant={tuplet ? 'contained' : 'outlined'}
      >
        Tuplet
      </Button>
      <Menu anchorEl={tupletAnchor} open={Boolean(tupletAnchor)} onClose={() => setTupletAnchor(null)}>
        <MenuItem onClick={() => { onTupletChange({ num: 3, den: 2 }); setTupletAnchor(null); }}>
          Triplet (3:2)
        </MenuItem>
        <MenuItem onClick={() => { onTupletChange({ num: 5, den: 4 }); setTupletAnchor(null); }}>
          Quintuplet (5:4)
        </MenuItem>
        <MenuItem onClick={() => { onTupletChange(null); setTupletAnchor(null); }}>
          Clear
        </MenuItem>
      </Menu>

      {/* Accidentals */}
      <Divider orientation="vertical" flexItem />
      <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>Accidentals:</Typography>
      <Tooltip title="Sharp (#)">
        <IconButton
          size="small"
          onClick={() => onAccidentalChange('#')}
          color={accidental === '#' ? 'primary' : 'default'}
          sx={{
            border: accidental === '#' ? '2px solid' : '1px solid',
            borderColor: accidental === '#' ? 'primary.main' : 'divider',
            minWidth: 40,
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          #
        </IconButton>
      </Tooltip>
      <Tooltip title="Flat (♭)">
        <IconButton
          size="small"
          onClick={() => onAccidentalChange('b')}
          color={accidental === 'b' ? 'primary' : 'default'}
          sx={{
            border: accidental === 'b' ? '2px solid' : '1px solid',
            borderColor: accidental === 'b' ? 'primary.main' : 'divider',
            minWidth: 40,
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          ♭
        </IconButton>
      </Tooltip>
      <Tooltip title="Natural (♮)">
        <IconButton
          size="small"
          onClick={() => onAccidentalChange('n')}
          color={accidental === 'n' ? 'primary' : 'default'}
          sx={{
            border: accidental === 'n' ? '2px solid' : '1px solid',
            borderColor: accidental === 'n' ? 'primary.main' : 'divider',
            minWidth: 40,
            fontWeight: 'bold',
            fontSize: '18px'
          }}
        >
          ♮
        </IconButton>
      </Tooltip>
      <Tooltip title="No accidental (Esc)">
        <IconButton
          size="small"
          onClick={() => onAccidentalChange(null)}
          color={accidental === null ? 'primary' : 'default'}
          sx={{
            border: accidental === null ? '2px solid' : '1px solid',
            borderColor: accidental === null ? 'primary.main' : 'divider',
            minWidth: 40,
            fontSize: '11px'
          }}
        >
          Clear
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />
      
      {/* Rest/Tie */}
      <Tooltip title="Rest (R)">
        <Chip
          label="♩ Rest"
          size="medium"
          onClick={onRestToggle}
          color={rest ? 'primary' : 'default'}
          sx={{ fontWeight: rest ? 'bold' : 'normal' }}
        />
      </Tooltip>
      <Tooltip title="Tie (T)">
        <Chip
          label="⌒ Tie"
          size="medium"
          onClick={onTieToggle}
          color={tie ? 'primary' : 'default'}
          sx={{ fontWeight: tie ? 'bold' : 'normal' }}
        />
      </Tooltip>

      <Divider orientation="vertical" flexItem />
      
      {/* Chord Mode */}
      <Tooltip title="Режим аккорда">
        <Chip
          label="🎹 Аккорд"
          size="medium"
          icon={<MusicNote />}
          onClick={onChordModeToggle}
          color={isChordMode ? 'primary' : 'default'}
          sx={{ fontWeight: isChordMode ? 'bold' : 'normal' }}
        />
      </Tooltip>
      {isChordMode && chordNotesCount > 0 && (
        <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          {chordNotesCount} нот(ы) в аккорде
        </Typography>
      )}

      {/* Dynamics */}
      <Typography variant="caption" sx={{ ml: 1 }}>Dynamic:</Typography>
      <select
        value={dynamic || ''}
        onChange={(e) => onDynamicChange(e.target.value || null)}
        style={{ padding: '4px', fontSize: '11px', borderRadius: '4px' }}
      >
        <option value="">None</option>
        {dynamicOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Articulations */}
      <Typography variant="caption" sx={{ ml: 1 }}>Articulation:</Typography>
      <select
        value={articulation || ''}
        onChange={(e) => onArticulationChange(e.target.value || null)}
        style={{ padding: '4px', fontSize: '11px', borderRadius: '4px' }}
      >
        <option value="">None</option>
        {articulationOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Ornaments */}
      <Button
        size="small"
        onClick={(e) => setOrnamentAnchor(e.currentTarget)}
        variant="outlined"
      >
        Ornament
      </Button>
      <Menu anchorEl={ornamentAnchor} open={Boolean(ornamentAnchor)} onClose={() => setOrnamentAnchor(null)}>
        {ornamentOptions.map(opt => (
          <MenuItem 
            key={opt.value} 
            onClick={() => { 
              onOrnamentClick(opt.value); 
              setOrnamentAnchor(null); 
            }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
});

NotePropertiesToolbar.displayName = 'NotePropertiesToolbar';

export default NotePropertiesToolbar;

