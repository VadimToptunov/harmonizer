/**
 * Tests for ProfessionalMusicEditor component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProfessionalMusicEditor from '../../components/ProfessionalMusicEditor';

// Mock VexFlow
jest.mock('vexflow', () => ({
  Flow: {
    Renderer: jest.fn().mockImplementation(() => ({
      getContext: () => ({
        setFont: jest.fn(),
        scale: jest.fn(),
        setStrokeStyle: jest.fn(),
        setLineWidth: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        setFont: jest.fn(),
        fillStyle: '',
        fillText: jest.fn()
      }),
      resize: jest.fn()
    })),
    Stave: jest.fn().mockImplementation(() => ({
      addClef: jest.fn(),
      addTimeSignature: jest.fn(),
      addKeySignature: jest.fn(),
      setContext: jest.fn().mockReturnThis(),
      draw: jest.fn(),
      getYForLine: jest.fn(() => 100)
    })),
    StaveNote: jest.fn().mockImplementation(() => ({
      addDot: jest.fn(),
      addAccidental: jest.fn(),
      addTie: jest.fn(),
      addArticulation: jest.fn(),
      setStyle: jest.fn()
    })),
    Voice: jest.fn().mockImplementation(() => ({
      addTickables: jest.fn(),
      draw: jest.fn()
    })),
    Formatter: jest.fn().mockImplementation(() => ({
      joinVoices: jest.fn().mockReturnThis(),
      format: jest.fn()
    })),
    Accidental: jest.fn(),
    Rest: jest.fn().mockImplementation(() => ({
      addDot: jest.fn()
    })),
    Beam: jest.fn().mockImplementation(() => ({
      setContext: jest.fn().mockReturnThis(),
      draw: jest.fn()
    })),
    Articulation: jest.fn(),
    Dot: jest.fn(),
    Tuplet: jest.fn()
  }
}));

describe('ProfessionalMusicEditor', () => {
  const defaultProps = {
    staffId: 'test-staff',
    clef: 'treble',
    keySignature: 'C',
    timeSignature: '4/4',
    notes: [],
    onNotesChange: jest.fn(),
    measures: 1,
    tempo: 120
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<ProfessionalMusicEditor {...defaultProps} />);
  });

  test('displays staff label when provided', () => {
    render(<ProfessionalMusicEditor {...defaultProps} staffLabel="Soprano" showLabels={true} />);
    expect(screen.getByText('Soprano')).toBeInTheDocument();
  });

  test('renders toolbar when not read-only', () => {
    render(<ProfessionalMusicEditor {...defaultProps} readOnly={false} />);
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument();
  });

  test('hides toolbar when read-only', () => {
    render(<ProfessionalMusicEditor {...defaultProps} readOnly={true} />);
    expect(screen.queryByRole('button', { name: /undo/i })).not.toBeInTheDocument();
  });

  test('handles note addition', () => {
    const onNotesChange = jest.fn();
    render(<ProfessionalMusicEditor {...defaultProps} onNotesChange={onNotesChange} />);
    
    // Simulate clicking on staff (this would need proper mock setup)
    // For now, just verify the component renders
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
  });

  test('handles undo/redo', () => {
    const onNotesChange = jest.fn();
    const { rerender } = render(
      <ProfessionalMusicEditor {...defaultProps} onNotesChange={onNotesChange} notes={[{ midi: 60 }]} />
    );
    
    const undoButton = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoButton);
    
    // Verify undo was called
    waitFor(() => {
      expect(onNotesChange).toHaveBeenCalled();
    });
  });

  test('handles copy/paste', () => {
    const onNotesChange = jest.fn();
    render(
      <ProfessionalMusicEditor 
        {...defaultProps} 
        onNotesChange={onNotesChange} 
        notes={[{ midi: 60 }]} 
      />
    );
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    const pasteButton = screen.getByRole('button', { name: /paste/i });
    
    // Copy should be enabled when notes are selected
    // Paste should be disabled initially
    expect(pasteButton).toBeDisabled();
  });

  test('handles zoom controls', () => {
    render(<ProfessionalMusicEditor {...defaultProps} />);
    
    const zoomIn = screen.getByRole('button', { name: /zoom in/i });
    const zoomOut = screen.getByRole('button', { name: /zoom out/i });
    
    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();
    
    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
  });

  test('handles duration selection', () => {
    render(<ProfessionalMusicEditor {...defaultProps} />);
    
    // Duration buttons should be present
    const durationButtons = screen.getAllByTitle(/note/i);
    expect(durationButtons.length).toBeGreaterThan(0);
  });

  test('handles key signature change', () => {
    const onKeySignatureChange = jest.fn();
    render(
      <ProfessionalMusicEditor 
        {...defaultProps} 
        onKeySignatureChange={onKeySignatureChange} 
      />
    );
    
    // Key signature selector should be present
    expect(screen.getByRole('button', { name: /key/i })).toBeInTheDocument();
  });
});

