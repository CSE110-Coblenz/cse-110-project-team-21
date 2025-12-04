// src/views/GameScreenView.ts
import Konva from "konva";

export default class GameScreenView {
  private group: Konva.Group;
  private bg: Konva.Rect;

  private sparkles: Konva.Circle[] = [];
  private sparkleAnim: Konva.Animation | null = null;

  constructor() {
    // Background should never block input
    this.group = new Konva.Group({
      visible: false,
      listening: false,
    });

    // 🌈 Soft pastel gradient background
    this.bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: window.innerHeight },
      fillLinearGradientColorStops: [
        0, "#dbeafe", // soft sky blue
        1, "#fce7f3", // soft pink
      ],
      listening: false,
    });

    this.group.add(this.bg);
    this.createSparkles();
  }

  /** ✨ Floating sparkles for magical feel */
  private createSparkles(): void {
    this.sparkles.forEach((s) => s.destroy());
    this.sparkles = [];

    for (let i = 0; i < 20; i++) {
      const sparkle = new Konva.Circle({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 3 + 1,
        fill: ["#a5b4fc", "#fbcfe8", "#fde68a"][Math.floor(Math.random() * 3)],
        opacity: 0.6,
        listening: false,
      });

      this.sparkles.push(sparkle);
      this.group.add(sparkle);
    }

    if (this.sparkleAnim) {
      this.sparkleAnim.stop();
      this.sparkleAnim = null;
    }

    this.sparkleAnim = new Konva.Animation((frame) => {
      if (!frame) return;

      this.sparkles.forEach((s, i) => {
        s.y(s.y() - (0.1 + Math.random() * 0.1));
        if (s.y() < -10) {
          s.y(window.innerHeight + Math.random() * 50);
        }
        s.x(s.x() + Math.sin((frame.time + i * 50) * 0.001) * 0.3);
      });
    });
  }

  /** 🎬 Show background + sparkles */
  show(): void {
    this.group.visible(true);

    if (this.sparkleAnim) {
      const layer = this.group.getLayer();
      if (layer) {
        this.sparkleAnim.setLayers([layer]);
        this.sparkleAnim.start();
      }
    }
  }

  /** Hide everything */
  hide(): void {
    this.group.visible(false);
    if (this.sparkleAnim) {
      this.sparkleAnim.stop();
    }
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  /** 📱 Responsive layout */
  onResize(width: number, height: number): void {
    this.bg.width(width);
    this.bg.height(height);

    this.sparkles.forEach((s) => {
      s.x(Math.random() * width);
      s.y(Math.random() * height);
    });
  }

  /** Stub so controllers don't break if they call this */
  setStatus(_message: string): void {
    // no-op: we removed the title text
  }

  /** Stub so controllers don't break if they call this */
  hideTitle(): void {
    // no-op: no title exists anymore
  }
}
