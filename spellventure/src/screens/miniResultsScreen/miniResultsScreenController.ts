import type { ScreenSwitcher } from "../../types";
import { miniResultsScreenView } from "./miniResultsScreenView";

export default class MiniResultsScreenController {
  constructor(private app: ScreenSwitcher) {}

  //display the mini_game_results
  show(params: {
    score: number;
    hearts: number;
    bonusHearts?: number;
    from?: string;
  }) {
    const root = document.getElementById("container") as HTMLDivElement;
    if (!root) return;

    // Create view
    new miniResultsScreenView(root, params.score, params.hearts, () =>
      this.goBack()
    );
  }

  // placeholder，next show would re-write innerHTML
  hide() {
    // no-op
  }

  // return back to miniGameSelect
  private goBack() {
    this.app.switchToScreen({ type: "miniGameSelect" }, true);
  }
}
