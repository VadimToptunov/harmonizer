"""
FastAPI backend for harmony exercise solver.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from harmonizer import Harmonizer
from exercises import ExerciseSolver, ExerciseType
from music_utils import Voice
try:
    from backend.middleware import RateLimitMiddleware, MonitoringMiddleware
    from backend.cache import get_cached_solution, cache_solution
except ImportError:
    # Fallback for direct execution
    from middleware import RateLimitMiddleware, MonitoringMiddleware
    from cache import get_cached_solution, cache_solution

# Environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

app = FastAPI(
    title="Harmony Exercise Solver API",
    version="1.0.0",
    docs_url="/docs" if ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if ENVIRONMENT != "production" else None
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "https://*.github.io"] if ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600
)

# Rate limiting and monitoring
if ENVIRONMENT == "production":
    app.add_middleware(RateLimitMiddleware)
app.add_middleware(MonitoringMiddleware)


class VoiceInput(BaseModel):
    """Input for a single voice."""
    notes: List[int]  # MIDI notes
    voice: str  # "S", "A", "T", "B"


class HarmonizeRequest(BaseModel):
    """Request for harmonization."""
    bass_line: List[int]  # MIDI notes for bass
    chord_types: Optional[List[str]] = None
    exercise_type: str = "bass_figured"


class MelodyHarmonizeRequest(BaseModel):
    """Request for melody harmonization."""
    melody: List[int]  # MIDI notes for soprano
    chord_types: Optional[List[str]] = None


class CounterpointRequest(BaseModel):
    """Request for counterpoint."""
    cantus_firmus: List[int]  # MIDI notes
    above: bool = True
    species: int = 1


class ErrorCheckRequest(BaseModel):
    """Request for error checking."""
    voices: List[Dict[str, List[int]]]  # List of voice dictionaries


class MusicSettings(BaseModel):
    """Music notation settings."""
    tempo: int = 120
    time_signature: str = "4/4"
    key_signature: str = "C"
    clef: str = "treble"  # treble, bass, alto, tenor
    show_roman_numerals: bool = True
    show_inversions: bool = True
    show_figured_bass: bool = False
    staff_count: int = 4  # 2 or 4


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Harmony Exercise Solver API", "version": "1.0.0", "environment": ENVIRONMENT}


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    try:
        # Check Redis connection
        from cache import get_redis_client
        client = get_redis_client()
        client.ping()
        redis_status = "ok"
    except:
        redis_status = "unavailable"
    
    return {
        "status": "healthy",
        "redis": redis_status,
        "environment": ENVIRONMENT
    }


@app.post("/api/harmonize")
async def harmonize(request: HarmonizeRequest):
    """Harmonize a bass line."""
    try:
        # Check cache first
        cache_key_data = {
            "bass_line": request.bass_line,
            "chord_types": request.chord_types or []
        }
        cached = get_cached_solution("harmonize", **cache_key_data)
        if cached:
            return JSONResponse(content=cached, headers={"X-Cache": "HIT"})
        
        harmonizer = Harmonizer()
        
        # Convert bass line to temporary MusicXML for processing
        # For now, we'll work directly with MIDI notes
        # In a full implementation, we'd create MusicXML from MIDI
        
        # Create a simple solution using the solver directly
        from solver import BeamSearchSolver
        solver = BeamSearchSolver()
        
        solutions = []
        prev_solutions = []
        
        for bass_note in request.bass_line:
            chord_type = "major"
            if request.chord_types and len(solutions) < len(request.chord_types):
                chord_type = request.chord_types[len(solutions)]
            
            step_solutions = solver.solve_step(bass_note, prev_solutions, chord_type)
            if step_solutions:
                best = step_solutions[0]
                solutions.append(best.voices)
                prev_solutions = step_solutions[:1]
            else:
                # Fallback - create a solution and update prev_solutions
                from solver import Solution
                if prev_solutions:
                    prev_voices = prev_solutions[0].voices.copy()
                    prev_voices[Voice.BASS] = bass_note
                    fallback_voices = prev_voices
                else:
                    fallback_voices = {
                        Voice.SOPRANO: bass_note + 12,
                        Voice.ALTO: bass_note + 7,
                        Voice.TENOR: bass_note + 4,
                        Voice.BASS: bass_note
                    }
                
                # Create Solution object for fallback
                fallback_solution = Solution(
                    voices=fallback_voices,
                    score=100.0,  # High score indicates fallback
                    violations=[]
                )
                
                solutions.append(fallback_voices)
                # Update prev_solutions so next iteration uses correct state
                prev_solutions = [fallback_solution]
        
        # Convert to response format
        result = []
        for sol in solutions:
            result.append({
                "S": sol.get(Voice.SOPRANO, 0),
                "A": sol.get(Voice.ALTO, 0),
                "T": sol.get(Voice.TENOR, 0),
                "B": sol.get(Voice.BASS, 0)
            })
        
        response_data = {
            "success": True,
            "voices": result,
            "explanations": "Harmonization completed successfully."
        }
        
        # Cache the result
        cache_solution("harmonize", response_data, ttl=3600, **cache_key_data)
        
        return JSONResponse(content=response_data, headers={"X-Cache": "MISS"})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/harmonize-melody")
async def harmonize_melody(request: MelodyHarmonizeRequest):
    """Harmonize a melody."""
    try:
        from exercises import MelodyHarmonizer
        harmonizer = MelodyHarmonizer()
        solutions = harmonizer.harmonize_melody(request.melody, request.chord_types)
        
        result = []
        for sol in solutions:
            result.append({
                "S": sol.get(Voice.SOPRANO, 0),
                "A": sol.get(Voice.ALTO, 0),
                "T": sol.get(Voice.TENOR, 0),
                "B": sol.get(Voice.BASS, 0)
            })
        
        return {
            "success": True,
            "voices": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/counterpoint")
async def counterpoint(request: CounterpointRequest):
    """Generate counterpoint."""
    try:
        from exercises import CounterpointSolver
        solver = CounterpointSolver(species=request.species)
        solutions = solver.solve_species_1(request.cantus_firmus, request.above)
        
        result = []
        for sol in solutions:
            result.append({
                "S": sol.get(Voice.SOPRANO, 0),
                "B": sol.get(Voice.BASS, 0)
            })
        
        return {
            "success": True,
            "voices": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/check-errors")
async def check_errors(request: ErrorCheckRequest):
    """Check for errors in harmony."""
    try:
        from exercises import ErrorCorrector
        from music_utils import Voice
        
        # Convert request format to internal format
        voices = []
        for v_dict in request.voices:
            voices.append({
                Voice.SOPRANO: v_dict.get("S", 0),
                Voice.ALTO: v_dict.get("A", 0),
                Voice.TENOR: v_dict.get("T", 0),
                Voice.BASS: v_dict.get("B", 0)
            })
        
        corrector = ErrorCorrector()
        errors = corrector.find_errors(voices)
        corrected = corrector.correct_errors(voices, errors)
        
        result = []
        for sol in corrected:
            result.append({
                "S": sol.get(Voice.SOPRANO, 0),
                "A": sol.get(Voice.ALTO, 0),
                "T": sol.get(Voice.TENOR, 0),
                "B": sol.get(Voice.BASS, 0)
            })
        
        return {
            "success": True,
            "errors": errors,
            "corrected": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/export-pdf")
async def export_pdf(request: Dict):
    """Export harmony to PDF."""
    try:
        from backend.pdf_export import export_to_pdf_bytes
        from fastapi.responses import Response
        
        voices_list = request.get("voices", [])
        settings = request.get("settings", {})
        
        pdf_bytes = export_to_pdf_bytes(voices_list, settings)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=harmony_exercise.pdf"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

