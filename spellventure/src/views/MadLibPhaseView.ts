/**
 * @file MadLibPhaseView.ts
 * @brief Renders a clean, readable Mad Libs paragraph and handles word selections + blank filling + heart logic.
 */

import Konva from "konva";

interface WordData {
  word: string;
  type: string;
}

export default class MadLibPhaseView {
  private group: Konva.Group;
  private storyTemplate: string;
  private wordBank: WordData[];
  private blanks: { node: Konva.Text; type: string; filled: boolean }[] = [];
  private wordTiles: { node: Konva.Text; word: string; type: string }[] = [];
  private wordClickHandler: ((word: string, type: string) => void) | null = null;

  private heartText: Konva.Text;
  private feedbackText: Konva.Text;
  private hearts = 3;

  constructor(story: string, words: WordData[]) {
    this.group = new Konva.Group();
    this.storyTemplate = story;
    this.wordBank = words;

    this.drawStory();
    this.drawWordBank();
    this.drawHUD();
    window.addEventListener("resize", () => this.onResize());
  }

  /** === STORY RENDERING === */
  private drawStory(): void {
    const paragraphY = 100;
    const lineHeight = 40;
    const marginX = window.innerWidth * 0.1;
    const maxWidth = window.innerWidth * 0.8;

    const words = this.storyTemplate.split(" ");
    let x = marginX;
    let y = paragraphY;

    for (const token of words) {
      const match = token.match(/\[(.*?)\]/);
      let display = token;
      let isBlank = false;
      let type = "";

      if (match) {
        isBlank = true;
        type = match[1];
        display = `[${type}]`; // show type name
      }

      const text = new Konva.Text({
        text: display + " ",
        x,
        y,
        fontSize: 22,
        fontFamily: "system-ui",
        fill: isBlank ? "#2563eb" : "#111",
        fontStyle: isBlank ? "italic" : "normal",
      });

      // Line wrap
      if (x + text.width() > marginX + maxWidth) {
        x = marginX;
        y += lineHeight;
        text.x(x);
        text.y(y);
      }

      // Make blanks interactive
      if (isBlank) {
        text.on("click tap", () => this.flashFeedback(`Looking for a ${type}...`));
        this.blanks.push({ node: text, type, filled: false });
      }

      this.group.add(text);
      x += text.width();
    }

    this.group.getLayer()?.batchDraw();
  }

  /** === WORD BANK === */
  private drawWordBank(): void {
    const startY = window.innerHeight - 200;
    const startX = window.innerWidth * 0.1;
    const spacingX = 140;
    const spacingY = 50;
    const wordsPerRow = Math.floor((window.innerWidth * 0.8) / spacingX);

    this.wordBank.forEach((item, index) => {
      const row = Math.floor(index / wordsPerRow);
      const col = index % wordsPerRow;

      const node = new Konva.Text({
        text: item.word,
        x: startX + col * spacingX,
        y: startY + row * spacingY,
        fontSize: 24,
        fill: "#16a34a",
        fontStyle: "bold",
        shadowColor: "rgba(0,0,0,0.2)",
        shadowBlur: 3,
      });

      node.on("click tap", () => {
        this.wordClickHandler?.(item.word, item.type);
      });

      this.wordTiles.push({ node, word: item.word, type: item.type });
      this.group.add(node);
    });

    this.group.getLayer()?.batchDraw();
  }

  /** === HUD: Hearts + Feedback === */
  private drawHUD(): void {
    this.heartText = new Konva.Text({
      text: `❤️ Hearts: ${this.hearts}`,
      x: window.innerWidth - 250,
      y: 30,
      fontSize: 22,
      fontFamily: "system-ui",
      fill: "#dc2626",
    });

    this.feedbackText = new Konva.Text({
      text: "",
      x: window.innerWidth / 2 - 150,
      y: 30,
      width: 300,
      fontSize: 20,
      fontFamily: "system-ui",
      fill: "#333",
      align: "center",
    });

    this.group.add(this.heartText, this.feedbackText);
  }

  /** === FILL BLANK LOGIC === */
  fillNextBlank(word: string, type: string): boolean {
    const blank = this.blanks.find((b) => !b.filled && b.type === type);
    if (!blank) {
      this.loseHeart(`Wrong type! Looking for a ${type}`);
      return false;
    }

    blank.node.text(word + " ");
    blank.node.fill("#111");
    blank.node.fontStyle("normal");
    blank.filled = true;

    // Remove the used word
    const tile = this.wordTiles.find((t) => t.word === word && t.type === type);
    if (tile) {
      tile.node.destroy();
      this.wordTiles = this.wordTiles.filter((t) => t !== tile);
    }

    this.flashFeedback("✅ Correct!");
    this.group.getLayer()?.batchDraw();
    return true;
  }

  /** === HEART / FEEDBACK SYSTEM === */
  private loseHeart(message: string): void {
    this.hearts--;
    this.flashFeedback(`❌ ${message}`);
    this.heartText.text(`❤️ Hearts: ${this.hearts}`);

    if (this.hearts <= 0) {
      this.triggerMiniGame(() => {
        this.hearts = 1;
        this.heartText.text(`❤️ Hearts: ${this.hearts}`);
      });
    }

    this.group.getLayer()?.batchDraw();
  }

  flashFeedback(message: string): void {
    this.feedbackText.text(message);
    this.group.getLayer()?.batchDraw();
    setTimeout(() => {
      this.feedbackText.text("");
      this.group.getLayer()?.batchDraw();
    }, 1500);
  }

  /** === MINI GAME PLACEHOLDER === */
  private triggerMiniGame(onResume: () => void): void {
    const layer = this.group.getLayer();
    if (!layer) return;

    const overlay = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fill: "rgba(0,0,0,0.8)",
    });

    const text = new Konva.Text({
      text: "💥 Mini Game Placeholder 💥\nTap Resume to Continue",
      fontSize: 28,
      fill: "#fff",
      width: window.innerWidth,
      align: "center",
      y: window.innerHeight / 2 - 80,
    });

    const button = new Konva.Rect({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 + 40,
      width: 200,
      height: 60,
      fill: "#4f46e5",
      cornerRadius: 10,
    });

    const label = new Konva.Text({
      text: "Resume",
      fontSize: 26,
      fill: "#fff",
      width: 200,
      align: "center",
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 + 55,
    });

    button.on("click tap", () => {
      overlay.destroy();
      text.destroy();
      button.destroy();
      label.destroy();
      layer.draw();
      onResume();
    });

    layer.add(overlay, text, button, label);
    layer.draw();
  }

  /** === HELPERS === */
  allBlanksFilled(): boolean {
    return this.blanks.every((b) => b.filled);
  }

  onWordClicked(cb: (word: string, type: string) => void): void {
    this.wordClickHandler = cb;
  }

  private onResize(): void {
    this.group.destroyChildren();
    this.drawStory();
    this.drawWordBank();
    this.drawHUD();
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}
