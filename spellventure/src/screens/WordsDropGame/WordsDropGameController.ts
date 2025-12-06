import { WordsDropGameModel } from "./WordsDropGameModel";
import { WordsDropGameView } from "./WordsDropGameView";
import type { ScreenSwitcher } from "../../types";

// How many points are needed to earn 1 heart
const POINTS_PER_HEART = 10;

// Total game duration in seconds (change this to adjust game length)
const GAME_DURATION_SEC = 60;

// Initial falling interval in milliseconds
const INITIAL_DROP_INTERVAL = 2500;

export class WordsDropGameController {
  model: WordsDropGameModel;
  view: WordsDropGameView;

  // Reference to the app/router so we can go back to mini_result
  private app: ScreenSwitcher;

  // Hearts earned during this mini game (returned to main game)
  private bonusHearts = 0;

  // Timers for countdown, falling blocks, and speed boost
  private tickTimer?: number;
  private fallTimer?: number;
  private speedBoostTimer?: number;

  // Current falling interval; will get faster over time
  private dropInterval = INITIAL_DROP_INTERVAL;

  constructor(container: string | HTMLDivElement, app: ScreenSwitcher) {
    this.app = app;

    // Model starts with timeLeft = GAME_DURATION_SEC
    console.log("[DROP] Controller constructed");
    this.model = new WordsDropGameModel(GAME_DURATION_SEC);
    this.view = new WordsDropGameView(container, this.model);

    // Bind keyboard controls
    this.bindKeys();

    // Initialize HUD once so it shows the correct starting time/score
    this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

    // Start the 3-2-1 countdown, then begin gameplay
    this.countdown321();
  }

  /**
   * Small helper to wait for a given number of milliseconds.
   * Used by the 3-2-1 countdown animation.
   */
  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  // ===========================
  // KEYBOARD INPUTS
  // ===========================
  /**
   * Binds global keydown events to control the falling block:
   *  - Left / A  → move left
   *  - Right / D → move right
   *  - Space / Down → hard drop
   */
  private bindKeys() {
    window.addEventListener("keydown", (e) => {
      if (!this.model.running) return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
          this.model.move(-1);
          if (this.model.current) this.view.renderPreview(this.model.current);
          new Audio("/sounds/click.wav").play().catch(() => {});
          break;

        case "ArrowRight":
        case "d":
          this.model.move(1);
          if (this.model.current) this.view.renderPreview(this.model.current);
          new Audio("/sounds/click.wav").play().catch(() => {});
          break;

        case " ":
        case "ArrowDown":
          e.preventDefault();
          new Audio("/sounds/click.wav").play().catch(() => {});
          this.drop();
          break;
      }
    });
  }

  // ===========================
  // 3-2-1 COUNTDOWN BEFORE PLAY
  // ===========================
  /**
   * Shows a full-screen overlay with "3", "2", "1" then starts the game.
   * During the countdown, the game is not running.
   */
  private async countdown321() {
    console.log("[DROP] countdown321 start");

    // Game is paused during countdown
    this.model.running = false;

    // Show the initial HUD (score/hearts/time)
    this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

    // Show "3", "2", "1" with a short beep each time
    for (const n of ["3", "2", "1"]) {
      console.log("[DROP] show overlay:", n);
      this.view.showOverlay(n, true);
      new Audio("/sounds/beep.ogg").play().catch(() => {});
      await this.sleep(900);
    }

    // Hide overlay before gameplay
    this.view.showOverlay("", false);

    // Spawn the first block
    const spawned = this.model.spawn();
    if (!spawned) {
      // If we cannot spawn even the first block, treat it as overflow
      return this.end("Stack Overflow");
    }
    this.view.renderPreview(spawned);

    // Reset timeLeft to the configured game duration,
    // then mark the game as running and start timers.
    this.model.timeLeft = GAME_DURATION_SEC;
    this.model.running = true;
    this.startTimers();
  }

  // ===========================
  // HARD DROP LOGIC
  // ===========================
  /**
   * Performs a "hard drop" of the current block:
   *  - Moves it down to the landing row
   *  - Clears clusters (if any)
   *  - Updates score and hearts
   *  - Spawns the next block or ends the game on overflow
   */
  private drop() {
    const res = this.model.hardDrop();

    // If the stack overflows, end the game
    if (res.overflow) {
      this.end("Stack Overflow");
      return;
    }

    // Redraw the grid based on the updated model
    this.view.renderGrid(this.model.grid);

    // If a cluster was cleared, update score and hearts
    if (res.cleared > 0) {
      this.model.score += res.cleared;

      // Earn hearts when score crosses multiples of POINTS_PER_HEART
      if (this.model.score > 0 && this.model.score % POINTS_PER_HEART === 0) {
        this.model.hearts += 1;
        this.bonusHearts += 1;
      }

      new Audio("/sounds/correct.ogg").play().catch(() => {});
    }

    // Update HUD after scoring and/or time changes
    this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

    // Spawn the next falling block
    const spawned = this.model.spawn();
    if (!spawned) {
      this.end("Stack Overflow");
      return;
    }

    this.view.renderPreview(spawned);
  }

  // ===========================
  // GAME TIMERS (TIME + FALL SPEED)
  // ===========================
  /**
   * Starts three timers:
   *  - tickTimer: counts down the remaining time each second
   *  - fallTimer: repeatedly drops the current block
   *  - speedBoostTimer: accelerates the falling speed over time
   */
  private startTimers() {
    // 1) Countdown timer (decrease timeLeft every second)
    this.tickTimer = window.setInterval(() => {
      if (!this.model.running) return;

      this.model.timeLeft--;
      this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

      if (this.model.timeLeft <= 0) {
        this.end("Time Up");
      }
    }, 1000);

    // 2) Falling blocks timer
    this.fallTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.drop();
    }, this.dropInterval);

    // 3) Speed boost timer (shorten dropInterval every 5 seconds)
    this.speedBoostTimer = window.setInterval(() => {
      if (!this.model.running) return;

      // Make falling faster gradually
      this.dropInterval *= 0.9;

      // Restart the fall timer with the new, faster interval
      clearInterval(this.fallTimer);
      this.fallTimer = window.setInterval(() => {
        if (!this.model.running) return;
        this.drop();
      }, this.dropInterval);
    }, 5000);
  }

  // ===========================
  // END GAME → GO TO MINI RESULT SCREEN
  // ===========================
  /**
   * Stops the game, clears all timers, and navigates to the mini_result screen.
   * The mini_result screen will receive the score, hearts, and bonusHearts.
   */
  private end(reason: string) {
    console.log("[DROP] end:", reason);

    this.model.running = false;

    clearInterval(this.tickTimer);
    clearInterval(this.fallTimer);
    clearInterval(this.speedBoostTimer);

    // Back to mini_ResultScreen (Konva / main app router)
    this.app.switchToScreen(
      {
        type: "mini_result",
        score: this.model.score,
        hearts: this.model.hearts,
        bonusHearts: this.bonusHearts,
        from: "drop",
      },
      true
    );
  }
}