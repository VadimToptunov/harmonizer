import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  Undo,
  Redo,
  ContentCopy,
  ContentPaste,
  Delete,
  SwapHoriz,
  AutoFixHigh,
  ZoomIn,
  ZoomOut,
  PlayArrow,
  Pause,
  MoreVert,
} from '@mui/icons-material';

/**
 * Optimized toolbar component for the music editor
 * Separated from main editor for better performance
 */
const EditorToolbar = React.memo(({
  // Undo/Redo
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  
  // Clipboard
  hasClipboard,
  hasSelection,
  onCopy,
  onPaste,
  onDelete,
  
  // Transform
  onTranspose,
  onRespell,
  
  // Zoom
  zoom,
  onZoomIn,
  onZoomOut,
  
  // Playback
  isPlaying,
  onPlayPause,
  canPlay,
  
  // Settings
  onMoreClick,
  moreMenuAnchor,
  onMoreClose,
}) => {
  const [transposeAnchor, setTransposeAnchor] = React.useState(null);
  const [respellAnchor, setRespellAnchor] = React.useState(null);

  return (
    <Box 
      sx={{ 
        mb: 1, 
        display: 'flex', 
        gap: 1, 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        p: 1, 
        bgcolor: 'grey.50', 
        borderRadius: 1 
      }}
    >
      {/* Edit Operations */}
      <Tooltip title="Undo (Ctrl+Z)">
        <span>
          <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
            <Undo fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Redo (Ctrl+Shift+Z)">
        <span>
          <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
            <Redo fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      <Tooltip title="Copy (Ctrl+C)">
        <span>
          <IconButton size="small" onClick={onCopy} disabled={!hasSelection}>
            <ContentCopy fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Paste (Ctrl+V)">
        <span>
          <IconButton size="small" onClick={onPaste} disabled={!hasClipboard}>
            <ContentPaste fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Delete">
        <span>
          <IconButton size="small" onClick={onDelete} disabled={!hasSelection}>
            <Delete fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      {/* Transpose */}
      <Button
        size="small"
        startIcon={<SwapHoriz />}
        onClick={(e) => setTransposeAnchor(e.currentTarget)}
        disabled={!hasSelection}
      >
        Transpose
      </Button>
      <Menu 
        anchorEl={transposeAnchor} 
        open={Boolean(transposeAnchor)} 
        onClose={() => setTransposeAnchor(null)}
      >
        <MenuItem onClick={() => { onTranspose(1); setTransposeAnchor(null); }}>
          Up semitone (+1)
        </MenuItem>
        <MenuItem onClick={() => { onTranspose(-1); setTransposeAnchor(null); }}>
          Down semitone (-1)
        </MenuItem>
        <MenuItem onClick={() => { onTranspose(2); setTransposeAnchor(null); }}>
          Up whole tone (+2)
        </MenuItem>
        <MenuItem onClick={() => { onTranspose(-2); setTransposeAnchor(null); }}>
          Down whole tone (-2)
        </MenuItem>
        <MenuItem onClick={() => { onTranspose(12); setTransposeAnchor(null); }}>
          Up octave (+12)
        </MenuItem>
        <MenuItem onClick={() => { onTranspose(-12); setTransposeAnchor(null); }}>
          Down octave (-12)
        </MenuItem>
      </Menu>

      {/* Respell */}
      <Button
        size="small"
        startIcon={<AutoFixHigh />}
        onClick={(e) => setRespellAnchor(e.currentTarget)}
        disabled={!hasSelection}
      >
        Respell
      </Button>
      <Menu 
        anchorEl={respellAnchor} 
        open={Boolean(respellAnchor)} 
        onClose={() => setRespellAnchor(null)}
      >
        <MenuItem onClick={() => { onRespell('sharp'); setRespellAnchor(null); }}>
          Use sharps (#)
        </MenuItem>
        <MenuItem onClick={() => { onRespell('flat'); setRespellAnchor(null); }}>
          Use flats (♭)
        </MenuItem>
        <MenuItem onClick={() => { onRespell('natural'); setRespellAnchor(null); }}>
          Remove accidentals
        </MenuItem>
      </Menu>

      <Divider orientation="vertical" flexItem />

      {/* Zoom */}
      <Tooltip title="Zoom In">
        <IconButton size="small" onClick={onZoomIn}>
          <ZoomIn fontSize="small" />
        </IconButton>
      </Tooltip>
      <Typography variant="caption" sx={{ minWidth: '45px', textAlign: 'center' }}>
        {zoom}%
      </Typography>
      <Tooltip title="Zoom Out">
        <IconButton size="small" onClick={onZoomOut}>
          <ZoomOut fontSize="small" />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem />

      {/* Playback */}
      <Tooltip title="Play (Space)">
        <span>
          <IconButton size="small" onClick={onPlayPause} disabled={!canPlay}>
            {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>

      {/* More Options */}
      <IconButton size="small" onClick={onMoreClick}>
        <MoreVert fontSize="small" />
      </IconButton>
    </Box>
  );
});

EditorToolbar.displayName = 'EditorToolbar';

export default EditorToolbar;

