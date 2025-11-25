/**
 * @file App.ts
 * @brief Central navigation + orchestration layer for Spellventure.
 *
 * This class:
 *   - Boots the global Konva stage & layer
 *   - Instantiates every screen controller (Menu → Difficulty → Game → Results)
 *   - Provides the ScreenSwitcher API (switchToScreen / goBack / goHome / help modal)
 *   - Handles dev-only demo flags (?dev=madlib)
 *   - Routes resume flows for MadLib/WordLink after mini-games
 *   - Sends resize events to every controller that supports responsive layout
 *
 * Conceptually, **App.ts is the “router” + “scene manager” for the whole game.**
 * All views/controllers attach their Konva groups to a single shared layer.
 */

import Konva from "konva";
import type { Screen, ScreenSwitcher } from "./types";

import MenuScreenController from "./controllers/MenuScreenController";
import GameScreenController from "./controllers/GameScreenController";
import ResultsScreenController from "./controllers/ResultsScreenController";
import DifficultyScreenController from "./controllers/DifficultyScreenController";
import NavBarController from "./controllers/NavBarController";
import HelpModalController from "./controllers/HelpModalController";
import MiniResultsScreenController from "./screens/miniResultsScreen/miniResultsScreenController";
import MadLibPhaseController from "./controllers/MadLibPhaseController";

export default class App implements ScreenSwitcher {
  /**
   * @brief Tracks whether the help modal has ever been closed.
   *
   * Used so the menu screen’s intro animation doesn’t replay every time
   * the user returns home. The menu intro only plays **after closing Help
   * for the very first time.**
   */
  private helpClosedOnce = false;

  /** Global Konva stage & root layer (all UI nodes render inside this). */
  private stage: Konva.Stage;
  private layer: Konva.Layer;

  // ======================================================
  // Main screen controllers (normal game flow)
  // ======================================================
  private menuController: MenuScreenController;
  private difficultyController: DifficultyScreenController;
  private gameController: GameScreenController;
  private resultsController: ResultsScreenController;
  private miniResultsController: MiniResultsScreenController;

  // ======================================================
  // Global UI elements (always present except special screens)
  // ======================================================
  private navBarController: NavBarController;
  private helpModalController: HelpModalController;

  /**
   * @brief Navigation history stack for browser-like "Back" behavior.
   * Each call to switchToScreen() (unless disabled) pushes to this stack.
   */
  private history: Screen[] = [];

  /**
   * @param stage Konva Stage created in main.ts
   * @param layer Konva Layer for all screen groups to attach into
   */
  constructor(stage: Konva.Stage, layer: Konva.Layer) {
    this.stage = stage;
    this.layer = layer;

    //----------------------------------------------------------------------
    // DEV-ONLY FEATURE FLAG
    //----------------------------------------------------------------------
    // If the URL includes "?dev=madlib", we bypass the full game entirely
    // and load ONLY the MadLib screen. This is incredibly useful for:
    // - debugging layout
    // - grading demonstration
    // - quickly testing the MadLib logic in isolation
    const params = new URLSearchParams(window.location.search);
    const devMadLib = params.get("dev") === "madlib";

    //----------------------------------------------------------------------
    // Instantiate controllers normally (unless running in dev mode)
    //----------------------------------------------------------------------
    if (!devMadLib) {
      // Main 4-stage game flow
      this.menuController = new MenuScreenController(this);
      this.difficultyController = new DifficultyScreenController(this);
      this.gameController = new GameScreenController(this, this.stage, this.layer);
      this.resultsController = new ResultsScreenController(this);

      // Global UI
      this.navBarController = new NavBarController(this);
      this.helpModalController = new HelpModalController(this);
      this.miniResultsController = new MiniResultsScreenController(this);

      // Add all view groups to the shared Konva layer
      // (Render order matters: earlier added = lower on screen)
      this.layer.add(this.menuController.getView().getGroup());
      this.layer.add(this.difficultyController.getView().getGroup());
      this.layer.add(this.gameController.getView().getGroup());
      this.layer.add(this.resultsController.getView().getGroup());
      this.layer.add(this.navBarController.getView().getGroup());
      this.layer.add(this.helpModalController.getView().getGroup());
    }

    // Commit layer to stage
    this.stage.add(this.layer);

    console.log("✅ App initialized:", this.stage.width(), this.stage.height());

    //----------------------------------------------------------------------
    // INITIAL APP STATE: menu screen + help modal
    //----------------------------------------------------------------------
    if (!devMadLib) {
      this.switchToScreen({ type: "menu" }, false);
      this.openHelp(); // first-time onboarding
    } else {
      //------------------------------------------------------------------
      // DEV MODE: Load MadLib directly with a test story + test word set
      //------------------------------------------------------------------
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

      this.layer.removeChildren();

      const madLib = new MadLibPhaseController(
        this,
        (this as any).storyData.story,
        (this as any).storyData.wordSet
      );

      this.layer.add(madLib.getView().getGroup());
      this.layer.batchDraw();
    }

    //----------------------------------------------------------------------
    // Global: resize listener redirects updates to all controllers
    //----------------------------------------------------------------------
    window.addEventListener("resize", () => this.handleResize());
  }

