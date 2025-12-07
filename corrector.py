"""
Corrector for harmonic functions - automatically fixes common issues.
"""
from typing import List, Optional
from harmonic_functions import HarmonicFunction, HarmonicFunctionType


class Corrector:
    """Corrects harmonic functions automatically."""
    
    def correct_function(self, func: HarmonicFunction,
                        prev_func: Optional[HarmonicFunction] = None) -> HarmonicFunction:
        """
        Correct harmonic function based on context.
        
        Returns:
            Corrected HarmonicFunction
        """
        corrected = HarmonicFunction(
            func_type=func.func_type,
            root_pc=func.root_pc,
            position=func.position,
            extra=func.extra.copy() if func.extra else None,
            alterations=func.alterations.copy() if func.alterations else None,
            is_related_backwards=func.is_related_backwards,
            is_related_forwards=func.is_related_forwards,
            is_minor=func.is_minor
        )
        
        # Fix position notation (3> -> 3)
        if corrected.position is not None and corrected.position > 3:
            corrected.position = 3
        
        # Chain dominants - omit fifth if needed
        if prev_func and corrected.func_type == HarmonicFunctionType.DOMINANT:
            if prev_func.func_type == HarmonicFunctionType.DOMINANT:
                # Both root position - omit fifth to avoid parallel fifths
                if corrected.position is None and prev_func.position is None:
                    # Mark fifth for omission (handled in solver)
                    pass
        
        # D7 with 7 in bass -> set T to third position
        if prev_func and prev_func.func_type == HarmonicFunctionType.DOMINANT:
            if prev_func.extra and 7 in prev_func.extra:
                if prev_func.position == 3:  # 7th in bass
                    if corrected.func_type == HarmonicFunctionType.TONIC:
                        if corrected.position is None:
                            corrected.position = 1  # Third in bass
        
        # Chopin chord - add fifth to omit if not specified
        if corrected.func_type == HarmonicFunctionType.CHOPIN:
            if corrected.extra is None:
                corrected.extra = [5]  # Omit fifth
        
        return corrected
    
    def correct_sequence(self, functions: List[HarmonicFunction]) -> List[HarmonicFunction]:
        """Correct entire sequence of harmonic functions."""
        corrected = []
        
        for i, func in enumerate(functions):
            prev_func = corrected[-1] if corrected else None
            corrected_func = self.correct_function(func, prev_func)
            corrected.append(corrected_func)
        
        return corrected

