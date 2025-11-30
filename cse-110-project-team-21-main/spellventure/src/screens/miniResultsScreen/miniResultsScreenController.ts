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

    // Create view with two actions: back to mini-game select, or return to main game
    new miniResultsScreenView(
      root,
      params.score,
      params.hearts,
      params.bonusHearts || 0,
      () => this.goBack(),
      () => this.returnToMainGame(params)
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

  // Return to the main game and pass along earned bonus hearts. Also request opening Mad Libs.
  private returnToMainGame(params: { score: number; hearts: number; bonusHearts?: number; from?: string; }) {
    const bonus = params.bonusHearts || 0;
    // The mini-games render directly into the #container and may remove the Konva canvas.
    // Do a full page redirect with query params so main.ts recreates the Konva stage and
    // resumes the correct in-game phase (WordLink or MadLib) depending on where the
    // mini-game was originally launched from. The original caller can set a
    // `returnTo` URL param when it redirected to the mini-game selection.
  const returnTo = new URLSearchParams(window.location.search).get('returnTo');
  console.log('miniResults: returnTo param ->', returnTo, 'earned bonus ->', bonus);
  const url = new URL('/index.html', window.location.origin);
    url.searchParams.set('screen', 'game');
    url.searchParams.set('bonusHearts', String(bonus));

    if (returnTo === 'game_openWordLink') {
      url.searchParams.set('openWordLink', 'true');
    } else {
      // Default to MadLib resume for backward compatibility
      url.searchParams.set('openMadLib', 'true');
    }

    window.location.href = url.toString();
  }
}
