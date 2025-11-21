/**
 * @file index.ts
 * @brief Central export hub for all word banks and story template.
 *
 * Updated: now provides getLinkedStoryWords() to create an ordered list of
 * words suitable for crossword-style placement (each word shares at least
 * one common letter with some previously chosen word).
 */

// ===== Import Word Banks =====
import { adjectives } from "./adjectives";
import { nouns } from "./nouns";
import { verbs } from "./verbs";
import { adverbs } from "./adverbs";
import { animals } from "./animals";
import { foods } from "./foods";
import { places } from "./places";
import { subjects } from "./subjects";
import { exclamations } from "./exclamations";

// ===== Import Story Template =====
import { storyTemplate } from "./storyTemplate";

// ===== Define Mapping =====
export const wordBanks = {
  adjective: adjectives,
  noun: nouns,
  verb: verbs,
  adverb: adverbs,
  animal: animals,
  food: foods,
  place: places,
  subject: subjects,
  exclamation: exclamations,
};

// ===== Utility: random pick from a list =====
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * @brief Fetches a random word of the given type from its word bank.
 */
export function getRandomWord(type: keyof typeof wordBanks): string {
  const bank = wordBanks[type];
  if (!bank || bank.length === 0) return "???";
  return pickRandom(bank);
}

/**
 * @brief Generates an ordered list of up to 15 words that can be linked
 * crossword-style — every subsequent word shares at least one letter with
 * one of the words already chosen.
 *
 * This doesn’t yet compute actual grid positions; it simply ensures that
 * the set of words is *connectable* for the next layout phase.
 */
export function getLinkedStoryWords(maxWords = 15): string[] {
  // Combine all words into one pool
  const allWords = Object.values(wordBanks).flat().map((w) => w.toLowerCase());
  const result: string[] = [];

  // Start with a completely random seed word
  let current = pickRandom(allWords);
  result.push(current);

  // Build a connectable list
  while (result.length < maxWords) {
    // Letters used so far
    const usedLetters = new Set(result.join("").split(""));

    // Find candidates that share ≥1 letter with existing words
    const candidates = allWords.filter(
      (w) =>
        !result.includes(w) &&
        [...w].some((ch) => usedLetters.has(ch))
    );

    // If no candidates share letters, fallback to any unused word
    const next = candidates.length > 0
      ? pickRandom(candidates)
      : pickRandom(allWords.filter((w) => !result.includes(w)));

    result.push(next);
    current = next;
  }

  return result;
}

// ===== Exports =====
export { storyTemplate };
export type { WordType, StoryBlank } from "./storyTemplate";
