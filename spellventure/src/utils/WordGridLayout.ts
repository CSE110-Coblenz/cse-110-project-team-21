/**
 * @file WordGridLayout.ts
 * @brief Computes a simple crossword-like layout for a list of words by:
 *        - Attempting to overlap matching characters
 *        - Alternating directions (horizontal ↔ vertical)
 *        - Falling back to non-overlapping placements when needed
 *        - Normalizing coordinates so grid starts at (0,0)
 *
 * This layout is NOT a full crossword solver, but is:
 *   - deterministic
 *   - collision-safe
 *   - predictable for educational games like Word Link
 */

export type Direction = "horizontal" | "vertical";

/**
 * @brief One letter positioned on a 2D integer grid.
 */
export interface PlacedLetter {
  x: number;      ///< Column index in the grid
  y: number;      ///< Row index in the grid
  char: string;   ///< Actual character at that position
}

/**
 * @brief Represents an entire placed word and all coordinates of its letters.
 */
export interface PlacedWord {
  word: string;
  x: number;                 ///< Starting X coordinate of the word
  y: number;                 ///< Starting Y coordinate of the word
  direction: Direction;      ///< horizontal or vertical orientation
  letters: PlacedLetter[];   ///< Detailed per-letter coordinate list
}

/**
 * @brief Entry point for generating a crossword-style word grid.
 *
 * @details
 * Algorithm:
 *   1. Place first word horizontally at origin (0,0)
 *   2. For each remaining word:
 *        - Attempt to intersect with any existing word on a matching letter
 *        - If intersection fits without conflict, place it
 *        - Otherwise, fall back to a non-overlapping placement near the last word
 *   3. Normalize entire grid so minimum x/y is 0 → final layout always positive
 *
 * @param words List of words to place
 * @returns PlacedWord[] with full coordinate data for each letter
 */
export function buildWordGrid(words: string[]): PlacedWord[] {
  const placed: PlacedWord[] = [];

  // --------------------------------------------------------------------------
  // 1️⃣ Place first word as horizontal baseline
  // --------------------------------------------------------------------------
  const first: PlacedWord = {
    word: words[0],
    x: 0,
    y: 0,
    direction: "horizontal",
    letters: [],
  };

  for (let i = 0; i < first.word.length; i++) {
    first.letters.push({ x: i, y: 0, char: first.word[i] });
  }

  placed.push(first);

  // --------------------------------------------------------------------------
  // 2️⃣ Attempt to overlap each subsequent word against previous ones
  // --------------------------------------------------------------------------
  for (let w = 1; w < words.length; w++) {
    const word = words[w];

    // Core overlap logic (see tryPlaceWord)
    const newWord = tryPlaceWord(word, placed);

    placed.push(newWord);
  }

  // --------------------------------------------------------------------------
  // 3️⃣ Normalize coordinates → ensure all x,y >= 0 for rendering simplicity
  // --------------------------------------------------------------------------
  return normalizeGrid(placed);
}

/**
 * @brief Attempts to place a word intersecting an existing placed word.
 *
 * @details
 * Strategy:
 *   - For every placed word:
 *       For every letter in placed word:
 *         For every letter in new word:
 *             If letters match → candidate intersection opportunity
 *             Build a perpendicular placement at that intersection
 *             Check for collisions
 *             Accept first valid placement
 *
 * If no overlap works, fallbackPlacement() is used.
 */
function tryPlaceWord(word: string, placed: PlacedWord[]): PlacedWord {
  for (const existing of placed) {
    for (let i = 0; i < existing.word.length; i++) {
      const existingLetter = existing.word[i];

      for (let j = 0; j < word.length; j++) {
        if (word[j] !== existingLetter) continue;

        // Create proposed placement based on intersection
        const candidate = makePlacement(existing, i, word, j);

        // Ensure no collisions with already-placed letters
        if (fitsWithoutConflict(candidate, placed)) {
          return candidate;
        }
      }
    }
  }

  // No valid overlap → place freely but offset
  const last = placed[placed.length - 1];
  return fallbackPlacement(word, last);
}

