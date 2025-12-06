// src/views/DifficultyScreenView.ts
import Konva from "konva";

export default class DifficultyScreenView {
  private group: Konva.Group;
  private buttons: Record<string, Konva.Rect> = {};
  private labels: Record<string, Konva.Text> = {};

  constructor() {
    this.group = new Konva.Group();

    const title = new Konva.Text({
      text: "Choose Difficulty",
      fontSize: 48,
      fontFamily: "Arial",
      fill: "#1e1e1e",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 4,
      width: 400,
      align: "center",
    });
    this.group.add(title);

    const levels = ["Easy", "Medium", "Hard"];
    const colors = ["#22c55e", "#eab308", "#ef4444"];

    levels.forEach((lvl, i) => {
      const x = window.innerWidth / 2 - 150;
      const y = window.innerHeight / 2 - 100 + i * 120;

      const rect = new Konva.Rect({
        x,
        y,
        width: 300,
        height: 80,
        cornerRadius: 20,
        fill: colors[i],
        shadowColor: "rgba(0,0,0,0.3)",
        shadowBlur: 8,
      });

      const label = new Konva.Text({
        text: lvl,
        fontSize: 32,
        fill: "#ffffff",
        width: 300,
        align: "center",
        x,
        y: y + 22,
      });

      this.buttons[lvl.toLowerCase()] = rect;
      this.labels[lvl.toLowerCase()] = label;

      this.group.add(rect);
      this.group.add(label);
    });
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  onDifficultySelected(handler: (level: string) => void): void {
    Object.keys(this.buttons).forEach((key) => {
      const rect = this.buttons[key];
      const label = this.labels[key];
      rect.on("click tap", () => handler(key));
      label.on("click tap", () => handler(key));
    });
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }
}
