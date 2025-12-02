"""
CLI for different harmony exercises.
"""
import sys
from exercises import ExerciseSolver, ExerciseType


def main():
    if len(sys.argv) < 3:
        print("Usage: python exercise_cli.py <exercise_type> <input.xml> [output.xml]")
        print("\nExercise types:")
        print("  bass_figured - Generate upper voices from bass line (default)")
        print("  melody - Harmonize a melody")
        print("  counterpoint - Write counterpoint to cantus firmus")
        print("  errors - Find and correct errors in harmony")
        print("\nExample:")
        print("  python exercise_cli.py melody melody.xml output.xml")
        sys.exit(1)
    
    exercise_type_str = sys.argv[1].lower()
    input_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else input_file.replace(".xml", "_solved.xml")
    
    # Map string to ExerciseType
    exercise_type_map = {
        "bass_figured": ExerciseType.BASS_FIGURED,
        "bass": ExerciseType.BASS_FIGURED,
        "melody": ExerciseType.MELODY_HARMONIZATION,
        "melody_harmonization": ExerciseType.MELODY_HARMONIZATION,
        "counterpoint": ExerciseType.COUNTERPOINT,
        "cp": ExerciseType.COUNTERPOINT,
        "errors": ExerciseType.ERROR_CORRECTION,
        "error_correction": ExerciseType.ERROR_CORRECTION,
    }
    
    exercise_type = exercise_type_map.get(exercise_type_str)
    if not exercise_type:
        print(f"Unknown exercise type: {exercise_type_str}")
        print("Available types:", ", ".join(exercise_type_map.keys()))
        sys.exit(1)
    
    solver = ExerciseSolver()
    result = solver.solve_exercise(exercise_type, input_file, output_file)
    
    if result.success:
        print(f"✓ Exercise solved successfully!")
        print(f"Output saved to: {output_file}")
        print("\n" + "="*60)
        print("EXPLANATIONS:")
        print("="*60)
        print(result.explanations)
    else:
        print(f"✗ Exercise failed: {result.error_message}")
        sys.exit(1)


if __name__ == "__main__":
    main()

