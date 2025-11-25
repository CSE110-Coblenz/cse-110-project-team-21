/**
 * @file WordValidator.ts
 * @brief Provides offline + online English word validation for the Word Link game.
 *
 * The validation pipeline intentionally uses a *layered* approach:
 *
 *  1. **Local dictionary (instant lookup)**  
 *     - Derived from your story word banks in `/data/index.ts`.  
 *     - This means any word that appears in your game's story or any predefined word lists
 *       will ALWAYS count as valid even without internet access.
 *
 *  2. **In-memory cache**  
 *     - Previously validated API results are stored so repeated guesses do not hit the network.
 *     - Prevents unnecessary latency and rate-limit issues.
 *
 *  3. **Online API fallback**  
 *     - Uses the free `dictionaryapi.dev` endpoint.
 *     - A word is considered valid if the HTTP response is OK (`res.ok === true`).
 *     - If the request fails (offline, network blocked, API rate-limited), we default to "invalid"
 *       to avoid awarding unintended points.
 *
 * Used by: WordLinkController.submitGuess()
 */

import { wordBanks } from "../data/index";

// ============================================================================
// 1️⃣ LOCAL OFFLINE DICTIONARY (SET)
// ============================================================================
// We combine ALL word lists across all story types into one Set.
// This gives constant-time O(1) lookups for offline validation.
//
// Example source (from data/index.ts):
//   - noun banks
//   - verb banks
//   - adjective banks
//   - any custom word lists relevant to Story Mode
//
// Any word in these banks is treated as a valid English word,
// regardless of whether it appears in the external dictionary API.
const LOCAL_DICTIONARY: Set<string> = new Set();

for (const list of Object.values(wordBanks)) {
  list.forEach((word: string) => LOCAL_DICTIONARY.add(word.toLowerCase()));
}

// ============================================================================
// 2️⃣ VALIDATION CACHE FOR ONLINE RESULTS
// ============================================================================
// Because the dictionary API is remote and can be slow/limited,
// we cache every validated word (true/false) so the next check is instant.
//
// Example:
//   - First check of "apple": hits API → result cached
//   - Next 20 checks of "apple": returned from VALIDATED_CACHE immediately
//
const VALIDATED_CACHE: Map<string, boolean> = new Map();

/**
 * @brief Checks whether a given word is valid English.
 *
 * @details
 * Validation priority:
 *   1. **Local dictionary** — instant, offline
 *   2. **Cached online result**
 *   3. **Network API check**
 *
 * The function is async because the external API requires a network fetch.
 *
 * @param word The player-submitted word (typically from WordLink guesses).
 * @returns Promise<boolean> True if the word is valid, false otherwise.
 */
export async function isValidEnglishWord(word: string): Promise<boolean> {
  if (!word || word.length < 2) return false;
  const normalized = word.toLowerCase();

  // --- 1️⃣ Local offline dictionary check ---
  // If found, we immediately return true (faster than API).
  if (LOCAL_DICTIONARY.has(normalized)) return true;

  // --- 2️⃣ Check the in-memory validation cache ---
  if (VALIDATED_CACHE.has(normalized)) {
    return VALIDATED_CACHE.get(normalized)!;
  }

  // --- 3️⃣ Remote dictionary check (fallback) ---
  // Query dictionaryapi.dev, which returns 200 OK for real English words.
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${normalized}`);

    // `res.ok` === 200–299 — valid English word
    const isValid = res.ok;

    // Store result in memory to avoid another network call
    VALIDATED_CACHE.set(normalized, isValid);

    return isValid;
  } catch (err) {
    // Network or CORS failures end up here
    console.warn(`[WordValidator] Failed to fetch definition for "${word}"`, err);

    // Fail-safe: treat word as invalid so the player doesn't gain unintended rewards
    return false;
  }
}

/**
 * @brief Adds a new word to the LOCAL offline dictionary.
 *
 * @details
 * Useful for:
 *   - Mini-games that reward new vocabulary
 *   - Dynamically added story words
 *   - Extending the valid word list without modifying source files
 *
 * @param word The word to add.
 */
export function addWordToDictionary(word: string): void {
  if (!word) return;
  LOCAL_DICTIONARY.add(word.toLowerCase());
}

/**
 * @brief Clears only the online validation cache.
 *
 * @details
 * Local dictionary remains intact.
 * This is intended for:
 *   - Debugging
 *   - Unit tests
 *   - Forcing a fresh re-query of the API
 */
export function clearValidationCache(): void {
  VALIDATED_CACHE.clear();
}
