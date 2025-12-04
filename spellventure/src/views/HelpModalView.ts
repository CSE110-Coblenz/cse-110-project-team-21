// src/views/HelpModalView.ts
// Pastel Fantasy Storybook Help Modal

import Konva from "konva";

export default class HelpModalView {
  private group: Konva.Group;

  private overlay!: Konva.Rect;
  private panel!: Konva.Rect;
  private title!: Konva.Text;
  private body!: Konva.Text;
  private closeButton!: Konva.Text;

  private sparkles: Konva.Circle[] = [];
  private sparkleAnim: Konva.Animation | null = null;

  private closeHandler: (() => void) | null = null;

  constructor() {
    this.group = new Konva.Group({ visible: false });

    this.buildModal();
    this.createSparkles();

    window.addEventListener("resize", () => this.rebuild());
  }

  /** ---------------------------------------------------------
   * Pastel gradient overlay + rounded modal panel
   * --------------------------------------------------------- */
  private buildModal(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // ✨ Dimmed pastel gradient overlay
    // NOTE: listening is TRUE so clicking outside the panel can close the modal.
    // It is added FIRST, so it is at the bottom of the group draw order.
    this.overlay = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: width, y: height },
      fillLinearGradientColorStops: [
        0, "rgba(219,234,254,0.6)", // pastel blue
        1, "rgba(252,231,243,0.6)", // pastel pink
      ],
      listening: true,
    });

    const modalWidth = Math.min(640, width * 0.9);
    const modalHeight = Math.min(520, height * 0.75);

    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    // 📘 Rounded storybook panel
    this.panel = new Konva.Rect({
      x: modalX,
      y: modalY,
      width: modalWidth,
      height: modalHeight,
      cornerRadius: 28,
      fill: "#ffffff",
      shadowColor: "rgba(0,0,0,0.25)",
      shadowBlur: 20,
      shadowOffsetY: 6,
      opacity: 0,
      scaleX: 0.8,
      scaleY: 0.8,
    });

    // Title
    this.title = new Konva.Text({
      text: "📘 How to Play Spellventure",
      fontSize: 34,
      fontFamily: "Comic Sans MS",
      fill: "#1e3a8a",
      align: "center",
      x: modalX,
      y: modalY + 25,
      width: modalWidth,
    });

    // Body text – kid-friendly formatting
    this.body = new Konva.Text({
      text:
        "Welcome to your magical spelling quest!\n\n" +
        "✨ HOW TO PLAY ✨\n" +
        "• Drag the blue PLAY word into place to start.\n" +
        "• Pick a difficulty you like.\n" +
        "• Spell words correctly to earn points.\n" +
        "• Fill in the Mad Libs story with the right words.\n\n" +
        "💡 TIPS\n" +
        "• You start with 3 hearts.\n" +
        "• Use hints when you're stuck.\n" +
        "• Wrong answers cost a heart!\n" +
        "• Mini-games give you bonus hearts.\n\n" +
        "Have fun and believe in your magic! 🌟",
      fontSize: 22,
      fontFamily: "Comic Sans MS",
      fill: "#374151",
      x: modalX + 40,
      y: modalY + 90,
      width: modalWidth - 80,
      lineHeight: 1.4,
    });

    // Close button in the top-right corner of the panel
    this.closeButton = new Konva.Text({
      text: "✖",
      fontSize: 32,
      fontFamily: "Comic Sans MS",
      fill: "#555",
      x: modalX + modalWidth - 50,
      y: modalY + 20,
      width: 40,
      align: "center",
      listening: true,
    });

    this.closeButton.on("mouseenter", () => {
      document.body.style.cursor = "pointer";
      this.closeButton.fill("#1e3a8a");
      this.group.getLayer()?.batchDraw();
    });

    this.closeButton.on("mouseleave", () => {
      document.body.style.cursor = "default";
      this.closeButton.fill("#555");
      this.group.getLayer()?.batchDraw();
    });

    // Rebuild group content
    this.group.removeChildren();
    // ADD ORDER MATTERS: overlay first (bottom), then panel, then text, closeButton last (top).
    this.group.add(this.overlay, this.panel, this.title, this.body, this.closeButton);

    // Play the panel entrance animation AFTER it's added
    this.panel.to({
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.25,
      easing: Konva.Easings.EaseOut,
    });
  }

  /** ---------------------------------------------------------
   * ✨ Sparkles around the modal
   * --------------------------------------------------------- */
  private createSparkles(): void {
    this.sparkles.forEach((s) => s.destroy());
    this.sparkles = [];

    for (let i = 0; i < 16; i++) {
      const c = new Konva.Circle({
        x: window.innerWidth / 2 + (Math.random() * 300 - 150),
        y: window.innerHeight / 2 + (Math.random() * 300 - 150),
        radius: Math.random() * 3 + 1,
        fill: ["#a5b4fc", "#fbcfe8", "#fde68a"][Math.floor(Math.random() * 3)],
        opacity: 0.7,
      });

      this.group.add(c);
      this.sparkles.push(c);
    }

    // Stop previous animation if any
    if (this.sparkleAnim) {
      this.sparkleAnim.stop();
      this.sparkleAnim = null;
    }

    // Do NOT bind to layer here; group may not be on a layer yet.
    this.sparkleAnim = new Konva.Animation((frame) => {
      if (!frame) return;

      this.sparkles.forEach((s, i) => {
        s.y(s.y() - 0.15);
        if (s.y() < -20) {
          s.y(window.innerHeight + Math.random() * 20);
        }
        s.x(s.x() + Math.sin((frame.time + i * 80) * 0.001) * 0.25);
      });
    });
  }

  /** ---------------------------------------------------------
   * Rebuild on resize
   * --------------------------------------------------------- */
  private rebuild(): void {
    const handler = this.closeHandler;

    this.group.destroyChildren();
    this.buildModal();
    this.createSparkles();

    if (handler) this.onClose(handler);

    this.group.getLayer()?.batchDraw();
  }

  /** ---------------------------------------------------------
   * Close handlers
   * --------------------------------------------------------- */
  onClose(handler: () => void): void {
    this.closeHandler = handler;

    // Remove any previous listeners to avoid duplicates
    this.closeButton.off("click tap");
    this.overlay.off("click tap");

    // Click ✖ → close
    this.closeButton.on("click tap", handler);

    // Click overlay (outside the panel) → close
    this.overlay.on("click tap", handler);
  }

  /** ---------------------------------------------------------
   * Visibility & animation control
   * --------------------------------------------------------- */
  show(): void {
    this.group.visible(true);

    // Start sparkles once layer is known
    if (this.sparkleAnim) {
      const layer = this.group.getLayer();
      if (layer) {
        this.sparkleAnim.setLayers([layer]);
        this.sparkleAnim.start();
      }
    }
  }

  hide(): void {
    this.group.visible(false);

    if (this.sparkleAnim) {
      this.sparkleAnim.stop();
    }
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}
