// src/screens/miniResultsScreen/miniResultsScreenView.ts
export class miniResultsScreenView {
  constructor(
    container: string | HTMLElement,
    score: number,
    hearts: number,
    bonusHearts: number,
    onBack: () => void,
    onReturnToGame: () => void
  ) {
    const root =
      typeof container === "string"
        ? document.getElementById(container)!
        : (container as HTMLElement);

    root.innerHTML = `
      <div style="
        width:100vw;
        height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#0b1220;
        font-family:Inter,Arial;
        color:white;
      ">
        <div style="
          text-align:center;
          padding:40px 60px;
          background:#0f172a;
          border-radius:16px;
          box-shadow:0 0 30px rgba(0,0,0,0.35);
          min-width:320px;
        ">
          <h1 style="font-size:32px;margin-bottom:24px;">Results</h1>

          <p style="font-size:22px;margin:6px 0;">
            Final Score: <b>${score}</b>
          </p>
          <p style="font-size:22px;margin-bottom:24px;">
            Hearts: <b>${hearts}</b>
          </p>

          <div style="display:flex;flex-direction:column;gap:14px;margin-top:10px;">
            <button id="backMiniBtn" style="
              padding:12px 20px;
              font-size:18px;
              border:none;
              border-radius:10px;
              background:#2dd4bf;
              color:#0b1220;
              cursor:pointer;
              font-weight:600;
            ">
              ← Return to Mini Game Select
            </button>

            ${
              bonusHearts > 0
                ? `
            <button id="returnMainBtn" style="
              padding:12px 20px;
              font-size:18px;
              border:none;
              border-radius:10px;
              background:#60a5fa;
              color:#0b1220;
              cursor:pointer;
              font-weight:600;
            ">
              Return to Main Game (+${bonusHearts} hearts)
            </button>`
                : ``
            }
          </div>
        </div>
      </div>
    `;

    root.querySelector("#backMiniBtn")!.addEventListener("click", onBack);

    const btn = root.querySelector("#returnMainBtn");
    if (btn) btn.addEventListener("click", onReturnToGame);
  }
}