import Konva from "konva";

export default class EasyModeController {
  private parentGroup: Konva.Group;
  private group: Konva.Group;
  private blanks: Konva.Text[] = [];
  private draggableWords: Konva.Text[] = [];
  private originalPos = new Map<Konva.Text, { x: number; y: number }>();

  private story =
    "The slow and steady tortoise beats the fast and bragging hare.";

  private missingWords = ["slow", "fast", "tortoise"];
  private distractors = ["hungry", "sad", "homework"];

  constructor(parentGroup: Konva.Group, onComplete: () => void) {
    this.parentGroup = parentGroup;
    this.group = new Konva.Group();
    this.parentGroup.add(this.group);

    const blankedStory = this.story
      .replace("slow", "____")
      .replace("tortoise", "________")
      .replace("fast", "____");

    this.drawStory(blankedStory);
    this.drawWordOptions(
      [...this.missingWords, ...this.distractors].sort(() => Math.random() - 0.5)
    );

    this.enableDrag(onComplete);
  }

  private drawStory(text: string) {
    const words = text.split(" ");
    let x = 50, y = 100;

    words.forEach((word) => {
      const isBlank = word.includes("_");

      const textNode = new Konva.Text({
        text: word,
        fontSize: 28,
        fontFamily: "Arial Black",
        fill: isBlank ? "#999" : "#000",
        x,
        y,
      });

      if (isBlank) this.blanks.push(textNode);
      this.group.add(textNode);

      x += word.length * 20 + 15;
      if (x > window.innerWidth - 200) {
        x = 50;
        y += 40;
      }
    });
  }

  private drawWordOptions(words: string[]) {
    let x = 50;
    let y = window.innerHeight - 180;

    words.forEach((word) => {
      const tile = new Konva.Text({
        text: word,
        fontSize: 28,
        fontFamily: "Arial Black",
        fill: "#4f46e5",
        draggable: true,
        x, y,
        shadowColor: "rgba(0,0,0,0.3)",
        shadowBlur: 5,
      });

      this.draggableWords.push(tile);
      this.originalPos.set(tile, { x, y });
      this.group.add(tile);

      x += word.length * 22 + 40;
      if (x > window.innerWidth - 200) {
        x = 50;
        y += 50;
      }
    });
  }

  private enableDrag(onComplete: () => void) {
    this.draggableWords.forEach((tile) => {
      tile.on("dragend", () => {
        let targetBlank: Konva.Text | undefined;

        // find closest blank to drop zone
        for (const blank of this.blanks) {
          const dx = Math.abs(tile.x() - blank.x());
          const dy = Math.abs(tile.y() - blank.y());

          if (dx < 80 && dy < 40) {
            targetBlank = blank;
            break;
          }
        }

        // not on a blank? snap back
        if (!targetBlank) {
          const orig = this.originalPos.get(tile);
          tile.position(orig!);
          this.group.getLayer()?.draw();
          return;
        }

        // handle replacing an existing word
        const prevWord = targetBlank.text();
        if (!prevWord.includes("_")) {
          const prevTile = this.draggableWords.find(t => t.text() === prevWord);
          if (prevTile) {
            const orig = this.originalPos.get(prevTile);
            prevTile.position(orig!);
          }
        }

        // fill blank with tile text
        targetBlank.text(tile.text());

        // correct vs wrong color
        if (this.missingWords.includes(tile.text())) {
          targetBlank.fill("#16a34a");
        } else {
          targetBlank.fill("#dc2626");
        }

        tile.position(targetBlank.position());
        this.group.getLayer()?.draw();

        // check if fully correct puzzle
        const allCorrect = this.blanks.every(
          b => this.missingWords.includes(b.text())
        );

        if (allCorrect) this.showWinScreen(onComplete);
      });
    });
  }

  private showWinScreen(onComplete: () => void) {
    const overlay = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      fill: "rgba(0,0,0,0.65)",
    });

    const message = new Konva.Text({
      text: "🎉 You got it!",
      fontSize: 40,
      fill: "#fff",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 80,
      width: 400,
      align: "center",
    });

    const button = new Konva.Rect({
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2,
      width: 200,
      height: 60,
      fill: "#4f46e5",
      cornerRadius: 10,
    });

    const btnText = new Konva.Text({
      text: "Next",
      fontSize: 26,
      fill: "#fff",
      x: window.innerWidth / 2 - 100,
      y: window.innerHeight / 2 + 15,
      width: 200,
      align: "center",
    });

    button.on("click", () => {
      overlay.destroy();
      message.destroy();
      button.destroy();
      btnText.destroy();
      onComplete();
    });

    this.group.add(overlay, message, button, btnText);
    this.group.getLayer()?.draw();
  }
}
