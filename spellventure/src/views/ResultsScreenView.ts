/**
 * @file ResultsScreenView.ts
 * @brief Minimal placeholder UI for the Results screen.
 *
 * This view is currently a simple text label centered on-screen. It exists so
 * the navigation architecture (index.html → main.ts → App.ts → ResultsScreenController)
 * remains complete even while your team is still designing the final results UI.
 *
 * In the final game, this screen will likely show:
 *   - Completed Mad Lib story
 *   - Total score
 *   - Hearts remaining
 *   - Buttons: "Play Again", "Home", "Try Harder Mode", etc.
 *
 * For now, the view only contains:
 *   - A Konva.Group (root container)
 *   - A placeholder Konva.Text label
 *
 * The controller manages showing/hiding this view, as well as passing resize
 * events so the text stays centered.
 */

import Konva from "konva";

export default class ResultsScreenView {
  /** Root Konva group that holds all UI elements for this screen */
  private group: Konva.Group;

  /**
   * The placeholder text label that appears centered on the screen.
   *
   * NOTE:
   *  - This text is temporary.
   *  - When the real Results screen is implemented, this field will be replaced
   *    by multiple UI elements and/or a layout container.
   */
  private text: Konva.Text;

  /**
   * @brief Constructs the placeholder results screen.
   *
   * Initializes:
   *   - The root group
   *   - A “Results Screen (placeholder)” text label
   *   - Centers the text manually based on the current viewport dimensions
   */
  constructor() {
    this.group = new Konva.Group();

    this.text = new Konva.Text({
      text: "Results Screen (placeholder)",
      fontSize: 32,
      fill: "#333",
      x: window.innerWidth / 2 - 200,  // manual centering — recalculated on resize
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });

    // Add the placeholder text to the root group
    this.group.add(this.text);
  }

  /**
   * @return The root Konva group so App.ts can attach it to the shared layer
   */
  getGroup(): Konva.Group {
    return this.group;
  }

  /**
   * @brief Makes the screen visible.
   *
   * App.ts → ResultsScreenController.show() → this.show()
   */
  show(): void {
    this.group.visible(true);
  }

  /**
   * @brief Hides the screen when navigating away.
   */
  hide(): void {
    this.group.visible(false);
  }

  /**
   * @brief Re-centers the placeholder text when the window resizes.
   *
   * This ensures the UI remains visually centered no matter the device size.
   *
   * @param width  New width of the canvas/stage
   * @param height New height of the canvas/stage
   */
  onResize(width: number, height: number): void {
    // Center horizontally by subtracting half of the text width
    this.text.x(width / 2 - this.text.width() / 2);

    // Center vertically by subtracting half of the text height
    this.text.y(height / 2 - this.text.height() / 2);
  }
}
