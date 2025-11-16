import Konva from "konva";
import { SoundManager } from "../utils/SoundManager"; 

const width = window.innerWidth;

export default class NavBarView {
  private group: Konva.Group;
  private homeButton: Konva.Text;
  private backButton: Konva.Text;
  private helpButton: Konva.Text;
  private bg: Konva.Rect;
  private soundIcon: Konva.Text;

  

  constructor() {
    this.group = new Konva.Group();

    const barHeight = 60;

    // background bar
    this.bg = new Konva.Rect({
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: barHeight,
      fill: "#1e1e1e",
      opacity: 0.9,
    });

    this.homeButton = new Konva.Text({
      text: "🏠 Home",
      fontSize: 20,
      fill: "#ffffff",
      x: 20,
      y: 18,
    });

    this.backButton = new Konva.Text({
      text: "← Back",
      fontSize: 20,
      fill: "#ffffff",
      x: 130,
      y: 18,
    });

    // help button
    this.helpButton = new Konva.Text({
      text: "❓ Help",
      fontSize: 20,
      fill: "#ffffff",
      x: window.innerWidth - 100,
      y: 18,
    });

    this.helpButton.x(width - 60);
    this.helpButton.y(12);

    this.group.add(this.bg, this.homeButton, this.backButton, this.helpButton);
    this.group.visible(true);

    //add a Sound Button --Yanhua11/15
    this.soundIcon = new Konva.Text({
      text: SoundManager.isEnabled() ? "🔊" : "🔇",
      fontSize: 20,
      fill: "#e5e7eb",
    });
    this.soundIcon.x(this.helpButton.x() - 40); // <-- put on the left of the '?' by 40px
    this.soundIcon.y(this.helpButton.y());

    // === Add to group ===
    this.group.add(this.soundIcon);
    this.group.add(this.helpButton);

    // === Click event ===
    this.soundIcon.on("click tap", () => {
      const enabled = SoundManager.toggle();
      this.soundIcon.text(enabled ? "🔊" : "🔇");
      this.soundIcon.getLayer()?.batchDraw();
    });
  }

  
  getGroup() {
    return this.group;
  }

  onHomeClick(handler: () => void) {
    this.homeButton.on("click tap", handler);
  }

  onBackClick(handler: () => void) {
    this.backButton.on("click tap", handler);
  }

  onHelpClick(handler: () => void) {
    this.helpButton.on("click tap", handler);
  }

  show() {
    this.group.visible(true);
  }

  hide() {
    this.group.visible(false);
  }
}
