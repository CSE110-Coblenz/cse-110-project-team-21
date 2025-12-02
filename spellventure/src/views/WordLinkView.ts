/**
 * @file WordLinkView.ts
 * @brief Handles UI rendering and interaction for the Word Link gameplay.
 */

import Konva from "konva";
import type { PlacedWord } from "../utils/WordGridLayout";

export default class WordLinkView {
  private group: Konva.Group;
  private letterBoxes: Konva.Rect[] = [];
  private letterTexts: Konva.Text[] = [];
  private letterTiles: { tile: Konva.Text; letter: string }[] = [];
  private hudGroup: Konva.Group = new Konva.Group();

  private submitButton: Konva.Group;
  private refreshButton: Konva.Group;
  private hintButton: Konva.Group;

  private submitHandler: (() => void) | null = null;
  private refreshHandler: (() => void) | null = null;
  private hintHandler: (() => void) | null = null;
  private letterClickHandler: ((letter: string) => void) | null = null;
  private boxClickHandler: ((index: number) => void) | null = null;

  // Tracks which boxes are permanent (revealed via hints)
  private lockedHintIndices: Set<number> = new Set();

  constructor() {
    this.group = new Konva.Group();

    // === HUD ===
    this.drawHUD(0, 3);
    this.group.add(this.hudGroup);

    // === Buttons ===
    this.refreshButton = this.createButton(
      window.innerWidth / 2 - 230,
      window.innerHeight - 100,
      "#facc15",
      "🔄 Refresh"
    );
    this.submitButton = this.createButton(
      window.innerWidth / 2 + 50,
      window.innerHeight - 100,
      "#4ade80",
      "✅ Submit"
    );
    this.hintButton = this.createButton(
      window.innerWidth / 2 - 90,
      window.innerHeight - 180,
      "#93c5fd",
      "💡 Hint"
    );

    this.group.add(this.refreshButton, this.submitButton, this.hintButton);
  }

  /** === HUD === */
  drawHUD(score: number, hearts: number): void {
    this.hudGroup.destroyChildren();

    const totalHearts = 3;
    const heartIcons = "❤️".repeat(hearts) + "🤍".repeat(totalHearts - hearts);

    const hudY = 80; // just under NavBar

    const scoreText = new Konva.Text({
      text: `Score: ${score}`,
      x: 30,
      y: hudY,
      fontSize: 26,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#111827",
      fontStyle: "bold",
    });

    const heartsText = new Konva.Text({
      text: heartIcons,
      x: 200,
      y: hudY + 2,
      fontSize: 26,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#ef4444",
    });

    this.hudGroup.add(scoreText, heartsText);
    this.group.add(this.hudGroup);
    this.group.getLayer()?.batchDraw();
  }

  updateHUD(score: number, hearts: number): void {
    this.drawHUD(score, hearts);
  }

  /** === Buttons === */
  private createButton(x: number, y: number, color: string, text: string): Konva.Group {
    const buttonGroup = new Konva.Group();

    const button = new Konva.Rect({
      x,
      y,
      width: 180,
      height: 60,
      fill: color,
      cornerRadius: 18,
      shadowColor: "rgba(15,23,42,0.25)",
      shadowBlur: 10,
      shadowOffsetY: 4,
      listening: true,
    });

    const label = new Konva.Text({
      text,
      x,
      y: y + 18,
      width: 180,
      align: "center",
      fontSize: 22,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#111827",
      fontStyle: "bold",
      listening: false,
    });

    buttonGroup.add(button, label);
    buttonGroup.listening(true);
    this.group.add(buttonGroup);

    // Gentle hover animation
    buttonGroup.on("mouseenter", () => {
      document.body.style.cursor = "pointer";
      buttonGroup.to({
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 0.1,
      });
      this.group.getLayer()?.batchDraw();
    });

    buttonGroup.on("mouseleave", () => {
      document.body.style.cursor = "default";
      buttonGroup.to({
        scaleX: 1,
        scaleY: 1,
        duration: 0.1,
      });
      this.group.getLayer()?.batchDraw();
    });

    button.on("click tap", () => {
      if (text.includes("Refresh")) this.refreshHandler?.();
      else if (text.includes("Submit")) this.submitHandler?.();
      else if (text.includes("Hint")) this.hintHandler?.();
    });

    return buttonGroup;
  }

