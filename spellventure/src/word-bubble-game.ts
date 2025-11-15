//mini game (yanhua)
import { WordBubbleGameController } from "./screens/WordBubbleGame/WordBubbleGameController";

const root = document.getElementById("container") as HTMLDivElement;
if (!root) throw new Error("Missing #container");

new WordBubbleGameController(root);