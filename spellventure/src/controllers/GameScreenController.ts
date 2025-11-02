// src/controllers/GameScreenController.ts
import Konva from "konva";
import type { ScreenSwitcher } from "../types";
import { GameState } from "../state/GameState";
import EasyModeController from "./EasyModeController";

export default class GameScreenController {
  private group: Konva.Group;
  private app: ScreenSwitcher;
  private stage:Konva.Stage;
  private layer: Konva.Layer;

  constructor(app: ScreenSwitcher, stage: Konva.Stage , layer:Konva.Layer) {
    this.app = app;
    this.stage = stage;
    this.layer = layer;
    this.group = new Konva.Group();
    let displayText = "Game Screen (placeholder)"
    const difficulty = GameState.load().getDifficulty();
    console.log("Difficulty loaded:", difficulty);
    //switch case for difficulty
    switch(difficulty){
      case "easy":
  new EasyModeController(this.group, () => {
    console.log("✅ Finished easy mode!");
  });
  return;
      case "medium":
        displayText = "Medium Mode-Coming soon";
        break;
      case "hard":
        displayText = "Hard Mode-Coming soon";
        break;        
    }

    const text = new Konva.Text({
      text: displayText,
      fontSize: 32,
      fill: "#333",
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 20,
      width: 400,
      align: "center",
    });
    this.group.add(text);
  }

  getView() {
    return { getGroup: () => this.group };
  }

  show() {
    this.group.visible(true);
  }

  hide() {
    this.group.visible(false);
  }
}
