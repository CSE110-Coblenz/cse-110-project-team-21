/**
 * @file NavBarController.ts
 * @brief Controller for the top navigation bar (Home, Back, Help, Sound).
 *
 * This controller:
 *   - Creates an instance of NavBarView
 *   - Registers callback handlers for its buttons
 *   - Exposes show/hide + resize functionality
 *
 * The NavBar remains visible across almost all screens and behaves like a
 * global "HUD" element, controlled directly by App.ts. It does not manage any
 * game logic itself — it simply forwards UI events upward into the App.
 */

import NavBarView from "../views/NavBarView";
import type { ScreenSwitcher } from "../types";

export default class NavBarController {
  /** The rendered Konva-based view */
  private view: NavBarView;

  /** Reference back to App.ts so the navbar can call goHome/goBack/openHelp */
  private app: ScreenSwitcher;

  /**
   * @brief Creates the navigation bar and wires button callbacks.
   * @param app The App instance implementing ScreenSwitcher (goHome, goBack, openHelp)
   */
  constructor(app: ScreenSwitcher) {
    this.app = app;

    // Build the visual component
    this.view = new NavBarView();

    // Hook NavBarView's UI events into App.ts navigation functions
    this.view.onHomeClick(() => this.app.goHome());
    this.view.onBackClick(() => this.app.goBack());
    this.view.onHelpClick(() => this.app.openHelp());
  }

  /**
   * @return The underlying NavBarView so App.ts can add it to the shared layer.
   */
  getView(): NavBarView {
    return this.view;
  }

  /**
   * @brief Makes the navbar visible.
   */
  show(): void {
    this.view.show();
  }

  /**
   * @brief Hides the navbar.
   */
  hide(): void {
    this.view.hide();
  }

  /**
   * @brief Supports dynamic repositioning when the window resizes.
   * Called by App.ts → handleResize().
   *
   * @param width  New stage width
   * @param height New stage height (unused)
   */
  onResize(width: number, height: number): void {
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }
}
