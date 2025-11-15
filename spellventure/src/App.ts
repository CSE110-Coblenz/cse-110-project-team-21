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

  // History stack for navigation
  private history: Screen[] = [];

  constructor(stage: Konva.Stage, layer: Konva.Layer) {
    this.stage = stage;
    this.layer = layer;

    // === Instantiate screen controllers ===
    this.menuController = new MenuScreenController(this);
    this.difficultyController = new DifficultyScreenController(this);
    this.gameController = new GameScreenController(this, this.stage, this.layer); 
    this.resultsController = new ResultsScreenController(this);


    // === Global UI ===
    this.navBarController = new NavBarController(this);
    this.helpModalController = new HelpModalController(this);

    // === Attach all screen groups (bottom to top z-order) ===
    this.layer.add(this.menuController.getView().getGroup());
    this.layer.add(this.difficultyController.getView().getGroup());
    this.layer.add(this.gameController.getView().getGroup());
    this.layer.add(this.resultsController.getView().getGroup());
    this.layer.add(this.navBarController.getView().getGroup());
    this.layer.add(this.helpModalController.getView().getGroup());

    this.stage.add(this.layer);

    console.log("✅ App initialized with stage:", this.stage.width(), this.stage.height());

    // === Initial State ===
    this.switchToScreen({ type: "menu" }, false);
    this.openHelp();

    // === Handle Resizing ===
    window.addEventListener("resize", () => this.handleResize());
  }

  /** ===== ScreenSwitcher API ===== */

  switchToScreen(screen: Screen, pushToHistory: boolean = true): void {
    // Hide all screens
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
        console.warn(`⚠️ Unknown screen type: ${screen.type}`);
    }

    // Always show navbar (global HUD)
    this.navBarController.show();

    // Manage navigation history
    if (pushToHistory) this.history.push(screen);

    this.layer.batchDraw();
  }

  /** Clears game-specific content from the layer without destroying screen groups */
  private clearGameContent(): void {
    // Get the game controller's group and remove its children
    const gameView = this.gameController.getView();
    if (gameView && gameView.getGroup) {
      const gameGroup = gameView.getGroup();
      gameGroup.destroyChildren();
    }
  }

  goBack(): void {
    if (this.history.length <= 1) {
      this.goHome();
      return;
    }
    this.history.pop();
    const prev = this.history[this.history.length - 1];
    this.switchToScreen(prev, false);
  }

  goHome(): void {
    this.history = [];
    this.clearGameContent();
    this.switchToScreen({ type: "menu" }, true);

    if (!this.helpClosedOnce) {
      this.openHelp();
    } else {
      this.menuController.reset();
      this.menuController.startPlayIntro();
    }
  }

  /** ===== Global Help Modal ===== */

  openHelp(): void {
    this.helpModalController.show();
    this.layer.batchDraw();
  }

  closeHelp(): void {
    this.helpModalController.hide();
    this.layer.batchDraw();

    if (!this.helpClosedOnce) {
      this.helpClosedOnce = true;
      this.menuController.startPlayIntro();
    }
  }

  /** ===== Handle window resizing ===== */
  private handleResize(): void {
    const container = this.stage.container() as HTMLDivElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.stage.width(width);
    this.stage.height(height);

    (this.menuController as any).onResize?.(width, height);
    (this.difficultyController as any).onResize?.(width, height);
    (this.gameController as any).onResize?.(width, height);
    (this.resultsController as any).onResize?.(width, height);
    (this.navBarController as any).onResize?.(width, height);
    (this.helpModalController as any).onResize?.(width, height);

    this.layer.batchDraw();
  }
}
