// src/controllers/DifficultyScreenController.ts
import DifficultyScreenView from "../views/DifficultyScreenView";
import type { ScreenSwitcher } from "../types";
import { GameState } from "../state/GameState";

export default class DifficultyScreenController {
  private view: DifficultyScreenView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new DifficultyScreenView();

    this.view.onDifficultySelected((level) => {
      const state = GameState.load();
      state.setDifficulty(level as "easy" | "medium" | "hard");
      this.app.switchToScreen({ type: "game" });
    });
  }

  getView(): DifficultyScreenView {
    return this.view;
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }
}
