/**
 * @file WordLinkView.ts
 * @brief Handles all UI rendering, drawing, and interaction for the Word Link phase.
 *
 * This class contains *no gameplay logic*. Instead, it:
 *   • Draws the word boxes (the empty “_ _ _ _” boxes players fill).
 *   • Draws clickable letter tiles.
 *   • Draws and updates the HUD (score + hearts).
 *   • Draws solved words on the left in a vertical stack (simple grid preview).
 *   • Handles visual feedback (Correct!, Try again!, etc.).
 *   • Registers and triggers event callbacks that the controller listens for.
 *
 * Important separation:
 *   - WordLinkController: Logic, state, correctness, scoring, hearts.
 *   - WordLinkView: Graphics, animations, event wiring.
 *
 * Nothing in this file determines correctness — it only renders and reports clicks.
 */

import Konva from "konva";
import type { PlacedWord } from "../utils/WordGridLayout";

export default class WordLinkView {
  /** Root Konva group containing everything in this screen. */
  private group: Konva.Group;

  /** Rectangles representing each letter box in the current word. */
  private letterBoxes: Konva.Rect[] = [];

  /** Text nodes representing each letter inside those boxes. */
  private letterTexts: Konva.Text[] = [];

  /**
   * Letter tiles (buttons) the player can click.
   * Stored as objects so we can delete the tile AND the char it represents.
   */
  private letterTiles: { tile: Konva.Text; letter: string }[] = [];

  /** HUD area containing score + hearts (drawn at top-left). */
  private hudGroup: Konva.Group = new Konva.Group();

  /** Buttons for Refresh, Submit, and Hint. */
  private submitButton: Konva.Group;
  private refreshButton: Konva.Group;
  private hintButton: Konva.Group;

  /** Event callback handlers. The controller assigns these. */
  private submitHandler: (() => void) | null = null;
  private refreshHandler: (() => void) | null = null;
  private hintHandler: (() => void) | null = null;
  private letterClickHandler: ((letter: string) => void) | null = null;

  /**
   * Tracks which positions in the word are "locked"
   * because they were revealed via hints.
   *
   * Locked boxes:
   *   - Cannot be overwritten by fillNextLetter
   *   - Cannot be cleared during refresh
   */
  private lockedHintIndices: Set<number> = new Set();

  constructor() {
    /** Main group that UI is drawn into. */
    this.group = new Konva.Group();

    // -----------------------------------------------------------------------
    // HUD setup
    // -----------------------------------------------------------------------
    this.drawHUD(0, 3);
    this.group.add(this.hudGroup);

    // -----------------------------------------------------------------------
    // Buttons setup
    // -----------------------------------------------------------------------
    this.refreshButton = this.createButton(
      window.innerWidth / 2 - 230,
      window.innerHeight - 100,
      "#f59e0b",
      "🔄 Refresh"
    );

    this.submitButton = this.createButton(
      window.innerWidth / 2 + 50,
      window.innerHeight - 100,
      "#22c55e",
      "✅ Submit"
    );

    this.hintButton = this.createButton(
      window.innerWidth / 2 - 90,
      window.innerHeight - 180,
      "#3b82f6",
      "💡 Hint"
    );

    this.group.add(this.refreshButton, this.submitButton, this.hintButton);
  }

  // ===========================================================================
  // HUD (Score + Hearts)
  // ===========================================================================

  /**
   * @brief Draws the HUD containing score and hearts.
   * Called on construction AND every time hearts/score change.
   */
  drawHUD(score: number, hearts: number): void {
    /**
     * Destroy existing HUD children to redraw from scratch.
     * HUD is simple, so full redraw is easiest and cleanest.
     */
    this.hudGroup.destroyChildren();

    const totalHearts = 3; // Always 3 in Word Link
    const heartIcons =
      "❤️".repeat(hearts) + "🤍".repeat(totalHearts - hearts);

    const scoreText = new Konva.Text({
      text: `Score: ${score}`,
      x: 30,
      y: 70,
      fontSize: 26,
      fill: "#222",
      fontStyle: "bold",
    });

    const heartsText = new Konva.Text({
      text: heartIcons,
      x: 200,
      y: 72,
      fontSize: 26,
    });

    this.hudGroup.add(scoreText, heartsText);
    this.group.add(this.hudGroup);
    this.group.getLayer()?.batchDraw();
  }

  /** Lightweight helper for updating only. */
  updateHUD(score: number, hearts: number): void {
    this.drawHUD(score, hearts);
  }

  // ===========================================================================
  // Button creation (Submit, Refresh, Hint)
  // ===========================================================================

