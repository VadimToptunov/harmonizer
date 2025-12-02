"""
Different types of harmony and counterpoint exercises.
"""
from typing import List, Dict, Optional, Tuple
from music_utils import Voice, parse_musicxml, export_to_musicxml, midi_to_pitch_class
from solver import BeamSearchSolver, Solution
from explanation import ExplanationEngine
from constraints import ConstraintChecker, SoftConstraintScorer
from dataclasses import dataclass
from enum import Enum


class ExerciseType(Enum):
    """Types of harmony exercises."""
    BASS_FIGURED = "bass_figured"  # Generate upper voices from figured bass
    MELODY_HARMONIZATION = "melody_harmonization"  # Generate harmony from melody
    COUNTERPOINT = "counterpoint"  # Write counterpoint to cantus firmus
    ERROR_CORRECTION = "error_correction"  # Find and fix errors
    CADENCE_GENERATION = "cadence_generation"  # Generate cadences
    VOICE_COMPLETION = "voice_completion"  # Complete missing voice(s)


@dataclass
class ExerciseResult:
    """Result of an exercise."""
    voices: List[Dict[Voice, int]]
    explanations: str
    success: bool
    error_message: Optional[str] = None
    exercise_type: Optional[ExerciseType] = None


class CounterpointSolver:
    """Solver for counterpoint exercises (species counterpoint)."""
    
    def __init__(self, species: int = 1):
        """
        Initialize counterpoint solver.
        
        Args:
            species: Counterpoint species (1-5)
                    1: Note against note
                    2: Two notes against one
                    3: Four notes against one
                    4: Syncopated (suspensions)
                    5: Florid (mixed)
        """
        self.species = species
        self.constraint_checker = ConstraintChecker()
        self.scorer = SoftConstraintScorer()
    
    def solve_species_1(self, cantus_firmus: List[int], 
                       above: bool = True) -> List[Dict[Voice, int]]:
        """
        Solve first species counterpoint (note against note).
        
        Args:
            cantus_firmus: List of MIDI notes for cantus firmus
            above: If True, counterpoint is above CF, else below
        
        Returns:
            List of voice dictionaries for each time step
        """
        solutions = []
        prev_cp_note = None
        
        for i, cf_note in enumerate(cantus_firmus):
            # Generate candidates for counterpoint
            candidates = self._generate_counterpoint_candidates(
                cf_note, prev_cp_note, above, i == 0, i == len(cantus_firmus) - 1
            )
            
            # Filter by constraints
            valid_candidates = []
            for cp_note in candidates:
                voices = {
                    Voice.SOPRANO: cp_note if above else cf_note,
                    Voice.BASS: cf_note if above else cp_note
                }
                
                # Check intervals
                interval = abs(cp_note - cf_note) % 12
                if interval in [0, 1, 2, 6, 10, 11]:  # Avoid dissonances in species 1
                    continue
                
                # Check parallel motion
                if prev_cp_note is not None and i > 0:
                    prev_voices = {
                        Voice.SOPRANO: prev_cp_note if above else cantus_firmus[i-1],
                        Voice.BASS: cantus_firmus[i-1] if above else prev_cp_note
                    }
                    parallels = self.constraint_checker.check_parallels(prev_voices, voices)
                    if parallels:
                        continue
                
                # Score candidate
                score = self._score_counterpoint_note(cp_note, prev_cp_note, cf_note, above)
                valid_candidates.append((cp_note, score))
            
            if not valid_candidates:
                # Fallback: use consonant interval
                if above:
                    cp_note = cf_note + 7  # Perfect fifth above
                else:
                    cp_note = cf_note - 7  # Perfect fifth below
            else:
                valid_candidates.sort(key=lambda x: x[1])
                cp_note = valid_candidates[0][0]
            
            solutions.append({
                Voice.SOPRANO: cp_note if above else cf_note,
                Voice.BASS: cf_note if above else cp_note
            })
            prev_cp_note = cp_note
        
        return solutions
    
    def _generate_counterpoint_candidates(self, cf_note: int, prev_cp: Optional[int],
                                         above: bool, is_start: bool, is_end: bool) -> List[int]:
        """Generate candidate notes for counterpoint."""
        candidates = []
        
        # Preferred intervals: 3, 4, 5, 6, 8 (consonances)
        intervals = [3, 4, 5, 6, 8, 10]  # m3, M3, P4, P5, M6, m7
        
        for interval in intervals:
            if above:
                note = cf_note + interval
            else:
                note = cf_note - interval
            
            # Check range (simplified - assume C4-C5 for counterpoint)
            if 60 <= note <= 84:
                candidates.append(note)
        
        # Add octave
        if above:
            candidates.append(cf_note + 12)
        else:
            candidates.append(cf_note - 12)
        
        # Start and end on perfect consonance
        if is_start or is_end:
            # Prefer unison, octave, or fifth
            if above:
                candidates = [cf_note, cf_note + 7, cf_note + 12] + candidates
            else:
                candidates = [cf_note, cf_note - 7, cf_note - 12] + candidates
        
        return list(set(candidates))  # Remove duplicates
    
    def _score_counterpoint_note(self, cp_note: int, prev_cp: Optional[int],
                                cf_note: int, above: bool) -> float:
        """Score a counterpoint note."""
        score = 0.0
        
        # Prefer stepwise motion
        if prev_cp:
            motion = abs(cp_note - prev_cp)
            if motion <= 2:
                score += 1.0
            elif motion > 7:
                score += 5.0  # Penalty for large leaps
        
        # Prefer contrary motion
        if prev_cp:
            cf_motion = cf_note - (cf_note - (cp_note - cf_note))  # Simplified
            cp_motion = cp_note - prev_cp
            if (cf_motion * cp_motion) < 0:
                score -= 2.0  # Bonus for contrary motion
        
        # Prefer perfect consonances
        interval = abs(cp_note - cf_note) % 12
        if interval in [0, 7]:  # Unison or fifth
            score -= 1.0
        
        return score


