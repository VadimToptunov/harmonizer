/**
 * MusicXML parser for the frontend
 * Parses MusicXML files and extracts musical data
 */

export const parseMusicXML = async (xmlText) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse MusicXML: ' + parserError.textContent);
  }

  const score = xmlDoc.querySelector('score-partwise');
  if (!score) {
    throw new Error('Not a valid MusicXML partwise score');
  }

  // Extract metadata
  const metadata = {
    title: score.querySelector('work-title')?.textContent || '',
    composer: score.querySelector('creator[type="composer"]')?.textContent || '',
    key: extractKey(score),
    timeSignature: extractTimeSignature(score),
    divisions: parseInt(score.querySelector('divisions')?.textContent || '256')
  };

  // Extract parts and measures
  const parts = [];
  const partElements = score.querySelectorAll('part');
  
  partElements.forEach(partEl => {
    const partId = partEl.getAttribute('id');
    const measures = extractMeasures(partEl, metadata.divisions);
    parts.push({
      id: partId,
      measures
    });
  });

  // Extract directions (Roman numerals, figured bass)
  const directions = extractDirections(score);

  return {
    metadata,
    parts,
    directions
  };
};

const extractKey = (score) => {
  const keyEl = score.querySelector('key');
  if (!keyEl) return { fifths: 0, mode: 'major' };
  
  const fifths = parseInt(keyEl.querySelector('fifths')?.textContent || '0');
  const mode = keyEl.querySelector('mode')?.textContent || 'major';
  
  return { fifths, mode };
};

const extractTimeSignature = (score) => {
  const timeEl = score.querySelector('time');
  if (!timeEl) return { beats: 4, beatType: 4 };
  
  const beats = parseInt(timeEl.querySelector('beats')?.textContent || '4');
  const beatType = parseInt(timeEl.querySelector('beat-type')?.textContent || '4');
  
  return { beats, beatType };
};

const extractMeasures = (partEl, divisions) => {
  const measures = [];
  const measureElements = partEl.querySelectorAll('measure');
  
  measureElements.forEach(measureEl => {
    const measureNumber = parseInt(measureEl.getAttribute('number') || '1');
    const notes = extractNotes(measureEl, divisions);
    measures.push({
      number: measureNumber,
      notes
    });
  });
  
  return measures;
};

const extractNotes = (measureEl, divisions) => {
  const notes = [];
  let currentTime = 0;
  
  const noteElements = measureEl.querySelectorAll('note');
  
  noteElements.forEach(noteEl => {
    // Check for backup (time movement)
    const backup = noteEl.previousElementSibling;
    if (backup && backup.tagName === 'backup') {
      const backupDuration = parseInt(backup.querySelector('duration')?.textContent || '0');
      currentTime -= backupDuration;
    }
    
    // Check if it's a rest
    if (noteEl.querySelector('rest')) {
      const duration = parseInt(noteEl.querySelector('duration')?.textContent || divisions);
      const voice = parseInt(noteEl.querySelector('voice')?.textContent || '1');
      const staff = parseInt(noteEl.querySelector('staff')?.textContent || '1');
      
      notes.push({
        type: 'rest',
        time: currentTime,
        duration,
        voice,
        staff
      });
      
      currentTime += duration;
      return;
    }
    
    // Extract pitch
    const pitchEl = noteEl.querySelector('pitch');
    if (!pitchEl) return;
    
    const step = pitchEl.querySelector('step')?.textContent || 'C';
    const alter = parseInt(pitchEl.querySelector('alter')?.textContent || '0');
    const octave = parseInt(pitchEl.querySelector('octave')?.textContent || '4');
    
    const duration = parseInt(noteEl.querySelector('duration')?.textContent || divisions);
    const voice = parseInt(noteEl.querySelector('voice')?.textContent || '1');
    const staff = parseInt(noteEl.querySelector('staff')?.textContent || '1');
    const type = noteEl.querySelector('type')?.textContent || 'quarter';
    
    // Convert to MIDI
    const midi = pitchToMidi(step, alter, octave);
    
    notes.push({
      type: 'note',
      pitch: { step, alter, octave },
      midi,
      time: currentTime,
      duration,
      voice,
      staff,
      noteType: type
    });
    
    currentTime += duration;
  });
  
  return notes;
};

const pitchToMidi = (step, alter, octave) => {
  const noteMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const baseNote = noteMap[step] || 0;
  const midi = (octave + 1) * 12 + baseNote + alter;
  return midi;
};

const extractDirections = (score) => {
  const directions = [];
  
  const directionElements = score.querySelectorAll('direction');
  
  directionElements.forEach(dirEl => {
    const wordsEl = dirEl.querySelector('words');
    if (!wordsEl) return;
    
    const text = wordsEl.textContent.trim();
    const voice = parseInt(dirEl.querySelector('voice')?.textContent || '1');
    const staff = parseInt(dirEl.querySelector('staff')?.textContent || '1');
    const offset = parseInt(dirEl.querySelector('offset')?.getAttribute('sound') === 'no' 
      ? dirEl.querySelector('offset')?.textContent || '0' : '0');
    
    // Determine if it's Roman numeral or figured bass
    const isRomanNumeral = /^[IVX]+[b#]?[a-z]*$/i.test(text);
    const isFiguredBass = /^[\d\/]+$/.test(text.replace(/\s/g, ''));
    
    directions.push({
      text,
      voice,
      staff,
      offset,
      type: isRomanNumeral ? 'roman' : isFiguredBass ? 'figured' : 'text'
    });
  });
  
  return directions;
};

/**
 * Organize notes by voice and staff for rendering
 */
export const organizeNotesForRendering = (parsedData) => {
  const organized = {
    staff1: { voices: {} }, // Treble staff
    staff2: { voices: {} }   // Bass staff
  };
  
  parsedData.parts.forEach(part => {
    part.measures.forEach(measure => {
      measure.notes.forEach(note => {
        const staffKey = note.staff === 1 ? 'staff1' : 'staff2';
        const voiceKey = `voice${note.voice}`;
        
        if (!organized[staffKey].voices[voiceKey]) {
          organized[staffKey].voices[voiceKey] = [];
        }
        
        organized[staffKey].voices[voiceKey].push(note);
      });
    });
  });
  
  // Add directions
  organized.directions = parsedData.directions;
  
  return organized;
};

