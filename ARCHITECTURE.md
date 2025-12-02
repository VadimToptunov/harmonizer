# Harmony Tool Architecture

## Component Overview

### 1. `music_utils.py`
Basic music utilities:
- Voice representation and ranges
- MusicXML parsing and export
- Interval and chord operations
- Conversion between MIDI, pitch class, and note names

### 2. `constraints.py`
Constraint system:
- **ConstraintChecker**: hard constraint checking
  - Voice ranges
  - Voice order (S ≥ A ≥ T ≥ B)
  - Intervals between voices
  - Parallel fifths and octaves
  - Hidden parallelisms
  
- **SoftConstraintScorer**: soft constraint scoring
  - Minimizing voice motion
  - Preferring contrapuntal motion
  - Doubling evaluation
  - Chord spacing

### 3. `solver.py`
Beam search solver:
- Candidate generation for each voice
- Filtering by hard constraints
- Solution evaluation and ranking
- Keeping best solutions (beam)

### 4. `explanation.py`
Explanation engine:
- Analysis of chosen solutions
- Explanation of rejected alternatives
- Listing positive factors
- Human-readable formatting

### 5. `harmonizer.py`
Main class that combines all components:
- Input file parsing
- Coordination of solving and explanations
- Result export
- CLI interface

## Algorithm

1. **Parsing**: MusicXML → bass line (MIDI notes)
2. **For each time step**:
   - Generate all possible combinations for S, A, T
   - Filter by hard constraints
   - Score remaining candidates
   - Select best solutions (beam)
3. **Explanations**: analysis of solutions and alternatives
4. **Export**: four-part harmony → MusicXML

## Hard Constraints

- ✓ Voice ranges are respected
- ✓ Voices do not cross
- ✓ Intervals between upper voices ≤ octave
- ✓ No parallel fifths/octaves
- ✓ No hidden parallelisms

## Soft Constraints (Scoring)

Minimized:
- Voice motion (prefer stepwise)
- Parallel motion with bass
- Absence of root doubling
- Leading tone doubling
- Uneven chord spacing

## Extensions

Possible improvements:
- OR-Tools CP-SAT integration for optimal solving
- ML model for stylistic preferences
- Support for more complex chords (seventh chords, inversions)
- Dissonance resolution rules
- Web interface (FastAPI)
