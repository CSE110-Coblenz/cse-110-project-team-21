// src/controllers/MenuScreenController.ts
import MenuScreenView from "../views/MenuScreenView";
import type { ScreenSwitcher } from "../types";

export default class MenuScreenController {
  private view: MenuScreenView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new MenuScreenView();
  }

  getView(): MenuScreenView {
    return this.view;
  }

  startPlayIntro(): void {
    this.view.startPlayIntro(() => {
      // When user completes “PLAY” word:
      this.app.switchToScreen({ type: "difficulty" });
    });
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }
}
