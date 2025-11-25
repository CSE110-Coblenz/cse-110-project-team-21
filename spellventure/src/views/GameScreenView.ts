/**
 * @file GameScreenView.ts
 * @brief Placeholder view for the Game Screen (main parent screen).
 *
 * BEFORE WordLink loads, this view just shows “Game Screen (placeholder)”.
 * In normal gameplay, GameScreenController immediately replaces this UI with
 * WordLink or MadLib content, so this is rarely visible.
 */

import Konva from "konva";

/**
 * @class GameScreenView
 * @brief Minimal placeholder view containing a single centered “Game Screen” text.
 *
 * This exists mainly so the controller has a view object to attach,
 * though WordLink/MadLib usually replace it.
 */
export default class GameScreenView {
  /** Root container for the placeholder elements. */
  private group: Konva.Group;

  /** Placeholder text object. */
  private text: Konva.Text;

  constructor() {
    this.group = new Konva.Group();

    this.text = new Konva.Text({
      text: "Game Screen (placeholder)",
      fontSize: 32,
      fill: "#333",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });

    this.group.add(this.text);
  }

  /** Returns the group, used by App.ts. */
  getGroup(): Konva.Group {
    return this.group;
  }

  /** Show the placeholder view. */
  show(): void {
    this.group.visible(true);
  }

  /** Hide the placeholder view. */
  hide(): void {
    this.group.visible(false);
  }

  /**
   * @brief Reposition text when the window size changes.
   *
   * @param width  New viewport width
   * @param height New viewport height
   */
  onResize(width: number, height: number): void {
    this.text.x(width / 2 - this.text.width() / 2);
    this.text.y(height / 2 - this.text.height() / 2);
  }
}