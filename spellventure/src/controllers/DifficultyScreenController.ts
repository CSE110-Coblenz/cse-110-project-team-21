import DifficultyScreenView from "../views/DifficultyScreenView";
import type { ScreenSwitcher } from "../types";
import { GameState } from "../state/GameState";

/**
 * @class DifficultyScreenController
 * @brief Handles logic for selecting a difficulty level and navigating to the game screen.
 *
 * Responsibilities:
 * - Instantiate the DifficultyScreenView.
 * - Register a callback so the view can pass which difficulty was selected.
 * - Persist difficulty inside GameState (global model).
 * - Navigate into the “game” screen when the user chooses a level.
 */
export default class DifficultyScreenController {
  /** View instance that contains Konva UI elements for the difficulty screen. */
  private view: DifficultyScreenView;

  /** Reference to App (via ScreenSwitcher) so we can request screen transitions. */
  private app: ScreenSwitcher;

  /**
   * @brief Constructs controller and wires the difficulty-selection callback.
   *
   * @param app  ScreenSwitcher (App instance) used to request screen transitions.
   */
  constructor(app: ScreenSwitcher) {
    this.app = app;

    // Build the Konva view representing the three difficulty buttons.
    this.view = new DifficultyScreenView();

    // Wire the view → controller callback for when a button is clicked.
    this.view.onDifficultySelected((level) => {
      /**
       * The view passes strings like "easy", "medium", or "hard".
       * We save this into the global GameState object.
       *
       * GameState.load():
       *   - Returns a singleton-like object representing global session state.
       *   - Automatically created the first time it is accessed.
       */
      const state = GameState.load();

      // Store the selected difficulty in the GameState model.
      state.setDifficulty(level as "easy" | "medium" | "hard");

      // Move into the main game screen after choosing difficulty.
      this.app.switchToScreen({ type: "game" });
    });
  }

  /**
   * @brief Returns the view’s Konva group so App.ts can attach it to the main layer.
   *
   * @returns DifficultyScreenView
   */
  getView(): DifficultyScreenView {
    return this.view;
  }

  /**
   * @brief Makes this screen visible (called when App switches to the difficulty screen).
   */
  show(): void {
    this.view.show();
  }

  /**
   * @brief Hides this screen (called when App switches away from difficulty screen).
   */
  hide(): void {
    this.view.hide();
  }
}