  // ========================================================================
  // SCREEN SWITCHING — THE CORE ROUTER OF THE ENTIRE APP
  // ========================================================================
  /**
   * @brief Main navigation handler that shows/hides controllers depending
   *        on which screen object is passed.
   *
   * @param screen         Discriminated union describing the target screen.
   * @param pushToHistory  Whether this navigation should be added to the
   *                       back-navigation stack. Defaults to true.
   */
  switchToScreen(screen: Screen, pushToHistory: boolean = true): void {
    // Hide every normal screen before showing the new one
    this.menuController?.hide?.();
    this.difficultyController?.hide?.();
    this.gameController?.hide?.();
    this.resultsController?.hide?.();

    //----------------------------------------------
    // Main routing logic (branch on screen.type)
    //----------------------------------------------
    switch (screen.type) {
      case "menu":
        this.menuController.show();
        break;

      case "difficulty":
        this.difficultyController.show();
        break;

      case "game":
        this.gameController.show();

        // Inspect URL-driven resume flags
        console.log("App.switchToScreen → game flags:", {
          openMadLib: (screen as any).openMadLib,
          openWordLink: (screen as any).openWordLink,
          bonusHearts: (screen as any).bonusHearts,
        });

        // Resume directly to MadLib (used after mini-games)
        if ((screen as any).openMadLib) {
          (this.gameController as any).resumeToMadLib();
        }

        // Resume directly to WordLink
        if ((screen as any).openWordLink) {
          (this.gameController as any).resumeToWordLink();
        }

        // Apply hearts earned from mini-game
        if ((screen as any).bonusHearts > 0) {
          this.gameController.addHearts((screen as any).bonusHearts);
        }
        break;

      case "result":
        this.resultsController.show();
        break;

      case "mini_result":
        // Special overlay — skip NavBar
        this.miniResultsController.show({
          score: screen.score,
          hearts: screen.hearts,
          bonusHearts: screen.bonusHearts,
          from: screen.from,
        });
        return;

      case "miniGameSelect":
        // Lazy-load mini-game screen
        import("./screens/GameSelectScreen/GameSelectController").then(
          ({ GameSelectController }) => {
            const root = document.getElementById("container") as HTMLDivElement;
            root.innerHTML = "";
            new GameSelectController(root, this).start();
          }
        );
        return;

      case "drop":
        import("./screens/WordsDropGame/WordsDropGameController").then(
          ({ WordsDropGameController }) => {
            const root = document.getElementById("container")!;
            root.innerHTML = "";
            new WordsDropGameController(root, this);
          }
        );
        return;

      default:
        console.warn("⚠️ Unknown screen type:", screen.type);
    }

    // NavBar is visible for all normal screens
    this.navBarController.show();

    // Push navigation into history stack
    if (pushToHistory) this.history.push(screen);

    this.layer.batchDraw();
  }

  // ========================================================================
  // NAVIGATION ASSISTANTS
  // ========================================================================

  /** Clears only the game screen contents (used when returning home). */
  private clearGameContent(): void {
    const gameView = this.gameController.getView();
    if (gameView?.getGroup) {
      gameView.getGroup().destroyChildren();
    }
  }

  /** Navigate back one screen. If no history remains, return home. */
  goBack(): void {
    if (this.history.length <= 1) {
      this.goHome();
      return;
    }
    this.history.pop();
    this.switchToScreen(this.history[this.history.length - 1], false);
  }

  /**
   * @brief Return to main menu and reset onboarding intro logic.
   *
   * Behavior:
   *   - Clears history stack
   *   - Resets game content
   *   - Returns to menu
   *   - Shows Help if first time OR restarts intro animation if not
   */
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

  // ========================================================================
  // HELP MODAL LOGIC
  // ========================================================================
  openHelp(): void {
    this.helpModalController.show();
    this.layer.batchDraw();
  }

  closeHelp(): void {
    this.helpModalController.hide();
    this.layer.batchDraw();

    // First time closing help → trigger menu intro animation
    if (!this.helpClosedOnce) {
      this.helpClosedOnce = true;
      this.menuController.startPlayIntro();
    }
  }

  // ========================================================================
  // RESPONSIVE LAYOUT HANDLER
  // ========================================================================
  /**
   * @brief Resizes Konva stage to match its parent container and forwards
   *        new width/height to any controllers implementing onResize().
   */
  private handleResize(): void {
    const container = this.stage.container() as HTMLDivElement;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.stage.width(width);
    this.stage.height(height);

    // Forward to all controllers that implement onResize()
    (this.menuController as any).onResize?.(width, height);
    (this.difficultyController as any).onResize?.(width, height);
    (this.gameController as any).onResize?.(width, height);
    (this.resultsController as any).onResize?.(width, height);
    (this.navBarController as any).onResize?.(width, height);
    (this.helpModalController as any).onResize?.(width, height);

    this.layer.batchDraw();
  }
}
