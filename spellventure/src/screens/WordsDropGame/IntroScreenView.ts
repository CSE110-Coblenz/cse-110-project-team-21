export class MenuScreenView {
  private container: HTMLElement;

  constructor(container: string | HTMLElement, onStart: () => void) {
    this.container = typeof container === "string"
      ? document.getElementById(container)!
      : container;

    this.container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,Arial;color:#fff;background:#0b1220;">
        <h1 style="margin-bottom:16px;font-size:32px;">WordBlockDrop</h1>
        <button id="startBtn" style="padding:10px 24px;font-size:18px;border:none;border-radius:8px;background:#60a5fa;color:white;cursor:pointer;">Start Game</button>
      </div>
    `;

    const btn = this.container.querySelector<HTMLButtonElement>("#startBtn")!;
    btn.addEventListener("click", () => onStart());
  }
}

