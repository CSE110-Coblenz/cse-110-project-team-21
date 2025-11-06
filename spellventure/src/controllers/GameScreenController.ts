import GameScreenView from "../views/GameScreenView";
import type { ScreenSwitcher } from "../types";

export default class GameScreenController {
  private view: GameScreenView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new GameScreenView();
  }

  getView(): GameScreenView {
    return this.view;
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }

  // Handle responsive resizing
  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }
}
