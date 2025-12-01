import Konva from "konva";

export default class MenuScreenView {
  private group: Konva.Group;
  private backgroundGroup: Konva.Group;
  private backgroundAnim: Konva.Animation; 
  private title: Konva.Text;
  private targetWord: Konva.Text;
  private draggableWord: Konva.Text;

  constructor() {
    this.group = new Konva.Group();
    this.build();

    this.backgroundAnim = new Konva.Animation((frame) => {
      const timeDiff = (frame?.timeDiff || 0) / 1000; 
      this.animateBackground(timeDiff);
    }, this.group.getLayer());

    document.fonts.ready.then(() => {
      this.group.getLayer()?.batchDraw();
    });
  }

  private build(): void {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    this.createBackground(); 
    this.group.add(this.backgroundGroup);

    this.title = new Konva.Text({
      text: "SpellVenture",
      fontSize: 140,
      fontFamily: "Nabla", 
      width: window.innerWidth,
      align: "center",
      x: 0,
      y: centerY - 240,
      listening: false,
    });

    this.targetWord = new Konva.Text({
      text: "PLAY",
      fontSize: 100,
      fontFamily: "Kalnia Glaze",
      fill: "rgba(0,0,0,0.1)", 
      width: 400, 
      align: "center",
      x: centerX - 200, 
      y: centerY - 10,
      listening: false,
    });

    this.draggableWord = new Konva.Text({
      text: "PLAY",
      fontSize: 100,
      fontFamily: "Kalnia Glaze",
      fill: "#4f46e5",
      width: 400,
      align: "center",
      x: centerX - 200,
      y: window.innerHeight - 200, 
      draggable: true,
      shadowColor: "rgba(0,0,0,0.3)",
      shadowBlur: 10,
    });

    this.group.add(this.title, this.targetWord, this.draggableWord);
  }

  private createBackground(): void {
    this.backgroundGroup = new Konva.Group({ listening: false });
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ?!@#&";
    const width = window.innerWidth;
    const height = window.innerHeight;
    const count = 150; 

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
      const velocity = letter.getAttr('velocity');
      const rotSpeed = letter.getAttr('rotationSpeed');

      let newY = letter.y() - (velocity * dt);
      
      letter.rotation(letter.rotation() + (rotSpeed * dt));

      if (newY < -50) {
        newY = height + 50;
        letter.x(Math.random() * window.innerWidth); 
      }

      letter.y(newY);
    });
  }

  getGroup(): Konva.Group {
    return this.group;
  }

  startPlayIntro(onComplete: () => void): void {
    this.draggableWord.position({
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight - 200,
    });
    
    this.draggableWord.visible(true);
    this.draggableWord.fill("#4f46e5");
    this.draggableWord.draggable(true);

    this.draggableWord.off("dragend click tap mouseenter mouseleave");

    this.draggableWord.on("dragend", () => {
      const dx = Math.abs(this.draggableWord.x() - this.targetWord.x());
      const dy = Math.abs(this.draggableWord.y() - this.targetWord.y());

      if (dx < 80 && dy < 80) {
        this.draggableWord.position({
          x: this.targetWord.x(),
          y: this.targetWord.y(),
        });
        this.draggableWord.draggable(false);
        this.draggableWord.fill("#1e3a8a"); 

        this.draggableWord.on('mouseenter', () => {
          document.body.style.cursor = 'pointer';
        });
        this.draggableWord.on('mouseleave', () => {
          document.body.style.cursor = 'default';
        });

        this.draggableWord.on("click tap", () => {
            document.body.style.cursor = 'default';
            this.backgroundAnim.stop(); 
            onComplete();
        });
        
        this.group.getLayer()?.batchDraw();
      }
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

  onResize(width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    this.title.width(width);
    this.title.y(centerY - 280);

    this.targetWord.x(centerX - 200);
    this.targetWord.y(centerY - 50);
    
    if (this.draggableWord.draggable()) {
      this.draggableWord.x(centerX - 200);
      this.draggableWord.y(height - 200);
    } else {
      this.draggableWord.x(centerX - 200);
      this.draggableWord.y(centerY - 50);
    }
  }

  resetPlayPosition(): void {
    this.draggableWord.off("click tap mouseenter mouseleave");
    document.body.style.cursor = 'default';

    this.draggableWord.position({
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight - 200,
    });

    this.draggableWord.fill("#4f46e5");
    this.draggableWord.scale({ x: 1, y: 1 });
    this.draggableWord.draggable(true);
    
    if(!this.backgroundAnim.isRunning()) {
        this.backgroundAnim.start();
    }
  }  
}