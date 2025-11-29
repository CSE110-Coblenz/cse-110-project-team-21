import Konva from "konva";

export type Category = "noun" | "verb" | "adj";
export type Bubble = { id: string; word: string; cat: Category; slot: number };

const CELL = 96;             // grid cell size 4 * 6 size
const GRID_COLS = 6;
const GRID_ROWS = 4;
const MARGIN = 10;            // bubble margin to each other（>=10px）
const HUD_H = 56;

export class WordBubbleGameView {
    stage: Konva.Stage;
    bgLayer = new Konva.Layer();
    bubbleLayer = new Konva.Layer();
    uiLayer = new Konva.Layer();

    private overlay = new Konva.Group({ visible: false });
    private overlayText = new Konva.Text({ text: "", align: "center", fontSize: 38, fontStyle: "bold", fill: "#fff" });
    private overlaySub = new Konva.Text({ text: "", align: "center", fontSize: 20, fill: "#cbd5e1" });

    // HUD
    private scoreText = new Konva.Text({ x: 16, y: 12, fontSize: 18, fill: "#fff" });
    private heartText = new Konva.Text({ x: 160, y: 12, fontSize: 18, fill: "#fff" });
    private timeText  = new Konva.Text({ x: 0,  y: 12, fontSize: 18, fill: "#fff" });

    // return button
    private backBtn = new Konva.Label({ x: 16, y: 32 });
    private bubbleNodes = new Map<string, Konva.Group>();

    constructor(container: string | HTMLDivElement) {
        const WIDTH  = GRID_COLS * CELL + 2 * MARGIN;
        const HEIGHT = GRID_ROWS * CELL + HUD_H + 2 * MARGIN;

        this.stage = new Konva.Stage({ container, width: WIDTH, height: HEIGHT });

        // background
        const bg = new Konva.Rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: "#0b1220" });
        this.bgLayer.add(bg);

        // HUD
        this.timeText.x(WIDTH - 140);
        this.uiLayer.add(this.scoreText, this.heartText, this.timeText);

        //Back button only related to UI layer - events are bound in the controller
        const backRect = new Konva.Rect({ width: 68, height: 28, fill: "#e5e7eb", cornerRadius: 8, opacity: 0.9 });
        const backTxt  = new Konva.Text({ text: "← Back", fontSize: 16, padding: 6, fill: "#111827" });
        this.backBtn.add(backRect, backTxt);
        this.uiLayer.add(this.backBtn);

        // transparent Overlay
        const dim = new Konva.Rect({ x: 0, y: 0, width: WIDTH, height: HEIGHT, fill: "black", opacity: 0.55 });
        this.overlayText.width(WIDTH);
        this.overlaySub.width(WIDTH);
        this.overlayText.y(HEIGHT / 2 - 54);
        this.overlaySub.y(HEIGHT / 2 + 6);
        this.overlay.add(dim, this.overlayText, this.overlaySub);
        this.uiLayer.add(this.overlay);

        this.stage.add(this.bgLayer, this.bubbleLayer, this.uiLayer);

        // auto fit to screen , resize handling with 80% scale
        this.fitStage();
        window.addEventListener("resize", this.fitStage);
        window.addEventListener("orientationchange", this.fitStage);
    }

    // public event bindings
    onBack(handler: () => void) {
        this.backBtn.on("click", handler);
        this.backBtn.on("tap", handler);
    }

    updateHUD(score: number, hearts: number, timeLeft: number) {
        this.scoreText.text(`⭐ Score: ${score}`);
        this.heartText.text(`💖 Hearts: ${hearts}`);
        this.timeText.text(`⏱️ Time: ${Math.max(0, timeLeft)}s`);
        this.uiLayer.batchDraw();
    }

    showOverlay(title: string, sub: string = "", show = true) {
        this.overlayText.text(title);
        this.overlaySub.text(sub);
        this.overlay.visible(show);
        this.uiLayer.batchDraw();
    }

    // render 5 bubbles
    renderBubbles(bubbles: Bubble[], onClick: (id: string) => void) {
        this.bubbleLayer.destroyChildren();
        this.bubbleNodes.clear();

        for (const b of bubbles) {
        const [x, y] = this.gridSlotToXY(b.slot);
        const g = this.makeBubbleNode(b.word, b.cat);
        g.position({ x, y });
        g.on("click tap", () => onClick(b.id));
        this.bubbleLayer.add(g);
        this.bubbleNodes.set(b.id, g);
        }
        this.bubbleLayer.batchDraw();
    }

    //tool functions
    private gridSlotToXY(slot: number): [number, number] {
        // 0..23
        const c = slot % GRID_COLS;
        const r = Math.floor(slot / GRID_COLS);
        const cx = MARGIN + CELL * c + CELL / 2;
        const cy = HUD_H + MARGIN + CELL * r + CELL / 2;
        return [cx, cy];
    }

    private makeBubbleNode(word: string, cat: Category): Konva.Group {
            const new_COLORS = [
            "#C8E6C9", // green
            "#BBDEFB", // blue
            "#D1C4E9", // purple
            "#FFCCBC", // orange
            "#F8BBD0", // pink
            "#FFF9C4"  // yellow
        ];
        // randomly pick a color for the vocabulary 
        const color = new_COLORS[Math.floor(Math.random() * new_COLORS.length)];
        
        const r = Math.min(CELL, 96) / 2 - MARGIN; // radius
        const g = new Konva.Group();

        g.add(new Konva.Circle({
        radius: r,
        fill: color,
        shadowBlur: 8,
        opacity: 0.9
        }));
        
        g.add(new Konva.Text({
        text: word,
        fontSize: 20,
        fontStyle: "bold",
        fill: "#0b1220",
        width: r * 2,
        height: r * 2,
        align: "center",
        verticalAlign: "middle",
        offsetX: r,
        offsetY: r
        }));
        return g;
    }

    private fitStage = () => {
        const scale = 0.8;
        const w = window.innerWidth * scale;
        const h = window.innerHeight * scale;

        const designW = GRID_COLS * CELL + 2 * MARGIN;
        const designH = GRID_ROWS * CELL + HUD_H + 2 * MARGIN;

        const s = Math.min(w / designW, h / designH);
        this.stage.scale({ x: s, y: s });
        this.stage.size({ width: designW * s, height: designH * s });

        const el = this.stage.container() as HTMLDivElement;
        el.style.position = "absolute";
        el.style.left = "50%";
        el.style.top = "40%";
        el.style.transform = "translate(-50%,-50%)";
        el.style.background = "#0b1220";
        el.style.borderRadius = "12px";
        el.style.boxShadow = "0 0 20px rgba(0,0,0,.35)";

        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
    };
}
