/**
 * @file ResultsScreenController.ts
 * @brief Thin controller for the final Results screen. The controller’s job is
 *        minimal: show/hide the ResultsScreenView and pass resize events down.
 *
 * The actual UI (story, score, visuals, etc.) is defined in ResultsScreenView.
 */

import ResultsScreenView from "../views/ResultsScreenView";
import type { ScreenSwitcher } from "../types";

export default class ResultsScreenController {
  /** Reference to the view responsible for drawing the results UI */
  private view: ResultsScreenView;

  /** Reference to App.ts for future navigation features (currently unused) */
  private app: ScreenSwitcher;

  /**
   * @brief Constructor — instantiates the View and keeps app reference.
   *
   * @param app Main navigation orchestrator (App.ts)
   */
  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.view = new ResultsScreenView();
  }

  /**
   * @return The view object, so App.ts can attach its Konva group to the layer.
   */
  getView(): ResultsScreenView {
    return this.view;
  }

  /** Show the results screen */
  show(): void {
    this.view.show();
  }

  /** Hide the results screen */
  hide(): void {
    this.view.hide();
  }

  /**
   * @brief Pass through resize events to view if it implements onResize().
   *
   * This keeps the Results UI properly centered when screen size changes.
   */
  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }
}
