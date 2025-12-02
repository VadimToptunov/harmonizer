# Harmony and Counterpoint Exercise Solver

A comprehensive tool for solving various harmony and counterpoint exercises with detailed explanations.

## Features

### Exercise Types

1. **Figured Bass (Bass Line Harmonization)**
   - Generate three upper voices (Soprano, Alto, Tenor) from a bass line
   - Support for different chord types and inversions

2. **Melody Harmonization**
   - Generate harmony (bass, alto, tenor) for a given melody
   - Automatic chord selection based on melody notes

3. **Counterpoint**
   - Write counterpoint to a cantus firmus
   - Support for species counterpoint (currently species 1: note against note)
   - Can write counterpoint above or below the cantus firmus

4. **Error Correction**
   - Find errors in existing four-part harmony
   - Suggest corrections for range violations, parallelisms, spacing issues

### Core Features

- Parsing and export to/from MusicXML
- Hard constraint checking (voice ranges, parallelisms, resolutions, dissonances)
- Soft constraint scoring system (minimizing motion, preferring counterpoint)
- Detailed explanations for each decision and rejected alternatives
- Identification of potential error locations
- Tradeoff analysis between different factors

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Creating a Test File

First, create a test bass file:

```bash
python create_test_bass.py
```

This will create a `test_bass.xml` file with a simple bass line.

### CLI - Figured Bass (Original)

```bash
python harmonizer.py input.xml output.xml
```

Example:
```bash
python harmonizer.py test_bass.xml output.xml
```

### CLI - All Exercise Types

```bash
python exercise_cli.py <exercise_type> <input.xml> [output.xml]
```

Available exercise types:
- `bass_figured` or `bass` - Generate upper voices from bass line
- `melody` - Harmonize a melody
- `counterpoint` or `cp` - Write counterpoint to cantus firmus
- `errors` - Find and correct errors in harmony

Examples:
```bash
# Harmonize a melody
python exercise_cli.py melody melody.xml output.xml

# Write counterpoint above cantus firmus
python exercise_cli.py counterpoint cf.xml output.xml

# Find and fix errors
python exercise_cli.py errors harmony_with_errors.xml corrected.xml
```

### Python API

```python
from harmonizer import Harmonizer

harmonizer = Harmonizer(beam_width=10)
result = harmonizer.harmonize("input.xml", "output.xml")

if result.success:
    print(result.explanations)
    # result.voices contains a list of dictionaries {Voice: midi_note} for each step
else:
    print(f"Error: {result.error_message}")
```

## Architecture

- `harmonizer.py` - main class for bass harmonization
- `exercises.py` - different exercise types (counterpoint, melody, error correction)
- `constraints.py` - constraint checking
- `solver.py` - solver (beam search)
- `explanation.py` - explanation generation
- `music_utils.py` - music utilities
- `dissonance.py` - dissonance resolution rules
- `exercise_cli.py` - CLI for all exercise types
- `backend/` - FastAPI backend with caching and rate limiting
- `frontend/` - React frontend with VexFlow notation

## Production Deployment

### Quick Deploy to GitHub

1. **Fork this repository**
2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: GitHub Actions
3. **Set backend URL:**
   - Add secret `REACT_APP_API_URL` in repository settings
   - Or deploy backend separately (Railway/Render recommended)
4. **Push to main branch** - automatic deployment via GitHub Actions

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

### Performance Features

- ✅ Redis caching for solutions (1 hour TTL)
- ✅ Rate limiting (100 req/min per IP)
- ✅ Gunicorn with 4 workers
- ✅ Nginx reverse proxy
- ✅ Health checks for load balancers
- ✅ Optimized Docker images
- ✅ Static asset caching
