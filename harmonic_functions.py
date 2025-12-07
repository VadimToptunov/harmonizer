"""
Harmonic function system for functional harmony.
Supports Tonic (T), Subdominant (S), Dominant (D) with various parameters.
"""
from typing import List, Dict, Optional, Set
from dataclasses import dataclass
from enum import Enum
from music_utils import Voice, midi_to_pitch_class, pitch_class_to_name, get_chord_tones


class HarmonicFunctionType(Enum):
    """Types of harmonic functions."""
    TONIC = "T"
    SUBDOMINANT = "S"
    DOMINANT = "D"
    NEAPOLITAN = "N"
    CHOPIN = "Ch"


@dataclass
class HarmonicFunction:
    """Represents a harmonic function with parameters."""
    func_type: HarmonicFunctionType
    root_pc: int  # Pitch class of root (0-11)
    position: Optional[int] = None  # Inversion: 1, 2, 3, or None for root
    extra: Optional[List[int]] = None  # Extra tones: [7], [9], [7, 9], etc.
    alterations: Optional[Dict[int, str]] = None  # Alterations: {5: "<"} for lowered 5th
    is_related_backwards: bool = False  # For deflections
    is_related_forwards: bool = False  # For deflections
    is_minor: bool = False  # Minor variant
    
    def __str__(self):
        """Convert to string notation like T{}, D{extra: 7}, S{position: 3}."""
        parts = []
        
        if self.position is not None:
            parts.append(f"position: {self.position}")
        
        if self.extra:
            extra_str = ", ".join(map(str, self.extra))
            parts.append(f"extra: {extra_str}")
        
        if self.alterations:
            alt_str = ", ".join([f"{k}: {v}" for k, v in self.alterations.items()])
            parts.append(f"alterations: {alt_str}")
        
        if self.is_related_backwards:
            parts.append("isRelatedBackwards")
        
        if self.is_related_forwards:
            parts.append("isRelatedForwards")
        
        if self.is_minor:
            parts.append("minor")
        
        params = "; ".join(parts) if parts else ""
        return f"{self.func_type.value}{{{params}}}"
    
    def get_chord_tones(self) -> List[int]:
        """Get pitch classes of chord tones."""
        root = self.root_pc
        
        # Base chord tones
        if self.func_type == HarmonicFunctionType.TONIC:
            if self.is_minor:
                tones = [root, (root + 3) % 12, (root + 7) % 12]
            else:
                tones = [root, (root + 4) % 12, (root + 7) % 12]
        elif self.func_type == HarmonicFunctionType.SUBDOMINANT:
            if self.is_minor:
                tones = [root, (root + 3) % 12, (root + 7) % 12]
            else:
                tones = [root, (root + 4) % 12, (root + 7) % 12]
        elif self.func_type == HarmonicFunctionType.DOMINANT:
            tones = [root, (root + 4) % 12, (root + 7) % 12]
            if self.extra and 7 in self.extra:
                tones.append((root + 10) % 12)
            if self.extra and 9 in self.extra:
                tones.append((root + 2) % 12)
        elif self.func_type == HarmonicFunctionType.NEAPOLITAN:
            # Neapolitan chord: bII
            tones = [(root - 1) % 12, (root + 3) % 12, (root + 7) % 12]
        elif self.func_type == HarmonicFunctionType.CHOPIN:
            # Chopin chord: specific voicing
            tones = [root, (root + 4) % 12, (root + 7) % 12, (root + 10) % 12]
        else:
            tones = [root, (root + 4) % 12, (root + 7) % 12]
        
        # Apply alterations
        if self.alterations:
            for interval, alt_type in self.alterations.items():
                if alt_type == "<":  # Lowered
                    tones = [(t - 1) % 12 if (t - root) % 12 == interval else t for t in tones]
                elif alt_type == ">":  # Raised
                    tones = [(t + 1) % 12 if (t - root) % 12 == interval else t for t in tones]
        
        return tones
    
    def get_bass_note_pc(self) -> int:
        """Get pitch class of bass note based on position."""
        tones = self.get_chord_tones()
        
        if self.position is None or self.position == 0:
            return tones[0]  # Root position
        elif self.position == 1 and len(tones) > 1:
            return tones[1]  # First inversion
        elif self.position == 2 and len(tones) > 2:
            return tones[2]  # Second inversion
        elif self.position == 3 and len(tones) > 3:
            return tones[3]  # Third inversion
        else:
            return tones[0]  # Fallback to root


def parse_harmonic_function(func_str: str, key_pc: int = 0) -> Optional[HarmonicFunction]:
    """
    Parse harmonic function string like "T{}", "D{extra: 7}", "S{position: 3}".
    
    Args:
        func_str: Function string
        key_pc: Pitch class of key (0=C, 2=D, etc.)
    
    Returns:
        HarmonicFunction or None if invalid
    """
    func_str = func_str.strip()
    
    # Extract function type
    if func_str.startswith("T"):
        func_type = HarmonicFunctionType.TONIC
        root_pc = key_pc
    elif func_str.startswith("S"):
        func_type = HarmonicFunctionType.SUBDOMINANT
        root_pc = (key_pc + 5) % 12  # Subdominant is 5 semitones up
    elif func_str.startswith("D"):
        func_type = HarmonicFunctionType.DOMINANT
        root_pc = (key_pc + 7) % 12  # Dominant is 7 semitones up
    elif func_str.startswith("N"):
        func_type = HarmonicFunctionType.NEAPOLITAN
        root_pc = (key_pc + 1) % 12  # Neapolitan is bII
    elif func_str.startswith("Ch"):
        func_type = HarmonicFunctionType.CHOPIN
        root_pc = key_pc
    else:
        return None
    
    # Extract parameters from {}
    params = {}
    if "{" in func_str and "}" in func_str:
        param_str = func_str[func_str.index("{") + 1:func_str.index("}")]
        for part in param_str.split(";"):
            part = part.strip()
            if ":" in part:
                key, value = part.split(":", 1)
                key = key.strip()
                value = value.strip()
                
                if key == "position":
                    params["position"] = int(value)
                elif key == "extra":
                    # Parse list like "7" or "7, 9"
                    extra_list = [int(x.strip()) for x in value.split(",")]
                    params["extra"] = extra_list
                elif key == "alterations":
                    # Parse dict like "5: <"
                    params["alterations"] = {}
                    for alt in value.split(","):
                        if ":" in alt:
                            k, v = alt.split(":", 1)
                            params["alterations"][int(k.strip())] = v.strip()
            else:
                # Boolean flags
                if part == "isRelatedBackwards":
                    params["is_related_backwards"] = True
                elif part == "isRelatedForwards":
                    params["is_related_forwards"] = True
                elif part == "minor":
                    params["is_minor"] = True
    
    return HarmonicFunction(
        func_type=func_type,
        root_pc=root_pc,
        position=params.get("position"),
        extra=params.get("extra"),
        alterations=params.get("alterations"),
        is_related_backwards=params.get("is_related_backwards", False),
        is_related_forwards=params.get("is_related_forwards", False),
        is_minor=params.get("is_minor", False)
    )


def parse_harmonic_sequence(sequence_str: str, key_pc: int = 0) -> List[HarmonicFunction]:
    """
    Parse sequence of harmonic functions like "T{}; D{}; T{}".
    
    Args:
        sequence_str: Sequence string
        key_pc: Pitch class of key
    
    Returns:
        List of HarmonicFunction
    """
    functions = []
    for func_str in sequence_str.split(";"):
        func_str = func_str.strip()
        if func_str:
            func = parse_harmonic_function(func_str, key_pc)
            if func:
                functions.append(func)
    return functions

