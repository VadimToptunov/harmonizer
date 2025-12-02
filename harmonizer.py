"""
Main class for four-part harmony generation.
"""
from typing import List, Dict, Optional
from music_utils import Voice, parse_musicxml, export_to_musicxml
from solver import BeamSearchSolver, Solution
from explanation import ExplanationEngine
from dataclasses import dataclass


@dataclass
class HarmonizationResult:
    """Result of harmonization."""
    voices: List[Dict[Voice, int]]
    explanations: str
    success: bool
    error_message: Optional[str] = None


class Harmonizer:
    """Main class for four-part harmony generation."""
    
    def __init__(self, beam_width: int = 10):
        """
        Initialize harmonizer.
        
        Args:
            beam_width: beam width for beam search
        """
        self.solver = BeamSearchSolver(beam_width=beam_width)
        self.explanation_engine = ExplanationEngine()
        self.all_candidates_per_step = []  # For explanations
    
    def harmonize(self, input_file: str, output_file: Optional[str] = None,
                 chord_types: Optional[List[str]] = None) -> HarmonizationResult:
        """
        Generates four-part harmony based on bass line.
        
        Args:
            input_file: path to input MusicXML file with bass line
            output_file: path to output MusicXML file (optional)
            chord_types: list of chord types for each step
        
        Returns:
            HarmonizationResult
        """
        try:
            # Parse input file
            time_steps = parse_musicxml(input_file)
            if not time_steps:
                return HarmonizationResult(
                    voices=[],
                    explanations="",
                    success=False,
                    error_message="No bass notes found in input file"
                )
            
            # Extract bass line
            bass_line = []
            for time_step, notes in time_steps:
                if notes:
                    bass_line.append(notes[0])  # Take first note (lowest)
            
            if not bass_line:
                return HarmonizationResult(
                    voices=[],
                    explanations="",
                    success=False,
                    error_message="No bass notes extracted"
                )
            
            # Solve the problem
            solutions = self._solve_with_tracking(bass_line, chord_types)
            
            if not solutions:
                return HarmonizationResult(
                    voices=[],
                    explanations="",
                    success=False,
                    error_message="No valid harmonization found"
                )
            
            # Generate explanations
            explanations_text = self.explanation_engine.generate_full_explanation(
                [Solution(voices=s, score=0.0, violations=[]) for s in solutions],
                self.all_candidates_per_step
            )
            
            # Export result
            if output_file:
                # Convert solution list to export format
                all_voices = {voice: [] for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]}
                for solution_dict in solutions:
                    for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
                        all_voices[voice].append(solution_dict.get(voice, 0))
                
                export_to_musicxml(all_voices, output_file)
            
            return HarmonizationResult(
                voices=solutions,
                explanations=explanations_text,
                success=True
            )
        
        except Exception as e:
            return HarmonizationResult(
                voices=[],
                explanations="",
                success=False,
                error_message=f"Error: {str(e)}"
            )
    
    def _solve_with_tracking(self, bass_line: List[int], 
                            chord_types: Optional[List[str]] = None) -> List[Dict[Voice, int]]:
        """Solves the problem while tracking all candidates for explanations."""
        if chord_types is None:
            chord_types = ["major"] * len(bass_line)
        
        prev_solutions = []
        all_solutions = []
        self.all_candidates_per_step = []
        
        for i, bass_note in enumerate(bass_line):
            chord_type = chord_types[i] if i < len(chord_types) else "major"
            
            # Generate solutions
            solutions = self.solver.solve_step(bass_note, prev_solutions, chord_type)
            self.all_candidates_per_step.append(solutions)
            
            if not solutions:
                if prev_solutions:
                    prev_voices = prev_solutions[0].voices.copy()
                    prev_voices[Voice.BASS] = bass_note
                    solutions = [Solution(voices=prev_voices, score=100.0, violations=[])]
                else:
                    raise ValueError(f"No valid solution found for step {i}")
            
            best_solution = solutions[0]
            all_solutions.append(best_solution.voices)
            prev_solutions = solutions
        
        return all_solutions


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python harmonizer.py <input.xml> [output.xml]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else input_file.replace(".xml", "_harmonized.xml")
    
    harmonizer = Harmonizer()
    result = harmonizer.harmonize(input_file, output_file)
    
    if result.success:
        print("✓ Harmonization successful!")
        print(f"Output saved to: {output_file}")
        print("\n" + "="*60)
        print("EXPLANATIONS:")
        print("="*60)
        print(result.explanations)
    else:
        print(f"✗ Harmonization failed: {result.error_message}")
        sys.exit(1)

