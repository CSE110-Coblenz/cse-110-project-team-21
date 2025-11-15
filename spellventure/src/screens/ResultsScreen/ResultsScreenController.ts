import { ResultsScreenView } from "../../screens/ResultsScreen/ResultsScreenView";
import { GameSelectController } from "../../screens/GameSelectScreen/GameSelectController";


function loadClick() {
  try {
    const a = new Audio("/sounds/click.wav");
    a.load();
    return a;
  } catch {
    return undefined;
  }
}

export class ResultsScreenController {
  private view: ResultsScreenView;
  private click = loadClick();

  constructor(container: string | HTMLDivElement, score: number, hearts: number) {
    const root =
      typeof container === "string"
        ? (document.getElementById(container) as HTMLDivElement)
        : (container as HTMLDivElement);

    this.view = new ResultsScreenView(root, score, hearts, () => this.backToMenu(root));
  }

  private backToMenu(root: HTMLDivElement) {
    this.click?.play().catch(() => {});
    root.innerHTML = "";
    new GameSelectController(root).start();
  }
}
