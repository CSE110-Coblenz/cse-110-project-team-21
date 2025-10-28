// src/types.ts
export type Screen = { type: "menu" | "difficulty" | "game" | "result" };

export interface ScreenSwitcher {
  switchToScreen(screen: Screen, pushToHistory?: boolean): void; // default true
  goBack(): void;
  goHome(): void;
  openHelp(): void;
  closeHelp(): void;
}
