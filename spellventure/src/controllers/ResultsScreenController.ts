// src/controllers/ResultsScreenController.ts
import ResultsScreenView from "../views/ResultsScreenView";
import type { ScreenSwitcher } from "../types";

export default class ResultsScreenController {
  private view: ResultsScreenView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new ResultsScreenView();

    // Wire up button actions
    this.view.onPlayAgain(() => this.handlePlayAgain());
    this.view.onMenu(() => this.handleMainMenu());
  }

  getView() {
    return this.view;
  }

  show() {
    this.view.show();
  }

  hide() {
    this.view.hide();
  }

  /** Called by parent to insert the story text */
  setStory(text: string): void {
    this.view.setStoryResult(text);
  }

  /** --------------------------------------------------------
   * Button Actions
   * -------------------------------------------------------- */

  /** Play Again → restart the main game flow */
  private handlePlayAgain(): void {
    console.log("🔁 Replay pressed — restarting game");
    this.app.switchToScreen({ type: "game" });
  }

  /** Main Menu → return to menu */
  private handleMainMenu(): void {
    console.log("🏠 Main Menu pressed — going home");
    this.app.goHome();
  }

  /** Resize passthrough */
  onResize(width: number, height: number): void {
    // view will rebuild automatically on resize
  }
}
