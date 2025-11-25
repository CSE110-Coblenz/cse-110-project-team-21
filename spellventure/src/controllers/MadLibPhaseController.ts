/**
 * @file MadLibPhaseController.ts
 * @brief Controls the entire Mad Libs phase.
 *
 * This controller:
 *   - Receives the finished story template and the completed wordSet
 *     generated in GameScreenController.
 *   - Owns the MadLibPhaseView, which renders the UI (story text,
 *     clickable blanks, word bank).
 *   - Handles user interactions such as selecting words for blanks.
 *   - Detects when the story is fully completed and transitions to
 *     the result screen.
 *
 * IMPORTANT:
 *   - The view handles all rendering and layout logic.
 *   - The controller handles only flow and navigation.
 *   - Hearts are forwarded to the view (the view is responsible
 *     for tracking the actual numeric heart count and showing HUD).
 */

import Konva from "konva";
import MadLibPhaseView from "../views/MadLibPhaseView";
import type { ScreenSwitcher } from "../types";

export default class MadLibPhaseController {
  /** View that displays the story, blanks, and word bank. */
  private view: MadLibPhaseView;

  /** App reference, so this phase can request navigation. */
  private app: ScreenSwitcher;

  // ===========================================================================
  // Heart manipulation API
  // ===========================================================================
  /**
   * @brief Add hearts to the MadLib view (used when returning from mini-game).
   *
   * The App and GameScreenController call this method after the user
   * completes a mini-game and earns bonus hearts. The controller itself
   * does NOT store hearts — the view stores and displays them.
   */
  addHearts(n: number) {
    (this.view as any).addHearts?.(n);
  }

  /**
   * @brief Sets hearts directly (used when resuming).
   * 
   * This is needed because the App may restore hearts from sessionStorage
   * when the user leaves WordLink or MadLib to play a mini-game and returns.
   */
  setHearts(n: number) {
    (this.view as any).setHearts?.(n);
  }

  // ===========================================================================
  // Constructor — builds the entire Mad Libs phase
  // ===========================================================================
  /**
   * @param app     Global ScreenSwitcher (App.ts)
   * @param story   The story template string containing placeholders like `[noun]`
   * @param wordSet The selected words from WordLink, e.g. [{word:"pizza", type:"food"}]
   *
   * The controller creates its view and registers the event handlers for:
   *   - Filling a blank when the user selects a word
   *   - Detecting when all blanks are filled
   */
  constructor(
    app: ScreenSwitcher,
    story: string,
    wordSet: { word: string; type: string }[]
  ) {
    this.app = app;

    /**
     * The view:
     *   - Parses the story for `[type]` placeholders
     *   - Displays a line of story text with clickable blanks
     *   - Displays a word bank where each word only matches its category
     */
    this.view = new MadLibPhaseView(story, wordSet);

    // -----------------------------------------------------------------------
    // Event: A blank was filled
    // -----------------------------------------------------------------------
    /**
     * View calls this whenever *any* blank is filled.
     * We check if ALL blanks are filled, and if so, navigate to results.
     */
    this.view.onBlankFilled(() => {
      if (this.view.allBlanksFilled()) {
        console.log("✅ Story complete! Transitioning to results screen...");
        this.app.switchToScreen({ type: "result" });
      }
    });

    // -----------------------------------------------------------------------
    // Event: User clicked a word in the bank
    // -----------------------------------------------------------------------
    /**
     * Clicking a word attempts to fill the next available matching blank.
     * 
     * `fillNextBlank(word, type)` returns:
     *    - true  → success (word was placed)
     *    - false → no matching blank available
     */
    this.view.onWordClicked((word, type) => {
      const filled = this.view.fillNextBlank(word, type);

      // If a word was placed AND every blank is now filled → go to results
      if (filled && this.view.allBlanksFilled()) {
        console.log("✅ Story complete! Transitioning to results screen...");
        this.app.switchToScreen({ type: "result" });
      }
    });
  }

  // ===========================================================================
  // View exposure for App.ts (Konva requires direct group access)
  // ===========================================================================
  /**
   * @brief Returns wrapper exposing the Konva group for this screen.
   * 
   * App.ts uses this so it can layer.add(controller.getView().getGroup()).
   */
  getView() {
    return { getGroup: () => this.view.getGroup() };
  }
}
