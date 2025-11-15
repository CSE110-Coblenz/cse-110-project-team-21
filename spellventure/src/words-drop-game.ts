//mini game (yanhua)
import { WordsDropGameController} from "./screens/WordsDropGame/WordsDropGameController";

const root = document.getElementById("container") as HTMLDivElement;
if (!root) throw new Error("Missing #container");

new WordsDropGameController(root);