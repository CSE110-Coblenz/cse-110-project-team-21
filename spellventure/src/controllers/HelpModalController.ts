/**
 * @file HelpModalController.ts
 * @brief Controller for the Help modal. Handles show/hide and relays user actions
 *        (close → App.closeHelp()) up to App.ts via the ScreenSwitcher interface.
 *
 * The controller:
 *   - Instantiates the HelpModalView
 *   - Wires the view's close events to App.closeHelp()
 *   - Exposes show() / hide() for App to toggle visibility
 *
 * This controller does not render anything itself; it only binds App-level logic
 * to the view's Konva UI.
 */

import HelpModalView from "../views/HelpModalView";
import type { ScreenSwitcher } from "../types";

export default class HelpModalController {
  /** Rendered Konva-based UI */
  private view: HelpModalView;

  /** Reference back to App.ts for navigation + closing logic */
  private app: ScreenSwitcher;

  /**
   * @brief Builds the modal and registers close handlers.
   * @param app The App instance (ScreenSwitcher) that will respond to "close help".
   */
  constructor(app: ScreenSwitcher) {
    this.app = app;

    // Build the UI component
    this.view = new HelpModalView();

    // When the modal emits "close", perform App.closeHelp()
    this.view.onClose(() => this.app.closeHelp());
  }

  /**
   * @return The rendered view so App.ts can add it to the shared Konva layer.
   */
  getView() {
    return this.view;
  }

  /**
   * @brief Makes modal visible. Called by App.openHelp().
   */
  show() {
    this.view.show();
  }

  /**
   * @brief Hides modal. Called by App.closeHelp().
   */
  hide() {
    this.view.hide();
  }
}
