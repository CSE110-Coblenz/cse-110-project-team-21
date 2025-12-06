// src/screens/WordsDropGame/IntroScreenController.ts
import { WordsDropGameController } from "../WordsDropGame/WordsDropGameController";
import type { ScreenSwitcher } from "../../types";
export class IntroScreenController {
  private stylesInjected = false;

  constructor(private root: HTMLDivElement, private app: ScreenSwitcher) {
    // Inject unicorn background + cloud button styles once
    this.injectStyles();

    // Render intro screen layout
    this.root.innerHTML = `
      <div class="intro-wrapper-drop">
        <h1 class="intro-title-drop">Word Block Drop</h1>
        <p class="intro-sub-drop">Use ← → to move, Space / ↓ to drop</p>
        <p class="intro-sub-drop">Match 4 same 'grammatical category' to clear blocks and earn points!</p>
        <p class="intro-sub-drop">Every 10 remove gain 1 heart!</p>
        <button id="startBtn" class="cloud-btn-drop">
          Start Game
        </button>
      </div>
    `;

    // Wire up Start button
    const btn = document.getElementById("startBtn");
    btn?.addEventListener("click", () => {
      new Audio("/sounds/click.wav").play().catch(() => {});

      this.root.innerHTML = "";
      setTimeout(() => {
        this.app.switchToScreen({ type: "drop" }, true);
      }, 200);
    });
  }

  /**
   * Injects global CSS for the intro screen:
   * - soft gradient background
   * - centered layout
   * - marshmallow cloud button
   */
  private injectStyles() {
    // Avoid injecting the same <style> multiple times
    if (this.stylesInjected) return;
    this.stylesInjected = true;

    const style = document.createElement("style");
    style.innerHTML = `
      /* Full-page soft gradient background */

      @keyframes drop-bg-flow {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* Centered intro layout */
      .intro-wrapper-drop {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        text-align: center;
        color: #3f2a63;
      }

      .intro-title-drop {
        font-size: 3rem;
        margin-bottom: 24px;
        text-shadow: 2px 2px 6px rgba(255, 255, 255, 0.7);
      }

      .intro-sub-drop {
        font-size: 1.1rem;
        margin: 4px 0;
        opacity: 0.9;
      }

      /Cloud-shape marshmallow button：start btn to start the game/
      .cloud-btn-drop {
        margin-top: 32px;
        font-size: 1.4rem;
        padding: 26px 70px;
        border: none;
        cursor: pointer;
        color: #ffffff;
        font-weight: 700;

        /* Soft pastel gradient like marshmallow */
        background: radial-gradient(circle at 20% 30%, #ffe7ff 0, #ffb8ec 35%, #f29dff 60%, #c28dff 100%);
        background-size: 200% 200%;
        animation: drop-btn-flow 9s ease-in-out infinite;

        /* Make the base hit area big enough for the cloud */
        border-radius: 999px;

        /* EXAGGERATED cloud outline with bumps */
        clip-path: polygon(
          8% 55%,
          12% 40%,
          20% 28%,
          32% 20%,
          45% 17%,
          57% 20%,
          66% 16%,
          76% 18%,
          84% 25%,
          90% 36%,
          93% 48%,
          92% 60%,
          87% 72%,
          78% 82%,
          65% 90%,
          50% 93%,
          36% 90%,
          25% 86%,
          16% 78%,
          10% 68%
        );

        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.18);
        transition: transform 0.25s ease, box-shadow 0.25s ease;
      }

      /* Hover marshmallow bounce + glow */
      .cloud-btn-drop:hover {
        transform: scale(1.12) translateY(-6px);
        animation: drop-marshmallow-bounce 0.6s ease-out;
        box-shadow:
          0 0 18px rgba(255, 244, 210, 0.98),
          0 0 34px rgba(255, 215, 170, 0.8);
      }

    `;
    document.head.appendChild(style);
  }
}