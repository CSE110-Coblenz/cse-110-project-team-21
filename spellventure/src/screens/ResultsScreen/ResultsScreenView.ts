export class ResultsScreenView {
  constructor(
    container: string | HTMLElement,
    score: number,
    hearts: number,
    onBack: () => void
  ) {
    const root = typeof container === "string"
      ? document.getElementById(container)!
      : container;

    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,Arial;color:#fff;background:#0b1220;">
        <h1 style="font-size:32px;margin-bottom:20px;">Results</h1>
        <p style="font-size:22px;">Final Score: <b>${score}</b></p>
        <p style="font-size:22px;margin-bottom:30px;">Hearts: <b>${hearts}</b></p>
        <button id="homeBtn" aria-label="Return to Mini Game Page"
          style="padding:10px 24px;font-size:18px;border:none;border-radius:8px;background:#2dd4bf;color:#0b1220;cursor:pointer;">
          Return to Mini Game Page
        </button>
      </div>
    `;
    root.querySelector<HTMLButtonElement>("#homeBtn")!.addEventListener("click", onBack);
  }
}


/*export class ResultsScreenView {
  constructor(
    container: string | HTMLElement,
    score: number,
    hearts: number,
    onBack: () => void
  ) {
    const root =
      typeof container === "string"
        ? (document.getElementById(container) as HTMLElement)
        : container;

    // 小工具：批量设置 style
    const style = (el: HTMLElement, s: Partial<CSSStyleDeclaration>) =>
      Object.assign(el.style, s);

    // 清空容器
    root.replaceChildren();

    // 外层容器
    const wrap = document.createElement("div");
    style(wrap, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "Inter, Arial, sans-serif",
      color: "#fff",
      background: "#0b1220",
    });

    // 标题
    const h1 = document.createElement("h1");
    h1.textContent = "Results";
    style(h1, { fontSize: "32px", marginBottom: "20px" });

    // 分数
    const pScore = document.createElement("p");
    pScore.innerHTML = `Final Score: <b>${score}</b>`;
    style(pScore, { fontSize: "22px" });

    // Hearts
    const pHearts = document.createElement("p");
    pHearts.innerHTML = `Hearts: <b>${hearts}</b>`;
    style(pHearts, { fontSize: "22px", marginBottom: "30px" });

    // 返回按钮
    const btn = document.createElement("button");
    btn.id = "homeBtn";
    btn.type = "button";
    btn.textContent = "Return to Mini Game Page"; // <- 你想要的文案
    btn.setAttribute("aria-label", "Return to Mini Game Page");
    style(btn, {
      padding: "10px 24px",
      fontSize: "18px",
      border: "none",
      borderRadius: "8px",
      background: "#2dd4bf",
      color: "#0b1220",
      cursor: "pointer",
    });
    btn.addEventListener("click", onBack);

    // 组装
    wrap.append(h1, pScore, pHearts, btn);
    root.appendChild(wrap);
  }
}


/*
The version that used innerHTML to render the Results Screen.
export class ResultsScreenView {
  constructor(
    container: string | HTMLElement,
    score: number,
    hearts: number,
    onBack: () => void
  ) {
    const root = typeof container === "string"
      ? document.getElementById(container)!
      : container;

    root.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,Arial;color:#fff;background:#0b1220;">
        <h1 style="font-size:32px;margin-bottom:20px;">Results</h1>
        <p style="font-size:22px;">Final Score: <b>${score}</b></p>
        <p style="font-size:22px;margin-bottom:30px;">Hearts: <b>${hearts}</b></p>
        <button id="homeBtn" style="padding:10px 24px;font-size:18px;border:none;border-radius:8px;background:#2dd4bf;color:#0b1220;cursor:pointer;">Back</button>
      </div>
    `;
    root.querySelector<HTMLButtonElement>("#homeBtn")!.addEventListener("click", onBack);
  }
}
*/