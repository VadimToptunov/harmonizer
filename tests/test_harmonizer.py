"""
Unit tests for harmonizer module.
"""
import unittest
import tempfile
import os
from harmonizer import Harmonizer, HarmonizationResult
from music_utils import Voice, export_to_musicxml


class TestHarmonizer(unittest.TestCase):
    """Test Harmonizer class."""

    def setUp(self):
        """Set up test fixtures."""
        self.harmonizer = Harmonizer()

    def test_harmonize_bass_line(self):
        """Test bass line harmonization."""
        # Create a temporary MusicXML file with bass line
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False) as f:
            temp_file = f.name
            # Create minimal MusicXML
            xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Bass</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch>
          <step>C</step>
          <octave>3</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>3</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>'''
            f.write(xml_content)
        
        try:
            result = self.harmonizer.harmonize(temp_file)
            
            self.assertIsNotNone(result)
            self.assertIsInstance(result, HarmonizationResult)
            if result.success:
                self.assertGreater(len(result.voices), 0)
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)

    def test_harmonize_with_explanations(self):
        """Test harmonization with explanations."""
        # Use solver directly for testing
        from solver import BeamSearchSolver
        solver = BeamSearchSolver()
        
        bass_line = [48, 50]
        prev_solutions = []
        
        solutions = []
        for bass_note in bass_line:
            step_solutions = solver.solve_step(bass_note, prev_solutions, "major")
            if step_solutions:
                solutions.append(step_solutions[0].voices)
                prev_solutions = step_solutions[:1]
        
        self.assertGreater(len(solutions), 0)

    def test_voice_output_format(self):
        """Test voice output format."""
        from solver import BeamSearchSolver
        solver = BeamSearchSolver()
        
        bass_note = 48
        step_solutions = solver.solve_step(bass_note, [], "major")
        
        if step_solutions:
            voices = step_solutions[0].voices
            self.assertIn(Voice.SOPRANO, voices)
            self.assertIn(Voice.ALTO, voices)
            self.assertIn(Voice.TENOR, voices)
            self.assertIn(Voice.BASS, voices)
            self.assertEqual(voices[Voice.BASS], bass_note)


if __name__ == '__main__':
    unittest.main()

