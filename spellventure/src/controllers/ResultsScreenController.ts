import ResultsScreenView from "../views/ResultsScreenView";
import type { ScreenSwitcher } from "../types";

export default class ResultsScreenController {
  private view: ResultsScreenView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new ResultsScreenView();
  }

  getView(): ResultsScreenView {
    return this.view;
  }

  show(): void {
    this.view.show();
  }

  hide(): void {
    this.view.hide();
  }

  // Pass resize events to view
  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }
}
