/**
 * @file HelpModalView.ts
 * @brief Renders the in-game Help modal with a dim overlay, text instructions,
 *        and a close button. Includes full dynamic resizing and clean rebuilding.
 *
 * The Help modal is rendered on its own Konva.Group but not on its own layer.
 * It is toggled visible/hidden by HelpModalController and layered above other UI.
 *
 * Behavior:
 *   - Dim background overlay → blocks main game visually
 *   - Centered white modal with title + instructions
 *   - Close button top-right
 *   - Clicking background ALSO closes modal (user-friendly)
 *
 * Notes on resizing:
 *   - On window resize, the entire modal is rebuilt to maintain proper centering,
 *     sizing, and readability.
 */

import Konva from "konva";

export default class HelpModalView {
  /** Root group containing entire modal + overlay */
  private group: Konva.Group;

  /** Dim background rectangle */
  private background: Konva.Rect;

  /** White modal rectangle */
  private box: Konva.Rect;

  /** Title text ("Welcome to Spellventure!") */
  private title: Konva.Text;

  /** Instructional paragraph text */
  private text: Konva.Text;

  /** "✖" button in the top-right corner */
  private closeButton: Konva.Text;

  /**
   * @brief Creates modal and attaches resize listener.
   *
   * The group starts hidden until HelpModalController.show() makes it visible.
   */
  constructor() {
    // Hidden until App.openHelp() shows it
    this.group = new Konva.Group({ visible: false });

    // Build initial layout
    this.buildModal();

    // Rebuild modal whenever browser window is resized
    window.addEventListener("resize", () => this.rebuild());
  }

  /**
   * @brief Constructs all UI components (overlay, modal box, title, text, close button).
   *
   * This function is called once in constructor AND again whenever resized.
   * All positions use window.innerWidth / innerHeight dynamically.
   */
  private buildModal() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // === Background overlay (semi-transparent black) ===
    // Blocks game from view and catches click → closes modal
    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: "rgba(0,0,0,0.5)",
    });

    // === Modal box dimensions ===
    const modalWidth = Math.min(640, width * 0.9);
    const modalHeight = Math.min(520, height * 0.75);

    // Center the modal (slightly higher vertically for aesthetics)
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2 - 40;

    this.box = new Konva.Rect({
      x: modalX,
      y: modalY,
      width: modalWidth,
      height: modalHeight,
      fill: "#ffffff",
      cornerRadius: 20,
      shadowColor: "black",
      shadowBlur: 20,
      shadowOpacity: 0.25,
    });

    // === Title ("Welcome to Spellventure!") ===
    this.title = new Konva.Text({
      text: "Welcome to Spellventure!",
      fontSize: 34,
      fontFamily: "Arial Black",
      fill: "#1e1e1e",
      x: modalX + 20,
      y: modalY + 25,
      width: modalWidth - 40,
      align: "center",
    });

    // === Description block (game instructions) ===
    this.text = new Konva.Text({
      text: `
How to Play:

• To begin the game, drag the BLUE "PLAY" to the word “PLAY” displayed on screen.
• Choose your difficulty level.

Tips:
• You start with 3 hearts.
• Correct spelling & longer words earn more points.
• You can reopen this Help screen anytime by clicking the "?" icon.
      `,
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#222",
      x: modalX + 40,
      y: modalY + 90,
      width: modalWidth - 80,
      lineHeight: 1.5,
      align: "left",
    });

    // === Close button "✖" in top-right corner ===
    this.closeButton = new Konva.Text({
      text: "✖",
      fontSize: 28,
      fontFamily: "Arial Black",
      fill: "#444",
      x: modalX + modalWidth - 45,
      y: modalY + 20,
      width: 40,
      height: 40,
      align: "center",
    });

    // Build the group fresh
    this.group.removeChildren();
    this.group.add(this.background, this.box, this.title, this.text, this.closeButton);
  }

  /**
   * @brief Fully rebuilds the modal when window resizes.
   *
   * Entire modal is reconstructed to:
   *   - Maintain readability
   *   - Stay centered
   *   - Recompute text wrapping
   *
   * Safe to call because we always wipe group and rebuild cleanly.
   */
  private rebuild() {
    this.group.removeChildren();
    this.buildModal();
    this.group.getLayer()?.batchDraw();
  }

  /**
   * @return The Konva group containing the modal and overlay.
   */
  getGroup(): Konva.Group {
    return this.group;
  }

  /**
   * @brief Registers handler for when modal is closed.
   * Close triggers:
   *   - Clicking the ✖ button
   *   - Clicking outside modal on dim background
   */
  onClose(handler: () => void): void {
    this.closeButton.on("click tap", handler);
    this.background.on("click tap", handler);
  }

  /**
   * @brief Show the modal.
   */
  show(): void {
    this.group.visible(true);
  }

  /**
   * @brief Hide the modal.
   */
  hide(): void {
    this.group.visible(false);
  }
}
