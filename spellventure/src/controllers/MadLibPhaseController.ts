/**
 * @file MadLibPhaseController.ts
 * @brief Handles the Mad Libs phase using the story and preselected typed words
 *        passed from the Word Link phase.
 */

import Konva from "konva";
import MadLibPhaseView from "../views/MadLibPhaseView";
import type { ScreenSwitcher } from "../types";

export default class MadLibPhaseController {
  private view: MadLibPhaseView;
  private app: ScreenSwitcher;
  
  /** Expose methods for external controllers to adjust hearts */
  addHearts(n: number) {
    (this.view as any).addHearts?.(n);
  }

  setHearts(n: number) {
    (this.view as any).setHearts?.(n);
  }

  /**
   * @param app        The App controller
   * @param story      The story template string with [type] placeholders
   * @param wordSet    The list of { word, type } pairs chosen in GameScreenController
   */
  constructor(app: ScreenSwitcher, story: string, wordSet: { word: string; type: string }[]) {
    this.app = app;

    // ✅ Build the view with the fixed story + words
    this.view = new MadLibPhaseView(story, wordSet);
    // Register blank filled handler once
    this.view.onBlankFilled(() => {
      if (this.view.allBlanksFilled()) {
        console.log("✅ Story complete! Transitioning to results screen...");
        this.app.switchToScreen({ type: "result" });
      }
    });

    // When the player clicks a word in the word bank
    this.view.onWordClicked((word, type) => {
      const filled = this.view.fillNextBlank(word, type);
      
      // If all blanks filled, go to results
      if (filled && this.view.allBlanksFilled()) {
        console.log("✅ Story complete! Transitioning to results screen...");
        this.app.switchToScreen({ type: "result" });
      }
    });
  }

  /** Returns the visual Konva group for this screen */
  getView() {
    return { getGroup: () => this.view.getGroup() };
  }
}
