// src/views/GameScreenView.ts
import Konva from "konva";

export default class GameScreenView {
  private group: Konva.Group;
  private text: Konva.Text;
  private background: Konva.Rect;
  private animation: Konva.Animation;
  private gradientPhase: number = 0;

  constructor() {
    this.group = new Konva.Group();

    // ⭐ Animated gradient background
    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: window.innerHeight },
      fillLinearGradientColorStops: [0, "#4e54c8", 1, "#8f94fb"],
    });

    // Add background first so it stays behind everything else
    this.group.add(this.background);

    // Add placeholder text on top
    this.text = new Konva.Text({
      text: "Game Screen (placeholder)",
      fontSize: 32,
      fill: "#ffffff",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });
    this.group.add(this.text);

    // Start gradient animation
    // The animation will automatically redraw the layer each frame
    this.animation = new Konva.Animation((frame) => {
      this.gradientPhase += 0.002;

      // Shift hue over time
      const color1 = `hsl(${(this.gradientPhase * 360) % 360}, 70%, 50%)`;
      const color2 = `hsl(${((this.gradientPhase + 0.3) * 360) % 360}, 70%, 60%)`;
      this.background.fillLinearGradientColorStops([0, color1, 1, color2]);
    }, this.background.getLayer()!); // Non-null since it’s added to a layer
    this.animation.start();
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }

  // Make background and text responsive
  onResize(width: number, height: number): void {
    this.background.width(width);
    this.background.height(height);

    this.text.x(width / 2 - this.text.width() / 2);
    this.text.y(height / 2 - this.text.height() / 2);
  }
}
