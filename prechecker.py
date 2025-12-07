"""
Prechecker for harmonic functions - validates before solving.
"""
from typing import List, Optional, Dict
from harmonic_functions import HarmonicFunction, HarmonicFunctionType
from constraints import ConstraintChecker
from music_utils import Voice, get_chord_tones


class Prechecker:
    """Prechecks harmonic functions for validity."""
    
    def __init__(self):
        self.constraint_checker = ConstraintChecker()
    
    def check_function(self, func: HarmonicFunction, 
                      prev_func: Optional[HarmonicFunction] = None) -> List[str]:
        """
        Check if harmonic function can generate valid chord.
        
        Returns:
            List of error messages (empty if valid)
        """
        errors = []
        
        # Check if function can generate chord tones
        try:
            tones = func.get_chord_tones()
            if not tones:
                errors.append(f"{func} cannot generate chord tones")
        except Exception as e:
            errors.append(f"{func} error: {str(e)}")
        
        # Check position validity
        if func.position is not None:
            tones = func.get_chord_tones()
            if func.position >= len(tones):
                errors.append(f"{func} position {func.position} is invalid (max {len(tones)-1})")
        
        # Check for parallel fifths in chain dominants
        if prev_func and func.func_type == HarmonicFunctionType.DOMINANT:
            if prev_func.func_type == HarmonicFunctionType.DOMINANT:
                # Chain dominants - check if fifth should be omitted
                if func.position is None and prev_func.position is None:
                    # Both root position - might need to omit fifth
                    pass  # Corrector will handle this
        
        return errors
    
    def check_sequence(self, functions: List[HarmonicFunction]) -> Dict[int, List[str]]:
        """
        Check entire sequence of harmonic functions.
        
        Returns:
            Dict mapping function index to list of errors
        """
        errors = {}
        
        for i, func in enumerate(functions):
            prev_func = functions[i - 1] if i > 0 else None
            func_errors = self.check_function(func, prev_func)
            if func_errors:
                errors[i] = func_errors
        
        return errors
    
    def can_generate_chord(self, func: HarmonicFunction) -> bool:
        """Check if function can generate at least one valid chord."""
        try:
            tones = func.get_chord_tones()
            return len(tones) >= 3  # At least triad
        except:
            return False