  /**
   * @brief Creates a generic button (rectangle + centered label).
   */
  private createButton(
    x: number,
    y: number,
    color: string,
    text: string
  ): Konva.Group {
    const buttonGroup = new Konva.Group();

    const button = new Konva.Rect({
      x,
      y,
      width: 180,
      height: 60,
      fill: color,
      cornerRadius: 12,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 8,
      listening: true,
    });

    const label = new Konva.Text({
      text,
      x,
      y: y + 18,
      width: 180,
      align: "center",
      fontSize: 22,
      fill: "#fff",
      fontStyle: "bold",
      listening: false, // Text shouldn't intercept clicks
    });

    buttonGroup.add(button, label);
    buttonGroup.listening(true);
    this.group.add(buttonGroup);

    // Clicking button triggers correct handler, depending on text
    button.on("click tap", () => {
      if (text.includes("Refresh")) this.refreshHandler?.();
      else if (text.includes("Submit")) this.submitHandler?.();
      else if (text.includes("Hint")) this.hintHandler?.();
    });

    return buttonGroup;
  }

  // ===========================================================================
  // Word Boxes (the main target word UI)
  // ===========================================================================

  /**
   * @brief Draws a fresh row of empty boxes for the new word.
   *
   * @param firstLetter The fixed first letter of the word (always visible).
   * @param length      Total length of the target word.
   */
  drawWordBoxes(firstLetter: string, length: number): void {
    // Remove previous word boxes entirely
    this.letterBoxes.forEach((b) => b.destroy());
    this.letterTexts.forEach((t) => t.destroy());

    this.letterBoxes = [];
    this.letterTexts = [];
    this.lockedHintIndices.clear();

    // Center the boxes horizontally
    const startX = window.innerWidth / 2 - (length * 50) / 2;
    const y = window.innerHeight / 2 - 60;

    for (let i = 0; i < length; i++) {
      // Background box
      const box = new Konva.Rect({
        x: startX + i * 50,
        y,
        width: 40,
        height: 40,
        stroke: "#000",
        strokeWidth: 2,
        fill: i === 0 ? "#16a34a" : "#e5e7eb", // First letter = green box
        cornerRadius: 6,
      });

      // Foreground letter
      const text = new Konva.Text({
        text: i === 0 ? firstLetter.toUpperCase() : "",
        x: box.x(),
        y: box.y() + 8,
        width: 40,
        align: "center",
        fontSize: 26,
        fill: i === 0 ? "#fff" : "#111",
      });

      this.letterBoxes.push(box);
      this.letterTexts.push(text);

      this.group.add(box, text);
    }

    this.group.getLayer()?.batchDraw();
  }

  // ===========================================================================
  // Letter Tiles (player clickable options)
  // ===========================================================================

  /**
   * @brief Draws clickable letter tiles for the player to select from.
   *
   * These represent the shuffled letters of the target word (minus the first).
   */
  drawLetterTiles(letters: string[]): void {
    // Destroy old tiles
    this.letterTiles.forEach(({ tile }) => tile.destroy());
    this.letterTiles = [];

    const startY = window.innerHeight - 250;
    const startX = window.innerWidth / 2 - (letters.length * 60) / 2;
    const spacing = 70;

    letters.forEach((char, i) => {
      const tile = new Konva.Text({
        text: char.toUpperCase(),
        x: startX + i * spacing,
        y: startY,
        fontSize: 32,
        fill: "#4f46e5",
        fontStyle: "bold",
        shadowColor: "rgba(0,0,0,0.25)",
        shadowBlur: 3,
        listening: true,
      });

      // Clicking tile → notify controller with lowercase letter
      tile.on("click tap", () => {
        this.letterClickHandler?.(char.toLowerCase());
      });

      this.letterTiles.push({ tile, letter: char });
      this.group.add(tile);
    });

    this.group.getLayer()?.batchDraw();
  }

  /**
   * @brief Removes one tile from the bottom tile bank.
   *
   * Called when:
   *   • Player uses the tile
   *   • A hint reveals that letter
   */
  removeLetterTile(letter: string): void {
    const index = this.letterTiles.findIndex((t) => t.letter === letter);

    if (index >= 0) {
      this.letterTiles[index].tile.destroy();
      this.letterTiles.splice(index, 1);
      this.group.getLayer()?.batchDraw();
    }
  }

  // ===========================================================================
  // Filling / Clearing / Revealing letters
  // ===========================================================================

  /**
   * @brief Fills the *next available* (unlocked) box with the chosen letter.
   */
  fillNextLetter(letter: string): void {
    for (let i = 1; i < this.letterTexts.length; i++) {
      if (this.lockedHintIndices.has(i)) continue;
      if (this.letterTexts[i].text() === "") {
        this.letterTexts[i].text(letter.toUpperCase());
        this.group.getLayer()?.batchDraw();
        return;
      }
    }
  }

  /**
   * @brief Clears all non-hinted boxes.
   * Used when pressing Refresh.
   */
  clearCurrentWord(): void {
    for (let i = 1; i < this.letterTexts.length; i++) {
      if (!this.lockedHintIndices.has(i)) {
        this.letterTexts[i].text("");
      }
    }
    this.group.getLayer()?.batchDraw();
  }