class MelodyHarmonizer:
    """Harmonizes a given melody."""
    
    def __init__(self):
        self.solver = BeamSearchSolver()
        self.constraint_checker = ConstraintChecker()
    
    def harmonize_melody(self, melody: List[int],
                        chord_types: Optional[List[str]] = None) -> List[Dict[Voice, int]]:
        """
        Generate harmony for a given melody.
        
        Args:
            melody: List of MIDI notes for soprano (melody)
            chord_types: Optional list of chord types
        
        Returns:
            List of voice dictionaries
        """
        solutions = []
        prev_voices = None
        
        for i, soprano_note in enumerate(melody):
            # Determine possible bass notes based on melody note
            # For now, assume major triads
            root_pc = midi_to_pitch_class(soprano_note)
            
            # Try different chord interpretations
            possible_roots = []
            # Melody could be root, third, or fifth
            possible_roots.append(soprano_note)  # Root
            possible_roots.append(soprano_note - 4)  # Third (down M3)
            possible_roots.append(soprano_note - 7)  # Fifth (down P5)
            possible_roots.append(soprano_note - 3)  # Third (down m3)
            possible_roots.append(soprano_note - 8)  # Fifth (down m6)
            
            best_solution = None
            best_score = float('inf')
            
            for bass_candidate in possible_roots:
                # Generate A and T
                chord_type = chord_types[i] if chord_types and i < len(chord_types) else "major"
                chord_tones = self.solver.generate_candidate_notes(Voice.ALTO, bass_candidate, chord_type)
                tenor_candidates = self.solver.generate_candidate_notes(Voice.TENOR, bass_candidate, chord_type)
                
                for alto_note in chord_tones[:5]:  # Limit candidates
                    for tenor_note in tenor_candidates[:5]:
                        voices = {
                            Voice.SOPRANO: soprano_note,
                            Voice.ALTO: alto_note,
                            Voice.TENOR: tenor_note,
                            Voice.BASS: bass_candidate
                        }
                        
                        # Check constraints
                        violations = []
                        for voice, note_val in voices.items():
                            if voice != Voice.SOPRANO:
                                vs = self.constraint_checker.check_all_hard_constraints(
                                    voice, note_val, prev_voices, voices
                                )
                                violations.extend(vs)
                        
                        if prev_voices:
                            parallels = self.constraint_checker.check_parallels(prev_voices, voices)
                            violations.extend(parallels)
                        
                        hard_violations = [v for v in violations if v.severity == "hard"]
                        if hard_violations:
                            continue
                        
                        # Score
                        scorer = SoftConstraintScorer()
                        bass_motion = bass_candidate - prev_voices[Voice.BASS] if prev_voices else 0
                        score = scorer.total_score(prev_voices, voices, bass_motion, midi_to_pitch_class(bass_candidate))
                        
                        if score < best_score:
                            best_score = score
                            best_solution = voices
            
            if best_solution:
                solutions.append(best_solution)
                prev_voices = best_solution
            else:
                # Fallback
                if prev_voices:
                    solutions.append(prev_voices.copy())
                    solutions[-1][Voice.SOPRANO] = soprano_note
                else:
                    solutions.append({
                        Voice.SOPRANO: soprano_note,
                        Voice.ALTO: soprano_note - 4,
                        Voice.TENOR: soprano_note - 7,
                        Voice.BASS: soprano_note - 12
                    })
                prev_voices = solutions[-1]
        
        return solutions


