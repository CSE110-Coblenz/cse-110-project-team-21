import ResultsScreenView from "../views/ResultsScreenView";
import type { ScreenSwitcher } from "../types";

export default class ResultsScreenController {
  private view: ResultsScreenView;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new ResultsScreenView();

    this.view.onHomeClicked(() => {
      this.app.goHome();
    });
  }

  setFinalScores(wordLinkScore: number, heartsRemaining: number): void {
    this.view.updateScores(wordLinkScore, heartsRemaining);
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

  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }
}