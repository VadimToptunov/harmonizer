"""
Hard and soft constraint checking for four-part harmony.
"""
from typing import List, Dict, Tuple, Optional, Set
from music_utils import Voice, VOICE_RANGES, is_perfect_fifth, is_perfect_octave, get_interval_semitones, midi_to_pitch_class
from dataclasses import dataclass


@dataclass
class ConstraintViolation:
    """Constraint violation."""
    rule_name: str
    description: str
    severity: str  # "hard" or "soft"


class ConstraintChecker:
    """Checks constraints for four-part harmony."""
    
    def __init__(self):
        self.violations = []
    
    def check_voice_range(self, voice: Voice, midi_note: int) -> Optional[ConstraintViolation]:
        """Checks voice range."""
        min_note, max_note = VOICE_RANGES[voice]
        if midi_note < min_note or midi_note > max_note:
            return ConstraintViolation(
                rule_name="voice_range",
                description=f"{voice.value} note {midi_note} outside range [{min_note}, {max_note}]",
                severity="hard"
            )
        return None
    
    def check_voice_order(self, voices: Dict[Voice, int]) -> Optional[ConstraintViolation]:
        """Checks voice order: S >= A >= T >= B."""
        s = voices.get(Voice.SOPRANO)
        a = voices.get(Voice.ALTO)
        t = voices.get(Voice.TENOR)
        b = voices.get(Voice.BASS)
        
        if s is not None and a is not None and s < a:
            return ConstraintViolation(
                rule_name="voice_crossing",
                description=f"Soprano ({s}) < Alto ({a})",
                severity="hard"
            )
        if a is not None and t is not None and a < t:
            return ConstraintViolation(
                rule_name="voice_crossing",
                description=f"Alto ({a}) < Tenor ({t})",
                severity="hard"
            )
        if t is not None and b is not None and t < b:
            return ConstraintViolation(
                rule_name="voice_crossing",
                description=f"Tenor ({t}) < Bass ({b})",
                severity="hard"
            )
        return None
    
    def check_spacing(self, voices: Dict[Voice, int]) -> Optional[ConstraintViolation]:
        """Checks intervals between upper voices (<= octave between S-A and A-T)."""
        s = voices.get(Voice.SOPRANO)
        a = voices.get(Voice.ALTO)
        t = voices.get(Voice.TENOR)
        
        if s is not None and a is not None:
            interval_sa = get_interval_semitones(s, a)
            if interval_sa > 12:  # More than octave
                return ConstraintViolation(
                    rule_name="spacing",
                    description=f"Interval between Soprano ({s}) and Alto ({a}) is {interval_sa} semitones (> octave)",
                    severity="hard"
                )
        
        if a is not None and t is not None:
            interval_at = get_interval_semitones(a, t)
            if interval_at > 12:
                return ConstraintViolation(
                    rule_name="spacing",
                    description=f"Interval between Alto ({a}) and Tenor ({t}) is {interval_at} semitones (> octave)",
                    severity="hard"
                )
        
        return None
    
    def check_parallel_fifths(self, prev_voices: Dict[Voice, int], 
                             curr_voices: Dict[Voice, int]) -> List[ConstraintViolation]:
        """Checks parallel fifths between two time steps."""
        violations = []
        
        for voice1 in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            for voice2 in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
                if voice1 == voice2:
                    continue
                
                prev1 = prev_voices.get(voice1)
                prev2 = prev_voices.get(voice2)
                curr1 = curr_voices.get(voice1)
                curr2 = curr_voices.get(voice2)
                
                if prev1 is None or prev2 is None or curr1 is None or curr2 is None:
                    continue
                
                # Check if intervals are fifths
                if is_perfect_fifth(prev1, prev2) and is_perfect_fifth(curr1, curr2):
                    # Check motion direction
                    motion1 = curr1 - prev1
                    motion2 = curr2 - prev2
                    
                    if motion1 != 0 and motion2 != 0 and (motion1 * motion2 > 0):  # Same direction
                        violations.append(ConstraintViolation(
                            rule_name="parallel_fifths",
                            description=f"Parallel fifths between {voice1.value} and {voice2.value}",
                            severity="hard"
                        ))
        
        return violations
    
    def check_parallel_octaves(self, prev_voices: Dict[Voice, int], 
                              curr_voices: Dict[Voice, int]) -> List[ConstraintViolation]:
        """Checks parallel octaves between two time steps."""
        violations = []
        
        for voice1 in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            for voice2 in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
                if voice1 == voice2:
                    continue
                
                prev1 = prev_voices.get(voice1)
                prev2 = prev_voices.get(voice2)
                curr1 = curr_voices.get(voice1)
                curr2 = curr_voices.get(voice2)
                
                if prev1 is None or prev2 is None or curr1 is None or curr2 is None:
                    continue
                
                if is_perfect_octave(prev1, prev2) and is_perfect_octave(curr1, curr2):
                    motion1 = curr1 - prev1
                    motion2 = curr2 - prev2
                    
                    if motion1 != 0 and motion2 != 0 and (motion1 * motion2 > 0):
                        violations.append(ConstraintViolation(
                            rule_name="parallel_octaves",
                            description=f"Parallel octaves between {voice1.value} and {voice2.value}",
                            severity="hard"
                        ))
        
        return violations
    
    def check_hidden_fifths_octaves(self, prev_voices: Dict[Voice, int], 
                                   curr_voices: Dict[Voice, int]) -> List[ConstraintViolation]:
        """Checks hidden fifths and octaves in parallel motion."""
        violations = []
        
        for voice1 in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            for voice2 in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
                if voice1 == voice2:
                    continue
                
                prev1 = prev_voices.get(voice1)
                prev2 = prev_voices.get(voice2)
                curr1 = curr_voices.get(voice1)
                curr2 = curr_voices.get(voice2)
                
                if prev1 is None or prev2 is None or curr1 is None or curr2 is None:
                    continue
                
                motion1 = curr1 - prev1
                motion2 = curr2 - prev2
                
                # Parallel motion
                if motion1 != 0 and motion2 != 0 and (motion1 * motion2 > 0):
                    if is_perfect_fifth(curr1, curr2) or is_perfect_octave(curr1, curr2):
                        violations.append(ConstraintViolation(
                            rule_name="hidden_fifths_octaves",
                            description=f"Hidden P5/P8 between {voice1.value} and {voice2.value} in parallel motion",
                            severity="hard"
                        ))
        
        return violations
    
    def check_all_hard_constraints(self, voice: Voice, midi_note: int,
                                  prev_voices: Optional[Dict[Voice, int]] = None,
                                  curr_voices: Optional[Dict[Voice, int]] = None) -> List[ConstraintViolation]:
        """Checks all hard constraints for one note."""
        violations = []
        
        # Check range
        range_violation = self.check_voice_range(voice, midi_note)
        if range_violation:
            violations.append(range_violation)
        
        # Check voice order (if current voices exist)
        if curr_voices:
            temp_voices = curr_voices.copy()
            temp_voices[voice] = midi_note
            order_violation = self.check_voice_order(temp_voices)
            if order_violation:
                violations.append(order_violation)
            
            spacing_violation = self.check_spacing(temp_voices)
            if spacing_violation:
                violations.append(spacing_violation)
        
        return violations
    
    def check_parallels(self, prev_voices: Dict[Voice, int], 
                       curr_voices: Dict[Voice, int]) -> List[ConstraintViolation]:
        """Checks all parallelisms."""
        violations = []
        violations.extend(self.check_parallel_fifths(prev_voices, curr_voices))
        violations.extend(self.check_parallel_octaves(prev_voices, curr_voices))
        violations.extend(self.check_hidden_fifths_octaves(prev_voices, curr_voices))
        return violations


