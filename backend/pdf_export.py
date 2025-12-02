"""
PDF export functionality for harmony exercises.
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from typing import List, Dict, Union, BinaryIO
import io


def midi_to_note_name(midi: int) -> str:
    """Convert MIDI note to note name."""
    note_names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    octave = (midi // 12) - 1
    note = note_names[midi % 12]
    return f"{note}{octave}"


def export_harmony_to_pdf(voices_list: List[Dict], settings: Dict, output_path: Union[str, BinaryIO]):
    """
    Export harmony to PDF.
    
    Args:
        voices_list: List of voice dictionaries (original and solution)
        settings: Music settings (tempo, time signature, etc.)
        output_path: Path to save PDF (str) or file-like object (BinaryIO)
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Harmony Exercise")
    
    # Settings info
    c.setFont("Helvetica", 10)
    y_pos = height - 80
    c.drawString(50, y_pos, f"Tempo: {settings.get('tempo', 120)} BPM")
    c.drawString(200, y_pos, f"Time Signature: {settings.get('time_signature', '4/4')}")
    c.drawString(350, y_pos, f"Key: {settings.get('key_signature', 'C')}")
    
    # Draw staves
    y_start = height - 150
    staff_height = 100
    staff_spacing = 120
    
    for staff_idx, voices in enumerate(voices_list):
        y_pos = y_start - (staff_idx * (staff_height * 4 + 50))
        
        # Staff label
        c.setFont("Helvetica-Bold", 12)
        label = "Original" if staff_idx == 0 else "Solution"
        c.drawString(50, y_pos + staff_height * 4 + 20, label)
        
        # Draw staff lines
        for voice_idx, voice_name in enumerate(['S', 'A', 'T', 'B']):
            voice_y = y_pos + (3 - voice_idx) * staff_spacing
            
            # Draw 5 lines
            for line in range(5):
                line_y = voice_y - line * 15
                c.line(50, line_y, width - 50, line_y)
            
            # Voice label
            c.setFont("Helvetica", 10)
            c.drawString(20, voice_y - 30, voice_name)
            
            # Notes
            notes = voices.get(voice_name, [])
            if notes:
                x_start = 100
                note_spacing = (width - 150) / max(len(notes), 1)
                
                for note_idx, note in enumerate(notes):
                    x_pos = x_start + note_idx * note_spacing
                    note_name = midi_to_note_name(note)
                    
                    # Draw note (simplified - just text for now)
                    c.setFont("Helvetica", 12)
                    c.drawString(x_pos, voice_y - 20, note_name)
        
        # Page break if needed
        if y_pos < 100:
            c.showPage()
            y_start = height - 50
    
    c.save()
    return output_path


def export_to_pdf_bytes(voices_list: List[Dict], settings: Dict) -> bytes:
    """Export to PDF as bytes."""
    buffer = io.BytesIO()
    export_harmony_to_pdf(voices_list, settings, buffer)
    buffer.seek(0)
    return buffer.getvalue()

