"""
Enhanced validator with detailed error reports and visual indicators.
"""
from typing import List, Dict, Optional, Tuple
from constraints import ConstraintChecker, ConstraintViolation
from music_utils import Voice, get_interval_semitones, is_perfect_fifth, is_perfect_octave


class EnhancedValidator:
    """Enhanced validator with detailed error reporting."""
    
    def __init__(self):
        self.constraint_checker = ConstraintChecker()
    
    def validate_harmony(self, voices_list: List[Dict[Voice, int]]) -> Dict:
        """
        Validate four-part harmony with detailed error reports.
        
        Args:
            voices_list: List of voice dictionaries for each time step
        
        Returns:
            Dict with validation results:
            {
                "valid": bool,
                "errors": List[Dict],  # Detailed error list
                "warnings": List[Dict],  # Warning list
                "summary": Dict  # Summary statistics
            }
        """
        errors = []
        warnings = []
        
        # Statistics
        parallel_fifths_count = 0
        parallel_octaves_count = 0
        voice_crossing_count = 0
        spacing_issues_count = 0
        range_violations_count = 0
        
        for step_idx, voices in enumerate(voices_list):
            # Check voice ranges
            for voice, midi_note in voices.items():
                violation = self.constraint_checker.check_voice_range(voice, midi_note)
                if violation:
                    errors.append({
                        "step": step_idx,
                        "type": "range",
                        "severity": "error",
                        "voice": voice.value,
                        "note": midi_note,
                        "message": violation.description,
                        "location": f"Step {step_idx + 1}, {voice.value}"
                    })
                    range_violations_count += 1
            
            # Check voice order
            order_violation = self.constraint_checker.check_voice_order(voices)
            if order_violation:
                errors.append({
                    "step": step_idx,
                    "type": "voice_crossing",
                    "severity": "error",
                    "message": order_violation.description,
                    "location": f"Step {step_idx + 1}"
                })
                voice_crossing_count += 1
            
            # Check spacing
            spacing_violation = self.constraint_checker.check_spacing(voices)
            if spacing_violation:
                warnings.append({
                    "step": step_idx,
                    "type": "spacing",
                    "severity": "warning",
                    "message": spacing_violation.description,
                    "location": f"Step {step_idx + 1}"
                })
                spacing_issues_count += 1
            
            # Check parallels with previous step
            if step_idx > 0:
                prev_voices = voices_list[step_idx - 1]
                parallels = self.constraint_checker.check_parallels(prev_voices, voices)
                
                for violation in parallels:
                    if "fifth" in violation.rule_name.lower():
                        parallel_fifths_count += 1
                        errors.append({
                            "step": step_idx,
                            "type": "parallel_fifths",
                            "severity": "error",
                            "message": violation.description,
                            "location": f"Between steps {step_idx} and {step_idx + 1}",
                            "prev_step": step_idx - 1,
                            "curr_step": step_idx
                        })
                    elif "octave" in violation.rule_name.lower():
                        parallel_octaves_count += 1
                        errors.append({
                            "step": step_idx,
                            "type": "parallel_octaves",
                            "severity": "error",
                            "message": violation.description,
                            "location": f"Between steps {step_idx} and {step_idx + 1}",
                            "prev_step": step_idx - 1,
                            "curr_step": step_idx
                        })
        
        # Summary
        summary = {
            "total_steps": len(voices_list),
            "total_errors": len(errors),
            "total_warnings": len(warnings),
            "parallel_fifths": parallel_fifths_count,
            "parallel_octaves": parallel_octaves_count,
            "voice_crossings": voice_crossing_count,
            "spacing_issues": spacing_issues_count,
            "range_violations": range_violations_count
        }
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "summary": summary
        }
    
    def get_error_summary_text(self, validation_result: Dict) -> str:
        """Generate human-readable error summary."""
        if validation_result["valid"]:
            return "✓ Harmony is valid! No errors found."
        
        summary = validation_result["summary"]
        text = f"Found {summary['total_errors']} error(s) and {summary['total_warnings']} warning(s):\n\n"
        
        if summary["parallel_fifths"] > 0:
            text += f"• {summary['parallel_fifths']} parallel fifth(s)\n"
        if summary["parallel_octaves"] > 0:
            text += f"• {summary['parallel_octaves']} parallel octave(s)\n"
        if summary["voice_crossings"] > 0:
            text += f"• {summary['voice_crossings']} voice crossing(s)\n"
        if summary["range_violations"] > 0:
            text += f"• {summary['range_violations']} range violation(s)\n"
        if summary["spacing_issues"] > 0:
            text += f"• {summary['spacing_issues']} spacing issue(s)\n"
        
        return text