  /** === Word Boxes === */
  drawWordBoxes(firstLetter: string, length: number): void {
    this.letterBoxes.forEach((b) => b.destroy());
    this.letterTexts.forEach((t) => t.destroy());
    this.letterBoxes = [];
    this.letterTexts = [];
    this.lockedHintIndices.clear();

    const startX = window.innerWidth / 2 - (length * 50) / 2;
    const y = window.innerHeight / 2 - 60;

    for (let i = 0; i < length; i++) {
      const box = new Konva.Rect({
        x: startX + i * 50,
        y,
        width: 40,
        height: 40,
        stroke: i === 0 ? "#22c55e" : "#a5b4fc",
        strokeWidth: 2,
        fill: i === 0 ? "#4ade80" : "#e5e7eb",
        cornerRadius: 8,
        listening: i !== 0,
      });

      const text = new Konva.Text({
        text: i === 0 ? firstLetter.toUpperCase() : "",
        x: box.x(),
        y: box.y() + 6,
        width: 40,
        align: "center",
        fontSize: 26,
        fontFamily: "Comic Sans MS, system-ui, sans-serif",
        fill: i === 0 ? "#ffffff" : "#111827",
        listening: false,
      });

      if (i !== 0) {
        const index = i;
        box.on("click tap", () => {
          if (this.boxClickHandler) this.boxClickHandler(index);
        });

        box.on("mouseenter", () => {
          document.body.style.cursor = "pointer";
          box.to({
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 0.08,
          });
          this.group.getLayer()?.batchDraw();
        });

        box.on("mouseleave", () => {
          document.body.style.cursor = "default";
          box.to({
            scaleX: 1,
            scaleY: 1,
            duration: 0.08,
          });
          this.group.getLayer()?.batchDraw();
        });
      }

      this.letterBoxes.push(box);
      this.letterTexts.push(text);
      this.group.add(box, text);
    }

    this.group.getLayer()?.batchDraw();
  }

  /** Draws clickable letter tiles for the current word */
  drawLetterTiles(letters: string[]): void {
    this.letterTiles.forEach(({ tile }) => tile.destroy());
    this.letterTiles = [];

    const startY = window.innerHeight - 250;
    const startX = window.innerWidth / 2 - (letters.length * 60) / 2;
    const spacing = 70;

    letters.forEach((char, i) => {
      this.createSingleTile(char, startX + i * spacing, startY);
    });

    this.group.getLayer()?.batchDraw();
  }

  // Helper to create a tile (refactored for reuse)
  private createSingleTile(char: string, x: number, y: number) {
    const tile = new Konva.Text({
      text: char.toUpperCase(),
      x,
      y,
      fontSize: 32,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#4f46e5",
      fontStyle: "bold",
      shadowColor: "rgba(0,0,0,0.2)",
      shadowBlur: 4,
      listening: true,
    });

    tile.on("mouseenter", () => {
      document.body.style.cursor = "pointer";
      tile.to({
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 0.08,
      });
      this.group.getLayer()?.batchDraw();
    });

    tile.on("mouseleave", () => {
      document.body.style.cursor = "default";
      tile.to({
        scaleX: 1,
        scaleY: 1,
        duration: 0.08,
      });
      this.group.getLayer()?.batchDraw();
    });

    tile.on("click tap", () => {
      if (this.letterClickHandler) {
        this.letterClickHandler(char.toLowerCase());
      }
    });

    this.letterTiles.push({ tile, letter: char });
    this.group.add(tile);
  }

  /** Returns a letter to the bank visually */
  addLetterToBank(letter: string): void {
    const startY = window.innerHeight - 250;

    const spacing = 70;
    let nextX = window.innerWidth / 2;

    if (this.letterTiles.length > 0) {
      const lastTile = this.letterTiles[this.letterTiles.length - 1].tile;
      nextX = lastTile.x() + spacing;
    } else {
      nextX = window.innerWidth / 2;
    }

    this.createSingleTile(letter, nextX, startY);

    this.group.getLayer()?.batchDraw();
  }

  /** Clears a specific box by index */
  clearLetterAtIndex(index: number): void {
    if (index > 0 && index < this.letterTexts.length) {
      this.letterTexts[index].text("");
      this.group.getLayer()?.batchDraw();
    }
  }

