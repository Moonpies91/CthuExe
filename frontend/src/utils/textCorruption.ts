// Character corruption map for Zalgo-like text effects
// Maps regular characters to similar-looking Unicode alternatives
const CORRUPTION_MAP: Record<string, string[]> = {
  'A': ['Α', 'А', 'Ā', '∆', 'Λ'],
  'B': ['Β', 'В', 'ß', '฿'],
  'C': ['Ċ', 'С', 'Ç', '¢'],
  'D': ['Ð', 'Đ', 'Ď'],
  'E': ['Ε', 'Е', 'Ē', '∃', 'Ξ'],
  'F': ['Ƒ', 'ғ'],
  'G': ['Ğ', 'Ģ'],
  'H': ['Η', 'Н', 'Ħ'],
  'I': ['Ι', 'І', 'Ī', '|'],
  'J': ['Ј', 'Ĵ'],
  'K': ['Κ', 'К', 'Ķ'],
  'L': ['Ł', 'Ļ', '₤'],
  'M': ['Μ', 'М', 'Ṁ'],
  'N': ['Ν', 'И', 'Ñ', 'Ň'],
  'O': ['Ο', 'О', 'Ø', '⊙', '◯'],
  'P': ['Ρ', 'Р', 'Þ'],
  'Q': ['Ǫ'],
  'R': ['Я', 'Ŗ', '®'],
  'S': ['Ș', '$', '§'],
  'T': ['Τ', 'Т', 'Ŧ', '†'],
  'U': ['Ū', 'Ų', 'Ц'],
  'V': ['Ṿ', '∨'],
  'W': ['Ŵ', 'Ш', 'Щ'],
  'X': ['Χ', 'Х', '×'],
  'Y': ['Υ', 'Ý', '¥'],
  'Z': ['Ζ', 'Ž', 'Ż'],
  '0': ['Ø', '⊘', '◯'],
  '1': ['І', '|', '¦'],
  '2': ['Ƨ'],
  '3': ['Ʒ', 'Ɛ'],
  '4': ['Ч'],
  '5': ['Ƽ'],
  '6': ['б'],
  '7': ['Ⴚ'],
  '8': ['Ȣ', '∞'],
  '9': ['Գ'],
}

// Zalgo diacritical marks for glitch effects
const ZALGO_UP = [
  '\u030d', '\u030e', '\u0304', '\u0305', '\u033f', '\u0311', '\u0306',
  '\u0310', '\u0352', '\u0357', '\u0351', '\u0307', '\u0308', '\u030a',
  '\u0342', '\u0343', '\u0344', '\u034a', '\u034b', '\u034c', '\u0303',
]

const ZALGO_DOWN = [
  '\u0316', '\u0317', '\u0318', '\u0319', '\u031c', '\u031d', '\u031e',
  '\u031f', '\u0320', '\u0324', '\u0325', '\u0326', '\u0329', '\u032a',
  '\u032b', '\u032c', '\u032d', '\u032e', '\u032f', '\u0330', '\u0331',
]

/**
 * Corrupts text by randomly replacing characters with similar-looking alternatives
 * @param text The text to corrupt
 * @param intensity 0-1 probability of each character being corrupted
 * @returns Corrupted text
 */
export function corruptText(text: string, intensity: number = 0.1): string {
  return text
    .split('')
    .map((char) => {
      const upperChar = char.toUpperCase()
      const alternatives = CORRUPTION_MAP[upperChar]

      if (alternatives && Math.random() < intensity) {
        const replacement = alternatives[Math.floor(Math.random() * alternatives.length)]
        // Preserve case if lowercase
        return char === upperChar ? replacement : replacement.toLowerCase()
      }

      return char
    })
    .join('')
}

/**
 * Adds Zalgo-style glitch marks to text
 * @param text The text to glitch
 * @param intensity 0-1 controlling how many marks to add
 * @returns Glitched text with diacritical marks
 */
export function zalgoText(text: string, intensity: number = 0.3): string {
  return text
    .split('')
    .map((char) => {
      if (char === ' ' || char === '\n') return char

      let result = char

      // Add marks based on intensity
      const numMarks = Math.floor(Math.random() * intensity * 3)

      for (let i = 0; i < numMarks; i++) {
        if (Math.random() < 0.5) {
          result += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)]
        } else {
          result += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)]
        }
      }

      return result
    })
    .join('')
}

/**
 * Randomly glitches parts of text - replacing segments with noise
 * @param text The text to glitch
 * @param intensity 0-1 probability of glitch segments
 * @returns Text with random glitch segments
 */
export function glitchText(text: string, intensity: number = 0.05): string {
  const glitchChars = '░▒▓█▄▀■□▪▫'

  return text
    .split('')
    .map((char) => {
      if (Math.random() < intensity) {
        return glitchChars[Math.floor(Math.random() * glitchChars.length)]
      }
      return char
    })
    .join('')
}

/**
 * Creates a binary noise effect
 * @param length Number of characters
 * @returns Binary noise string
 */
export function binaryNoise(length: number): string {
  return Array.from({ length }, () => Math.random() < 0.5 ? '0' : '1').join('')
}

/**
 * Creates a hex noise effect
 * @param length Number of characters
 * @returns Hex noise string
 */
export function hexNoise(length: number): string {
  const hexChars = '0123456789ABCDEF'
  return Array.from({ length }, () => hexChars[Math.floor(Math.random() * 16)]).join('')
}

export type CorruptionLevel = 0 | 1 | 2 | 3 | 4

/**
 * Apply corruption based on madness level
 */
export function applyMadnessCorruption(text: string, level: CorruptionLevel): string {
  const intensities: Record<CorruptionLevel, number> = {
    0: 0,
    1: 0,
    2: 0.02,
    3: 0.05,
    4: 0.1,
  }

  const intensity = intensities[level]

  if (intensity === 0) return text

  return corruptText(text, intensity)
}
