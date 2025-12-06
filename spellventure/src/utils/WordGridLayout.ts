/**
 * @file WordGridLayout.ts
 * @brief Generates crossword-style 2D positions for a list of words.
 */

export type Direction = "horizontal" | "vertical";

export interface PlacedLetter {
  x: number;
  y: number;
  char: string;
}

export interface PlacedWord {
  word: string;
  x: number;
  y: number;
  direction: Direction;
  letters: PlacedLetter[];
}

/**
 * @brief Builds a crossword-style layout for the given words.
 */
export function buildWordGrid(words: string[]): PlacedWord[] {
  const placed: PlacedWord[] = [];

  // 1️⃣ Place the first word at origin
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

  // 2️⃣ Attempt to place the rest
  for (let w = 1; w < words.length; w++) {
    const word = words[w];
    const newWord = tryPlaceWord(word, placed);
    placed.push(newWord);
  }

  return normalizeGrid(placed);
}

/**
 * @brief Attempts to place a new word intersecting an existing one.
 */
function tryPlaceWord(word: string, placed: PlacedWord[]): PlacedWord {
  for (const existing of placed) {
    for (let i = 0; i < existing.word.length; i++) {
      const existingLetter = existing.word[i];
      for (let j = 0; j < word.length; j++) {
        if (word[j] !== existingLetter) continue;

        const candidate = makePlacement(existing, i, word, j);
        if (fitsWithoutConflict(candidate, placed)) return candidate;
      }
    }
  }

  // No valid overlap → place offset from last word
  const last = placed[placed.length - 1];
  return fallbackPlacement(word, last);
}

/**
 * @brief Creates a new placement given overlap positions.
 */
function makePlacement(
  existing: PlacedWord,
  existingIndex: number,
  word: string,
  overlapIndex: number
): PlacedWord {
  const perpendicular: Direction =
    existing.direction === "horizontal" ? "vertical" : "horizontal";

  const overlapLetter = existing.letters[existingIndex];
  const baseX = overlapLetter.x;
  const baseY = overlapLetter.y;

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
 * @brief Checks if the new placement collides incorrectly with existing ones.
 */
function fitsWithoutConflict(candidate: PlacedWord, placed: PlacedWord[]): boolean {
  const allLetters = placed.flatMap((p) => p.letters);
  for (const c of candidate.letters) {
    const overlap = allLetters.find((l) => l.x === c.x && l.y === c.y);
    if (overlap && overlap.char !== c.char) return false;
  }
  return true;
}

/**
 * @brief Places a word offset from the last one when no intersection found.
 */
function fallbackPlacement(word: string, last: PlacedWord): PlacedWord {
  const offset = 3;
  const dir: Direction = last.direction === "horizontal" ? "vertical" : "horizontal";
  const baseX = last.x + (dir === "horizontal" ? 0 : last.word.length + offset);
  const baseY = last.y + (dir === "vertical" ? 0 : last.word.length + offset);

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
 * @brief Normalizes all coordinates so the grid starts at (0,0).
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