  /**
   * @brief Reveals a letter permanently (used by hint system).
   *
   * @param index  Position in the word (1..len-1)
   * @param letter Letter to reveal
   */
  revealLetter(index: number, letter: string): void {
    if (index >= 1 && index < this.letterTexts.length) {
      this.letterTexts[index].text(letter.toUpperCase());
      this.letterTexts[index].fill("#1e3a8a"); // blue highlight
      this.lockedHintIndices.add(index);
      this.group.getLayer()?.batchDraw();
    }
  }

  // ===========================================================================
  // Feedback messages (Correct!, Wrong!, etc.)
  // ===========================================================================

  /**
   * @brief Displays a temporary message in the center of the screen.
   *
   * Used for:
   *   • Correct!
   *   • Try again!
   *   • No more hints!
   */
  flashFeedback(type: string): void {
    let msg = "";
    let color = "";

    if (type === "correct") {
      msg = "✅ Correct!";
      color = "#22c55e";
    } else if (type === "wrong") {
      msg = "❌ Try again!";
      color = "#ef4444";
    } else if (type.includes("hint")) {
      msg = "⚠️ No more hints!";
      color = "#3b82f6";
    } else {
      msg = type;
      color = "#facc15"; // yellow fallback
    }

    const text = new Konva.Text({
      text: msg,
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 - 150,
      width: 200,
      align: "center",
      fontSize: 26,
      fill: color,
      fontStyle: "bold",
    });

    this.group.add(text);
    this.group.getLayer()?.batchDraw();

    setTimeout(() => {
      text.destroy();
      this.group.getLayer()?.batchDraw();
    }, 1200);
  }

  // ===========================================================================
  // Grid building (left-side solved word list)
  // ===========================================================================

  /**
   * @brief Draws a minimal preview grid for crossword-based chaining.
   *
   * NOTE: This is *not* the full crossword — just a visual list of solved words.
   */
  drawGridPreview(placedWords: PlacedWord[]): void {
    const gridGroup = new Konva.Group();

    placedWords.forEach((pw) => {
      pw.letters.forEach((l) => {
        const rect = new Konva.Rect({
          x: 100 + l.x * 40,
          y: 100 + l.y * 40,
          width: 38,
          height: 38,
          stroke: "#ccc",
          cornerRadius: 4,
        });

        const txt = new Konva.Text({
          x: 100 + l.x * 40,
          y: 100 + l.y * 40 + 6,
          width: 38,
          height: 38,
          text: l.char.toUpperCase(),
          align: "center",
          verticalAlign: "middle",
          fontSize: 20,
          fill: "#555",
        });

        gridGroup.add(rect, txt);
      });
    });

    this.group.add(gridGroup);
    this.group.getLayer()?.batchDraw();
  }

  /**
   * @brief Adds a solved word into the left column, stacked vertically.
   *
   * Simple visual reinforcement: as players solve words, they appear here.
   */
  addWordToGrid(placedWord: PlacedWord): void {
    // Keep a persistent counter so each solved word appears lower.
    if (!(this as any)._solvedCount) (this as any)._solvedCount = 0;
    const solvedCount = (this as any)._solvedCount++;

    const gridGroup = new Konva.Group();

    const baseX = 100; // fixed margin
    const baseY = 120 + solvedCount * 50;

    placedWord.word.split("").forEach((char, i) => {
      const rect = new Konva.Rect({
        x: baseX + i * 35,
        y: baseY,
        width: 34,
        height: 34,
        fill: "#f3f4f6",
        stroke: "#000",
        strokeWidth: 1,
        cornerRadius: 4,
      });

      const text = new Konva.Text({
        text: char.toUpperCase(),
        x: rect.x(),
        y: rect.y() + 4,
        width: 34,
        align: "center",
        fontSize: 20,
        fill: "#111",
      });

      gridGroup.add(rect, text);
    });

    this.group.add(gridGroup);
    this.group.getLayer()?.batchDraw();
  }

  // ===========================================================================
  // Helpers for the controller
  // ===========================================================================

  /** Returns a string of the letters currently shown in the boxes. */
  getVisibleWord(): string {
    return this.letterTexts.map((t) => t.text()).join("");
  }

  /** Returns letters that were revealed by hints (used by refresh logic). */
  getHintedLetters(): string[] {
    const letters: string[] = [];
    this.lockedHintIndices.forEach((index) => {
      if (this.letterTexts[index]) {
        letters.push(this.letterTexts[index].text().toLowerCase());
      }
    });
    return letters;
  }

  // ===========================================================================
  // Controller Event Registration
  // ===========================================================================

  onSubmitClicked(cb: () => void) {
    this.submitHandler = cb;
  }

  onRefreshClicked(cb: () => void) {
    this.refreshHandler = cb;
  }

  onHintClicked(cb: () => void) {
    this.hintHandler = cb;
  }

  onLetterClicked(cb: (letter: string) => void) {
    this.letterClickHandler = cb;
  }

  /** Exposes the root Konva group so the controller can attach this view. */
  getGroup(): Konva.Group {
    return this.group;
  }
}
