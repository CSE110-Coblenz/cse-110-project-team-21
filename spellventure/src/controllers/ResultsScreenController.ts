// src/controllers/ResultsScreenController.ts
import Konva from "konva";
import type { ScreenSwitcher } from "../types";

export default class ResultsScreenController {
  private group: Konva.Group;
  private app: ScreenSwitcher;

  constructor(app: ScreenSwitcher) {
    this.app = app;
    this.group = new Konva.Group();

    const text = new Konva.Text({
      text: "Results Screen (placeholder)",
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
