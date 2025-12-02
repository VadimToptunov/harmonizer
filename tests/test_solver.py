"""
Unit tests for solver module.
"""
import unittest
from solver import Solver, Solution
from music_utils import Voice
from constraints import HardConstraint, SoftConstraint


class TestSolver(unittest.TestCase):
    """Test harmony solver."""

    def setUp(self):
        """Set up test fixtures."""
        self.solver = Solver()

    def test_solve_step(self):
        """Test solving a single step."""
        bass_note = 48  # C3
        prev_solutions = []
        chord_type = "major"
        
        solutions = self.solver.solve_step(bass_note, prev_solutions, chord_type)
        
        self.assertGreater(len(solutions), 0)
        self.assertIsInstance(solutions[0], Solution)
        self.assertEqual(solutions[0].voices[Voice.BASS], bass_note)

    def test_solution_structure(self):
        """Test Solution object structure."""
        voices = {
            Voice.SOPRANO: 72,
            Voice.ALTO: 67,
            Voice.TENOR: 60,
            Voice.BASS: 48
        }
        solution = Solution(voices=voices, score=100.0, violations=[])
        
        self.assertEqual(solution.voices[Voice.SOPRANO], 72)
        self.assertEqual(solution.score, 100.0)
        self.assertEqual(len(solution.violations), 0)

    def test_beam_search(self):
        """Test beam search algorithm."""
        bass_line = [48, 50, 52, 48]  # Simple bass line
        chord_types = ["major", "minor", "major", "major"]
        
        solutions = []
        prev_solutions = []
        
        for bass_note, chord_type in zip(bass_line, chord_types):
            step_solutions = self.solver.solve_step(bass_note, prev_solutions, chord_type)
            if step_solutions:
                solutions.append(step_solutions[0])
                prev_solutions = step_solutions[:1]
        
        self.assertEqual(len(solutions), len(bass_line))
        for i, sol in enumerate(solutions):
            self.assertEqual(sol.voices[Voice.BASS], bass_line[i])


if __name__ == '__main__':
    unittest.main()

