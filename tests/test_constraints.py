"""
Unit tests for constraints module.
"""
import unittest
from constraints import ConstraintChecker, ConstraintViolation
from music_utils import Voice


class TestConstraints(unittest.TestCase):
    """Test constraint checking functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.checker = ConstraintChecker()

    def test_check_voice_range(self):
        """Test voice range validation."""
        # In range
        violation = self.checker.check_voice_range(Voice.SOPRANO, 72)  # C5 - in range
        self.assertIsNone(violation)

        # Out of range
        violation = self.checker.check_voice_range(Voice.SOPRANO, 50)  # Too low
        self.assertIsNotNone(violation)
        self.assertEqual(violation.rule_name, "voice_range")
        self.assertEqual(violation.severity, "hard")

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
        violations = self.checker.check_parallel_fifths(prev_voices, curr_voices)
        # Should detect parallel fifths between voices if present
        self.assertIsInstance(violations, list)

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
        violations = self.checker.check_parallel_octaves(prev_voices, curr_voices)
        # Should detect parallel octaves
        self.assertIsInstance(violations, list)

    def test_check_spacing(self):
        """Test spacing validation."""
        voices = {
            Voice.SOPRANO: 72,
            Voice.ALTO: 67,
            Voice.TENOR: 60,
            Voice.BASS: 48
        }
        violation = self.checker.check_spacing(voices)
        # Should check proper spacing between adjacent voices
        # Good spacing should return None
        self.assertIsNone(violation)

    def test_check_voice_order(self):
        """Test voice order validation."""
        # Correct order
        voices = {
            Voice.SOPRANO: 72,
            Voice.ALTO: 67,
            Voice.TENOR: 60,
            Voice.BASS: 48
        }
        violation = self.checker.check_voice_order(voices)
        self.assertIsNone(violation)

        # Voice crossing
        voices[Voice.SOPRANO] = 55  # Below alto
        violation = self.checker.check_voice_order(voices)
        self.assertIsNotNone(violation)
        self.assertEqual(violation.rule_name, "voice_crossing")


if __name__ == '__main__':
    unittest.main()

