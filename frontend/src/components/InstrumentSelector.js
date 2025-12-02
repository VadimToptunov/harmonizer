/**
 * Instrument definitions with ranges and transpositions
 */
export const INSTRUMENTS = {
  // Strings
  violin: {
    name: 'Violin',
    clef: 'treble',
    range: { min: 55, max: 105 }, // G3 to E7
    transposition: 0,
    key: 'C'
  },
  viola: {
    name: 'Viola',
    clef: 'alto',
    range: { min: 48, max: 88 }, // C3 to C6
    transposition: 0,
    key: 'C'
  },
  cello: {
    name: 'Cello',
    clef: 'bass',
    range: { min: 36, max: 84 }, // C2 to C6
    transposition: 0,
    key: 'C'
  },
  doubleBass: {
    name: 'Double Bass',
    clef: 'bass',
    range: { min: 28, max: 67 }, // E1 to G4
    transposition: -12, // Sounds octave lower
    key: 'C'
  },
  
  // Woodwinds
  flute: {
    name: 'Flute',
    clef: 'treble',
    range: { min: 60, max: 96 }, // C4 to C7
    transposition: 0,
    key: 'C'
  },
  piccolo: {
    name: 'Piccolo',
    clef: 'treble',
    range: { min: 74, max: 108 }, // D5 to C8
    transposition: 12, // Sounds octave higher
    key: 'C'
  },
  clarinetBb: {
    name: 'Clarinet (Bb)',
    clef: 'treble',
    range: { min: 50, max: 102 }, // D3 to Bb6
    transposition: -2, // Bb instrument
    key: 'Bb'
  },
  clarinetA: {
    name: 'Clarinet (A)',
    clef: 'treble',
    range: { min: 49, max: 101 }, // C#3 to A6
    transposition: -3, // A instrument
    key: 'A'
  },
  oboe: {
    name: 'Oboe',
    clef: 'treble',
    range: { min: 58, max: 94 }, // Bb3 to F6
    transposition: 0,
    key: 'C'
  },
  bassoon: {
    name: 'Bassoon',
    clef: 'bass',
    range: { min: 34, max: 77 }, // Bb1 to F4
    transposition: 0,
    key: 'C'
  },
  saxophoneSoprano: {
    name: 'Soprano Sax (Bb)',
    clef: 'treble',
    range: { min: 55, max: 100 }, // Ab3 to Eb6
    transposition: -2,
    key: 'Bb'
  },
  saxophoneAlto: {
    name: 'Alto Sax (Eb)',
    clef: 'treble',
    range: { min: 49, max: 88 }, // Bb2 to F5
    transposition: -9, // Eb instrument
    key: 'Eb'
  },
  saxophoneTenor: {
    name: 'Tenor Sax (Bb)',
    clef: 'treble',
    range: { min: 43, max: 82 }, // Ab2 to Eb5
    transposition: -14, // Bb instrument, octave lower
    key: 'Bb'
  },
  saxophoneBaritone: {
    name: 'Baritone Sax (Eb)',
    clef: 'treble',
    range: { min: 37, max: 76 }, // C2 to Ab4
    transposition: -21, // Eb instrument, two octaves lower
    key: 'Eb'
  },
  
  // Brass
  trumpet: {
    name: 'Trumpet (Bb)',
    clef: 'treble',
    range: { min: 55, max: 88 }, // E3 to E6
    transposition: -2,
    key: 'Bb'
  },
  frenchHorn: {
    name: 'French Horn (F)',
    clef: 'treble',
    range: { min: 41, max: 88 }, // F2 to F5
    transposition: -7, // F instrument
    key: 'F'
  },
  trombone: {
    name: 'Trombone',
    clef: 'bass',
    range: { min: 40, max: 84 }, // E2 to C6
    transposition: 0,
    key: 'C'
  },
  tuba: {
    name: 'Tuba',
    clef: 'bass',
    range: { min: 29, max: 60 }, // F1 to C4
    transposition: 0,
    key: 'C'
  },
  
  // Voice
  soprano: {
    name: 'Soprano',
    clef: 'treble',
    range: { min: 60, max: 88 }, // C4 to E6
    transposition: 0,
    key: 'C'
  },
  alto: {
    name: 'Alto',
    clef: 'treble',
    range: { min: 55, max: 84 }, // G3 to C6
    transposition: 0,
    key: 'C'
  },
  tenor: {
    name: 'Tenor',
    clef: 'treble',
    range: { min: 48, max: 79 }, // C3 to G5
    transposition: 0,
    key: 'C'
  },
  bass: {
    name: 'Bass',
    clef: 'bass',
    range: { min: 40, max: 72 }, // E2 to C5
    transposition: 0,
    key: 'C'
  },
  
  // Piano
  piano: {
    name: 'Piano',
    clef: 'treble',
    range: { min: 21, max: 108 }, // A0 to C8
    transposition: 0,
    key: 'C'
  }
};

/**
 * Get instrument by name
 */
export const getInstrument = (name) => {
  const key = Object.keys(INSTRUMENTS).find(
    k => INSTRUMENTS[k].name.toLowerCase() === name.toLowerCase()
  );
  return key ? INSTRUMENTS[key] : null;
};

/**
 * Get all instruments grouped by category
 */
export const getInstrumentsByCategory = () => {
  return {
    'Strings': ['violin', 'viola', 'cello', 'doubleBass'],
    'Woodwinds': ['flute', 'piccolo', 'clarinetBb', 'clarinetA', 'oboe', 'bassoon', 
                  'saxophoneSoprano', 'saxophoneAlto', 'saxophoneTenor', 'saxophoneBaritone'],
    'Brass': ['trumpet', 'frenchHorn', 'trombone', 'tuba'],
    'Voice': ['soprano', 'alto', 'tenor', 'bass'],
    'Keyboard': ['piano']
  };
};

