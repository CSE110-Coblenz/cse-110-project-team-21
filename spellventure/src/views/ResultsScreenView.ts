// src/views/ResultsScreenView.ts
// Pastel Fantasy Celebration Results Screen

import Konva from "konva";

export default class ResultsScreenView {
  private group: Konva.Group;

  private confetti: Konva.Rect[] = [];
  private stars: Konva.Star[] = [];
  private anim: Konva.Animation | null = null;

  private title!: Konva.Text;
  private subtitle!: Konva.Text;
  private card!: Konva.Rect;

  private playAgainBtn!: Konva.Rect;
  private playAgainText!: Konva.Text;

  private menuBtn!: Konva.Rect;
  private menuText!: Konva.Text;

  private onPlayAgainHandler: (() => void) | null = null;
  private onMenuHandler: (() => void) | null = null;

  constructor() {
    this.group = new Konva.Group({ visible: false });

    this.drawBackground();
    this.drawCelebrationEffects();
    this.drawCard();
    this.drawButtons();

    window.addEventListener("resize", () => this.rebuild());
  }

  // ------------------------------------------------------------
  // Background gradient
  // ------------------------------------------------------------
  private drawBackground(): void {
    const bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fillLinearGradientStartPoint: { x: 0, y: 0 },
      fillLinearGradientEndPoint: { x: 0, y: window.innerHeight },
      fillLinearGradientColorStops: [
        0, "#fef3c7",  // peach
        1, "#e0f2fe",  // sky pastel
      ],
    });

    this.group.add(bg);
  }

  // ------------------------------------------------------------
  // Confetti + stars
  // ------------------------------------------------------------
  private drawCelebrationEffects(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Reset if rebuilding
    this.confetti.forEach((c) => c.destroy());
    this.stars.forEach((s) => s.destroy());
    this.confetti = [];
    this.stars = [];

    const confettiColors = ["#fbcfe8", "#a5b4fc", "#fde68a", "#bbf7d0", "#fecaca"];

    // Confetti pieces
    for (let i = 0; i < 60; i++) {
      const rect = new Konva.Rect({
        x: Math.random() * W,
        y: Math.random() * -H,
        width: 8 + Math.random() * 6,
        height: 10 + Math.random() * 8,
        fill: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 180,
        opacity: 0.9,
      });
      this.confetti.push(rect);
      this.group.add(rect);
    }

    // Floating stars
    for (let i = 0; i < 12; i++) {
      const star = new Konva.Star({
        x: Math.random() * W,
        y: H + Math.random() * 200,
        numPoints: 5,
        innerRadius: 4,
        outerRadius: 10 + Math.random() * 4,
        fill: ["#fde047", "#fb923c", "#f472b6"][Math.floor(Math.random() * 3)],
        opacity: 0.8,
      });
      this.stars.push(star);
      this.group.add(star);
    }

    // Animation loop
    if (this.anim) this.anim.stop();

    this.anim = new Konva.Animation((frame) => {
      if (!frame) return;

      // Confetti falling
      this.confetti.forEach((c, i) => {
        c.y(c.y() + 2 + (i % 3));
        c.rotation(c.rotation() + 1);

        if (c.y() > window.innerHeight + 20) {
          c.y(-20);
          c.x(Math.random() * window.innerWidth);
        }
      });

      // Stars rising
      this.stars.forEach((s) => {
        s.y(s.y() - 0.8);
        if (s.y() < -30) {
          s.y(window.innerHeight + Math.random() * 150);
          s.x(Math.random() * window.innerWidth);
        }
      });
    }, this.group.getLayer());

    this.anim.start();
  }

  // ------------------------------------------------------------
  // Celebration card
  // ------------------------------------------------------------
  private drawCard(): void {
    const W = window.innerWidth;
    const H = window.innerHeight;

    const cardWidth = Math.min(680, W * 0.85);
    const cardHeight = Math.min(420, H * 0.65);

    const cardX = W / 2 - cardWidth / 2;
    const cardY = H / 2 - cardHeight / 2;

    this.card = new Konva.Rect({
      x: cardX,
      y: cardY,
      width: cardWidth,
      height: cardHeight,
      cornerRadius: 32,
      fillLinearGradientStartPoint: { x: 0, y: cardY },
      fillLinearGradientEndPoint: { x: 0, y: cardY + cardHeight },
      fillLinearGradientColorStops: [
        0, "#ffffff",
        1, "#fef9c3",
      ],
      shadowColor: "rgba(0,0,0,0.2)",
      shadowBlur: 20,
      shadowOffsetY: 6,
      opacity: 0,
      scaleX: 0.8,
      scaleY: 0.8,
    });
    this.group.add(this.card);

    this.card.to({
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 0.3,
      easing: Konva.Easings.EaseOut,
    });

    // Title
    this.title = new Konva.Text({
      text: "🎉 Your Adventure Is Complete!",
      x: cardX,
      y: cardY + 40,
      width: cardWidth,
      align: "center",
      fontSize: 36,
      fontFamily: "Comic Sans MS",
      fill: "#1e3a8a",
    });
    this.group.add(this.title);

    // Subtitle (the completed story)
    this.subtitle = new Konva.Text({
      text: "You finished your magical Mad Libs adventure!",
      x: cardX + 40,
      y: cardY + 120,
      width: cardWidth - 80,
      align: "center",
      fontSize: 22,
      fontFamily: "Comic Sans MS",
      fill: "#334155",
      lineHeight: 1.4,
    });

    this.group.add(this.subtitle);
  }

  setStoryResult(text: string): void {
    this.subtitle.text(text);
    this.group.getLayer()?.batchDraw();
  }

  // ------------------------------------------------------------
  // Buttons (Play Again, Menu)
  // ------------------------------------------------------------
  private drawButtons(): void {
    const W = window.innerWidth;
    const cardBottom = this.card.y() + this.card.height();

    // Play Again button
    this.playAgainBtn = new Konva.Rect({
      x: W / 2 - 180,
      y: cardBottom + 30,
      width: 160,
      height: 58,
      cornerRadius: 26,
      fill: "#c7d2fe",
      shadowColor: "rgba(0,0,0,0.25)",
      shadowBlur: 10,
      shadowOffsetY: 4,
      listening: true,
    });

    this.playAgainText = new Konva.Text({
      text: "Play Again",
      x: this.playAgainBtn.x(),
      y: this.playAgainBtn.y() + 16,
      width: this.playAgainBtn.width(),
      fontSize: 20,
      fontFamily: "Comic Sans MS",
      align: "center",
      fill: "#1e3a8a",
    });

    this.setupButtonHover(this.playAgainBtn);

    this.playAgainBtn.on("click tap", () => {
      this.onPlayAgainHandler?.();
    });

    // Menu button
    this.menuBtn = new Konva.Rect({
      x: W / 2 + 20,
      y: cardBottom + 30,
      width: 160,
      height: 58,
      cornerRadius: 26,
      fill: "#bbf7d0",
      shadowColor: "rgba(0,0,0,0.25)",
      shadowBlur: 10,
      shadowOffsetY: 4,
      listening: true,
    });

    this.menuText = new Konva.Text({
      text: "Main Menu",
      x: this.menuBtn.x(),
      y: this.menuBtn.y() + 16,
      width: this.menuBtn.width(),
      fontSize: 20,
      fontFamily: "Comic Sans MS",
      align: "center",
      fill: "#065f46",
    });

    this.setupButtonHover(this.menuBtn);

    this.menuBtn.on("click tap", () => {
      this.onMenuHandler?.();
    });

    this.group.add(
      this.playAgainBtn, this.playAgainText,
      this.menuBtn, this.menuText
    );
  }

  private setupButtonHover(btn: Konva.Rect): void {
    btn.on("mouseenter", () => {
      document.body.style.cursor = "pointer";
      btn.to({ scaleX: 1.06, scaleY: 1.06, duration: 0.12 });
    });

    btn.on("mouseleave", () => {
      document.body.style.cursor = "default";
      btn.to({ scaleX: 1.0, scaleY: 1.0, duration: 0.12 });
    });
  }

  // ------------------------------------------------------------
  // Resize rebuild
  // ------------------------------------------------------------
  private rebuild(): void {
    const savedStory = this.subtitle.text();
    const playCb = this.onPlayAgainHandler;
    const menuCb = this.onMenuHandler;

    this.group.destroyChildren();
    this.drawBackground();
    this.drawCelebrationEffects();
    this.drawCard();
    this.drawButtons();

    this.subtitle.text(savedStory);
    if (playCb) this.onPlayAgain(playCb);
    if (menuCb) this.onMenu(menuCb);
  }

  // ------------------------------------------------------------
  // Handlers exposed to controller
  // ------------------------------------------------------------
  onPlayAgain(handler: () => void): void {
    this.onPlayAgainHandler = handler;
  }

  onMenu(handler: () => void): void {
    this.onMenuHandler = handler;
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}
