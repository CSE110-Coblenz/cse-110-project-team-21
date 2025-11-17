import Konva from "konva";

export default class GameScreenView {
  private group: Konva.Group;
  private text: Konva.Text;
  private background: Konva.Rect;
  private animation?: Konva.Animation;

  // Keep track of gradient phase for animation
  private gradientPhase = 0;

  constructor() {
    this.group = new Konva.Group();

    // Gradient background
    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: window.innerHeight },
      fillLinearGradientColorStops: [0, "#4e54c8", 1, "#8f94fb"],
    });

    this.group.add(this.background);

    // Placeholder text (can be replaced with actual game UI)
    this.text = new Konva.Text({
      text: "Game Screen",
      fontSize: 32,
      fill: "#ffffff",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });

    this.group.add(this.text);

    // Start the background animation
    this.startBackgroundAnimation();
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

  onResize(width: number, height: number): void {
    this.background.width(width);
    this.background.height(height);

    this.text.x(width / 2 - this.text.width() / 2);
    this.text.y(height / 2 - this.text.height() / 2);
  }

  /** Animate gradient over time */
  private startBackgroundAnimation(): void {
    const layer = this.background.getLayer();
    if (!layer) return;

    this.animation = new Konva.Animation(() => {
      this.gradientPhase += 0.002; // Adjust speed here

      // Calculate color shift
      const c1 = `hsl(${(this.gradientPhase * 360) % 360}, 70%, 50%)`;
      const c2 = `hsl(${((this.gradientPhase + 0.3) * 360) % 360}, 70%, 60%)`;

      this.background.fillLinearGradientColorStops = [0, c1, 1, c2];
    }, layer);

    this.animation.start();
  }

  /** Stop animation if needed */
  stopAnimation(): void {
    this.animation?.stop();
  }
}
