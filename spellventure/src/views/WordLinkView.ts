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
  private letterTiles: { tile: Konva.Group; letter: string }[] = [];
  private hudGroup: Konva.Group = new Konva.Group();

  private submitButton: Konva.Group;
  private refreshButton: Konva.Group;
  private hintButton: Konva.Group;

  private submitHandler: (() => void) | null = null;
  private refreshHandler: (() => void) | null = null;
  private hintHandler: (() => void) | null = null;
  private letterClickHandler: ((letter: string) => void) | null = null;

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

  /** === HUD === */
  drawHUD(score: number, hearts: number): void {
    this.hudGroup.destroyChildren();

    const totalHearts = 3;
    const heartIcons = "❤️".repeat(hearts) + "🤍".repeat(totalHearts - hearts);

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
      cornerRadius: 12,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 8,
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
    });

    buttonGroup.add(button, label);
    this.group.add(buttonGroup);

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
        stroke: "#000",
        strokeWidth: 2,
        fill: i === 0 ? "#16a34a" : "#e5e7eb",
        cornerRadius: 6,
      });

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

/** Draws clickable letter tiles for the current word */
drawLetterTiles(letters: string[]): void {
  // Remove previous tiles cleanly
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
      listening: true, // ensure Konva registers clicks
    });

    // always rebind the click handler here
    tile.on("click tap", () => {
      if (this.letterClickHandler) {
        this.letterClickHandler(char.toLowerCase());
      }
    });

    this.letterTiles.push({ tile, letter: char });
    this.group.add(tile);
  });

  this.group.getLayer()?.batchDraw();
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

  /** === Grid Preview (for visual chaining layout) === */
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

/** Adds a solved word onto a clean vertical column on the left side */
addWordToGrid(placedWord: PlacedWord): void {
  // Persistent offset counter (so each new word stacks lower)
  if (!(this as any)._solvedCount) (this as any)._solvedCount = 0;
  const solvedCount = (this as any)._solvedCount++;

  const gridGroup = new Konva.Group();

  // Starting anchor on the left side
  const baseX = 100; //  fixed left margin
  const baseY = 120 + solvedCount * 50; //  stacks words downward

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


/** Returns the visible letters currently filled in boxes */
getVisibleWord(): string {
  return this.letterTexts.map((t) => t.text()).join("");
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

  /** Returns the Konva group for the game layer */
  getGroup(): Konva.Group {
    return this.group;
  }
}
