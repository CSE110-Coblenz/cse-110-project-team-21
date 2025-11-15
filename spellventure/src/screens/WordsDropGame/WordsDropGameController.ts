import { WordsDropGameModel } from "./WordsDropGameModel";
import { WordsDropGameView } from "./WordsDropGameView";
import { GameSelectController } from "../GameSelectScreen/GameSelectController";

const POINTS_PER_HEART = 10;

export class WordsDropGameController {
  model: WordsDropGameModel;
  view: WordsDropGameView;
  private tickTimer?: number;
  private fallTimer?: number;
  private speedBoostTimer?: number;
  private dropInterval = 1200; // 初始下落间隔（毫秒）

  constructor(container: string | HTMLDivElement) {
    this.model = new WordsDropGameModel(90); // 游戏时长 90 秒
    this.view = new WordsDropGameView(container, this.model);

    this.bindKeys();
    this.countdownThenStart(); // 倒计时开始游戏
  }

  // --- 键盘控制 ---
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

  // --- 倒计时开始 ---
  private async countdownThenStart() {
    this.model.running = false;
    this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);

    for (let n = 3; n >= 1; n--) {
      this.view.showOverlay(`${n}`, true);
      new Audio("/sounds/beep.ogg").play().catch(() => {});
      await this.sleep(900);
    }
    this.view.showOverlay("", false);

    const spawned = this.model.spawn();
    if (!spawned) return this.end("Stack Overflow");
    this.view.renderPreview(spawned);

    this.model.running = true;
    this.startTimers();
  }

  // --- 下落逻辑 ---
  private drop() {
    const res = this.model.hardDrop();
    if (res.overflow) {
      this.end("Stack Overflow");
      return;
    }

    this.view.renderGrid(this.model.grid);

    if (res.cleared > 0) {
      this.model.score += res.cleared;
      if (this.model.score > 0 && this.model.score % POINTS_PER_HEART === 0) {
        this.model.hearts += 1;
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

  // --- 游戏计时器 ---
  private startTimers() {
    // 倒计时
    this.tickTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.model.timeLeft--;
      this.view.updateHUD(this.model.score, this.model.hearts, this.model.timeLeft);
      if (this.model.timeLeft <= 0) this.end("Time Up");
    }, 1000);

    // 方块下落
    this.fallTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.drop();
    }, this.dropInterval);

    // 每 5 秒提速 +3%
    this.speedBoostTimer = window.setInterval(() => {
      if (!this.model.running) return;
      this.dropInterval *= 0.97;
      clearInterval(this.fallTimer);
      this.fallTimer = window.setInterval(() => {
        if (!this.model.running) return;
        this.drop();
      }, this.dropInterval);
      console.log(`Speed increased! New interval: ${this.dropInterval.toFixed(0)}ms`);
    }, 5000);
  }

  // --- 游戏结束 ---
  private end(reason: string) {
    this.model.running = false;
    clearInterval(this.tickTimer);
    clearInterval(this.fallTimer);
    clearInterval(this.speedBoostTimer);

    this.view.showOverlay(
      `Game Over — ${reason}\nScore ${this.model.score} • Hearts ${this.model.hearts}`,
      true
    );

    new Audio("/sounds/wrong.ogg").play().catch(() => {});

    const root = document.getElementById("container") as HTMLDivElement;
    if (!root) return;

    const btns = [
      { label: "Try it again", action: () => this.restart() },
      { label: "Back to Mini Game Page", action: () => this.returnToMenu() },
    ];

    btns.forEach(({ label, action }, i) => {
      const btn = document.createElement("button");
      btn.textContent = label;
      Object.assign(btn.style, {
        position: "absolute",
        left: "50%",
        top: `${68 + i * 10}%`,
        transform: "translate(-50%, -50%)",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "none",
        fontWeight: "600",
        cursor: "pointer",
      });
      btn.onclick = action;
      root.append(btn);
    });
  }

  private restart() {
    const root = document.getElementById("container") as HTMLDivElement;
    if (!root) return;
    root.innerHTML = "";
    new WordsDropGameController(root);
  }

  private returnToMenu() {
    const root = document.getElementById("container") as HTMLDivElement;
    if (!root) return;
    root.innerHTML = "";
    new GameSelectController(root).start();
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
}
