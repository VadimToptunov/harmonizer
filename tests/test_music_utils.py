"""
Unit tests for music_utils module.
"""
import unittest
from music_utils import (
    midi_to_note_name, note_name_to_midi, get_chord_tones,
    get_chord_inversion, Voice
)


class TestMusicUtils(unittest.TestCase):
    """Test music utility functions."""

    def test_midi_to_note_name(self):
        """Test MIDI to note name conversion."""
        self.assertEqual(midi_to_note_name(60), "C4")
        self.assertEqual(midi_to_note_name(61), "C#4")
        self.assertEqual(midi_to_note_name(69), "A4")
        self.assertEqual(midi_to_note_name(21), "A0")
        self.assertEqual(midi_to_note_name(108), "C8")

    def test_note_name_to_midi(self):
        """Test note name to MIDI conversion."""
        self.assertEqual(note_name_to_midi("C4"), 60)
        self.assertEqual(note_name_to_midi("C#4"), 61)
        self.assertEqual(note_name_to_midi("Db4"), 61)
        self.assertEqual(note_name_to_midi("A4"), 69)
        self.assertEqual(note_name_to_midi("A0"), 21)

    def test_get_chord_tones(self):
        """Test chord tone extraction."""
        # C major - returns pitch classes (0-11)
        tones = get_chord_tones(60, "major")
        self.assertIn(0, tones)  # C (pitch class)
        self.assertIn(4, tones)  # E (pitch class)
        self.assertIn(7, tones)  # G (pitch class)

        # C minor
        tones = get_chord_tones(60, "minor")
        self.assertIn(0, tones)  # C (pitch class)
        self.assertIn(3, tones)  # Eb (pitch class)
        self.assertIn(7, tones)  # G (pitch class)

        # C diminished
        tones = get_chord_tones(60, "diminished")
        self.assertIn(0, tones)  # C (pitch class)
        self.assertIn(3, tones)  # Eb (pitch class)
        self.assertIn(6, tones)  # Gb (pitch class)

    def test_get_chord_inversion(self):
        """Test chord inversion detection."""
        # Root position (C major, bass is C)
        self.assertEqual(get_chord_inversion(60, 60, "major"), 0)
        
        # First inversion (C major, bass is E)
        self.assertEqual(get_chord_inversion(64, 60, "major"), 1)
        
        # Second inversion (C major, bass is G)
        self.assertEqual(get_chord_inversion(67, 60, "major"), 2)

    def test_voice_enum(self):
        """Test Voice enum values."""
        self.assertEqual(Voice.SOPRANO.value, "S")
        self.assertEqual(Voice.ALTO.value, "A")
        self.assertEqual(Voice.TENOR.value, "T")
        self.assertEqual(Voice.BASS.value, "B")


if __name__ == '__main__':
    unittest.main()

