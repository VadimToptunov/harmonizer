"""
Rules for dissonance resolution in four-part harmony.
"""
from typing import List, Dict, Optional
from music_utils import Voice, midi_to_pitch_class, get_interval_semitones
from constraints import ConstraintViolation


class DissonanceResolver:
    """Handles dissonance resolution rules."""
    
    def __init__(self):
        pass
    
    def is_dissonance(self, note1: int, note2: int) -> bool:
        """Checks if an interval is dissonant."""
        semitones = get_interval_semitones(note1, note2) % 12
        dissonant_intervals = {1, 2, 6, 10, 11}  # m2, M2, TT, m7, M7
        return semitones in dissonant_intervals
    
    def is_seventh(self, note_pc: int, root_pc: int) -> bool:
        """Checks if a note is the seventh of a chord."""
        # Seventh is 10 semitones above root (minor 7th) or 11 (major 7th)
        interval = (note_pc - root_pc) % 12
        return interval in [10, 11]
    
    def check_seventh_resolution(self, prev_voices: Dict[Voice, int],
                                curr_voices: Dict[Voice, int],
                                root_pc: int) -> List[ConstraintViolation]:
        """
        Checks if chordal sevenths resolve properly.
        Rule: Chordal 7th must resolve down by step in the same voice.
        """
        violations = []
        
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            prev_note = prev_voices.get(voice)
            curr_note = curr_voices.get(voice)
            
            if prev_note and curr_note:
                prev_pc = midi_to_pitch_class(prev_note)
                
                # Check if previous note was a seventh
                if self.is_seventh(prev_pc, root_pc):
                    # Seventh should resolve down by step
                    motion = curr_note - prev_note
                    if motion > 0:  # Moved up
                        violations.append(ConstraintViolation(
                            rule_name="seventh_resolution",
                            description=f"{voice.value} seventh ({prev_note}) should resolve down, but moved up to {curr_note}",
                            severity="hard"
                        ))
                    elif motion < -2:  # Moved down more than a step
                        violations.append(ConstraintViolation(
                            rule_name="seventh_resolution",
                            description=f"{voice.value} seventh ({prev_note}) should resolve down by step, but moved down {abs(motion)} semitones",
                            severity="hard"
                        ))
                    elif motion == 0:  # Stayed the same
                        violations.append(ConstraintViolation(
                            rule_name="seventh_resolution",
                            description=f"{voice.value} seventh ({prev_note}) should resolve down, but stayed the same",
                            severity="hard"
                        ))
        
        return violations
    
    def check_suspension_resolution(self, prev_voices: Dict[Voice, int],
                                   curr_voices: Dict[Voice, int]) -> List[ConstraintViolation]:
        """
        Checks if suspensions resolve properly.
        Rule: Suspensions (4-3, 7-6, 9-8) must resolve down by step.
        """
        violations = []
        
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            prev_note = prev_voices.get(voice)
            curr_note = curr_voices.get(voice)
            
            if prev_note and curr_note:
                # Check if previous note was a suspension
                # This is simplified - in practice, we'd need harmonic analysis
                # to identify suspensions. For now, we check for common suspension patterns.
                motion = curr_note - prev_note
                
                # If note moved up, it might be a suspension that didn't resolve
                # This is a heuristic - full implementation would require harmonic analysis
                if motion > 0:
                    # Check if it's a dissonant interval with another voice
                    for other_voice, other_note in prev_voices.items():
                        if other_voice != voice and self.is_dissonance(prev_note, other_note):
                            # Potential suspension that should resolve down
                            if motion > 0:
                                violations.append(ConstraintViolation(
                                    rule_name="suspension_resolution",
                                    description=f"{voice.value} potential suspension ({prev_note}) should resolve down, but moved up",
                                    severity="soft"  # Soft because we can't be sure it's a suspension
                                ))
        
        return violations
    
    def check_leading_tone_resolution(self, prev_voices: Dict[Voice, int],
                                      curr_voices: Dict[Voice, int],
                                      key_root_pc: int) -> List[ConstraintViolation]:
        """
        Checks if leading tone resolves properly.
        Rule: Leading tone (7th scale degree) should resolve up to tonic.
        """
        violations = []
        leading_tone_pc = (key_root_pc + 11) % 12  # Semitone below root
        
        for voice in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
            prev_note = prev_voices.get(voice)
            curr_note = curr_voices.get(voice)
            
            if prev_note:
                prev_pc = midi_to_pitch_class(prev_note)
                
                # Check if previous note was leading tone
                if prev_pc == leading_tone_pc:
                    if curr_note:
                        curr_pc = midi_to_pitch_class(curr_note)
                        motion = curr_note - prev_note
                        
                        # Leading tone should resolve up to tonic
                        if motion <= 0:
                            violations.append(ConstraintViolation(
                                rule_name="leading_tone_resolution",
                                description=f"{voice.value} leading tone ({prev_note}) should resolve up to tonic, but moved {motion} semitones",
                                severity="hard"
                            ))
                        elif curr_pc != key_root_pc:
                            # Resolved but not to tonic
                            violations.append(ConstraintViolation(
                                rule_name="leading_tone_resolution",
                                description=f"{voice.value} leading tone ({prev_note}) resolved to {curr_note} instead of tonic",
                                severity="soft"
                            ))
        
        return violations
    
    def check_all_dissonances(self, prev_voices: Dict[Voice, int],
                             curr_voices: Dict[Voice, int],
                             root_pc: int,
                             key_root_pc: Optional[int] = None) -> List[ConstraintViolation]:
        """Checks all dissonance resolution rules."""
        violations = []
        
        violations.extend(self.check_seventh_resolution(prev_voices, curr_voices, root_pc))
        
        if key_root_pc is not None:
            violations.extend(self.check_leading_tone_resolution(prev_voices, curr_voices, key_root_pc))
        
        # Suspension resolution is soft constraint
        # violations.extend(self.check_suspension_resolution(prev_voices, curr_voices))
        
        return violations

