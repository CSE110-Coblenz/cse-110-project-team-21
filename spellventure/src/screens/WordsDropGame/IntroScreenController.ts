import { WordsDropGameController } from "../WordsDropGame/WordsDropGameController";

export class IntroScreenController {
  constructor(private root: HTMLDivElement) {
    this.root.innerHTML = `
      <div style="text-align:center; font-family:sans-serif; padding-top:100px">
        <h1>WordBlock</h1>
        <p>Use ← → to move, Space/↓ to drop</p>
        <button id="startBtn" style="padding:10px 18px; font-size:16px">Start Game</button>
      </div>
    `;

    document.getElementById("startBtn")?.addEventListener("click", () => {
      // 播放点击音效（受全局 SoundManager 控制）
      new Audio("/sounds/click.wav").play().catch(() => {});

      // 切换到游戏页面
      this.root.innerHTML = "";
      setTimeout(() => {
        new WordsDropGameController(this.root);
      }, 200);
    });
  }
}
