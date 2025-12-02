/**
 * Tests for PlaybackController component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlaybackController from '../../components/PlaybackController';

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    frequency: { value: 0 },
    start: jest.fn(),
    stop: jest.fn()
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 0 }
  })),
  destination: {},
  close: jest.fn()
}));

describe('PlaybackController', () => {
  const defaultProps = {
    notes: [
      { midi: 60, duration: 1, startTime: 0 },
      { midi: 62, duration: 1, startTime: 1 }
    ],
    tempo: 120,
    isPlaying: false,
    onPlaybackChange: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<PlaybackController {...defaultProps} />);
  });

  test('handles play button click', () => {
    const onPlaybackChange = jest.fn();
    render(<PlaybackController {...defaultProps} onPlaybackChange={onPlaybackChange} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
    
    expect(onPlaybackChange).toHaveBeenCalledWith(true);
  });

  test('handles pause button click', () => {
    const onPlaybackChange = jest.fn();
    render(
      <PlaybackController 
        {...defaultProps} 
        isPlaying={true}
        onPlaybackChange={onPlaybackChange} 
      />
    );
    
    const pauseButton = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(pauseButton);
    
    expect(onPlaybackChange).toHaveBeenCalledWith(false);
  });

  test('handles stop button click', () => {
    const onPlaybackChange = jest.fn();
    render(
      <PlaybackController 
        {...defaultProps} 
        isPlaying={true}
        onPlaybackChange={onPlaybackChange} 
      />
    );
    
    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);
    
    expect(onPlaybackChange).toHaveBeenCalledWith(false);
  });

  test('validates MIDI values', () => {
    const invalidNotes = [
      { midi: -1, duration: 1, startTime: 0 },
      { midi: 200, duration: 1, startTime: 0 }
    ];
    
    render(<PlaybackController {...defaultProps} notes={invalidNotes} />);
    
    // Should handle invalid MIDI values gracefully
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);
  });
});