class SoftConstraintScorer:
    """Scores soft constraints."""
    
    def score_voice_motion(self, prev_note: Optional[int], curr_note: int) -> float:
        """Scores voice motion (lower = better)."""
        if prev_note is None:
            return 0.0
        
        motion = abs(curr_note - prev_note)
        if motion == 0:
            return 0.0  # Stays in place - excellent
        elif motion <= 2:
            return 1.0  # Stepwise motion - good
        elif motion <= 7:
            return 3.0  # Small leap
        else:
            return 10.0  # Large leap - bad
    
    def score_contrary_motion_to_bass(self, bass_motion: int, voice_motion: int) -> float:
        """Scores contrapuntal motion relative to bass (lower = better)."""
        if bass_motion == 0 or voice_motion == 0:
            return 0.0
        
        if (bass_motion * voice_motion) < 0:  # Opposite direction
            return -2.0  # Bonus for counterpoint
        else:
            return 2.0  # Penalty for parallel motion
    
    def score_doubling(self, voices: Dict[Voice, int], root_pc: int) -> float:
        """Scores doubling (prefer root doubling)."""
        score = 0.0
        root_count = 0
        
        for voice, midi_note in voices.items():
            if midi_to_pitch_class(midi_note) == root_pc:
                root_count += 1
        
        if root_count >= 2:
            score = -1.0  # Bonus for root doubling
        elif root_count == 0:
            score = 5.0  # Penalty for no root
        
        return score
    
    def score_leading_tone_doubling(self, voices: Dict[Voice, int], 
                                   leading_tone_pc: int) -> float:
        """Penalizes leading tone doubling."""
        score = 0.0
        lt_count = 0
        
        for voice, midi_note in voices.items():
            if midi_to_pitch_class(midi_note) == leading_tone_pc:
                lt_count += 1
        
        if lt_count >= 2:
            score = 10.0  # Large penalty for leading tone doubling
        
        return score
    
    def score_chord_spacing(self, voices: Dict[Voice, int]) -> float:
        """Scores chord spacing (prefer even distribution)."""
        s = voices.get(Voice.SOPRANO)
        a = voices.get(Voice.ALTO)
        t = voices.get(Voice.TENOR)
        b = voices.get(Voice.BASS)
        
        if s is None or a is None or t is None or b is None:
            return 0.0
        
        # Calculate intervals
        sa = get_interval_semitones(s, a)
        at = get_interval_semitones(a, t)
        tb = get_interval_semitones(t, b)
        
        # Prefer even distribution
        intervals = [sa, at, tb]
        avg_interval = sum(intervals) / len(intervals)
        variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)
        
        return variance * 0.1  # Penalty for uneven spacing
    
    def total_score(self, prev_voices: Optional[Dict[Voice, int]], 
                   curr_voices: Dict[Voice, int],
                   bass_motion: int = 0,
                   root_pc: Optional[int] = None,
                   leading_tone_pc: Optional[int] = None) -> float:
        """Calculates total score for current chord."""
        score = 0.0
        
        # Voice motion
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR]:
            prev_note = prev_voices.get(voice) if prev_voices else None
            curr_note = curr_voices.get(voice)
            if curr_note:
                score += self.score_voice_motion(prev_note, curr_note)
                
                # Counterpoint with bass
                if prev_note:
                    voice_motion = curr_note - prev_note
                    score += self.score_contrary_motion_to_bass(bass_motion, voice_motion)
        
        # Doubling
        if root_pc is not None:
            score += self.score_doubling(curr_voices, root_pc)
        
        if leading_tone_pc is not None:
            score += self.score_leading_tone_doubling(curr_voices, leading_tone_pc)
        
        # Chord spacing
        score += self.score_chord_spacing(curr_voices)
        
        return score

