// src/App.ts
import Konva from "konva";
import type { Screen, ScreenSwitcher } from "./types";

import MenuScreenController from "./controllers/MenuScreenController";
import GameScreenController from "./controllers/GameScreenController";
import ResultsScreenController from "./controllers/ResultsScreenController";
import DifficultyScreenController from "./controllers/DifficultyScreenController";
import NavBarController from "./controllers/NavBarController";
import HelpModalController from "./controllers/HelpModalController";
import MadLibPhaseController from "./controllers/MadLibPhaseController";

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

    // runtime dev flag: append ?dev=madlib to the URL to launch only MadLib phase
    const params = new URLSearchParams(window.location.search);
    const devMadLib = params.get("dev") === "madlib";

    // === Instantiate screen controllers ===
    if (!devMadLib) {
      this.menuController = new MenuScreenController(this);
      this.difficultyController = new DifficultyScreenController(this);
      this.gameController = new GameScreenController(this, this.stage, this.layer);
      this.resultsController = new ResultsScreenController(this);
    }

    // === Global UI === (only instantiate in normal mode)
    if (!devMadLib) {
      this.navBarController = new NavBarController(this);
      this.helpModalController = new HelpModalController(this);

      // === Attach all screen groups (bottom to top z-order) ===
      this.layer.add(this.menuController.getView().getGroup());
      this.layer.add(this.difficultyController.getView().getGroup());
      this.layer.add(this.gameController.getView().getGroup());
      this.layer.add(this.resultsController.getView().getGroup());
      this.layer.add(this.navBarController.getView().getGroup());
      this.layer.add(this.helpModalController.getView().getGroup());
    }

    this.stage.add(this.layer);

    console.log("✅ App initialized with stage:", this.stage.width(), this.stage.height());

    // === Initial State ===
    if (!devMadLib) {
      // Normal app: show menu and help
      this.switchToScreen({ type: "menu" }, false);
      this.openHelp();
    } else {
      // Dev mode: directly launch MadLibs only (no other controllers/UI)
      (this as any).storyData = {
        story: `
  Wow! Today my [adjective] teacher marched in with a [noun] and said we'd
  study [subject] by teaching a [animal] to [verb]. It sounded [adjective],
  but we brought our [noun] and some [food]. At recess we saw a [animal]
  try to [verb] a [noun], and everyone shouted "Wow!"`,
        wordSet: [
          { word: "surprised", type: "adjective" },
          { word: "bucket", type: "noun" },
          { word: "hippo", type: "noun" },
          { word: "math", type: "subject" },
          { word: "dog", type: "animal" },
          { word: "cheetah", type: "animal" },
          { word: "fetch", type: "verb" },
          { word: "scratch", type: "verb" },
          { word: "funny", type: "adjective" },
          { word: "snack", type: "noun" },
          { word: "pizza", type: "food" }
        ]
      };

      // Clear any existing children and add only the MadLib view
      this.layer.removeChildren();
      const madLib = new MadLibPhaseController(this, (this as any).storyData.story, (this as any).storyData.wordSet);
      this.layer.add(madLib.getView().getGroup());
      this.layer.batchDraw();
    }
    

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
