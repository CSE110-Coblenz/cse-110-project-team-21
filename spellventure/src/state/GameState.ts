// src/state/GameState.ts
// Manages persistent state such as difficulty, score, and progress.
// Uses localStorage for persistence between sessions.

export type Difficulty = "easy" | "medium" | "hard";

export class GameState {
  private static instance: GameState;
  private difficulty: Difficulty = "easy";
  private score: number = 0;

  // Singleton pattern
  static load(): GameState {
    if (!GameState.instance) {
      const saved = localStorage.getItem("spellventure_state");
      if (saved) {
        const data = JSON.parse(saved);
        const gs = new GameState();
        gs.difficulty = data.difficulty ?? "easy";
        gs.score = data.score ?? 0;
        GameState.instance = gs;
      } else {
        GameState.instance = new GameState();
      }
    }
    return GameState.instance;
  }

  setDifficulty(level: Difficulty) {
    this.difficulty = level;
    this.save();
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  addScore(points: number) {
    this.score += points;
    this.save();
  }

  getScore(): number {
    return this.score;
  }

  reset() {
    this.difficulty = "easy";
    this.score = 0;
    this.save();
  }

  private save() {
    localStorage.setItem(
      "spellventure_state",
      JSON.stringify({
        difficulty: this.difficulty,
        score: this.score,
      })
    );
  }
}
