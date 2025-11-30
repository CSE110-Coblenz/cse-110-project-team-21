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
  
  /** allow external set/add hearts (rarely used) */
  addHearts(n: number) {
    (this.view as any).addHearts?.(n);
  }

  setHearts(n: number) {
    (this.view as any).setHearts?.(n);
  }

  /**
   * @param app        the App controller
   * @param story      template string with [type] placeholders
   * @param wordSet    list of { word, type } from WordLink phase
   */
  constructor(app: ScreenSwitcher, story: string, wordSet: { word: string; type: string }[]) {
    this.app = app;

    // build MadLib UI
    this.view = new MadLibPhaseView(story, wordSet);

    // when blanks are filled one-by-one
    this.view.onBlankFilled(() => {
      if (this.view.allBlanksFilled()) {
        console.log("🎉 All blanks filled (via typing). Showing Congrats animation...");
        this.view.showCongratsAnimation(() => {
          this.app.switchToScreen({ type: "difficulty" });
        });
      }
    });

    // when user clicks a word in the bank
    this.view.onWordClicked((word, type) => {
      const filled = this.view.fillNextBlank(word, type);

      if (filled && this.view.allBlanksFilled()) {
        console.log("🎉 All blanks filled (via clicking). Showing Congrats animation...");
        this.view.showCongratsAnimation(() => {
          this.app.switchToScreen({ type: "difficulty" });
        });
      }
    });
  }

  /** Return the Konva group */
  getView() {
    return { getGroup: () => this.view.getGroup() };
  }
}
