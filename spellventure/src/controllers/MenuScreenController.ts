import MenuScreenView from "../views/MenuScreenView";
import type { ScreenSwitcher } from "../types";

/**
 * @class MenuScreenController
 * @brief Orchestrates the behavior of the menu screen and communicates with the App.
 *
 * Responsibilities:
 * - Owns a MenuScreenView instance.
 * - Tells the view when to show/hide.
 * - Wires the view's intro interaction (dragging "PLAY") to navigation
 *   into the next screen (difficulty selection).
 * - Provides a resize hook so layout stays correct on window resizes.
 */
export default class MenuScreenController {
  /**
   * Underlying Konva-based view for the menu UI (target "PLAY" and draggable "PLAY").
   * The controller never draws directly – it always delegates to this view.
   */
  private view: MenuScreenView;

  /**
   * Reference to the higher-level screen switcher (the App).
   * The controller calls this to navigate to other screens (e.g., difficulty screen).
   */
  private app: ScreenSwitcher;

  /**
   * @brief Constructs the controller and creates its view.
   *
   * @param app A ScreenSwitcher (usually the App instance) that the controller uses
   *            to request navigation to other screens (e.g. difficulty screen).
   */
  constructor(app: ScreenSwitcher) {
    // Store reference to the App so the menu can trigger navigation when "PLAY" is completed.
    this.app = app;

    // Create the visual representation of the menu (Konva nodes for "PLAY" UI).
    this.view = new MenuScreenView();
  }

  /**
   * @brief Returns the underlying view.
   *
   * App.ts uses this to grab the Konva.Group and add it to the main layer.
   *
   * @returns The MenuScreenView associated with this controller.
   */
  getView(): MenuScreenView {
    return this.view;
  }

  /**
   * @brief Starts the "drag the PLAY word into the outline" intro interaction.
   *
   * Behavior:
   * - Resets the draggable "PLAY" text to its starting position and color.
   * - Attaches a dragend handler on the draggable word.
   * - When user drags "PLAY" close enough to the target outline, the word snaps
   *   into place, animates briefly, and then calls `onComplete()`.
   *
   * Here, `onComplete` is wired to switch to the difficulty screen.
   */
  startPlayIntro(): void {
    this.view.startPlayIntro(() => {
      // When the intro interaction finishes, navigate to the difficulty screen.
      this.app.switchToScreen({ type: "difficulty" });
    });
  }

  /**
   * @brief Shows the menu screen.
   *
   * This toggles visibility of the underlying Konva group to true.
   * Called when App.ts switches to the menu screen.
   */
  show(): void {
    this.view.show();
  }

  /**
   * @brief Hides the menu screen.
   *
   * This toggles visibility of the underlying Konva group to false.
   * Called when App.ts switches away from the menu screen.
   */
  hide(): void {
    this.view.hide();
  }

  /**
   * @brief Responds to stage resize events so the menu layout stays centered.
   *
   * App.ts calls this from its `handleResize()` method, passing the new width/height.
   * The view uses this to recalculate positions of the target and draggable "PLAY" text.
   *
   * @param width  New width of the Konva stage / container.
   * @param height New height of the Konva stage / container.
   */
  onResize(width: number, height: number): void {
    // Only call view.onResize if it exists (for safety / future refactors).
    if (typeof (this.view as any).onResize === "function") {
      (this.view as any).onResize(width, height);
    }
  }

  /**
   * @brief Resets the interactive "PLAY" word to its initial position and color.
   *
   * This is used when returning to the menu from other screens so the intro
   * mechanic feels "fresh" again (drag from bottom → up to target outline).
   */
  reset(): void {
    this.view.resetPlayPosition();
  }
}