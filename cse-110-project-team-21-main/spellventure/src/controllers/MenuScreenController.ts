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
      this.app.switchToScreen({ type: "difficulty" });
    });
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }

  //Responsive hook
  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }

  reset(): void {
    this.view.resetPlayPosition();
  }
}
