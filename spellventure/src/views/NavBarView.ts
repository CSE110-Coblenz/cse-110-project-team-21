import Konva from "konva";

export default class NavBarView {
  private group: Konva.Group;
  private homeButton: Konva.Text;
  private backButton: Konva.Text;
  private helpButton: Konva.Text;
  private bg: Konva.Rect;

  constructor() {
    this.group = new Konva.Group();
    this.build();
  }

  private build(): void {
    const barHeight = 60;

    this.bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: barHeight,
      fill: "#1e1e1e",
      opacity: 0.9,
    });

    this.homeButton = new Konva.Text({
      text: "🏠 Home",
      fontSize: 20,
      fill: "#ffffff",
      x: 20,
      y: 18,
    });

    this.backButton = new Konva.Text({
      text: "← Back",
      fontSize: 20,
      fill: "#ffffff",
      x: 130,
      y: 18,
    });

    this.helpButton = new Konva.Text({
      text: "❓ Help",
      fontSize: 20,
      fill: "#ffffff",
      x: window.innerWidth - 100,
      y: 18,
    });

    this.group.add(this.bg, this.homeButton, this.backButton, this.helpButton);
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  onHomeClick(handler: () => void): void {
    this.homeButton.on("click tap", handler);
  }

  onBackClick(handler: () => void): void {
    this.backButton.on("click tap", handler);
  }

  onHelpClick(handler: () => void): void {
    this.helpButton.on("click tap", handler);
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }

  //Adjust bar + help button position
  onResize(width: number, _height: number): void {
    this.bg.width(width);
    this.helpButton.x(width - 100);
  }
}
