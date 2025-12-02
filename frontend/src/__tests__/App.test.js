/**
 * Tests for App component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('displays main title', () => {
    render(<App />);
    const title = screen.getByText(/harmony/i);
    expect(title).toBeInTheDocument();
  });

  test('renders SheetMusicView', () => {
    render(<App />);
    // Check for key elements of SheetMusicView
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });
});

