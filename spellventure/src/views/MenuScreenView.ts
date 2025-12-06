import Konva from "konva";

export default class MenuScreenView {
  private group: Konva.Group;
  private targetWord: Konva.Text;
  private draggableWord: Konva.Text;

  constructor() {
    this.group = new Konva.Group();
    this.build();
  }

  private build(): void {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    this.targetWord = new Konva.Text({
      text: "PLAY",
      fontSize: 140,
      fontFamily: "Arial Black",
      fill: "rgba(0,0,0,0.1)",
      x: centerX - 220,
      y: centerY - 180,
      align: "center",
      listening: false,
    });

    this.draggableWord = new Konva.Text({
      text: "PLAY",
      fontSize: 140,
      fontFamily: "Arial Black",
      fill: "#4f46e5",
      x: centerX - 220,
      y: window.innerHeight - 250,
      draggable: true,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 10,
    });

    this.group.add(this.targetWord, this.draggableWord);
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  startPlayIntro(onComplete: () => void): void {
    this.draggableWord.position({
      x: window.innerWidth / 2 - 220,
      y: window.innerHeight - 250,
    });
    this.draggableWord.visible(true);
    this.draggableWord.fill("#4f46e5"); // default purple-blue tone

    // Remove any existing dragend listeners to avoid duplicates
    this.draggableWord.off("dragend");
    
    this.draggableWord.on("dragend", () => {
      const dx = Math.abs(this.draggableWord.x() - this.targetWord.x());
      const dy = Math.abs(this.draggableWord.y() - this.targetWord.y());

      if (dx < 80 && dy < 80) {
        this.draggableWord.position({
          x: this.targetWord.x(),
          y: this.targetWord.y(),
        });
        this.draggableWord.fill("#1e3a8a");

        const anim = new Konva.Animation((frame) => {
          const scale = 1 + 0.1 * Math.sin(frame.time * 0.02);
          this.draggableWord.scale({ x: scale, y: scale });
        }, this.group.getLayer());
        anim.start();

        setTimeout(() => {
          anim.stop();
          this.draggableWord.scale({ x: 1, y: 1 });
          onComplete();
        }, 800);
      }
    });
  }

  show(): void {
    this.group.visible(true);
  }

  hide(): void {
    this.group.visible(false);
  }

  // Responsive layout
  onResize(width: number, height: number): void {
    this.targetWord.x(width / 2 - 220);
    this.targetWord.y(height / 2 - 180);
    this.draggableWord.x(width / 2 - 220);
    this.draggableWord.y(height - 250);
  }

  //Reset "PLAY" to its starting position and color
  resetPlayPosition(): void {
    this.draggableWord.position({
      x: window.innerWidth / 2 - 220,
      y: window.innerHeight - 250,
    });
    this.draggableWord.fill("#4f46e5"); // default blue color
    this.draggableWord.scale({ x: 1, y: 1 });
  }  
}
