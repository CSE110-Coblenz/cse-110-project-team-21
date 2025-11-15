// src/screens/BubbleGame/BubbleGameModel.ts
export type Bubble = {
    id: string;
    word: string;
    cat: "noun" | "verb" | "adj";
    x: number; // pixels
    y: number; // pixels
    vy: number; // pixels per second
    };

    const SAMPLE: Array<{ word: string; cat: "noun" | "verb" | "adj" }> = [
    { word: "run", cat: "verb" }, { word: "apple", cat: "noun" }, { word: "blue", cat: "adj" },
    { word: "jump", cat: "verb" }, { word: "book", cat: "noun" }, { word: "happy", cat: "adj" },
    ];

    function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }


    export class WordBubbleGameModel {
        score: number = 0;
        hearts: number = 0;
        timeLeft: number = 30;
        isRunning: boolean = true;

        constructor() {}

        resetGame() {
            this.score = 0;
            this.hearts = 0;
            this.timeLeft = 30;
            this.isRunning = true;
        }

        tick() {
            if (this.timeLeft > 0) {
            this.timeLeft--;
            } else {
            this.isRunning = false;
            }
        }

}
