import { GameSelectModel } from "./GameSelectModel";
import { GameSelectView } from "./GameSelectView";
import { IntroScreenController } from "../WordsDropGame/IntroScreenController";
import { WordBubbleGameController } from "../WordBubbleGame/WordBubbleGameController";
import { WordsDropGameController } from "../WordsDropGame/WordsDropGameController";
import { SoundManager } from "../../utils/SoundManager";

export class GameSelectController {
    model: GameSelectModel;
    view: GameSelectView;
    private root: HTMLDivElement;

    constructor(container: string | HTMLDivElement) {
        this.root =
        typeof container === "string"
            ? (document.getElementById(container) as HTMLDivElement)
            : container;
        this.model = new GameSelectModel();
        this.view = new GameSelectView(this.root);
    }

    start() {
        // --- 1️⃣ 渲染游戏选择按钮 ---
        this.view.render(this.model.games, (id) => {
        if (!id) return;
        this.root.innerHTML = "";
        if (id === "drop") new IntroScreenController(this.root);
        else if (id === "bubble") new WordBubbleGameController(this.root);
        });

        // --- 2️⃣ 创建 Sound ON/OFF 按钮 ---
        const soundBtn = document.createElement("button");
        soundBtn.id = "btnToggleSound";
        soundBtn.style.cssText = `
        padding: 8px 14px;
        font-size: 14px;
        display: block;
        margin: 30px auto 0;
        `;

        // 设置初始文字
        const setLabel = () => {
        soundBtn.textContent = SoundManager.isEnabled()
            ? "🔊 Sound: ON"
            : "🔇 Sound: OFF";
        };
        setLabel();

        // 点击切换全局状态
        soundBtn.addEventListener("click", () => {
        SoundManager.toggle();
        setLabel();
        // 播放点击反馈（如果开启）
        new Audio("/sounds/click.wav").play().catch(() => {});
        });

        // 包裹容器让按钮居中
        const soundRow = document.createElement("div");
        soundRow.style.cssText = "display:flex; justify-content:center; margin-top:24px;";
        soundRow.appendChild(soundBtn);
        this.root.appendChild(soundRow);

        // --- 3️⃣ 给 WordDrop 按钮绑定点击音效 ---
        document.getElementById("btnWordDrop")?.addEventListener("click", () => {
        new Audio("/sounds/click.wav").play().catch(() => {});
        this.root.innerHTML = "";
        setTimeout(() => {
            new WordsDropGameController(this.root);
        }, 150);
        });
    }
}
