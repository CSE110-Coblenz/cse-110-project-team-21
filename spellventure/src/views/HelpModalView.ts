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

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Semi-transparent dark background
    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: "rgba(0,0,0,0.5)",
    });

    // Main modal box
    this.box = new Konva.Rect({
      x: width / 2 - 280,
      y: height / 2 - 200,
      width: 560,
      height: 360,
      fill: "#ffffff",
      cornerRadius: 20,
      shadowColor: "black",
      shadowBlur: 10,
    });

    this.title = new Konva.Text({
      text: "Welcome to Spellventure!",
      fontSize: 32,
      fontFamily: "Arial",
      fill: "#1e1e1e",
      x: width / 2 - 250,
      y: height / 2 - 170,
      width: 500,
      align: "center",
    });

    this.text = new Konva.Text({
      text:
        "How to Play:\n\n" +
        "• To begin the game, drag the letters below to correctly spell “PLAY”.\n" +
        "• Once the word is complete, you’ll move on to choose your difficulty.\n" +
        "• Easy, Medium, and Hard levels change how much help you get.\n\n" +
        "Tips:\n" +
        "• You start with 3 hearts.\n" +
        "• Correct spelling and longer words earn more points.\n" +
        "• You can reopen this Help screen anytime by clicking the ❓ icon.",
      fontSize: 20,
      fontFamily: "Arial",
      fill: "#222",
      x: width / 2 - 260,
      y: height / 2 - 120,
      width: 520,
      lineHeight: 1.4,
      align: "left",
    });

    this.closeButton = new Konva.Text({
      text: "✖ Close",
      fontSize: 22,
      fill: "#1e1e1e",
      x: width / 2 + 180,
      y: height / 2 + 120,
      width: 100,
      align: "center",
    });

    this.group.add(this.background, this.box, this.title, this.text, this.closeButton);
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