class ErrorCorrector:
    """Finds and corrects errors in four-part harmony."""
    
    def __init__(self):
        self.constraint_checker = ConstraintChecker()
        self.solver = BeamSearchSolver()
    
    def find_errors(self, voices: List[Dict[Voice, int]]) -> List[Dict]:
        """
        Find errors in four-part harmony.
        
        Returns:
            List of error dictionaries with location and description
        """
        errors = []
        
        for i in range(len(voices)):
            curr_voices = voices[i]
            
            # Check voice ranges
            for voice, note_val in curr_voices.items():
                violation = self.constraint_checker.check_voice_range(voice, note_val)
                if violation:
                    errors.append({
                        "step": i,
                        "voice": voice.value,
                        "type": "range",
                        "description": violation.description
                    })
            
            # Check voice order
            order_violation = self.constraint_checker.check_voice_order(curr_voices)
            if order_violation:
                errors.append({
                    "step": i,
                    "type": "voice_crossing",
                    "description": order_violation.description
                })
            
            # Check spacing
            spacing_violation = self.constraint_checker.check_spacing(curr_voices)
            if spacing_violation:
                errors.append({
                    "step": i,
                    "type": "spacing",
                    "description": spacing_violation.description
                })
            
            # Check parallels with previous step
            if i > 0:
                parallels = self.constraint_checker.check_parallels(voices[i-1], curr_voices)
                for violation in parallels:
                    errors.append({
                        "step": i,
                        "type": "parallelism",
                        "description": violation.description
                    })
        
        return errors
    
    def correct_errors(self, voices: List[Dict[Voice, int]], 
                      errors: List[Dict]) -> List[Dict[Voice, int]]:
        """
        Attempt to correct errors in harmony.
        
        Args:
            voices: Original voices with errors
            errors: List of errors found
        
        Returns:
            Corrected voices
        """
        corrected = voices.copy()
        
        # Group errors by step
        errors_by_step = {}
        for error in errors:
            step = error["step"]
            if step not in errors_by_step:
                errors_by_step[step] = []
            errors_by_step[step].append(error)
        
        # Correct each step
        for step, step_errors in errors_by_step.items():
            # Try to fix by adjusting notes
            curr_voices = corrected[step].copy()
            
            for error in step_errors:
                if error["type"] == "range":
                    voice = Voice[error["voice"]]
                    note_val = curr_voices[voice]
                    min_note, max_note = {
                        Voice.SOPRANO: (60, 84),
                        Voice.ALTO: (55, 72),
                        Voice.TENOR: (48, 69),
                        Voice.BASS: (40, 60)
                    }[voice]
                    
                    if note_val < min_note:
                        curr_voices[voice] = min_note
                    elif note_val > max_note:
                        curr_voices[voice] = max_note
                
                # Other error types would need more sophisticated correction
                # For now, just log them
        
        return corrected


