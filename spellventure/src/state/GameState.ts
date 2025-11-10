// src/state/GameState.ts
// Manages persistent state such as difficulty, score, and progress.
// Uses localStorage for persistence between sessions.

export type Difficulty = "easy" | "medium" | "hard";

export class GameState {
  private static instance: GameState;
  private difficulty: Difficulty = "easy";
  private wordsCollected: number = 0;
  private wordLinkCurrentWord: string | null = null;
  private wordLinkHealth: number = 3;

  // Singleton pattern
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
        GameState.instance = gs;
      } else {
        GameState.instance = new GameState();
      }
    }
    return GameState.instance;
  }
  //Difficulty
  setDifficulty(level: Difficulty) {
    this.difficulty = level;
    this.save();
  }
  getDifficulty(): Difficulty {
    return this.difficulty;
  }
  //WordLink
  getWordLinkCurrentWord(): string | null {
    return this.wordLinkCurrentWord;
  }
  setCurrentWord(word: string | null) {
    this.wordLinkCurrentWord = word;
    this.save();
  }
  getWordsCollected(): number{
    return this.wordsCollected;
  }
  incrementWordsCollected(){
    this.wordsCollected++;
    this.save();
  }

  getHealth(): number{
    return this.wordLinkHealth;
  }
  addWordLinkHealth(amount: number = 1){
    this.wordLinkHealth += amount;
    this.save();
  }
  removeLinkHealth(amount: number = 1) {
    this.wordLinkHealth = Math.max(0, this.wordLinkHealth - amount);
    this.save();
  }
  resetWordLink(){
    this.wordLinkCurrentWord = null;
    this.wordsCollected = 0;
    this.wordLinkHealth = 3;
    this.save();
  }
  //resetAll
  resetAll() {
    this.difficulty = "easy";
    this.wordLinkCurrentWord = null;
    this.wordsCollected = 0;
    this.wordLinkHealth = 3;

    this.save();
  }

  private save() {
    localStorage.setItem(
      "spellventure_state",
      JSON.stringify({
        difficulty: this.difficulty,
        wordsCollected: this.wordsCollected,
        wordLinkCurrentWord: this.wordLinkCurrentWord,
        wordLinkhealth: this.wordLinkHealth,
      })
    );
  }
}
