/**
 * @file GameState.ts
 * @brief Manages persistent game state such as difficulty, score, health, and
 *        the word banks used for each round. Uses localStorage for persistence.
 */

export type Difficulty = "easy" | "medium" | "hard";

export class GameState {
  private static instance: GameState;

  // ====== Core persistent fields ======
  private difficulty: Difficulty = "easy";
  private wordsCollected: number = 0;
  private wordLinkCurrentWord: string | null = null;
  private wordLinkHealth: number = 3;
  private score: number = 0;

  // ====== Word Bank Data ======
  private wordBank: string[] = [];
  private wordBankByType: Record<string, string[]> = {};

  // ====== Singleton Loader ======
  static load(): GameState {
    if (!GameState.instance) {
      const saved = localStorage.getItem("spellventure_state");
      if (saved) {
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
        GameState.instance = new GameState();
      }
    }
    return GameState.instance;
  }

  // ====== Persistence Helper ======
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

  // ====== Difficulty ======
  setDifficulty(level: Difficulty): void {
    this.difficulty = level;
    this.save();
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  // ====== WordLink: Current Word ======
  getWordLinkCurrentWord(): string | null {
    return this.wordLinkCurrentWord;
  }

  setCurrentWord(word: string | null): void {
    this.wordLinkCurrentWord = word;
    this.save();
  }

  // ====== WordLink: Progression ======
  getWordsCollected(): number {
    return this.wordsCollected;
  }

  incrementWordsCollected(): void {
    this.wordsCollected++;
    this.save();
  }

  // ====== WordLink: Health ======
  getHealth(): number {
    return this.wordLinkHealth;
  }

  addWordLinkHealth(amount: number = 1): void {
    this.wordLinkHealth += amount;
    this.save();
  }

  removeLinkHealth(amount: number = 1): void {
    this.wordLinkHealth = Math.max(0, this.wordLinkHealth - amount);
    this.save();
  }

  // ====== WordLink: Reset Round ======
  resetWordLink(): void {
    this.wordLinkCurrentWord = null;
    this.wordsCollected = 0;
    this.wordLinkHealth = 3;
    this.score = 0;
    this.wordBank = [];
    this.wordBankByType = {};
    this.save();
  }

  // ====== Score ======
  addScore(points: number): void {
    this.score += points;
    this.save();
  }

  getScore(): number {
    return this.score;
  }

  // ====== Word Bank Handling ======
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

  // ====== Reset All Game Data ======
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
