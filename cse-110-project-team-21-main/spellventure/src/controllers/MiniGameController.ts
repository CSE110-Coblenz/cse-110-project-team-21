/**
 * @file MiniGameController.ts
 * @brief Placeholder mini-game screen that appears when the player loses all hearts.
 *
 * Future versions can replace this placeholder with an interactive challenge.
 */

import Konva from "konva";
import { GameState } from "../state/GameState";
import type { ScreenSwitcher } from "../types";

export default class MiniGameController {
  private group: Konva.Group;
  private app: ScreenSwitcher;
  private state: GameState;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.state = GameState.load();
    this.group = new Konva.Group();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Title text
    const title = new Konva.Text({
      text: "Mini Game – Earn 1 Heart Back!",
      fontSize: 36,
      fill: "#ffffff",
      align: "center",
      width,
      y: height / 3,
    });

    // Instruction text
    const instructions = new Konva.Text({
      text: "Press Resume to continue your adventure.",
      fontSize: 24,
      fill: "#ffcc00",
      align: "center",
      width,
      y: height / 2 - 20,
    });

    // Resume button
    const resumeButton = new Konva.Rect({
      x: width / 2 - 100,
      y: height / 2 + 40,
      width: 200,
      height: 60,
      cornerRadius: 10,
      fill: "#4CAF50",
      shadowColor: "black",
      shadowBlur: 10,
    });

    const resumeText = new Konva.Text({
      text: "RESUME",
      fontSize: 28,
      fill: "#fff",
      x: width / 2 - 55,
      y: height / 2 + 55,
    });

    // Add to group
    this.group.add(title);
    this.group.add(instructions);
    this.group.add(resumeButton);
    this.group.add(resumeText);

    // Click listener
    resumeButton.on("click", () => this.resumeGame());
    resumeText.on("click", () => this.resumeGame());
  }

  /**
   * @brief Adds one heart and switches back to the WordLink game.
   */
  private resumeGame() {
    this.state.addWordLinkHealth(1);
    this.app.switchToScreen({ type: "wordLink" }, true);
  }

  /**
   * @brief Returns the main Konva group for this screen.
   */
  getView() {
    return { getGroup: () => this.group };
  }

  show() {
    this.group.visible(true);
  }

  hide() {
    this.group.visible(false);
  }
}
