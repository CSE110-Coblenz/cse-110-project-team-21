/**
 * @file types.ts
 * @brief Shared type definitions for Spellventure’s screen-navigation system.
 *
 * This file provides:
 *   - A discriminated union type `Screen` describing every possible screen
 *     the app can navigate to.
 *   - The `ScreenSwitcher` interface implemented by App.ts to allow any
 *     controller (WordLink, MadLib, Results, etc.) to trigger navigation.
 *
 * These types act as the “public API” that all controllers rely on when
 * switching screens. Using strict TypeScript unions avoids invalid states
 * (e.g., navigating to a screen that doesn't exist or missing required fields).
 */

/**
 * @typedef Screen
 * @brief A discriminated union describing every navigable screen in Spellventure.
 *
 * Each screen variant:
 *   - Must include a `type` string literal.
 *   - May include additional fields required by that screen.
 *
 * Controllers call `app.switchToScreen()` with one of these objects.
 */
export type Screen =
  /** Main menu screen — starting point of the game. */
  | { type: "menu" }

  /** Difficulty selection screen (easy / medium / hard). */
  | { type: "difficulty" }

  /**
   * Full game screen controller containing WordLink -> MadLib flow.
   *
   * @param bonusHearts Optional hearts awarded immediately on entering this screen
   *                    (typically from certain mini-games).
   */
  | { type: "game"; bonusHearts?: number }

  /**
   * Mini-game result summary after completing a mini-game.
   *
   * @param score        Score earned inside the mini-game.
   * @param hearts       Hearts remaining at mini-game end.
   * @param bonusHearts  Extra hearts to award the main game upon returning.
   * @param from         Context identifier to know where to resume ("wordLink", etc.).
   */
  | {
      type: "mini_result";
      score: number;
      hearts: number;
      bonusHearts?: number;
      from?: string;
    }

  /** Mini-game selection hub shown when hearts drop to zero. */
  | { type: "miniGameSelect" }

  /** Drag-and-drop interaction screen (early prototype). */
  | { type: "drop" }

  /** Final result screen shown when story is fully completed. */
  | { type: "result" };

/**
 * @interface ScreenSwitcher
 * @brief Shared interface implemented by App.ts to standardize navigation.
 *
 * Any controller (WordLink, MadLib, Menu, Difficulty, Mini-game, etc.) receives
 * a `ScreenSwitcher` reference so it can instruct the app to:
 *   - navigate to a new screen
 *   - go back in navigation history
 *   - return to the main menu
 *   - open or close the help modal
 *
 * This decouples all controllers from the app internals and provides a single
 * navigation API shared across the entire project.
 */
export interface ScreenSwitcher {
  /**
   * @brief Navigate to another screen.
   * @param screen        A valid `Screen` union member.
   * @param pushToHistory If true (default), adds to browser-like back history.
   */
  switchToScreen(screen: Screen, pushToHistory?: boolean): void;

  /** Navigate back to the previous screen (if available). */
  goBack(): void;

  /** Return to the main menu and reset screen history. */
  goHome(): void;

  /** Open the universal help modal. */
  openHelp(): void;

  /** Close the universal help modal. */
  closeHelp(): void;
}
