/**
 * @file MiniGameController.ts
 * @brief Legacy placeholder mini-game screen. This was originally intended as
 *        the “lose all hearts → earn 1 heart back” screen BEFORE real mini-games
 *        were implemented in /screens/.
 *
 * Today, this class is mostly kept for backward compatibility and for reference
 * in the architecture diagram. The real mini-game flow has been migrated into
 * /screens/GameSelectScreen and /screens/WordsDropGame/.
 *
 * This controller still works but functions as a *static fake mini-game*—
 * letting the player press “Resume” to return to gameplay with +1 heart.
 */

import Konva from "konva";
import { GameState } from "../state/GameState";
import type { ScreenSwitcher } from "../types";

export default class MiniGameController {
  /** Root Konva group representing this mini-game screen */
  private group: Konva.Group;

  /** Reference to App.ts (used for screen switching) */
  private app: ScreenSwitcher;

  /** Global GameState object (legacy — used for heart restore) */
  private state: GameState;

  /**
   * @brief Constructs the placeholder mini-game screen.
   *
   * The “mini-game” is simply a static screen with:
   *  - A title
   *  - A subtitle telling the player they're earning a heart back
   *  - A “Resume” button
   *
   * When the resume button is clicked, +1 heart is granted and the game resumes.
   */
  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.state = GameState.load();
    this.group = new Konva.Group();

    const width = window.innerWidth;
    const height = window.innerHeight;

    // === Title text ===
    const title = new Konva.Text({
      text: "Mini Game – Earn 1 Heart Back!",
      fontSize: 36,
      fill: "#ffffff",
      align: "center",
      width,
      y: height / 3,
    });

    // === Instruction text ===
    const instructions = new Konva.Text({
      text: "Press Resume to continue your adventure.",
      fontSize: 24,
      fill: "#ffcc00",
      align: "center",
      width,
      y: height / 2 - 20,
    });

    // === Resume Button (Rect + Text) ===
    const resumeButton = new Konva.Rect({
      x: width / 2 - 100,
      y: height / 2 + 40,
      width: 200,
      height: 60,
      cornerRadius: 10,
      fill: "#4CAF50",
      shadowColor: "black",
      shadowBlur: 10,
      listening: true,
    });

    const resumeText = new Konva.Text({
      text: "RESUME",
      fontSize: 28,
      fill: "#fff",
      x: width / 2 - 55,
      y: height / 2 + 55,
      listening: true,
    });

    // Add UI pieces to root group
    this.group.add(title);
    this.group.add(instructions);
    this.group.add(resumeButton);
    this.group.add(resumeText);

    // === Click listeners (both text + button register clicks) ===
    resumeButton.on("click", () => this.resumeGame());
    resumeText.on("click", () => this.resumeGame());
  }

  /**
   * @brief Legacy: adds +1 heart to the WordLink health pool and returns to game.
   *
   * NOTE: This system is no longer used by the modern mini-game flow (which
   * returns hearts via App.ts → GameScreenController.addHearts).
   *
   * However, we keep this behavior for completeness when documenting the old
   * architecture.
   */
  private resumeGame() {
    this.state.addWordLinkHealth(1); // Old pre-phase heart tracking
    this.app.switchToScreen({ type: "wordLink" }, true);
  }

  /**
   * @return A wrapper exposing the root Konva group (consistent with framework)
   */
  getView() {
    return { getGroup: () => this.group };
  }

  /** Makes this screen visible */
  show() {
    this.group.visible(true);
  }

  /** Hides this screen */
  hide() {
    this.group.visible(false);
  }
}
