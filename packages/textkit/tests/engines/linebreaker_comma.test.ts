import { describe, expect, test, vi } from 'vitest';
import linebreaker from '../../src/engines/linebreaker';

// Mock dependencies with dynamic width
vi.mock('../../src/attributedString/advanceWidthBetween', () => ({
  default: (start, end, attrStr) => {
    const s = attrStr.string.slice(start, end);
    // Simple width logic for test
    if (s.trim() === '') return 5; // space
    if (s === 'Prefix') return 5;
    if (s === 'Hello') return 10;
    if (s === ',') return 10;
    return 10;
  },
}));

vi.mock('../../src/attributedString/slice', () => ({
  default: (start, end, attrStr) => ({
    string: attrStr.string.slice(start, end),
    syllables: [],
  }),
}));

vi.mock('../../src/attributedString/insertGlyph', () => ({
  default: (index, glyph, attrStr) => attrStr,
}));

describe('linebreaker comma handling', () => {
  test('should move word+comma to next line instead of splitting', () => {
    const string = 'Prefix Hello, World';
    // Indices:
    // Prefix: 0-6
    // Hello: 7-12
    // ,: 12-13
    // World: 14-19

    const attributedString = {
      string,
      syllables: ['Prefix', ' ', 'Hello', ',', ' ', 'World'],
      runs: [{ start: 0, end: string.length, attributes: {} }],
    };

    // Width 25.
    // Prefix (5) + Space (5) + Hello (10) = 20. Fits.
    // , (10) -> Total 30. Overflows.

    // If break allowed at Hello:
    //   Line 1: "Prefix Hello" (20/25).
    //   Line 2: ", World"

    // If break forbidden at Hello:
    //   "Prefix Hello," (30/25) doesn't fit.
    //   Move "Hello," to next line.
    //   Line 1: "Prefix " (10/25).
    //   Line 2: "Hello,"...

    const engine = linebreaker({});
    const lines = engine(attributedString, [25]);

    // We expect Line 1 to NOT contain "Hello"
    expect(lines[0].string.trim()).toBe('Prefix');
    expect(lines[1].string).toContain('Hello,');
  });
});
