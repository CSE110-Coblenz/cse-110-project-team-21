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

    window.addEventListener("resize", () => {
      const container = this.stage.container() as HTMLDivElement;
      const width = container.clientWidth;
      const height = container.clientHeight;

      this.stage.width(width);
      this.stage.height(height);

      // Let each controller update its own layout
      (this.menuController as any).onResize?.(width, height);
      (this.difficultyController as any).onResize?.(width, height);
      (this.gameController as any).onResize?.(width, height);
      (this.resultsController as any).onResize?.(width, height);
      (this.navBarController as any).onResize?.(width, height);
      (this.helpModalController as any).onResize?.(width, height);

      this.layer.batchDraw();
    });
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
    this.switchToScreen({ type: "menu" }, true);

    // ✅ Don't reopen help automatically after the first close
    if (!this.helpClosedOnce) {
      this.openHelp();
    } else {
      this.menuController.reset();
      this.menuController.startPlayIntro();
    }
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
      this.menuController.startPlayIntro();
    }
  }
}
