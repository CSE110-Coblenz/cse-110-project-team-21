// src/screens/GameSelectScreen/GameSelectView.ts
import "./GameSelectView.css";

export type MiniGame = {
  id: string;           // Unique string used to identify this mini-game (ex: "bubble", "drop")
  name: string;        // Text shown on the button (ex: "Word Bubble Game")
  description?: string; // Optional extra info (used for accessibility / tooltip)
};

export class GameSelectView {
    private root: HTMLDivElement; // The parent HTML container where this whole screen will be rendered

    constructor(root: HTMLDivElement) {
        this.root = root;  // Save the provided container for future rendering
    }

    /**
     * Render the “Choose a Mini Game” screen.
     *
     * This method replaces everything inside the root container with:
     *   - A title
     *   - A subtitle
     *   - A row of buttons (1 button for each mini-game)
     *
     * @param games - A list of mini games provided by the GameSelectModel
     * @param onSelect - A callback function. When a button is clicked, we pass the mini game id back.
     */
    render(games: MiniGame[], onSelect: (id: string) => void): void {
        // Remove all previous HTML inside root, so we start with a blank screen.
        // The root element itself stays in the DOM.
        this.root.innerHTML = "";

        // Apply the CSS class that gives this page its layout/background.
        // (Your CSS defines how the entire screen looks when selecting mini games.)
        this.root.className = "mini-game-root";

        // Create a wrapper <div> that will contain all elements on this screen.
        // This wrapper helps with centering and layout.
        const wrapper = document.createElement("div");
        wrapper.className = "mini-game-wrapper";

        // Create the main page title <h1>.
        // This will display "Choose a Mini Game" at the top of the screen.
        const title = document.createElement("h1");
        title.className = "mini-game-title";
        title.textContent = "Choose a Mini Game";

        // Create a subtitle/explanatory text <p>.
        // This line encourages players to play mini games to earn hearts.
        const subtitle = document.createElement("p");
        subtitle.className = "mini-game-subtitle";
        subtitle.textContent = "Earn extra hearts by playing a mini game!";

        // Create a container to hold the mini-game buttons.
        // This is usually a flexbox row defined in your CSS.
        const btnRow = document.createElement("div");
        btnRow.className = "mini-game-buttons";

        // Loop through every mini game in the list and create one button per game.
        for (const g of games) {
        // Create an actual <button> element.
        const btn = document.createElement("button");
        btn.type = "button"; // Ensures the button won’t accidentally submit forms.

        // Apply a base style + a unique class per game.
        // Example: "mini-game-btn mini-game-btn-bubble"
        btn.className = `mini-game-btn mini-game-btn-${g.id}`;

        // What the player sees on the button.
        btn.textContent = g.name;

        // Add ARIA name for accessibility screen readers (optional).
        // If description exists, we combine name + description so screen readers
        // can announce what this button does.
        if (g.description) {
            btn.setAttribute("aria-label", `${g.name}: ${g.description}`);
        }

        // Add a click listener to the button.
        //
        // When the player clicks:
        //   → call onSelect(...) and pass the game's id
        //   → this tells the controller "player chose this mini game"
        //
        // The controller will then switch screens based on this id.
        btn.addEventListener("click", () => onSelect(g.id));

        // Add the button into the row of buttons.
        btnRow.appendChild(btn);
        }

        // Add all parts into the wrapper in visual order:
        //   Title → Subtitle → Buttons
        wrapper.appendChild(title);
        wrapper.appendChild(subtitle);
        wrapper.appendChild(btnRow);

        // Finally, add the wrapper into the root container so it appears on the page.
        this.root.appendChild(wrapper);
    }
}

