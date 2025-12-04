import Konva from "konva";

export default class HelpModalView {
  private group: Konva.Group;
  private background: Konva.Rect;
  private box: Konva.Rect;
  private title: Konva.Text;
  private separator: Konva.Line;
  private text: Konva.Text;
  private closeButton: Konva.Group;

  constructor() {
    this.group = new Konva.Group({ visible: false });
    this.buildModal();

    window.addEventListener("resize", () => this.rebuild());
  }

  private buildModal() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.background = new Konva.Rect({
      x: 0,
      y: 0,
      width,
      height,
      fill: "rgba(30, 30, 50, 0.7)",
    });

    const modalWidth = Math.min(700, width * 0.9);
    const modalHeight = Math.min(600, height * 0.85);
    const modalX = width / 2 - modalWidth / 2;
    const modalY = height / 2 - modalHeight / 2;

    this.box = new Konva.Rect({
      x: modalX,
      y: modalY,
      width: modalWidth,
      height: modalHeight,
      fill: "#ffffff",
      cornerRadius: 25,
      stroke: "#4f46e5",
      strokeWidth: 6,
      shadowColor: "#4f46e5",
      shadowBlur: 30,
      shadowOpacity: 0.4,
      shadowOffset: { x: 0, y: 10 },
    });

    this.title = new Konva.Text({
      text: "HOW TO PLAY",
      fontSize: 40,
      fontFamily: "Montserrat",
      fontStyle: "900",
      fill: "#4f46e5",
      x: modalX,
      y: modalY + 35,
      width: modalWidth,
      align: "center",
    });

    this.separator = new Konva.Line({
        points: [modalX + 40, modalY + 90, modalX + modalWidth - 40, modalY + 90],
        stroke: '#e2e8f0',
        strokeWidth: 2,
    });

    const content = `
GENERAL
• Drag the blue "PLAY" onto the ghost "PLAY" to start.

WORDLINK
• Click letters in the bank to form words.
• You have 3 Hearts per round.
• Create 15 words to advance to the next stage.

MADLIBS
• Complete the story by filling in the blanks.
• Choose the word that fits the description, be quick, you only have 10 seconds
    `;

    this.text = new Konva.Text({
      text: content.trim(),
      fontSize: 22,
      fontFamily: "Montserrat",
      fontStyle: "500",
      fill: "#334155",
      x: modalX + 50,
      y: modalY + 110,
      width: modalWidth - 100,
      lineHeight: 1.6,
      align: "left",
    });

    this.createCloseButton(modalX + modalWidth - 25, modalY + 25);

    this.group.removeChildren();
    this.group.add(
        this.background, 
        this.box, 
        this.title, 
        this.separator, 
        this.text, 
        this.closeButton
    );
  }

  private createCloseButton(x: number, y: number) {
    this.closeButton = new Konva.Group({
        x: x,
        y: y,
    });

    const radius = 20;
    const diameter = radius * 2;

    const circle = new Konva.Circle({
        radius: radius,
        fill: '#ef4444', 
        shadowColor: 'black',
        shadowBlur: 5,
        shadowOpacity: 0.3
    });

    const xText = new Konva.Text({
        text: '✕',
        fontSize: 22,
        fontFamily: 'Arial',
        fill: 'white',
        width: diameter,
        height: diameter,
        x: -radius,
        y: -radius,
        align: 'center',
        verticalAlign: 'middle',
        listening: false 
    });

    circle.on("mouseenter", () => {
      document.body.style.cursor = "pointer"; 
    }); 

    circle.on("mouseleave", () => {
      document.body.style.cursor = "default"; 
    })

    this.closeButton.add(circle, xText);
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