"""
Unit tests for constraints module.
"""
import unittest
from constraints import (
    check_voice_ranges, check_parallel_fifths, check_parallel_octaves,
    check_voice_leading, check_doubled_leading_tone, check_spacing,
    HardConstraint, SoftConstraint
)
from music_utils import Voice


class TestConstraints(unittest.TestCase):
    """Test constraint checking functions."""

    def test_check_voice_ranges(self):
        """Test voice range validation."""
        voices = {
            Voice.SOPRANO: 72,  # C5 - in range
            Voice.ALTO: 67,      # G4 - in range
            Voice.TENOR: 60,    # C4 - in range
            Voice.BASS: 48      # C3 - in range
        }
        violations = check_voice_ranges(voices)
        self.assertEqual(len(violations), 0)

        # Out of range
        voices[Voice.SOPRANO] = 50  # Too low
        violations = check_voice_ranges(voices)
        self.assertGreater(len(violations), 0)

    def test_check_parallel_fifths(self):
        """Test parallel fifths detection."""
        prev_voices = {
            Voice.SOPRANO: 60,  # C
            Voice.ALTO: 57,      # A
            Voice.TENOR: 53,    # F
            Voice.BASS: 48      # C
        }
        curr_voices = {
            Voice.SOPRANO: 65,  # F
            Voice.ALTO: 62,     # D
            Voice.TENOR: 58,    # Bb
            Voice.BASS: 53      # F
        }
        violations = check_parallel_fifths(prev_voices, curr_voices)
        # Should detect parallel fifths between voices

    def test_check_parallel_octaves(self):
        """Test parallel octaves detection."""
        prev_voices = {
            Voice.SOPRANO: 60,  # C
            Voice.BASS: 48       # C (octave below)
        }
        curr_voices = {
            Voice.SOPRANO: 64,  # E
            Voice.BASS: 52       # E (octave below)
        }
        violations = check_parallel_octaves(prev_voices, curr_voices)
        # Should detect parallel octaves

    def test_check_voice_leading(self):
        """Test voice leading validation."""
        prev_voices = {
            Voice.SOPRANO: 60,
            Voice.ALTO: 57,
            Voice.TENOR: 53,
            Voice.BASS: 48
        }
        curr_voices = {
            Voice.SOPRANO: 64,  # Step up
            Voice.ALTO: 57,      # Same
            Voice.TENOR: 55,     # Step up
            Voice.BASS: 50       # Step up
        }
        violations = check_voice_leading(prev_voices, curr_voices)
        # Should have minimal violations for good voice leading

    def test_check_spacing(self):
        """Test spacing validation."""
        voices = {
            Voice.SOPRANO: 72,
            Voice.ALTO: 67,
            Voice.TENOR: 60,
            Voice.BASS: 48
        }
        violations = check_spacing(voices)
        # Should check proper spacing between adjacent voices


if __name__ == '__main__':
    unittest.main()

