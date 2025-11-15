import { WordBubbleGameView} from "./WordBubbleGameView";
import type { Category } from "./WordBubbleGameView";
import type { Bubble } from "./WordBubbleGameView";

import { wordBank } from "../../data/wordBank";

function pick<T>(arr: T[], k = 1): T[] {
    const a = [...arr];
    const out: T[] = [];
    while (out.length < k && a.length) {
        const i = Math.floor(Math.random() * a.length);
        out.push(a.splice(i, 1)[0]);
    }
    return out;
    }

    export class WordBubbleGameController {
    private view: WordBubbleGameView;
    private target: Category = "noun";
    private running = false;
    private timeLeft = 15;
    private score = 0;
    private hearts = 0;
    private ticker?: number;

    constructor(container: string | HTMLDivElement) {
        this.view = new WordBubbleGameView(container);
        this.view.onBack(() => (window.location.href = "/index.html"));
        this.showIntro();
    }

    // --- 游戏开始前 ---
    private async showIntro() {
        this.view.showOverlay("Word Bubble Game", "Only click the right category.\nReady?", true);
        await this.sleep(1500);
        await this.countdown321();
        await this.showFindTargetSlide();
        this.startGame();
    }

    private async countdown321() {
        for (const n of ["3", "2", "1"]) {
        this.view.showOverlay(n, "", true);
        new Audio("/sounds/beep.ogg").play().catch(() => {});
        await this.sleep(900);
        }
        this.view.showOverlay("", "", false);
    }

    private async showFindTargetSlide() {
        this.target = (["noun", "verb", "adj"] as Category[])[Math.floor(Math.random() * 3)];
        const msg = `Find all the ${this.target === "adj" ? "adjectives" : this.target + "s"}!`;
        this.view.showOverlay("Go!", msg, true);
        await this.sleep(1200);
        this.view.showOverlay("", "", false);
    }

    // --- 游戏进行 ---
    private startGame() {
        this.running = true;
        this.timeLeft = 15;
        this.score = 0;
        this.renderNewRound();

        this.ticker = window.setInterval(() => {
        if (!this.running) return;
        this.timeLeft--;
        this.view.updateHUD(this.score, this.hearts, this.timeLeft);
        if (this.timeLeft <= 0) this.endGame("Time Up");
        }, 3000);
    }

    private endGame(reason: string) {
        this.running = false;
        if (this.ticker) clearInterval(this.ticker);

        this.view.showOverlay(
        `Game Over — ${reason}\nScore ${this.score} • Hearts ${this.hearts}`,
        "Try again or Back to Mini Game Page",
        true
        );

        const dom = this.view["stage"].container() as HTMLDivElement;
        const panel = document.createElement("div");
        panel.style.position = "absolute";
        panel.style.left = "50%";
        panel.style.top = "68%";
        panel.style.transform = "translate(-50%,-50%)";
        panel.style.display = "flex";
        panel.style.gap = "12px";

        const again = document.createElement("button");
        again.textContent = "Try it again";
        again.onclick = () => window.location.reload();

        const back = document.createElement("button");
        back.textContent = "Back to Mini Game Page";
        back.onclick = () => (window.location.href = "/index.html");

        for (const b of [again, back]) {
        b.style.padding = "10px 14px";
        b.style.borderRadius = "10px";
        b.style.border = "none";
        b.style.fontWeight = "600";
        }

        panel.append(again, back);
        dom.append(panel);
    }

    // --- 回合逻辑 ---
    private renderNewRound() {
        const correctPool = this.poolFor(this.target);
        const wrongPool = this.poolFor(this.randomOther(this.target));

        const correctWords = pick(correctPool, 2 + Math.floor(Math.random() * 2)); // 2 or 3 correct
        const needed = 5 - correctWords.length;
        const wrongWords = pick(wrongPool, needed);

        const words = [
        ...correctWords.map((w) => ({ word: w, cat: this.target as Category })),
        ...wrongWords.map((w) => ({ word: w, cat: this.randomOther(this.target) as Category })),
        ];

        const slots = this.pickSlots(5);
        const bubbles: Bubble[] = words.map((w, i) => ({
        id: crypto.randomUUID(),
        word: w.word,
        cat: w.cat,
        slot: slots[i],
        }));

        this.view.renderBubbles(bubbles, (id) => this.handleClick(bubbles, id));
        this.view.updateHUD(this.score, this.hearts, this.timeLeft);
    }

    private handleClick(bubbles: Bubble[], id: string) {
        if (!this.running) return;
        const b = bubbles.find((x) => x.id === id);
        if (!b) return;

        if (b.cat === this.target) {
        this.score += 1;
        if (this.score > 0 && this.score % 10 === 0) this.hearts += 1;
        new Audio("/sounds/correct.ogg").play().catch(() => {});
        } else {
        this.score = Math.max(0, this.score - 1);
        new Audio("/sounds/wrong.ogg").play().catch(() => {});
        if (this.score === 0) return this.endGame("Score reached 0");
        }

        this.renderNewRound();
    }

    // --- 工具函数 ---
    private poolFor(cat: Category): string[] {
        return wordBank[cat];
    }

    private randomOther(cat: Category): Category {
        const arr: Category[] = ["noun", "verb", "adj"].filter((c) => c !== cat) as Category[];
        return arr[Math.floor(Math.random() * arr.length)];
    }

    private pickSlots(k: number): number[] {
        const all = Array.from({ length: 24 }, (_, i) => i);
        return pick(all, k);
    }

    private sleep(ms: number) {
        return new Promise((r) => setTimeout(r, ms));
    }
}