class ExerciseSolver:
    """Main class for solving different types of harmony exercises."""
    
    def __init__(self):
        self.counterpoint_solver = CounterpointSolver()
        self.melody_harmonizer = MelodyHarmonizer()
        self.error_corrector = ErrorCorrector()
        self.explanation_engine = ExplanationEngine()
    
    def solve_exercise(self, exercise_type: ExerciseType,
                      input_file: str,
                      output_file: Optional[str] = None,
                      **kwargs) -> ExerciseResult:
        """
        Solve a harmony exercise.
        
        Args:
            exercise_type: Type of exercise
            input_file: Input MusicXML file
            output_file: Output file (optional)
            **kwargs: Additional parameters for specific exercises
        
        Returns:
            ExerciseResult
        """
        try:
            if exercise_type == ExerciseType.BASS_FIGURED:
                # This is the default harmonization
                from harmonizer import Harmonizer
                harmonizer = Harmonizer()
                result = harmonizer.harmonize(input_file, output_file)
                return ExerciseResult(
                    voices=result.voices,
                    explanations=result.explanations,
                    success=result.success,
                    error_message=result.error_message,
                    exercise_type=exercise_type
                )
            
            elif exercise_type == ExerciseType.MELODY_HARMONIZATION:
                time_steps = parse_musicxml(input_file)
                melody = []
                for _, notes in time_steps:
                    if notes:
                        melody.append(notes[0])  # Assume melody is first voice
                
                solutions = self.melody_harmonizer.harmonize_melody(melody)
                
                if output_file:
                    all_voices = {voice: [] for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]}
                    for solution in solutions:
                        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
                            all_voices[voice].append(solution.get(voice, 0))
                    export_to_musicxml(all_voices, output_file)
                
                return ExerciseResult(
                    voices=solutions,
                    explanations="Melody harmonization completed.",
                    success=True,
                    exercise_type=exercise_type
                )
            
            elif exercise_type == ExerciseType.COUNTERPOINT:
                time_steps = parse_musicxml(input_file)
                cantus_firmus = []
                for _, notes in time_steps:
                    if notes:
                        cantus_firmus.append(notes[0])
                
                above = kwargs.get("above", True)
                solutions = self.counterpoint_solver.solve_species_1(cantus_firmus, above)
                
                if output_file:
                    all_voices = {Voice.SOPRANO: [], Voice.BASS: []}
                    for solution in solutions:
                        all_voices[Voice.SOPRANO].append(solution.get(Voice.SOPRANO, 0))
                        all_voices[Voice.BASS].append(solution.get(Voice.BASS, 0))
                    export_to_musicxml(all_voices, output_file)
                
                return ExerciseResult(
                    voices=solutions,
                    explanations="Counterpoint exercise completed.",
                    success=True,
                    exercise_type=exercise_type
                )
            
            elif exercise_type == ExerciseType.ERROR_CORRECTION:
                time_steps = parse_musicxml(input_file)
                voices = []
                for _, notes in time_steps:
                    # Parse all voices (simplified - would need proper parsing)
                    voices.append({
                        Voice.SOPRANO: notes[0] if len(notes) > 0 else 0,
                        Voice.ALTO: notes[1] if len(notes) > 1 else 0,
                        Voice.TENOR: notes[2] if len(notes) > 2 else 0,
                        Voice.BASS: notes[3] if len(notes) > 3 else 0,
                    })
                
                errors = self.error_corrector.find_errors(voices)
                corrected = self.error_corrector.correct_errors(voices, errors)
                
                error_report = f"Found {len(errors)} errors:\n"
                for error in errors:
                    error_report += f"Step {error['step']}: {error['description']}\n"
                
                if output_file:
                    all_voices = {voice: [] for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]}
                    for solution in corrected:
                        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
                            all_voices[voice].append(solution.get(voice, 0))
                    export_to_musicxml(all_voices, output_file)
                
                return ExerciseResult(
                    voices=corrected,
                    explanations=error_report,
                    success=True,
                    exercise_type=exercise_type
                )
            
            else:
                return ExerciseResult(
                    voices=[],
                    explanations="",
                    success=False,
                    error_message=f"Exercise type {exercise_type} not yet implemented",
                    exercise_type=exercise_type
                )
        
        except Exception as e:
            return ExerciseResult(
                voices=[],
                explanations="",
                success=False,
                error_message=f"Error: {str(e)}",
                exercise_type=exercise_type
            )

