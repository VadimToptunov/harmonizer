"""
Solver for four-part harmony generation (beam search).
"""
from typing import List, Dict, Optional, Tuple
from music_utils import Voice, VOICE_RANGES, get_chord_tones, midi_to_pitch_class
from constraints import ConstraintChecker, SoftConstraintScorer
from dataclasses import dataclass


@dataclass
class Solution:
    """Solution for one time step."""
    voices: Dict[Voice, int]
    score: float
    violations: List


class BeamSearchSolver:
    """Beam search solver."""
    
    def __init__(self, beam_width: int = 10):
        self.beam_width = beam_width
        self.constraint_checker = ConstraintChecker()
        self.scorer = SoftConstraintScorer()
    
    def generate_candidate_notes(self, voice: Voice, bass_note: int, 
                                 chord_type: str = "major") -> List[int]:
        """Generates candidates for voice based on chord."""
        candidates = []
        min_note, max_note = VOICE_RANGES[voice]
        
        # Get chord tones
        chord_tones_pc = get_chord_tones(bass_note, chord_type)
        
        # Generate all possible notes in voice range
        for midi in range(min_note, max_note + 1):
            pc = midi_to_pitch_class(midi)
            if pc in chord_tones_pc:
                candidates.append(midi)
        
        return candidates
    
    def solve_step(self, bass_note: int, prev_solutions: List[Solution],
                  chord_type: str = "major") -> List[Solution]:
        """
        Solves one time step.
        
        Args:
            bass_note: MIDI note of bass
            prev_solutions: previous solutions (beam)
            chord_type: chord type
        
        Returns:
            Best solutions for current step
        """
        if not prev_solutions:
            # First step - generate initial solutions
            return self._solve_first_step(bass_note, chord_type)
        
        # Generate all possible combinations for three upper voices
        s_candidates = self.generate_candidate_notes(Voice.SOPRANO, bass_note, chord_type)
        a_candidates = self.generate_candidate_notes(Voice.ALTO, bass_note, chord_type)
        t_candidates = self.generate_candidate_notes(Voice.TENOR, bass_note, chord_type)
        
        solutions = []
        
        # Iterate through all combinations
        for s_note in s_candidates:
            for a_note in a_candidates:
                for t_note in t_candidates:
                    curr_voices = {
                        Voice.SOPRANO: s_note,
                        Voice.ALTO: a_note,
                        Voice.TENOR: t_note,
                        Voice.BASS: bass_note
                    }
                    
                    # Check hard constraints
                    violations = []
                    
                    # Check for each voice
                    for voice, note_val in curr_voices.items():
                        if voice != Voice.BASS:  # Bass already checked
                            vs = self.constraint_checker.check_all_hard_constraints(
                                voice, note_val, None, curr_voices
                            )
                            violations.extend(vs)
                    
                    # Check parallelisms with previous step
                    for prev_sol in prev_solutions:
                        parallel_violations = self.constraint_checker.check_parallels(
                            prev_sol.voices, curr_voices
                        )
                        violations.extend(parallel_violations)
                    
                    # If there are hard violations, skip
                    hard_violations = [v for v in violations if v.severity == "hard"]
                    if hard_violations:
                        continue
                    
                    # Calculate score
                    prev_voices = prev_solutions[0].voices if prev_solutions else None
                    bass_motion = bass_note - prev_voices[Voice.BASS] if prev_voices else 0
                    
                    root_pc = midi_to_pitch_class(bass_note)
                    score = self.scorer.total_score(
                        prev_voices, curr_voices, bass_motion, root_pc
                    )
                    
                    solutions.append(Solution(
                        voices=curr_voices,
                        score=score,
                        violations=violations
                    ))
        
        # Sort by score and return best
        solutions.sort(key=lambda s: s.score)
        return solutions[:self.beam_width]
    
    def _solve_first_step(self, bass_note: int, chord_type: str) -> List[Solution]:
        """Solves first time step."""
        s_candidates = self.generate_candidate_notes(Voice.SOPRANO, bass_note, chord_type)
        a_candidates = self.generate_candidate_notes(Voice.ALTO, bass_note, chord_type)
        t_candidates = self.generate_candidate_notes(Voice.TENOR, bass_note, chord_type)
        
        solutions = []
        
        for s_note in s_candidates:
            for a_note in a_candidates:
                for t_note in t_candidates:
                    curr_voices = {
                        Voice.SOPRANO: s_note,
                        Voice.ALTO: a_note,
                        Voice.TENOR: t_note,
                        Voice.BASS: bass_note
                    }
                    
                    # Check hard constraints
                    violations = []
                    for voice, note_val in curr_voices.items():
                        if voice != Voice.BASS:
                            vs = self.constraint_checker.check_all_hard_constraints(
                                voice, note_val, None, curr_voices
                            )
                            violations.extend(vs)
                    
                    hard_violations = [v for v in violations if v.severity == "hard"]
                    if hard_violations:
                        continue
                    
                    # For first step score = 0 (no motion)
                    score = self.scorer.total_score(None, curr_voices, 0, midi_to_pitch_class(bass_note))
                    
                    solutions.append(Solution(
                        voices=curr_voices,
                        score=score,
                        violations=violations
                    ))
        
        solutions.sort(key=lambda s: s.score)
        return solutions[:self.beam_width]
    
    def solve(self, bass_line: List[int], chord_types: Optional[List[str]] = None) -> List[Dict[Voice, int]]:
        """
        Solves entire sequence.
        
        Args:
            bass_line: list of MIDI notes for bass
            chord_types: list of chord types (default all major)
        
        Returns:
            List of solutions for each time step
        """
        if chord_types is None:
            chord_types = ["major"] * len(bass_line)
        
        prev_solutions = []
        all_solutions = []
        
        for i, bass_note in enumerate(bass_line):
            chord_type = chord_types[i] if i < len(chord_types) else "major"
            solutions = self.solve_step(bass_note, prev_solutions, chord_type)
            
            if not solutions:
                # If no solutions, use first valid from previous step
                if prev_solutions:
                    # Simplified solution: use same notes as previous step
                    prev_voices = prev_solutions[0].voices.copy()
                    prev_voices[Voice.BASS] = bass_note
                    # Try to find nearest valid notes
                    solutions = [Solution(voices=prev_voices, score=100.0, violations=[])]
                else:
                    raise ValueError(f"No valid solution found for step {i}")
            
            # Select best solution
            best_solution = solutions[0]
            all_solutions.append(best_solution.voices)
            prev_solutions = solutions
        
        return all_solutions

