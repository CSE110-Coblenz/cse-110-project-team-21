import Konva from "konva";

export default class GameScreenView {
  private group: Konva.Group;
  private text: Konva.Text;
  private background: Konva.Rect;

  constructor() {
    this.group = new Konva.Group();

    // ⭐ Add gradient background
    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: window.innerHeight },
      fillLinearGradientColorStops: [0, "#4e54c8", 1, "#8f94fb"],
    });

    // Background must be added BEFORE text so it stays behind
    this.group.add(this.background);

    this.text = new Konva.Text({
      text: "Game Screen (placeholder)",
      fontSize: 32,
      fill: "#ffffff",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });

    // Add the text on top
    this.group.add(this.text);
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

  // Make background and text resize correctly
  onResize(width: number, height: number): void {
    this.background.width(width);
    this.background.height(height);

    this.text.x(width / 2 - this.text.width() / 2);
    this.text.y(height / 2 - this.text.height() / 2);
  }
}
