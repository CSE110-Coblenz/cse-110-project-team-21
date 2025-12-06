export class MenuScreenView {
  private container: HTMLElement;

  constructor(container: string | HTMLElement, onStart: () => void) {
    this.container = typeof container === "string"
      ? document.getElementById(container)!
      : container;

    this.container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:Inter,Arial;color:#fff;background:#0b1220;">
        <h1 style="margin-bottom:16px;font-size:32px;">WordBlockDrop</h1>
        <button id="startBtn" class="mini-btn cloud-btn">
      </div>
    `;

    const btn = this.container.querySelector<HTMLButtonElement>("#startBtn")!;
    btn.addEventListener("click", () => onStart());
  }
}

