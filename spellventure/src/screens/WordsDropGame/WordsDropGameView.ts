import Konva from "konva";
import type { WordsDropGameModel } from "./WordsDropGameModel";

const CELL = 48;

export class WordsDropGameView {
  stage: Konva.Stage;
  gridLayer = new Konva.Layer();
  blockLayer = new Konva.Layer();
  uiLayer = new Konva.Layer();

  // visuals by id
  private blockNodes = new Map<string, Konva.Group>();

  // HUD
  private scoreText = new Konva.Text({ x: 8, y: 6, text: "", fontSize: 18, fontFamily: "Inter, Arial", fill: "#fff" });
  private heartText = new Konva.Text({ x: 160, y: 6, text: "", fontSize: 18, fontFamily: "Inter, Arial", fill: "#fff" });
  private timeText  = new Konva.Text({ x: 0, y: 6, text: "", fontSize: 18, fontFamily: "Inter, Arial", fill: "#fff" });

  private overlayGroup = new Konva.Group({ visible: false });

  constructor(container: string | HTMLDivElement, private model: WordsDropGameModel) {
    const WIDTH  = this.model.cols * CELL;
    const HEIGHT = this.model.rows * CELL;

    this.stage = new Konva.Stage({ container, width: WIDTH, height: HEIGHT });

    // Background + grid
    const bg = new Konva.Rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: "#0b1220" });
    this.gridLayer.add(bg);

    for (let r = 0; r < this.model.rows; r++) {
      for (let c = 0; c < this.model.cols; c++) {
        this.gridLayer.add(new Konva.Rect({
          x: c * CELL,
          y: r * CELL,
          width: CELL, height: CELL,
          stroke: "rgba(255,255,255,0.08)", strokeWidth: 1
        }));
      }
    }

    // HUD
    this.timeText.x(WIDTH - 120);
    this.uiLayer.add(this.scoreText, this.heartText, this.timeText);

    // Overlay (countdown / game over)
    const dim = new Konva.Rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: "black", opacity: 0.55 });
    const msg = new Konva.Text({
      name: "overlayText",
      text: "",
      x: 0, y: HEIGHT / 2 - 36, width: WIDTH,
      align: "center", fontSize: 140, fontStyle: "bold", fill: "#fff"
    });
    this.overlayGroup.add(dim, msg);
    this.uiLayer.add(this.overlayGroup);

    this.stage.add(this.gridLayer, this.blockLayer, this.uiLayer);

    // --- Auto-fit to 80% of the viewport, centered ---
    this.fitStage();
    window.addEventListener("resize", this.fitStage);
    window.addEventListener("orientationchange", this.fitStage);
  }

  


  updateHUD(score: number, hearts: number, timeLeft: number) {
    this.scoreText.text(`Score: ${score}`);
    this.heartText.text(`Hearts: ${hearts}`);
    this.timeText.text(`Time: ${Math.max(0, timeLeft)}s`);
    this.uiLayer.batchDraw();
  }

  renderGrid(grid: (any | null)[][]) {
    const presentIds = new Set<string>();
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c];
        if (!cell) continue;
        presentIds.add(cell.id);
        let g = this.blockNodes.get(cell.id);
        if (!g) {
          g = this.makeBlockNode(cell.word, cell.cat);
          this.blockNodes.set(cell.id, g);
          this.blockLayer.add(g);
        }
        g.position({ x: c * CELL, y: r * CELL });
      }
    }
    // remove nodes that disappeared
    for (const [id, node] of this.blockNodes.entries()) {
      if (!presentIds.has(id)) {
        node.destroy();
        this.blockNodes.delete(id);
      }
    }
    this.blockLayer.batchDraw();
  }

  renderPreview(block: { id: string; word: string; cat: string; row: number; col: number; }) {
    let g = this.blockNodes.get(block.id);
    if (!g) {
      g = this.makeBlockNode(block.word, block.cat);
      this.blockNodes.set(block.id, g);
      this.blockLayer.add(g);
    }
    g.position({ x: block.col * CELL, y: block.row * CELL });
    this.blockLayer.batchDraw();
  }

  showOverlay(text: string, visible: boolean) {
    const overlayText = this.overlayGroup.findOne<Konva.Text>('Text[name="overlayText"]');
    if (!overlayText) return;

    overlayText.text(text);
    this.overlayGroup.visible(visible);

    // ensure overlay is on top
    this.overlayGroup.moveToTop();

    // redraw entire stage to ensure visibility
    this.stage.draw();

    if (visible && text) {
      overlayText.scale({ x: 0.3, y: 0.3 });
      overlayText.opacity(1);

      overlayText.to({
        scaleX: 1,
        scaleY: 1,
        opacity: 0.15,
        duration: 0.9,
        easing: Konva.Easings.EaseOut
      });

    }
  }



  private makeBlockNode(word: string, cat: string): Konva.Group {
    const color =
      cat === "noun" ? "#2dd4bf" :
      cat === "verb" ? "#60a5fa" : "#f59e0b";
    const g = new Konva.Group();
    g.add(new Konva.Rect({
      x: 2, y: 2, width: 48 - 4, height: 48 - 4,
      cornerRadius: 8, fill: color, opacity: 0.9, shadowBlur: 6
    }));
    g.add(new Konva.Text({
      text: word, x: 2, y: 2, width: 48 - 4, height: 48 - 4,
      align: "center", verticalAlign: "middle",
      fontSize: 14, fontStyle: "bold", fill: "#0b1220"
    }));
    return g;
  }
  
  private fitStage = (): void => {
    const scale = 0.8; //  80% size of the screen
    const w = window.innerWidth * scale;
    const h = window.innerHeight * scale;

    // calculate scale factor
    const scaleX = w / (this.model.cols * CELL);
    const scaleY = h / (this.model.rows * CELL);
    const newScale = Math.min(scaleX, scaleY);

    this.stage.scale({ x: newScale, y: newScale });
    this.stage.size({
      width: this.model.cols * CELL * newScale,
      height: this.model.rows * CELL * newScale,
    });

    const container = this.stage.container() as HTMLDivElement;
    container.style.position = "absolute";
    container.style.left = "50%";
    container.style.top = "50%";
    container.style.transform = "translate(-50%, -50%)";
    container.style.backgroundColor = "#0b1220";
    container.style.borderRadius = "12px";
    container.style.boxShadow = "0 0 20px rgba(0,0,0,0.4)";

    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
  };

}
