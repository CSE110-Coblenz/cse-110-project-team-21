import Konva from "konva";

export default class ResultsScreenView {
  private group: Konva.Group;
  
  private backgroundGroup: Konva.Group;
  private backgroundAnim: Konva.Animation;

  private card: Konva.Rect;
  private title: Konva.Text;
  private scoreText: Konva.Text;
  private homeButton: Konva.Group;

  private homeClickHandler: (() => void) | null = null;

  constructor() {
    this.group = new Konva.Group({ visible: false });

    this.createBackground();
    this.group.add(this.backgroundGroup);

    this.backgroundAnim = new Konva.Animation((frame) => {
      const timeDiff = (frame?.timeDiff || 0) / 1000;
      this.animateBackground(timeDiff);
    }, this.group.getLayer());

    this.buildUI();

    window.addEventListener("resize", () => this.onResize());

    Promise.all([
      document.fonts.load("80px Nabla"),
      document.fonts.load("30px Montserrat")
    ]).then(() => {
      this.group.getLayer()?.batchDraw();
    });
  }

  updateScores(wordLinkScore: number, heartsFinal: number): void {
    const totalScore = wordLinkScore + (heartsFinal * 100); // Example calculation

    this.scoreText.text(
      `WordLink Score:  ${wordLinkScore}\n` +
      `Hearts Bonus:    ${heartsFinal} x 100\n` +
      `---------------------\n` +
      `TOTAL SCORE:     ${totalScore}`
    );
    
    this.centerUI();
    this.group.getLayer()?.batchDraw();
  }

  private buildUI(): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    this.card = new Konva.Rect({
      width: 500,
      height: 400,
      fill: "white",
      cornerRadius: 20,
      shadowColor: "rgba(0,0,0,0.2)",
      shadowBlur: 30,
      shadowOffsetY: 10,
      stroke: "#e2e8f0",
      strokeWidth: 1
    });

    this.title = new Konva.Text({
      text: "Adventure Complete!",
      fontSize: 50,
      fontFamily: "Nabla",
      align: "center",
      width: 600, 
    });

    this.scoreText = new Konva.Text({
      text: "Loading Stats...",
      fontSize: 24,
      fontFamily: "Montserrat",
      fontStyle: "600",
      fill: "#1e293b",
      align: "left",
      lineHeight: 1.8,
      width: 400
    });

    this.homeButton = this.createButton("Return to Home");

    this.group.add(this.card, this.title, this.scoreText, this.homeButton);
    
    this.centerUI();
  }

  private createButton(label: string): Konva.Group {
    const btnGroup = new Konva.Group();
    
    const bg = new Konva.Rect({
      width: 250,
      height: 60,
      fill: "#4f46e5",
      cornerRadius: 12,
      shadowColor: "#4f46e5",
      shadowBlur: 10,
      shadowOpacity: 0.4
    });

    const text = new Konva.Text({
      text: label,
      fontSize: 20,
      fontFamily: "Montserrat",
      fontStyle: "bold",
      fill: "white",
      width: 250,
      y: 20,
      align: "center",
      listening: false
    });

    btnGroup.add(bg, text);

    btnGroup.on("mouseenter", () => {
      document.body.style.cursor = "pointer";
      bg.fill("#4338ca");
      this.group.getLayer()?.batchDraw();
    });
    btnGroup.on("mouseleave", () => {
      document.body.style.cursor = "default";
      bg.fill("#4f46e5");
      this.group.getLayer()?.batchDraw();
    });
    btnGroup.on("click tap", () => {
      if (this.homeClickHandler) this.homeClickHandler();
    });

    return btnGroup;
  }

  private centerUI(): void {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    this.card.position({ x: cx - 250, y: cy - 200 });

    this.title.position({ 
      x: cx - 300, 
      y: cy - 260 
    });

    this.scoreText.position({ 
      x: cx - 140, 
      y: cy - 120 
    });

    this.homeButton.position({
      x: cx - 125,
      y: cy + 100
    });
  }

  private createBackground(): void {
    this.backgroundGroup = new Konva.Group({ listening: false });
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ?!@#&";
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = 100; 

    for (let i = 0; i < count; i++) {
      const char = letters.charAt(Math.floor(Math.random() * letters.length));
      const scale = 0.5 + Math.random(); 

      const letter = new Konva.Text({
        text: char,
        x: Math.random() * width,
        y: Math.random() * height,
        fontSize: 40, 
        fontFamily: "Arial Black",
        fill: Math.random() > 0.6 ? "#cbd5e1" : (Math.random() > 0.5 ? "#c7d2fe" : "#f5d0fe"), 
        opacity: 0.15 * scale, 
        rotation: Math.random() * 360,
        scaleX: scale,
        scaleY: scale,
      });

      letter.setAttr('velocity', 20 * scale); 
      letter.setAttr('rotationSpeed', (Math.random() - 0.5) * 50); 

      this.backgroundGroup.add(letter);
    }
  }

  private animateBackground(dt: number): void {
    const height = window.innerHeight;
    this.backgroundGroup.getChildren().forEach((node) => {
      const letter = node as Konva.Text;
      let newY = letter.y() - (letter.getAttr('velocity') * dt);
      letter.rotation(letter.rotation() + (letter.getAttr('rotationSpeed') * dt));
      if (newY < -50) {
        newY = height + 50;
        letter.x(Math.random() * window.innerWidth); 
      }
      letter.y(newY);
    });
  }

  show(): void {
    this.group.visible(true);
    this.backgroundAnim.start();
  }

  hide(): void {
    this.group.visible(false);
    this.backgroundAnim.stop();
  }

  onHomeClicked(cb: () => void): void {
    this.homeClickHandler = cb;
  }

  onResize(): void {
    this.backgroundGroup.destroyChildren();
    this.createBackground();
    this.centerUI();
    this.group.getLayer()?.batchDraw();
  }

  getGroup(): Konva.Group {
    return this.group;
  }
}