import { WordBubbleGameView } from "./WordBubbleGameView";
import type { Category } from "./WordBubbleGameView";
import type { Bubble } from "./WordBubbleGameView";
import { wordBank } from "../../data/wordBank";
import type { ScreenSwitcher } from "../../types";

// Utility: randomly pick k unique items from array
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

    // Game logic states
    private target: Category = "noun";
    private running = false;
    private timeLeft = 30;
    private score = 0;
    private hearts = 0;            // hearts used inside minigame
    private bonusHearts = 0;       // hearts to send back to main game
    private ticker?: number;

    constructor(container: string | HTMLDivElement, private app: ScreenSwitcher) {
        this.view = new WordBubbleGameView(container);

        // Back button → back to main menu
        this.view.onBack(() => (window.location.href = "/index.html"));

        // Show intro flow
        this.showIntro();
    }

    // ---------------------------
    // Intro flow before game starts
    // ---------------------------
    private async showIntro() {
        this.view.showOverlay("Word Bubble Game", "Only click the right category.\nReady?", true);
        await this.sleep(1500);
        await this.countdown321();
        await this.showFindTargetSlide();
        this.startGame();
    }

    // Countdown overlay
    private async countdown321() {
        for (const n of ["3", "2", "1"]) {
        this.view.showOverlay(n, "", true);
        new Audio("/sounds/beep.ogg").play().catch(() => {});
        await this.sleep(900);
        }
        this.view.showOverlay("", "", false);
    }

    // Show instruction for chosen category
    private async showFindTargetSlide() {
        this.target = (["noun", "verb", "adj"] as Category[])[Math.floor(Math.random() * 3)];
        const msg = `Find all the ${this.target === "adj" ? "adjectives" : this.target + "s"}!`;
        this.view.showOverlay("Go!", msg, true);
        await this.sleep(1200);
        this.view.showOverlay("", "", false);
    }

    // ---------------------------
    // Start gameplay loop
    // ---------------------------
    private startGame() {
        this.running = true;
        this.timeLeft = 30;
        this.score = 0;
        this.hearts = 0;
        this.bonusHearts = 0; // reset bonus hearts at start

        this.renderNewRound();

        // countdown tick
        this.ticker = window.setInterval(() => {
        if (!this.running) return;
        this.timeLeft--;
        this.view.updateHUD(this.score, this.hearts, this.timeLeft);
        if (this.timeLeft <= 0) this.endGame("Time Up");
        }, 1000);
    }

    // ---------------------------
    // End the game and return result to mini game
    // ---------------------------
    private endGame(reason: string) {
        this.running = false;
        if (this.ticker) clearInterval(this.ticker);

        this.app.switchToScreen(
            {
            type: "mini_result",
            score: this.score,
            hearts: this.hearts,
            bonusHearts: this.bonusHearts,
            from: "bubble",
            },
            true
        );
    }



    // ---------------------------
    // Render a new round of words
    // ---------------------------
    private renderNewRound() {
        const correctPool = this.poolFor(this.target);
        const wrongPool = this.poolFor(this.randomOther(this.target));

        const correctWords = pick(correctPool, 2 + Math.floor(Math.random() * 2)); // 2–3 correct words
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

    // ---------------------------
    // Handle user clicking a bubble
    // ---------------------------
    private handleClick(bubbles: Bubble[], id: string) {
        if (!this.running) return;
        const b = bubbles.find((x) => x.id === id);
        if (!b) return;

        // Correct choice
        if (b.cat === this.target) {
            this.score += 1;

            // Add hearts every 10 points
            if (this.score > 0 && this.score % 10 === 0) {
                this.hearts += 1;       // shown in HUD
                this.bonusHearts += 1;  // ⭐ reward sent to main game
            }

            new Audio("/sounds/correct.ogg").play().catch(() => {});
        }
        // Wrong choice
        else {
            this.score = Math.max(0, this.score - 1);
            new Audio("/sounds/wrong.ogg").play().catch(() => {});
            //clear the timer , then end the game
            if (this.score === 0) {
                clearInterval(this.ticker);
                return this.endGame("Score reached 0");
            }
        }

        this.renderNewRound();
    }

    // ---------------------------
    // Helper utilities
    // ---------------------------
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
