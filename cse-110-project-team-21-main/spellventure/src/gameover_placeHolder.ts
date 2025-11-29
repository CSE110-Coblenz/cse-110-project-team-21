(() => {
    // Read the parameters passed from the main game (optional)
    const params = new URLSearchParams(window.location.search);

    const game = params.get("game") || "";
    const score = Number(params.get("score") || "0");
    const hearts = Number(params.get("hearts") || "0");
    const reason = params.get("reason") || "Game Over";

    // Find the container element
    const container = document.getElementById("container") as HTMLDivElement | null;
    if (!container) {
        console.error("Missing #container element on gameover_placeHolder page");
        return;
    }

    // Clear any existing content
    container.innerHTML = "";

    // Title: Game Over + Score / Hearts
    const title = document.createElement("h2");
    title.style.textAlign = "center";
    title.style.marginTop = "48px";
    title.style.marginBottom = "32px";
    title.style.fontFamily = "Inter, Arial, sans-serif";
    title.style.color = "#f9fafb";
    title.innerText = `${reason}\nScore ${score} • Hearts ${hearts}`;
    container.appendChild(title);

    // Button panel wrapper
    const panel = document.createElement("div");
    panel.style.display = "flex";
    panel.style.flexDirection = "column";
    panel.style.gap = "16px";
    panel.style.marginTop = "20px";
    panel.style.alignItems = "center";
    container.appendChild(panel);

    // Small helper to style buttons consistently
    const styleButton = (btn: HTMLButtonElement) => {
        Object.assign(btn.style, {
        padding: "12px 24px",
        borderRadius: "12px",
        border: "none",
        fontWeight: "600",
        fontSize: "16px",
        cursor: "pointer",
        backgroundColor: "#374151",
        color: "#f9fafb",
        fontFamily: "Inter, Arial, sans-serif",
        });
    };

    // =============== Button 1: Go to Mini Game Selection ===============
    const backMini = document.createElement("button");
    backMini.textContent = "Play Mini Game to Earn Hearts";
    styleButton(backMini);

    backMini.onclick = () => {
        // Navigate back to the main app (index.html) and tell it
        // to open the "miniGameSelect" screen
        const url = new URL("/index.html", window.location.origin);
        url.searchParams.set("screen", "miniGameSelect");
        // Inform the mini-game to return to the main game and open MadLibs when finished
        // (mini-games can read this param and redirect back with bonusHearts/openMadLib)
        url.searchParams.set("returnTo", "game_openMadLib");

        // Optionally pass back game/score/hearts if needed
        if (game) url.searchParams.set("game", game);
        if (!Number.isNaN(score)) url.searchParams.set("score", String(score));
        if (!Number.isNaN(hearts)) url.searchParams.set("hearts", String(hearts));

        window.location.href = url.toString();
    };

    // =============== Button 2: Back to Main Game (Start Over) ===============
    const backMain = document.createElement("button");
    backMain.textContent = "Back to Spelling Adventure";
    styleButton(backMain);

    backMain.onclick = () => {
        // Go back to the main menu / PLAY screen
        // Redirect back to the main game and request opening the Mad Libs phase
        const url = new URL("/index.html", window.location.origin);
        url.searchParams.set("screen", "game");
        url.searchParams.set("bonusHearts", "1");
        url.searchParams.set("openMadLib", "true");
        window.location.href = url.toString();
    };

    // Append buttons to the panel
    panel.appendChild(backMini);
    panel.appendChild(backMain);
})();