/**
 * @brief Constructs a placement attempt based on an overlap match.
 *
 * @param existing       The word already on the grid to intersect with
 * @param existingIndex  Position inside existing.word that matches
 * @param word           New word being placed
 * @param overlapIndex   Index of matching char in the new word
 *
 * @returns A PlacedWord object with computed coordinates
 *
 * @details
 * Orientation rule:
 *   - If existing word is horizontal, new word becomes vertical
 *   - If existing word is vertical, new word becomes horizontal
 *
 * This creates a crossword pattern automatically.
 */
function makePlacement(
  existing: PlacedWord,
  existingIndex: number,
  word: string,
  overlapIndex: number
): PlacedWord {
  // Opposite direction of the word we're intersecting
  const perpendicular: Direction =
    existing.direction === "horizontal" ? "vertical" : "horizontal";

  // Coordinates of the intersecting letter
  const overlapLetter = existing.letters[existingIndex];
  const baseX = overlapLetter.x;
  const baseY = overlapLetter.y;

  // Build new placed letters around intersection
  const letters: PlacedLetter[] = [];

  for (let k = 0; k < word.length; k++) {
    const dx = perpendicular === "horizontal" ? k - overlapIndex : 0;
    const dy = perpendicular === "vertical" ? k - overlapIndex : 0;

    letters.push({ x: baseX + dx, y: baseY + dy, char: word[k] });
  }

  return {
    word,
    x: letters[0].x,
    y: letters[0].y,
    direction: perpendicular,
    letters,
  };
}

/**
 * @brief Ensures a candidate placement does not conflict with existing letters.
 *
 * @details
 * Valid overlap rule:
 *   - Letters may overlap *only* if the characters match.
 *   - Any mismatch = reject placement.
 *
 * Useful example:
 *   "CAT"
 *    ^
 *   intersects with
 *   "MAP"
 *    ^
 *   Only correct if both share the letter "A".
 */
function fitsWithoutConflict(candidate: PlacedWord, placed: PlacedWord[]): boolean {
  const allLetters = placed.flatMap((p) => p.letters);

  for (const c of candidate.letters) {
    const overlap = allLetters.find((l) => l.x === c.x && l.y === c.y);

    // If a letter already exists here and conflicts, reject candidate
    if (overlap && overlap.char !== c.char) return false;
  }

  return true;
}

/**
 * @brief Fallback placement when no intersection exists.
 *
 * @details
 * Strategy:
 *   - Alternate direction from the last word
 *   - Place new word offset far enough to avoid collision
 *
 * This prevents words from stacking directly on top of each other.
 */
function fallbackPlacement(word: string, last: PlacedWord): PlacedWord {
  const offset = 3; // arbitrary spacing constant

  const dir: Direction =
    last.direction === "horizontal" ? "vertical" : "horizontal";

  const baseX =
    last.x + (dir === "horizontal" ? 0 : last.word.length + offset);
  const baseY =
    last.y + (dir === "vertical" ? 0 : last.word.length + offset);

  const letters: PlacedLetter[] = [];

  for (let i = 0; i < word.length; i++) {
    letters.push({
      x: baseX + (dir === "horizontal" ? i : 0),
      y: baseY + (dir === "vertical" ? i : 0),
      char: word[i],
    });
  }

  return { word, x: baseX, y: baseY, direction: dir, letters };
}

/**
 * @brief Repositions all letters so the top-left of the grid becomes (0,0).
 *
 * @details
 * If any word was placed with negative x or y coordinates,
 * they are uniformly shifted positive until the smallest coordinate is 0.
 *
 * This ensures:
 *   - No negative positions in rendering
 *   - Simpler drawing logic in WordLinkView (all coordinates >= 0)
 */
function normalizeGrid(words: PlacedWord[]): PlacedWord[] {
  const minX = Math.min(...words.flatMap((w) => w.letters.map((l) => l.x)));
  const minY = Math.min(...words.flatMap((w) => w.letters.map((l) => l.y)));

  const dx = minX < 0 ? -minX : 0;
  const dy = minY < 0 ? -minY : 0;

  for (const w of words) {
    for (const l of w.letters) {
      l.x += dx;
      l.y += dy;
    }
    w.x += dx;
    w.y += dy;
  }

  return words;
}