  /** Removes a tile from the letter bank once used or hinted */
  removeLetterTile(letter: string): void {
    const index = this.letterTiles.findIndex((t) => t.letter === letter);
    if (index >= 0) {
      this.letterTiles[index].tile.destroy();
      this.letterTiles.splice(index, 1);
      this.group.getLayer()?.batchDraw();
    }
  }

  /** Fills the next available box (unless it’s a locked hint) */
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

  clearCurrentWord(): void {
    for (let i = 1; i < this.letterTexts.length; i++) {
      if (!this.lockedHintIndices.has(i)) this.letterTexts[i].text("");
    }
    this.group.getLayer()?.batchDraw();
  }

  revealLetter(index: number, letter: string): void {
    if (index >= 1 && index < this.letterTexts.length) {
      this.letterTexts[index].text(letter.toUpperCase());
      this.letterTexts[index].fill("#1e3a8a");
      this.lockedHintIndices.add(index);
      this.group.getLayer()?.batchDraw();
    }
  }

  /** Flash temporary feedback */
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
      color = "#facc15";
    }

    const text = new Konva.Text({
      text: msg,
      x: window.innerWidth / 2 - 120,
      y: window.innerHeight / 2 - 160,
      width: 240,
      align: "center",
      fontSize: 26,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
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

  /** === Grid Preview (for visual chaining layout) === */
  drawGridPreview(placedWords: PlacedWord[]): void {
    const gridGroup = new Konva.Group();

    placedWords.forEach((pw) => {
      pw.letters.forEach((l) => {
        const rect = new Konva.Rect({
          x: 100 + l.x * 40,
          y: 120 + l.y * 40,
          width: 38,
          height: 38,
          stroke: "#e5e7eb",
          fill: "#f9fafb",
          cornerRadius: 6,
        });
        const txt = new Konva.Text({
          x: 100 + l.x * 40,
          y: 120 + l.y * 40 + 6,
          width: 38,
          height: 38,
          text: l.char.toUpperCase(),
          align: "center",
          verticalAlign: "middle",
          fontSize: 20,
          fontFamily: "Comic Sans MS, system-ui, sans-serif",
          fill: "#374151",
        });
        gridGroup.add(rect, txt);
      });
    });

    this.group.add(gridGroup);
    this.group.getLayer()?.batchDraw();
  }

  /** Adds a solved word onto a clean vertical column on the left side */
  addWordToGrid(placedWord: PlacedWord): void {
    if (!(this as any)._solvedCount) (this as any)._solvedCount = 0;
    const solvedCount = (this as any)._solvedCount++;

    const gridGroup = new Konva.Group();

    const baseX = 100;
    const baseY = 140 + solvedCount * 50;

    placedWord.word.split("").forEach((char, i) => {
      const rect = new Konva.Rect({
        x: baseX + i * 35,
        y: baseY,
        width: 34,
        height: 34,
        fill: "#e5e7eb",
        stroke: "#9ca3af",
        strokeWidth: 1,
        cornerRadius: 6,
      });

      const text = new Konva.Text({
        text: char.toUpperCase(),
        x: rect.x(),
        y: rect.y() + 4,
        width: 34,
        align: "center",
        fontSize: 20,
        fontFamily: "Comic Sans MS, system-ui, sans-serif",
        fill: "#111827",
      });

      gridGroup.add(rect, text);
    });

    this.group.add(gridGroup);
    this.group.getLayer()?.batchDraw();
  }

  /** Returns the visible letters currently filled in boxes */
  getVisibleWord(): string {
    return this.letterTexts.map((t) => t.text()).join("");
  }

  getHintedLetters(): string[] {
    const letters: string[] = [];
    this.lockedHintIndices.forEach((index) => {
      if (this.letterTexts[index]) {
        letters.push(this.letterTexts[index].text().toLowerCase());
      }
    });
    return letters;
  }

  isLockedHint(index: number): boolean {
    return this.lockedHintIndices.has(index);
  }

  // === Event registration ===
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
  onBoxClicked(cb: (index: number) => void) {
    this.boxClickHandler = cb;
  }

  /** Returns the Konva group for the game layer */
  getGroup(): Konva.Group {
    return this.group;
  }
}
