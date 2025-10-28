// src/views/MenuScreenView.ts
import Konva from "konva";

export default class MenuScreenView {
  private group: Konva.Group;
  private targetGroup: Konva.Group;
  private letterGroup: Konva.Group;
  private targets: Konva.Text[] = [];
  private letters: Konva.Text[] = [];

  constructor() {
    this.group = new Konva.Group();
    this.targetGroup = new Konva.Group();
    this.letterGroup = new Konva.Group();
    this.group.add(this.targetGroup);
    this.group.add(this.letterGroup);

    // “PLAY” silhouette
    const word = "PLAY";
    const startX = window.innerWidth / 2 - 160;
    const startY = window.innerHeight / 3;

    for (let i = 0; i < word.length; i++) {
      const t = new Konva.Text({
        text: word[i],
        fontSize: 100,
        fontFamily: "Arial",
        fill: "rgba(0,0,0,0.1)", // silhouette color
        x: startX + i * 80,
        y: startY,
        width: 80,
        align: "center",
      });
      this.targetGroup.add(t);
      this.targets.push(t);
    }

    // Draggable letters at bottom
    const bottomY = window.innerHeight - 150;
    for (let i = 0; i < word.length; i++) {
      const l = new Konva.Text({
        text: word[i],
        fontSize: 90,
        fontFamily: "Arial",
        fill: "#4f46e5",
        x: startX + i * 100,
        y: bottomY,
        draggable: true,
        shadowColor: "rgba(0,0,0,0.3)",
        shadowBlur: 8,
      });
      this.letterGroup.add(l);
      this.letters.push(l);
    }
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  // Called from controller when starting intro
  startPlayIntro(onComplete: () => void) {
    let correct = 0;

    this.letters.forEach((letter, i) => {
      letter.on("dragend", () => {
        const target = this.targets[i];
        const dx = Math.abs(letter.x() - target.x());
        const dy = Math.abs(letter.y() - target.y());

        // Snap if close enough
        if (dx < 40 && dy < 40) {
          letter.position({ x: target.x(), y: target.y() });
          letter.draggable(false);
          letter.fill("#16a34a"); // turns green
          correct++;

          if (correct === this.letters.length) {
            // All correct
            setTimeout(() => {
              onComplete();
            }, 800);
          }
        }
      });
    });
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }
}
