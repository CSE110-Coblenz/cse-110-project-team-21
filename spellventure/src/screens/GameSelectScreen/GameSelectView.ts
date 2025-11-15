export class GameSelectView {
    container: HTMLDivElement;

    constructor(container: string | HTMLDivElement) {
        this.container = typeof container === "string" ? document.querySelector(container)! : container;
    }

    render(games: { id: string; name: string }[], onSelect: (id: string) => void) {
        this.container.innerHTML = `
        <div class="select-screen">
        <h1>Choose a Mini Game</h1>
        ${games.map(g => `<button data-id="${g.id}">${g.name}</button>`).join("")}
        </div>
        `;

        this.container.querySelectorAll("button").forEach(btn => {
        
        btn.addEventListener("click", () => {
        onSelect(String((btn as HTMLButtonElement).dataset.id));
        });
    });
    }
}