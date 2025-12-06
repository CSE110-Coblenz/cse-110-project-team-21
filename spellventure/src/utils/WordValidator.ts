/**
 * @file WordValidator.ts
 * @brief Validates player-submitted words for the Word Link game.
 *
 * Priority order:
 *  1️⃣ Check against local story word banks (offline, instant)
 *  2️⃣ If not found, query a lightweight online dictionary API
 *  3️⃣ Cache validated results in memory to avoid repeated lookups
 */

import { wordBanks } from "../data/index";

// ===== Step 1: Build an in-memory dictionary from your word banks =====
const LOCAL_DICTIONARY: Set<string> = new Set();

for (const list of Object.values(wordBanks)) {
  list.forEach((word: string) => LOCAL_DICTIONARY.add(word.toLowerCase()));
}

// ===== Step 2: In-memory cache for API results (avoid duplicate requests) =====
const VALIDATED_CACHE: Map<string, boolean> = new Map();

/**
 * @brief Checks if a given word is valid English.
 * @param word The player's submitted word.
 * @returns Promise<boolean> - true if valid (local or API check).
 */
export async function isValidEnglishWord(word: string): Promise<boolean> {
  if (!word || word.length < 2) return false;
  const normalized = word.toLowerCase();

  // === 1️⃣ Local check (instant) ===
  if (LOCAL_DICTIONARY.has(normalized)) return true;

  // === 2️⃣ Cached result ===
  if (VALIDATED_CACHE.has(normalized)) return VALIDATED_CACHE.get(normalized)!;

  // === 3️⃣ Online validation (dictionaryapi.dev) ===
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${normalized}`);
    const isValid = res.ok;
    VALIDATED_CACHE.set(normalized, isValid);
    return isValid;
  } catch (err) {
    console.warn(`[WordValidator] Failed to fetch definition for "${word}"`, err);
    return false; // fallback: assume invalid if offline or API fails
  }
}

/**
 * @brief Adds a new word to the local offline dictionary (for dynamic updates).
 * @param word Word to add (e.g., mini-game reward words or new story words).
 */
export function addWordToDictionary(word: string): void {
  if (!word) return;
  LOCAL_DICTIONARY.add(word.toLowerCase());
}

/**
 * @brief Clears the cache of previously validated online words.
 * (Useful for testing or debugging)
 */
export function clearValidationCache(): void {
  VALIDATED_CACHE.clear();
}
