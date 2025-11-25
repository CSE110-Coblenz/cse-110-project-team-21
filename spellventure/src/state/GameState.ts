/**
 * @file GameState.ts
 * @brief Central persistent state manager for Spellventure.
 *
 * This module encapsulates all “global game variables” such as difficulty,
 * WordLink progress, hearts, score, and word banks. It persists this data to
 * `localStorage` so the player can close the browser and return later without
 * losing progress.
 *
 * Core design goals:
 *  - Provide a **single source of truth** for all persistent game fields.
 *  - Avoid scattering localStorage calls throughout controllers.
 *  - Expose a consistent API for reading/updating state.
 *  - Guarantee that only one GameState instance exists (Singleton pattern).
 *
 * Used heavily by:
 *   - WordLinkController (hearts, score, current word)
 *   - MiniGameController (restore hearts)
 *   - Any future systems needing persistence (difficulty, future expansions)
 */

export type Difficulty = "easy" | "medium" | "hard";

export class GameState {
  /** Singleton instance shared across the entire app */
  private static instance: GameState;

  // ---------------------------------------------------------------------------
  // PERSISTED FIELDS
  // ---------------------------------------------------------------------------
  // These fields are saved to localStorage whenever modified, ensuring
  // the gameplay progress is durable across refreshes or browser restarts.

  /** Difficulty level chosen at the start menu */
  private difficulty: Difficulty = "easy";

  /** Number of WordLink words solved in the current run */
  private wordsCollected: number = 0;

  /** The *current* word being solved in WordLink (optional) */
  private wordLinkCurrentWord: string | null = null;

  /** Remaining hearts during WordLink */
  private wordLinkHealth: number = 3;

  /** Player's cumulative score */
  private score: number = 0;

  // ---------------------------------------------------------------------------
  // WORD BANK DATA
  // ---------------------------------------------------------------------------
  /**
   * Flat list of words used for the current session.
   * Used by older versions of WordLink; retained for future compatibility.
   */
  private wordBank: string[] = [];

  /**
   * Categorized bank of words (noun, verb, adjective, etc.).
   * Useful for story generation and structured Mad Lib phases.
   */
  private wordBankByType: Record<string, string[]> = {};

  // ---------------------------------------------------------------------------
  // SINGLETON LOADER
  // ---------------------------------------------------------------------------
  /**
   * @brief Loads (or creates) the global `GameState` singleton.
   *
   * @details
   * Steps:
   *   1. If instance already exists → return it.
   *   2. If saved state exists in localStorage → deserialize it.
   *   3. Otherwise → create a fresh default instance.
   *
   * This ensures all controllers (`WordLinkController`, `MiniGameController`,
   * `GameScreenController`, etc.) always reference the same state.
   *
   * @returns The single `GameState` instance.
   */
  static load(): GameState {
    if (!GameState.instance) {
      const saved = localStorage.getItem("spellventure_state");

      if (saved) {
        // Load previously saved fields
        const data = JSON.parse(saved);
        const gs = new GameState();

        gs.difficulty = data.difficulty ?? "easy";
        gs.wordLinkCurrentWord = data.wordLinkCurrentWord ?? null;
        gs.wordsCollected = data.wordsCollected ?? 0;
        gs.wordLinkHealth = data.wordLinkHealth ?? 3;
        gs.score = data.score ?? 0;
        gs.wordBank = data.wordBank ?? [];
        gs.wordBankByType = data.wordBankByType ?? {};

        GameState.instance = gs;
      } else {
        // First time player launches the game
        GameState.instance = new GameState();
      }
    }
    return GameState.instance;
  }

  // ---------------------------------------------------------------------------
  // INTERNAL SAVE HELPER
  // ---------------------------------------------------------------------------
  /**
   * @brief Writes the entire state object to localStorage.
   *
   * @details
   * Called automatically by all setter-like methods.  
   * Using a single serialization location prevents subtle bugs and guarantees
   * all state stays synchronized.
   */
  private save(): void {
    localStorage.setItem(
      "spellventure_state",
      JSON.stringify({
        difficulty: this.difficulty,
        wordsCollected: this.wordsCollected,
        wordLinkCurrentWord: this.wordLinkCurrentWord,
        wordLinkHealth: this.wordLinkHealth,
        score: this.score,
        wordBank: this.wordBank,
        wordBankByType: this.wordBankByType,
      })
    );
  }

  // ---------------------------------------------------------------------------
  // DIFFICULTY ACCESSORS
  // ---------------------------------------------------------------------------
  setDifficulty(level: Difficulty): void {
    this.difficulty = level;
    this.save();
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  // ---------------------------------------------------------------------------
  // WORDLINK — CURRENT WORD
  // ---------------------------------------------------------------------------
  getWordLinkCurrentWord(): string | null {
    return this.wordLinkCurrentWord;
  }

  setCurrentWord(word: string | null): void {
    this.wordLinkCurrentWord = word;
    this.save();
  }

  // ---------------------------------------------------------------------------
  // WORDLINK — PROGRESSION
  // ---------------------------------------------------------------------------
  getWordsCollected(): number {
    return this.wordsCollected;
  }

  /**
   * @brief Called when a word is guessed correctly in WordLink.
   */
  incrementWordsCollected(): void {
    this.wordsCollected++;
    this.save();
  }

  // ---------------------------------------------------------------------------
  // WORDLINK — HEART / HEALTH SYSTEM
  // ---------------------------------------------------------------------------
  getHealth(): number {
    return this.wordLinkHealth;
  }

  /**
   * @brief Adds health (used when returning from mini-games).
   */
  addWordLinkHealth(amount: number = 1): void {
    this.wordLinkHealth += amount;
    this.save();
  }

  /**
   * @brief Subtracts health while preventing negative values.
   */
  removeLinkHealth(amount: number = 1): void {
    this.wordLinkHealth = Math.max(0, this.wordLinkHealth - amount);
    this.save();
  }

  // ---------------------------------------------------------------------------
  // WORDLINK — ROUND RESET
  // ---------------------------------------------------------------------------
  /**
   * @brief Clears all WordLink-specific progress but keeps difficulty.
   */
  resetWordLink(): void {
    this.wordLinkCurrentWord = null;
    this.wordsCollected = 0;
    this.wordLinkHealth = 3;
    this.score = 0;
    this.wordBank = [];
    this.wordBankByType = {};
    this.save();
  }

  // ---------------------------------------------------------------------------
  // SCORE
  // ---------------------------------------------------------------------------
  addScore(points: number): void {
    this.score += points;
    this.save();
  }

  getScore(): number {
    return this.score;
  }

  // ---------------------------------------------------------------------------
  // WORD BANK MANAGEMENT
  // ---------------------------------------------------------------------------
  setWordBank(words: string[]): void {
    this.wordBank = words;
    this.save();
  }

  getWordBank(): string[] {
    return this.wordBank;
  }

  setWordBankByType(bank: Record<string, string[]>): void {
    this.wordBankByType = bank;
    this.save();
  }

  getWordBankByType(): Record<string, string[]> {
    return this.wordBankByType;
  }

  // ---------------------------------------------------------------------------
  // FULL RESET
  // ---------------------------------------------------------------------------
  /**
   * @brief Resets *all* persistent game data to factory defaults.
   *
   * @details
   * Used primarily for debugging, development tools, or a “New Game” option.
   */
  resetAll(): void {
    this.difficulty = "easy";
    this.wordLinkCurrentWord = null;
    this.wordsCollected = 0;
    this.wordLinkHealth = 3;
    this.score = 0;
    this.wordBank = [];
    this.wordBankByType = {};
    this.save();
  }
}
