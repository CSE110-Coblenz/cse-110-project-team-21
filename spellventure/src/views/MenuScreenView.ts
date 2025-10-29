// src/views/MenuScreenView.ts
import Konva from "konva";

export default class MenuScreenView {
  private group: Konva.Group;
  private targetWord: Konva.Text;
  private draggableWord: Konva.Text;

  constructor() {
    this.group = new Konva.Group();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // Silhouette target for "PLAY"
    this.targetWord = new Konva.Text({
      text: "PLAY",
      fontSize: 140,
      fontFamily: "Arial Black",
      fill: "rgba(0,0,0,0.1)",
      x: centerX - 220, // wider offset for full width
      y: centerY - 180,
      align: "center",
      listening: false,
    });

    // Draggable version of "PLAY"
    this.draggableWord = new Konva.Text({
      text: "PLAY",
      fontSize: 140,
      fontFamily: "Arial Black",
      fill: "#4f46e5",
      x: centerX - 220,
      y: window.innerHeight - 250,
      draggable: true,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 10,
    });

    this.group.add(this.targetWord);
    this.group.add(this.draggableWord);
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  startPlayIntro(onComplete: () => void): void {
    // Reset positions/visibility
    this.draggableWord.position({
      x: window.innerWidth / 2 - 220,
      y: window.innerHeight - 250,
    });
    this.draggableWord.visible(true);

    this.draggableWord.on("dragend", () => {
      const dx = Math.abs(this.draggableWord.x() - this.targetWord.x());
      const dy = Math.abs(this.draggableWord.y() - this.targetWord.y());

      if (dx < 80 && dy < 80) {
        // Snap to silhouette
        this.draggableWord.position({
          x: this.targetWord.x(),
          y: this.targetWord.y(),
        });
        this.draggableWord.fill("#16a34a");

        // Simple “bounce” animation for feedback
        const anim = new Konva.Animation((frame) => {
          const scale = 1 + 0.1 * Math.sin(frame.time * 0.02);
          this.draggableWord.scale({ x: scale, y: scale });
        }, this.group.getLayer());
        anim.start();

        setTimeout(() => {
          anim.stop();
          this.draggableWord.scale({ x: 1, y: 1 });
          onComplete();
        }, 800);
      }
    });
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }
}
