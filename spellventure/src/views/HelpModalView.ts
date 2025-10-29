// src/views/HelpModalView.ts
import Konva from "konva";

export default class HelpModalView {
  private group: Konva.Group;
  private background: Konva.Rect;
  private box: Konva.Rect;
  private title: Konva.Text;
  private text: Konva.Text;
  private closeButton: Konva.Text;

  constructor() {
    this.group = new Konva.Group({ visible: false });
    this.buildModal();

    // Rebuild and reposition modal on window resize
    window.addEventListener("resize", () => this.rebuild());
  }

  private buildModal() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // === Dim background overlay ===
    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: "rgba(0,0,0,0.5)",
    });

    // === Modal container ===
    const modalWidth = Math.min(640, width * 0.9);
    const modalHeight = Math.min(520, height * 0.75);

    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2 - 40;

    this.box = new Konva.Rect({
      x: modalX,
      y: modalY,
      width: modalWidth,
      height: modalHeight,
      fill: "#ffffff",
      cornerRadius: 20,
      shadowColor: "black",
      shadowBlur: 20,
      shadowOpacity: 0.25,
    });

    // === Title ===
    this.title = new Konva.Text({
      text: "Welcome to Spellventure!",
      fontSize: 34,
      fontFamily: "Arial Black",
      fill: "#1e1e1e",
      x: modalX + 20,
      y: modalY + 25,
      width: modalWidth - 40,
      align: "center",
    });

    // === Body text ===
    this.text = new Konva.Text({
      text: `
How to Play:

• To begin the game, drag the letters below to correctly spell “PLAY”.
• Once the word is complete, you’ll move on to choose your difficulty.
• Easy, Medium, and Hard levels change how much help you get.

Tips:
• You start with 3 hearts.
• Correct spelling and longer words earn more points.
• You can reopen this Help screen anytime by clicking the "?" icon.
      `,
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#222",
      x: modalX + 40,
      y: modalY + 90,
      width: modalWidth - 80,
      lineHeight: 1.5,
      align: "left",
    });

    // === Close button (top-right corner) ===
    this.closeButton = new Konva.Text({
      text: "✖",
      fontSize: 28,
      fontFamily: "Arial Black",
      fill: "#444",
      x: modalX + modalWidth - 45, // right aligned
      y: modalY + 20, // top corner
      width: 40,
      height: 40,
      align: "center",
    });

    // === Group assembly ===
    this.group.removeChildren();
    this.group.add(this.background, this.box, this.title, this.text, this.closeButton);
  }

  private rebuild() {
    this.group.removeChildren();
    this.buildModal();
    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  onClose(handler: () => void): void {
    this.closeButton.on("click tap", handler);
    this.background.on("click tap", handler);
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }
}
