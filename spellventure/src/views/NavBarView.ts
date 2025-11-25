/**
 * @file NavBarView.ts
 * @brief Visual component for the global navigation bar at the top of the screen.
 *
 * This view renders:
 *   - A dark background bar
 *   - Home button ("🏠 Home")
 *   - Back button ("← Back")
 *   - Help button ("❓ Help")
 *   - Sound toggle icon (🔊 / 🔇)
 *
 * The NavBar is a *global* UI element that stays visible on most screens.
 * It emits events upward but never performs navigation logic itself — that is
 * NavBarController’s job.
 */

import Konva from "konva";
import { SoundManager } from "../utils/SoundManager";

const width = window.innerWidth;

export default class NavBarView {
  /** Root container for the entire navbar */
  private group: Konva.Group;

  /** Buttons: rendered as clickable Konva.Text nodes */
  private homeButton: Konva.Text;
  private backButton: Konva.Text;
  private helpButton: Konva.Text;

  /** Background bar */
  private bg: Konva.Rect;

  /** Sound toggle icon (🔊 or 🔇) */
  private soundIcon: Konva.Text;

  /**
   * @brief Builds the navigation bar UI immediately.
   */
  constructor() {
    this.group = new Konva.Group();
    this.build();
  }

  /**
   * @brief Creates all UI nodes and attaches click listeners.
   *
   * Layout details:
   *   - Black semi-transparent bar spans full screen width
   *   - Home + Back are left-aligned
   *   - Help lives on the right edge
   *   - Sound icon appears directly left of the Help button
   */
  private build(): void {
    const barHeight = 60;

    // Background bar
    this.bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: barHeight,
      fill: "#1e1e1e",
      opacity: 0.9,
    });

    // Left-side: Home
    this.homeButton = new Konva.Text({
      text: "🏠 Home",
      fontSize: 20,
      fill: "#ffffff",
      x: 20,
      y: 18,
    });

    // Left-side: Back
    this.backButton = new Konva.Text({
      text: "← Back",
      fontSize: 20,
      fill: "#ffffff",
      x: 130,
      y: 18,
    });

    // Right-side: Help
    this.helpButton = new Konva.Text({
      text: "❓ Help",
      fontSize: 20,
      fill: "#ffffff",
      x: window.innerWidth - 100,  // approximate right alignment
      y: 12,
    });

    // Add base items
    this.group.add(this.bg, this.homeButton, this.backButton, this.helpButton);
    this.group.visible(true);

    // === SOUND ICON ===
    this.soundIcon = new Konva.Text({
      text: SoundManager.isEnabled() ? "🔊" : "🔇",
      fontSize: 20,
      fill: "#e5e7eb",
    });

    // Positioned just left of the help button
    this.soundIcon.x(this.helpButton.x() - 40);
    this.soundIcon.y(this.helpButton.y());

    this.group.add(this.soundIcon);

    // === Event: Toggle sound ===
    this.soundIcon.on("click tap", () => {
      const enabled = SoundManager.toggle();
      this.soundIcon.text(enabled ? "🔊" : "🔇");
      this.soundIcon.getLayer()?.batchDraw();
    });
  }

  /**
   * @return The root group for attaching to the stage/layer.
   */
  getGroup(): Konva.Group {
    return this.group;
  }

  /** Registers home-click callback */
  onHomeClick(handler: () => void): void {
    this.homeButton.on("click tap", handler);
  }

  /** Registers back-click callback */
  onBackClick(handler: () => void): void {
    this.backButton.on("click tap", handler);
  }

  /** Registers help-click callback */
  onHelpClick(handler: () => void): void {
    this.helpButton.on("click tap", handler);
  }

  /** Makes navbar visible */
  show(): void {
    this.group.visible(true);
  }

  /** Hides navbar */
  hide(): void {
    this.group.visible(false);
  }

  /**
   * @brief Resize handler to keep the navbar spanning full screen width.
   * Only adjusts width + help button position.
   */
  onResize(width: number, _height: number): void {
    this.bg.width(width);

    // Keep help button stuck to the right side
    this.helpButton.x(width - 100);

    // Move sound icon along with help button
    this.soundIcon.x(this.helpButton.x() - 40);
  }
}
