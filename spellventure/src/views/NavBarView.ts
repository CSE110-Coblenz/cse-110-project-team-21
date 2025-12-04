import Konva from "konva";
import { SoundManager } from "../utils/SoundManager";

export default class NavBarView {
  private group: Konva.Group;
  private bg: Konva.Rect;

  private homeButton!: Konva.Text;
  private backButton!: Konva.Text;
  private helpButton!: Konva.Text;
  private soundIcon!: Konva.Text;

  private sparkles: Konva.Circle[] = [];
  private sparkleAnim: Konva.Animation | null = null;

  constructor() {
    this.group = new Konva.Group({ visible: true });
    this.build();
    this.createSparkles();
    this.fadeIn();
  }

  /** ---------------------------------------------------------
   * Build the pastel-themed navbar
   * --------------------------------------------------------- */
  private build(): void {
    const width = window.innerWidth;
    const barHeight = 70;

    // 🌈 Pastel gradient bar background
    this.bg = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height: barHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: width, y: 0 },
      fillLinearGradientColorStops: [
        0, "#dbeafe",
        1, "#fce7f3",
      ],
      shadowColor: "rgba(0,0,0,0.2)",
      shadowBlur: 12,
      shadowOffsetY: 4,
    });

    this.homeButton = this.makeButton("🏠 Home", 30);
    this.backButton = this.makeButton("← Back", 150);
    this.helpButton = this.makeButton("❓ Help", width - 130);

    this.soundIcon = new Konva.Text({
      text: SoundManager.isEnabled() ? "🔊" : "🔇",
      fontSize: 26,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#1e3a8a",
      x: width - 190,
      y: 20,
    });

    this.addHoverEffect(this.soundIcon);
    this.soundIcon.on("click tap", () => {
      const enabled = SoundManager.toggle();
      this.soundIcon.text(enabled ? "🔊" : "🔇");
      this.group.getLayer()?.batchDraw();
    });

    this.group.add(this.bg, this.homeButton, this.backButton, this.soundIcon, this.helpButton);
  }

  /** Creates a themed text button */
  private makeButton(label: string, x: number): Konva.Text {
    const btn = new Konva.Text({
      text: label,
      fontSize: 22,
      fontFamily: "Comic Sans MS, system-ui, sans-serif",
      fill: "#1e3a8a",
      x,
      y: 20,
      shadowColor: "rgba(0,0,0,0.15)",
      shadowBlur: 4,
    });

    this.addHoverEffect(btn);
    return btn;
  }

  /** Hover glow */
  private addHoverEffect(node: Konva.Text) {
    node.on("mouseenter", () => {
      document.body.style.cursor = "pointer";
      node.scale({ x: 1.1, y: 1.1 });
      node.fill("#4338ca");
      this.group.getLayer()?.batchDraw();
    });

    node.on("mouseleave", () => {
      document.body.style.cursor = "default";
      node.scale({ x: 1, y: 1 });
      node.fill("#1e3a8a");
      this.group.getLayer()?.batchDraw();
    });
  }

  /** ---------------------------------------------------------
   * Sparkles that float across the navbar
   * --------------------------------------------------------- */
  private createSparkles(): void {
    this.sparkles.forEach((s) => s.destroy());
    this.sparkles = [];

    for (let i = 0; i < 12; i++) {
      const c = new Konva.Circle({
        x: Math.random() * window.innerWidth,
        y: Math.random() * 70,
        radius: Math.random() * 2 + 1,
        fill: ["#a5b4fc", "#fbcfe8", "#fde68a"][Math.floor(Math.random() * 3)],
        opacity: 0.7,
      });

      this.group.add(c);
      this.sparkles.push(c);
    }

    if (this.sparkleAnim) this.sparkleAnim.stop();

    this.sparkleAnim = new Konva.Animation((frame) => {
      if (!frame) return;

      this.sparkles.forEach((s, i) => {
        s.y(s.y() + 0.15);
        if (s.y() > 70) s.y(Math.random() * -20);

        s.x(s.x() + Math.sin((frame.time + i * 40) * 0.001) * 0.4);
      });
    }, this.group.getLayer());

    this.sparkleAnim.start();
  }

  /** Smooth fade animation */
  private fadeIn() {
    this.group.opacity(0);
    this.group.to({
      opacity: 1,
      duration: 0.4,
      easing: Konva.Easings.EaseInOut,
    });
  }

  /** ---------------------------------------------------------
   * Public API
   * --------------------------------------------------------- */
  getGroup(): Konva.Group {
    return this.group;
  }

  onHomeClick(cb: () => void) {
    this.homeButton.on("click tap", cb);
  }

  onBackClick(cb: () => void) {
    this.backButton.on("click tap", cb);
  }

  onHelpClick(cb: () => void) {
    this.helpButton.on("click tap", cb);
  }

  show() {
    this.group.visible(true);
  }

  hide() {
    this.group.visible(false);
  }

  onResize(width: number) {
    this.bg.width(width);

    // Reposition buttons based on new width for full-screen responsive layout
    this.homeButton.x(30);
    this.backButton.x(150);
    this.soundIcon.x(width - 190);
    this.helpButton.x(width - 130);

    this.group.getLayer()?.batchDraw();
  }
}
