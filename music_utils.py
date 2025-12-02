"""
Utilities for musical representation.
"""
from typing import List, Tuple, Optional
from music21 import note, chord, stream, pitch, interval
from enum import Enum


class Voice(Enum):
    """Four-part harmony voices."""
    SOPRANO = "S"
    ALTO = "A"
    TENOR = "T"
    BASS = "B"


# Voice ranges (MIDI notes)
VOICE_RANGES = {
    Voice.SOPRANO: (60, 84),  # C4-C6
    Voice.ALTO: (55, 72),      # G3-C5
    Voice.TENOR: (48, 69),    # C3-A4
    Voice.BASS: (40, 60),      # E2-C4
}


def midi_to_pitch_class(midi: int) -> int:
    """Converts MIDI note number to pitch class (0-11)."""
    return midi % 12


def pitch_class_to_name(pc: int) -> str:
    """Converts pitch class to note name."""
    names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    return names[pc]


def get_interval_semitones(note1: int, note2: int) -> int:
    """Returns interval in semitones between two MIDI notes."""
    return abs(note2 - note1)


def get_interval_type(note1: int, note2: int) -> Optional[str]:
    """Determines interval type (P5, P8, M3, etc.)."""
    semitones = get_interval_semitones(note1, note2) % 12
    interval_map = {
        0: "P1", 1: "m2", 2: "M2", 3: "m3", 4: "M3",
        5: "P4", 6: "TT", 7: "P5", 8: "m6", 9: "M6",
        10: "m7", 11: "M7"
    }
    return interval_map.get(semitones)


def is_perfect_fifth(note1: int, note2: int) -> bool:
    """Checks if interval is a perfect fifth."""
    return get_interval_semitones(note1, note2) % 12 == 7


def is_perfect_octave(note1: int, note2: int) -> bool:
    """Checks if interval is a perfect octave."""
    return get_interval_semitones(note1, note2) % 12 == 0


def parse_musicxml(filename: str) -> List[Tuple[int, List[int]]]:
    """
    Parses MusicXML file and returns sequence of chords.
    
    Returns:
        List of (time_step, [bass_midi, ...]) tuples
    """
    from music21 import converter
    score = converter.parse(filename)
    
    # Extract bass line (lowest voice)
    parts = score.parts
    if not parts:
        raise ValueError("No parts found in MusicXML")
    
    bass_part = parts[-1]  # Assume bass is the last voice
    
    # Group notes by time steps
    time_steps = []
    current_time = 0
    current_notes = []
    
    for element in bass_part.flat.notes:
        if element.offset > current_time:
            if current_notes:
                time_steps.append((current_time, [n.pitch.midi for n in current_notes]))
            current_time = element.offset
            current_notes = []
        
        if isinstance(element, note.Note):
            current_notes.append(element)
        elif isinstance(element, chord.Chord):
            current_notes.extend(element.notes)
    
    if current_notes:
        time_steps.append((current_time, [n.pitch.midi for n in current_notes]))
    
    return time_steps


def get_chord_tones(root: int, chord_type: str = "major", inversion: int = 0) -> List[int]:
    """
    Returns chord tones in pitch class.
    
    Args:
        root: MIDI note number of chord root
        chord_type: "major", "minor", "diminished", "augmented", 
                   "dominant7", "major7", "minor7", "half_diminished7", "fully_diminished7"
        inversion: 0 = root position, 1 = first inversion, 2 = second inversion, 3 = third inversion
    
    Returns:
        List of pitch classes that can be used in the chord
    """
    root_pc = midi_to_pitch_class(root)
    
    # Base chord tones (root position)
    if chord_type == "major":
        tones = [root_pc, (root_pc + 4) % 12, (root_pc + 7) % 12]
    elif chord_type == "minor":
        tones = [root_pc, (root_pc + 3) % 12, (root_pc + 7) % 12]
    elif chord_type == "diminished":
        tones = [root_pc, (root_pc + 3) % 12, (root_pc + 6) % 12]
    elif chord_type == "augmented":
        tones = [root_pc, (root_pc + 4) % 12, (root_pc + 8) % 12]
    elif chord_type == "dominant7":
        tones = [root_pc, (root_pc + 4) % 12, (root_pc + 7) % 12, (root_pc + 10) % 12]
    elif chord_type == "major7":
        tones = [root_pc, (root_pc + 4) % 12, (root_pc + 7) % 12, (root_pc + 11) % 12]
    elif chord_type == "minor7":
        tones = [root_pc, (root_pc + 3) % 12, (root_pc + 7) % 12, (root_pc + 10) % 12]
    elif chord_type == "half_diminished7":
        tones = [root_pc, (root_pc + 3) % 12, (root_pc + 6) % 12, (root_pc + 10) % 12]
    elif chord_type == "fully_diminished7":
        tones = [root_pc, (root_pc + 3) % 12, (root_pc + 6) % 12, (root_pc + 9) % 12]
    else:
        tones = [root_pc, (root_pc + 4) % 12, (root_pc + 7) % 12]
    
    # Apply inversion - for inversions, we still allow all chord tones
    # but the bass note indicates the inversion
    # The function returns all possible chord tones that can be used
    return tones


def get_chord_inversion(bass_note: int, root: int, chord_type: str = "major") -> int:
    """
    Determines the inversion of a chord based on the bass note.
    
    Args:
        bass_note: MIDI note of the bass
        root: MIDI note of the chord root
        chord_type: chord type
    
    Returns:
        Inversion number (0 = root, 1 = first, 2 = second, 3 = third)
    """
    bass_pc = midi_to_pitch_class(bass_note)
    root_pc = midi_to_pitch_class(root)
    
    tones = get_chord_tones(root, chord_type, 0)
    
    # Find which chord tone is in the bass
    if bass_pc == tones[0]:
        return 0  # Root position
    elif len(tones) > 1 and bass_pc == tones[1]:
        return 1  # First inversion
    elif len(tones) > 2 and bass_pc == tones[2]:
        return 2  # Second inversion
    elif len(tones) > 3 and bass_pc == tones[3]:
        return 3  # Third inversion
    
    # If bass note is not a chord tone, assume root position
    return 0


def export_to_musicxml(voices: dict, output_file: str):
    """
    Exports four-part harmony to MusicXML.
    
    Args:
        voices: dict {Voice: List[int]} - MIDI notes for each voice
        output_file: path to output file
    """
    score = stream.Score()
    
    voice_names = {
        Voice.SOPRANO: "Soprano",
        Voice.ALTO: "Alto",
        Voice.TENOR: "Tenor",
        Voice.BASS: "Bass"
    }
    
    for voice_enum in [Voice.SOPRANO, Voice.ALTO, Voice.TENOR, Voice.BASS]:
        part = stream.Part()
        part.id = voice_names[voice_enum]
        
        for midi_note in voices.get(voice_enum, []):
            n = note.Note()
            n.pitch.midi = midi_note
            n.quarterLength = 1.0  # Default quarter note
            part.append(n)
        
        score.append(part)
    
    score.write('musicxml', output_file)

