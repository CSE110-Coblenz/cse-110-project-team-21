import Konva from "konva";

export default class GameScreenView {
  private group: Konva.Group;
  private text: Konva.Text;

  constructor() {
    this.group = new Konva.Group();

    this.text = new Konva.Text({
      text: "Game Screen (placeholder)",
      fontSize: 32,
      fill: "#333",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });

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

  // ✅ Responsive repositioning
  onResize(width: number, height: number): void {
    this.text.x(width / 2 - this.text.width() / 2);
    this.text.y(height / 2 - this.text.height() / 2);
  }
}
