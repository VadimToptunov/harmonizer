"""
Unit tests for harmonizer module.
"""
import unittest
from harmonizer import Harmonizer
from music_utils import Voice


class TestHarmonizer(unittest.TestCase):
    """Test Harmonizer class."""

    def setUp(self):
        """Set up test fixtures."""
        self.harmonizer = Harmonizer()

    def test_harmonize_figured_bass(self):
        """Test figured bass harmonization."""
        bass_line = [48, 50, 52, 48]  # C, D, E, C
        figured_bass = ["", "6", "", ""]
        
        result = self.harmonizer.harmonize_figured_bass(bass_line, figured_bass)
        
        self.assertIsNotNone(result)
        self.assertIn("voices", result)
        self.assertEqual(len(result["voices"]), len(bass_line))

    def test_harmonize_with_explanations(self):
        """Test harmonization with explanations."""
        bass_line = [48, 50, 52, 48]
        figured_bass = ["", "", "", ""]
        
        result = self.harmonizer.harmonize_figured_bass(
            bass_line, figured_bass, include_explanations=True
        )
        
        self.assertIn("explanations", result)
        self.assertGreater(len(result["explanations"]), 0)

    def test_voice_output_format(self):
        """Test voice output format."""
        bass_line = [48]
        result = self.harmonizer.harmonize_figured_bass(bass_line, [""])
        
        voices = result["voices"][0]
        self.assertIn(Voice.SOPRANO, voices)
        self.assertIn(Voice.ALTO, voices)
        self.assertIn(Voice.TENOR, voices)
        self.assertIn(Voice.BASS, voices)


if __name__ == '__main__':
    unittest.main()

