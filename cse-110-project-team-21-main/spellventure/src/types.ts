// src/types.ts
export type Screen =
  | { type: "menu" }
  | { type: "difficulty" }
  | { type: "game"; bonusHearts?: number }
  | {
      type: "mini_result";
      score: number;
      hearts: number;
      bonusHearts?: number;
      from?: string;
    }
  | { type: "miniGameSelect" }
  | { type: "drop" }
  | { type: "result" }; 

export interface ScreenSwitcher {
  switchToScreen(screen: Screen, pushToHistory?: boolean): void; // default true
  goBack(): void;
  goHome(): void;
  openHelp(): void;
  closeHelp(): void;
}
