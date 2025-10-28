// src/App.ts
import Konva from "konva";
import type { Screen, ScreenSwitcher } from "./types";

import MenuScreenController from "./controllers/MenuScreenController";
import GameScreenController from "./controllers/GameScreenController";
import ResultsScreenController from "./controllers/ResultsScreenController";
import DifficultyScreenController from "./controllers/DifficultyScreenController";
import NavBarController from "./controllers/NavBarController";
import HelpModalController from "./controllers/HelpModalController";

export default class App implements ScreenSwitcher {
    private helpClosedOnce = false;
    private stage: Konva.Stage;
    private layer: Konva.Layer;

  // Screens
    private menuController: MenuScreenController;
    private difficultyController: DifficultyScreenController;
    private gameController: GameScreenController;
    private resultsController: ResultsScreenController;

  // Global UI
    private navBarController: NavBarController;
    private helpModalController: HelpModalController;

  // Simple history stack for Back behavior
    private history: Screen[] = [];

    constructor(stage: Konva.Stage, layer: Konva.Layer) {
        this.stage = stage;
        this.layer = layer;

    // Instantiate controllers
    this.menuController = new MenuScreenController(this);
    this.difficultyController = new DifficultyScreenController(this);
    this.gameController = new GameScreenController(this);
    this.resultsController = new ResultsScreenController(this);

    this.navBarController = new NavBarController(this);
    this.helpModalController = new HelpModalController(this);

    // Add groups to the shared layer (z-order = add order)
    // 1) Screens (bottom)
    this.layer.add(this.menuController.getView().getGroup());
    this.layer.add(this.difficultyController.getView().getGroup());
    this.layer.add(this.gameController.getView().getGroup());
    this.layer.add(this.resultsController.getView().getGroup());
    // 2) Nav bar (always on top of screens)
    this.layer.add(this.navBarController.getView().getGroup());
    // 3) Help modal (overlay above nav + screens)
    this.layer.add(this.helpModalController.getView().getGroup());

    this.stage.add(this.layer);

    // Initial state: Menu + auto-open Help once
    this.switchToScreen({ type: "menu" }, false);
    this.openHelp(); // auto show instructions on first load
  }

  // ===== ScreenSwitcher API =====
  switchToScreen(screen: Screen, pushToHistory: boolean = true): void {
    // Hide all screens first
    this.menuController.hide();
    this.difficultyController.hide();
    this.gameController.hide();
    this.resultsController.hide();

    // Show target screen
    switch (screen.type) {
      case "menu":
        this.menuController.show();
        break;
      case "difficulty":
        this.difficultyController.show();
        break;
      case "game":
        this.gameController.show();
        break;
      case "result":
        this.resultsController.show();
        break;
      default:
        console.warn(`Unknown screen: ${screen.type}`);
    }

    // Always show nav bar (global HUD)
    this.navBarController.show();

    // Manage history stack (don’t push when we’re doing a replace-like navigation)
    if (pushToHistory) this.history.push(screen);

    this.layer.draw();
  }

  goBack(): void {
    // Need at least 2 entries to go back (current + previous)
    if (this.history.length <= 1) {
      // If no history to go back to, go home
      this.goHome();
      return;
    }
    // Pop current
    this.history.pop();
    // Show previous without pushing again
    const prev = this.history[this.history.length - 1];
    this.switchToScreen(prev, false);
  }

  goHome(): void {
    this.history = [];
    this.switchToScreen({ type: "menu" }, true);
  }

  openHelp(): void {
    this.helpModalController.show();
    this.layer.draw();
  }

  closeHelp(): void {
  this.helpModalController.hide();
  this.layer.draw();

  if (!this.helpClosedOnce) {
    this.helpClosedOnce = true;
    // Start the “assemble PLAY” intro
    this.menuController.startPlayIntro();
  }
 }
}