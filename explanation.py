"""
Explanation engine for harmonization decisions.
"""
from typing import List, Dict, Optional
from music_utils import Voice, pitch_class_to_name, get_interval_type
from constraints import ConstraintViolation, ConstraintChecker, SoftConstraintScorer
from solver import Solution
from dataclasses import dataclass


@dataclass
class DecisionExplanation:
    """Explanation of decision for one time step."""
    time_step: int
    chosen_voices: Dict[Voice, int]
    rejected_alternatives: List[Dict[str, any]]
    positive_factors: List[str]
    active_constraints: List[str]
    why_chosen: List[str]  # Why this solution was chosen
    potential_errors: List[str]  # Where errors can be made
    tradeoffs: List[str]  # Tradeoffs between factors


class ExplanationEngine:
    """Generates explanations for decisions."""
    
    def __init__(self):
        self.constraint_checker = ConstraintChecker()
        self.scorer = SoftConstraintScorer()
    
    def explain_decision(self, time_step: int, chosen_solution: Solution,
                        all_candidates: List[Solution],
                        prev_voices: Optional[Dict[Voice, int]] = None) -> DecisionExplanation:
        """
        Generates explanation for chosen solution.
        
        Args:
            time_step: time step number
            chosen_solution: chosen solution
            all_candidates: all candidates for this step
            prev_voices: previous voices
        
        Returns:
            DecisionExplanation
        """
        # Get rejected alternatives
        rejected = []
        for candidate in all_candidates:
            if candidate.voices == chosen_solution.voices:
                continue
            
            # Check why this candidate was rejected
            violations = []
            for voice, note_val in candidate.voices.items():
                if voice != Voice.BASS:
                    vs = self.constraint_checker.check_all_hard_constraints(
                        voice, note_val, prev_voices, candidate.voices
                    )
                    violations.extend(vs)
            
            if prev_voices:
                parallel_vs = self.constraint_checker.check_parallels(prev_voices, candidate.voices)
                violations.extend(parallel_vs)
            
            hard_violations = [v for v in violations if v.severity == "hard"]
            if hard_violations:
                rejected.append({
                    "voices": candidate.voices,
                    "reason": "hard_constraint_violation",
                    "violations": [v.description for v in hard_violations]
                })
            elif candidate.score > chosen_solution.score:
                rejected.append({
                    "voices": candidate.voices,
                    "reason": "lower_score",
                    "score": candidate.score,
                    "chosen_score": chosen_solution.score
                })
        
        # Get positive factors
        positive_factors = self._get_positive_factors(chosen_solution, prev_voices)
        
        # Get active constraints
        active_constraints = self._get_active_constraints(chosen_solution, prev_voices)
        
        # Explain why this solution was chosen
        why_chosen = self._explain_why_chosen(chosen_solution, all_candidates, prev_voices)
        
        # Identify potential error locations
        potential_errors = self._identify_potential_errors(chosen_solution, prev_voices, all_candidates)
        
        # Explain tradeoffs
        tradeoffs = self._explain_tradeoffs(chosen_solution, all_candidates, prev_voices)
        
        return DecisionExplanation(
            time_step=time_step,
            chosen_voices=chosen_solution.voices,
            rejected_alternatives=rejected,
            positive_factors=positive_factors,
            active_constraints=active_constraints,
            why_chosen=why_chosen,
            potential_errors=potential_errors,
            tradeoffs=tradeoffs
        )
    
    def _get_positive_factors(self, solution: Solution, 
                              prev_voices: Optional[Dict[Voice, int]]) -> List[str]:
        """Extracts positive factors of solution."""
        factors = []
        
        if not prev_voices:
            return ["Initial chord - no motion constraints"]
        
        # Check voice motion
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
            prev_note = prev_voices.get(voice)
            curr_note = solution.voices.get(voice)
            
            if prev_note and curr_note:
                motion = abs(curr_note - prev_note)
                if motion == 0:
                    factors.append(f"{voice.value} stays on same note (minimal motion)")
                elif motion <= 2:
                    factors.append(f"{voice.value} moves stepwise ({motion} semitones)")
                
                # Check counterpoint with bass
                bass_motion = solution.voices[Voice.BASS] - prev_voices[Voice.BASS]
                voice_motion = curr_note - prev_note
                if bass_motion != 0 and voice_motion != 0 and (bass_motion * voice_motion < 0):
                    factors.append(f"{voice.value} moves contrary to bass (good counterpoint)")
        
        # Check doubling
        root_pc = solution.voices[Voice.BASS] % 12
        root_count = sum(1 for v in solution.voices.values() if v % 12 == root_pc)
        if root_count >= 2:
            factors.append(f"Root is doubled ({root_count} times)")
        
        # Check absence of parallelisms
        parallels = self.constraint_checker.check_parallels(prev_voices, solution.voices)
        if not parallels:
            factors.append("No parallel fifths or octaves")
        
        return factors
    
    def _get_active_constraints(self, solution: Solution,
                               prev_voices: Optional[Dict[Voice, int]]) -> List[str]:
        """Gets list of active constraints."""
        constraints = []
        
        # Voice ranges
        constraints.append("Voice ranges: S[C4-C6], A[G3-C5], T[C3-A4], B[E2-C4]")
        
        # Voice order
        constraints.append("Voice order: S ≥ A ≥ T ≥ B")
        
        # Intervals
        constraints.append("Spacing: ≤ octave between S-A and A-T")
        
        if prev_voices:
            constraints.append("No parallel perfect fifths or octaves")
            constraints.append("No hidden fifths/octaves in parallel motion")
        
        return constraints
    
    def _explain_why_chosen(self, chosen_solution: Solution,
                           all_candidates: List[Solution],
                           prev_voices: Optional[Dict[Voice, int]]) -> List[str]:
        """Explains why this solution was chosen over alternatives."""
        explanations = []
        
        if not prev_voices:
            explanations.append("This is the initial chord. Selection based on optimal spacing and root doubling.")
            return explanations
        
        # Find similar alternatives for comparison
        similar_candidates = []
        for candidate in all_candidates:
            if candidate.voices == chosen_solution.voices:
                continue
            # Count number of identical notes
            same_notes = sum(1 for v in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR] 
                           if candidate.voices.get(v) == chosen_solution.voices.get(v))
            if same_notes >= 2:  # Similar solutions (2+ identical notes)
                similar_candidates.append((candidate, same_notes))
        
        # Sort by similarity
        similar_candidates.sort(key=lambda x: x[1], reverse=True)
        
        if similar_candidates:
            best_alt = similar_candidates[0][0]
            score_diff = best_alt.score - chosen_solution.score
            
            explanations.append(f"Chosen over {len(similar_candidates)} similar alternatives.")
            explanations.append(f"Best alternative had score {best_alt.score:.1f} vs chosen {chosen_solution.score:.1f} (difference: {score_diff:.1f})")
            
            # Compare specific factors
            chosen_motion = self._calculate_total_motion(chosen_solution.voices, prev_voices)
            alt_motion = self._calculate_total_motion(best_alt.voices, prev_voices)
            
            if chosen_motion < alt_motion:
                explanations.append(f"Chosen solution has less total voice motion ({chosen_motion} semitones vs {alt_motion})")
            
            # Check counterpoint
            chosen_contrary = self._count_contrary_motions(chosen_solution.voices, prev_voices)
            alt_contrary = self._count_contrary_motions(best_alt.voices, prev_voices)
            
            if chosen_contrary > alt_contrary:
                explanations.append(f"Chosen solution has more contrary motion with bass ({chosen_contrary} voices vs {alt_contrary})")
        
        # Explain specific advantages
        if chosen_solution.score < 5.0:
            explanations.append("Low overall score indicates good balance of all factors.")
        
        return explanations
    
    def _identify_potential_errors(self, solution: Solution,
                                   prev_voices: Optional[Dict[Voice, int]],
                                   all_candidates: List[Solution]) -> List[str]:
        """Identifies potential locations where errors can be made."""
        errors = []
        
        if not prev_voices:
            return ["Initial chord: ensure proper voice spacing and root doubling"]
        
        # Check edge cases
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
            note_val = solution.voices.get(voice)
            if note_val:
                min_note, max_note = {
                    Voice.SOPRANO: (60, 84),
                    Voice.ALTO: (55, 72),
                    Voice.TENOR: (48, 69)
                }[voice]
                
                if note_val <= min_note + 2:
                    errors.append(f"{voice.value} is near lower range limit ({note_val}), risk of going out of range")
                if note_val >= max_note - 2:
                    errors.append(f"{voice.value} is near upper range limit ({note_val}), risk of going out of range")
        
        # Check for potential parallelisms in next step
        # (hard to predict, but can warn)
        bass_motion = solution.voices[Voice.BASS] - prev_voices[Voice.BASS]
        if bass_motion != 0:
            for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
                voice_motion = solution.voices[voice] - prev_voices.get(voice, solution.voices[voice])
                if voice_motion != 0 and (bass_motion * voice_motion > 0):
                    errors.append(f"{voice.value} moves parallel with bass - be careful in next step to avoid hidden parallelisms")
        
        # Check for large leaps
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
            prev_note = prev_voices.get(voice)
            curr_note = solution.voices.get(voice)
            if prev_note and curr_note:
                motion = abs(curr_note - prev_note)
                if motion > 7:
                    errors.append(f"{voice.value} makes a large leap ({motion} semitones) - ensure proper voice leading in next step")
        
        # Check doublings
        root_pc = solution.voices[Voice.BASS] % 12
        root_count = sum(1 for v in solution.voices.values() if v % 12 == root_pc)
        if root_count < 2:
            errors.append(f"Root is not doubled (only {root_count} occurrence) - may cause weak harmonic foundation")
        
        # Check chord spacing
        s = solution.voices.get(Voice.SOPRANO)
        a = solution.voices.get(Voice.ALTO)
        t = solution.voices.get(Voice.TENOR)
        if s and a and t:
            sa_interval = abs(s - a)
            at_interval = abs(a - t)
            if sa_interval > 10 or at_interval > 10:
                errors.append("Wide spacing between upper voices - may sound disconnected")
        
        return errors
    
    def _explain_tradeoffs(self, chosen_solution: Solution,
                          all_candidates: List[Solution],
                          prev_voices: Optional[Dict[Voice, int]]) -> List[str]:
        """Explains tradeoffs between different factors."""
        tradeoffs = []
        
        if not prev_voices:
            return tradeoffs
        
        # Analyze tradeoffs
        # Motion vs counterpoint
        total_motion = self._calculate_total_motion(chosen_solution.voices, prev_voices)
        contrary_count = self._count_contrary_motions(chosen_solution.voices, prev_voices)
        
        if total_motion < 5 and contrary_count < 2:
            tradeoffs.append("Minimal motion prioritized over contrary motion - voices stay close to previous positions")
        elif total_motion > 10 and contrary_count >= 2:
            tradeoffs.append("Contrary motion prioritized over minimal motion - more voice movement for better counterpoint")
        
        # Check if there are alternatives with better counterpoint but worse motion
        better_contrary_candidates = []
        for candidate in all_candidates:
            if candidate.voices == chosen_solution.voices:
                continue
            alt_contrary = self._count_contrary_motions(candidate.voices, prev_voices)
            alt_motion = self._calculate_total_motion(candidate.voices, prev_voices)
            if alt_contrary > contrary_count and alt_motion > total_motion:
                better_contrary_candidates.append((candidate, alt_contrary, alt_motion))
        
        if better_contrary_candidates:
            best_alt = max(better_contrary_candidates, key=lambda x: x[1])
            tradeoffs.append(f"Alternative with better contrary motion ({best_alt[1]} vs {contrary_count}) rejected due to excessive voice motion ({best_alt[2]} vs {total_motion} semitones)")
        
        # Doubling vs spacing
        root_pc = chosen_solution.voices[Voice.BASS] % 12
        root_count = sum(1 for v in chosen_solution.voices.values() if v % 12 == root_pc)
        
        if root_count >= 2:
            # Check if we sacrificed spacing for doubling
            s = chosen_solution.voices.get(Voice.SOPRANO)
            a = chosen_solution.voices.get(Voice.ALTO)
            t = chosen_solution.voices.get(Voice.TENOR)
            if s and a and t:
                spacing_variance = self._calculate_spacing_variance(s, a, t)
                if spacing_variance > 5:
                    tradeoffs.append("Root doubling prioritized over even spacing - chord may sound less balanced but harmonically stronger")
        
        return tradeoffs
    
    def _calculate_total_motion(self, curr_voices: Dict[Voice, int],
                               prev_voices: Dict[Voice, int]) -> int:
        """Calculates total motion of all voices."""
        total = 0
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
            prev_note = prev_voices.get(voice)
            curr_note = curr_voices.get(voice)
            if prev_note and curr_note:
                total += abs(curr_note - prev_note)
        return total
    
    def _count_contrary_motions(self, curr_voices: Dict[Voice, int],
                               prev_voices: Dict[Voice, int]) -> int:
        """Counts number of voices moving contrapuntally with bass."""
        count = 0
        bass_motion = curr_voices[Voice.BASS] - prev_voices[Voice.BASS]
        
        if bass_motion == 0:
            return 0
        
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
            prev_note = prev_voices.get(voice)
            curr_note = curr_voices.get(voice)
            if prev_note and curr_note:
                voice_motion = curr_note - prev_note
                if voice_motion != 0 and (bass_motion * voice_motion < 0):
                    count += 1
        
        return count
    
    def _calculate_spacing_variance(self, s: int, a: int, t: int) -> float:
        """Calculates variance of intervals between upper voices."""
        sa = abs(s - a)
        at = abs(a - t)
        intervals = [sa, at]
        avg = sum(intervals) / len(intervals)
        variance = sum((i - avg) ** 2 for i in intervals) / len(intervals)
        return variance
    
    def format_explanation(self, explanation: DecisionExplanation) -> str:
        """Formats explanation into readable text."""
        lines = []
        lines.append(f"\n=== Measure {explanation.time_step + 1} ===")
        lines.append("\nChosen harmony:")
        
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            midi = explanation.chosen_voices.get(voice)
            if midi:
                pc = midi % 12
                note_name = pitch_class_to_name(pc)
                octave = (midi // 12) - 1
                lines.append(f"  {voice.value}: {note_name}{octave} (MIDI {midi})")
        
        if explanation.positive_factors:
            lines.append("\nPositive factors:")
            for factor in explanation.positive_factors:
                lines.append(f"  ✓ {factor}")
        
        if explanation.rejected_alternatives:
            lines.append(f"\nRejected alternatives ({len(explanation.rejected_alternatives)}):")
            for i, alt in enumerate(explanation.rejected_alternatives[:5], 1):  # Show first 5
                voices_str = ", ".join([f"{v.value}:{n}" for v, n in alt['voices'].items() if v != Voice.BASS])
                if alt['reason'] == 'hard_constraint_violation':
                    lines.append(f"  {i}. {voices_str}")
                    for violation in alt['violations'][:2]:  # First 2 violations
                        lines.append(f"     ✗ {violation}")
                else:
                    lines.append(f"  {i}. {voices_str} (score: {alt.get('score', 'N/A')} > {alt.get('chosen_score', 'N/A')})")
        
        if explanation.active_constraints:
            lines.append("\nActive constraints:")
            for constraint in explanation.active_constraints:
                lines.append(f"  • {constraint}")
        
        if explanation.why_chosen:
            lines.append("\n" + "="*50)
            lines.append("WHY THIS SOLUTION WAS CHOSEN:")
            lines.append("="*50)
            for reason in explanation.why_chosen:
                lines.append(f"  → {reason}")
        
        if explanation.tradeoffs:
            lines.append("\n" + "="*50)
            lines.append("TRADEOFFS AND COMPROMISES:")
            lines.append("="*50)
            for tradeoff in explanation.tradeoffs:
                lines.append(f"  ⚖ {tradeoff}")
        
        if explanation.potential_errors:
            lines.append("\n" + "="*50)
            lines.append("⚠ POTENTIAL ERRORS TO WATCH FOR:")
            lines.append("="*50)
            for error in explanation.potential_errors:
                lines.append(f"  ⚠ {error}")
        
        return "\n".join(lines)
    
    def generate_full_explanation(self, solutions: List[Solution],
                                 all_candidates_per_step: List[List[Solution]]) -> str:
        """Generates full explanation for entire sequence."""
        explanations = []
        prev_voices = None
        
        for i, (solution, candidates) in enumerate(zip(solutions, all_candidates_per_step)):
            expl = self.explain_decision(i, solution, candidates, prev_voices)
            explanations.append(self.format_explanation(expl))
            prev_voices = solution.voices
        
        return "\n".join(explanations)

