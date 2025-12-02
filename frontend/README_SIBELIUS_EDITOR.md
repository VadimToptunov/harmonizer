# Professional Web Music Editor

This is a professional web-based music notation editor built with React and VexFlow.

## Features

### Core Functionality
- **Interactive Staff Editor**: Click on the staff to add notes
- **Multi-staff Support**: 2 or 4 staves (SATB)
- **Note Editing**: 
  - Select note duration (whole, half, quarter, eighth, sixteenth)
  - Add accidentals (sharp, flat, natural)
  - Delete notes with Delete/Backspace
- **Musical Settings**:
  - Key signatures (all major keys)
  - Time signatures (4/4, 3/4, 2/4, 6/8, etc.)
  - Tempo (BPM)
  - Clefs (treble, bass, alto, tenor)

### Advanced Features
- **Figured Bass**: Add and edit figured bass notation
- **Roman Numeral Analysis**: Add harmonic analysis with Roman numerals
- **MusicXML Import/Export**: 
  - Import existing MusicXML files
  - Export your work to MusicXML format
- **PDF Export**: Export completed exercises to PDF
- **Zoom Controls**: Zoom in/out for better viewing

### User Interface
- **Professional Layout**: Clean, professional interface
- **Tabbed Views**: Switch between Edit and View modes
- **Toolbar**: Quick access to common functions
- **Settings Dialog**: Configure score settings easily

## Usage

### Adding Notes
1. Click on the staff where you want to add a note
2. Select the duration from the toolbar (w, h, q, 8, 16)
3. Add accidentals if needed
4. Notes are automatically placed on the correct line/space

### Editing Notes
- Click a note to select it (highlighted in green)
- Press Delete or Backspace to remove selected note
- Change duration or accidental before adding new notes

### Adding Directions
1. Scroll to the Direction Editor below the bass staff
2. Enter text (e.g., "I" for Roman numeral, "6" for figured bass)
3. Select the type (Roman Numeral, Figured Bass, or Text)
4. Click "Add"

### Importing MusicXML
1. Click the Upload button in the toolbar
2. Select a MusicXML file
3. The score will be loaded and displayed

### Exporting
- **MusicXML**: Click Download button to export as MusicXML
- **PDF**: Use the Save button to export via backend API

## Keyboard Shortcuts

- `Q` - Quarter note duration
- `H` - Half note duration
- `W` - Whole note duration
- `8` - Eighth note duration
- `Delete` / `Backspace` - Delete selected note

## Technical Details

### Components
- `StaffEditor`: Interactive staff with click-to-add notes
- `SheetMusicView`: Main view with toolbar and staff management
- `SheetMusicDisplay`: Display-only view for viewing loaded MusicXML
- `DirectionEditor`: Editor for Roman numerals and figured bass
- `MusicXMLParser`: Parser for MusicXML files

### Technologies
- React 18
- Material-UI (MUI) for UI components
- VexFlow for music notation rendering
- Axios for API calls

## Implemented Features

✅ **Drag and drop notes** - Click and drag notes to change their pitch
✅ **Copy/paste functionality** - Copy notes with Ctrl+C, paste with Ctrl+V
✅ **Undo/redo** - Full undo/redo system (Ctrl+Z / Ctrl+Shift+Z)
✅ **Multiple measures** - Support for multiple measures per staff
✅ **Rests** - Add rests to the score
✅ **Ties and slurs** - Add ties between notes
✅ **Dynamics and articulations** - Add dynamics (pp, p, mp, mf, f, ff) and articulations (staccato, tenuto, accent)
✅ **Playback functionality** - Play back your music with adjustable tempo and volume

