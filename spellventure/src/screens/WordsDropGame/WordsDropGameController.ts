import { WordsDropGameModel } from "./WordsDropGameModel";
import { WordsDropGameView } from "./WordsDropGameView";
import type { ScreenSwitcher } from "../../types";


const POINTS_PER_HEART = 10;

export class WordsDropGameController {
  model: WordsDropGameModel;
  view: WordsDropGameView;
  private bonusHearts = 0;
  private tickTimer?: number;
  private fallTimer?: number;
  private speedBoostTimer?: number;
  private dropInterval = 1200;
  private sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

  constructor(container: string | HTMLDivElement, 
    private app: ScreenSwitcher) {

    console.log("[DROP] Controller constructed"); 
    this.model = new WordsDropGameModel(90);
    this.view = new WordsDropGameView(container, this.model);

    this.bindKeys();

    // countdownThenStart()
    this.countdown321();
  }

  // ===========================
  // KEYBOARD INPUTS
  // ===========================
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
  // NEW COUNTDOWN (321)
  // ===========================
  private async countdown321() {
    console.log("[DROP] countdown321 start");
    // Stop game while showing countdown
    this.model.running = false;
    this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

    // Show "3 2 1" like Bubble game
    for (const n of ["3", "2", "1"]) {
      console.log("show overlay:", n);
      this.view.showOverlay(n, true);               // WordDrop uses (text, visible)
      new Audio("/sounds/beep.ogg").play().catch(() => {});
      await this.sleep(900);
    }

    this.view.showOverlay("", false);

    // Spawn first block
    const spawned = this.model.spawn();
    if (!spawned) return this.end("Stack Overflow");
    this.view.renderPreview(spawned);

    // Begin gameplay
    this.model.running = true;
    this.startTimers();
  }

  // ===========================
  // Hard drop block
  // ===========================
  private drop() {
    const res = this.model.hardDrop();
    if (res.overflow) {
      this.end("Stack Overflow");
      return;
    }

    this.view.renderGrid(this.model.grid);

    if (res.cleared > 0) {
      this.model.score += res.cleared;

      // Earn hearts by score
      if (this.model.score > 0 && this.model.score % POINTS_PER_HEART === 0) {
        this.model.hearts += 1;
        this.bonusHearts += 1;
      }

      new Audio("/sounds/correct.ogg").play().catch(() => {});
    }

    this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

    const spawned = this.model.spawn();
    if (!spawned) {
      this.end("Stack Overflow");
      return;
    }
    this.view.renderPreview(spawned);
  }

  // ===========================
  // Game Timers
  // ===========================
  private startTimers() {
    // Countdown timer
    this.tickTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.model.timeLeft--;
      this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);
      if (this.model.timeLeft <= 0) this.end("Time Up");
    }, 1000);

    // Falling blocks
    this.fallTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.drop();
    }, this.dropInterval);

    // Speed increase every 5s
    this.speedBoostTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.dropInterval *= 0.9;
      clearInterval(this.fallTimer);
      this.fallTimer = window.setInterval(() => {
        if (!this.model.running) return;
        this.drop();
      }, this.dropInterval);
    }, 5000);
  }

  // ===========================
  // END GAME → go to result page
  // ===========================
    private end(reason: string) {
      this.model.running = false;
      clearInterval(this.tickTimer);
      clearInterval(this.fallTimer);
      clearInterval(this.speedBoostTimer);

      // back to mini_ResultScreen
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