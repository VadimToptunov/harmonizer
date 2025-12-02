"""
Utility for creating test bass file.
"""
from music21 import stream, note, meter, key

def create_test_bass():
    """Creates a simple test bass file."""
    # Create score
    score = stream.Score()
    
    # Add time signature and key
    score.insert(0, meter.TimeSignature('4/4'))
    score.insert(0, key.Key('C'))
    
    # Create bass part
    bass_part = stream.Part()
    bass_part.id = "Bass"
    
    # Simple bass line: C - F - G - C (I - IV - V - I)
    bass_notes = [
        ('C', 2),  # C2
        ('F', 2),  # F2
        ('G', 2),  # G2
        ('C', 2),  # C2
    ]
    
    for pitch_name, octave in bass_notes:
        n = note.Note(pitch_name + str(octave))
        n.quarterLength = 1.0
        bass_part.append(n)
    
    score.append(bass_part)
    
    # Save
    output_file = "test_bass.xml"
    score.write('musicxml', output_file)
    print(f"Created test bass file: {output_file}")
    print("Bass line: C2 - F2 - G2 - C2 (I - IV - V - I in C major)")

if __name__ == "__main__":
    create_test_bass()

