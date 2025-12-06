import { GameSelectModel } from "./GameSelectModel";
import { GameSelectView } from "./GameSelectView";
import { IntroScreenController } from "../WordsDropGame/IntroScreenController";
import { WordBubbleGameController } from "../WordBubbleGame/WordBubbleGameController";
import { WordsDropGameController } from "../WordsDropGame/WordsDropGameController";
//import { SoundManager } from "../../utils/SoundManager";
import type { ScreenSwitcher } from "../../types";  

export class GameSelectController {
    model: GameSelectModel;
    view: GameSelectView;
    private root: HTMLDivElement;

    constructor(container: string | HTMLDivElement, private app: ScreenSwitcher) {
        this.root =
        typeof container === "string"
            ? (document.getElementById(container) as HTMLDivElement)
            : container;
        this.model = new GameSelectModel();
        this.view = new GameSelectView(this.root);
    }

    start() {
        // --- rendering select button ---
        this.view.render(this.model.games, (id) => {
        if (!id) return;
        this.root.innerHTML = "";
        if (id === "drop") new IntroScreenController(this.root, this.app);
        else if (id === "bubble") new WordBubbleGameController(this.root, this.app);
        });

    }
}