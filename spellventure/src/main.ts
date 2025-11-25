import Konva from "konva";
import App from "./App";

// -------------------------------------------------------------
// 1. Grab the container DIV from index.html.
//    This div is REQUIRED because Konva attaches its <canvas>
//    inside this element. If this element doesn't exist, the
//    game cannot render, so we throw a hard error.
// -------------------------------------------------------------
const container = document.getElementById("container");
if (!container) {
  throw new Error("❌ Missing <div id='container'> element in index.html");
}

// -------------------------------------------------------------
// 2. Create the Konva stage.
//    - 'container' must match the ID of the div in index.html
//    - width/height come from the actual pixel size of the div
//
//    Konva.Stage = the root canvas for the entire game.
//    Everything we draw (characters, UI, animations) lives here.
// -------------------------------------------------------------
const stage = new Konva.Stage({
  container: "container",            // MUST match <div id="container">
  width: container.clientWidth,      // exact width of the container div
  height: container.clientHeight,    // exact height of the container div
});

// -------------------------------------------------------------
// 3. Create the shared Konva layer.
//    Think of a "layer" as a folder of shapes on the canvas.
//    We use ONE shared layer for the whole game.
// -------------------------------------------------------------
const layer = new Konva.Layer();
stage.add(layer);

// -------------------------------------------------------------
// 4. Initialize the main App.
//    App is the brain of navigation:
//    - manages Menu, Difficulty, Game, Results, MiniGames
//    - creates/controls all controllers + views
// -------------------------------------------------------------
const app = new App(stage, layer);

// -------------------------------------------------------------
// 5. OPTIONAL: Screen selection by URL parameters.
//    This is used for debugging or jumping directly into states.
//    
//    Example URLs:
//      index.html?screen=game
//      index.html?screen=result&bonusHearts=2
// -------------------------------------------------------------

// Parse the query string of the URL.
// Example: "?screen=game&bonusHearts=2"
const params = new URLSearchParams(window.location.search);

// -------------------------------------------------------------
// 6. Determine which screen to load first.
//    - If the URL contains ?screen=game → load game
//    - Otherwise, fall back to "menu"
//
//    This allows teammates or testers to jump
//    into specific screens without clicking through the UI.
// -------------------------------------------------------------
const screenParam =
  (params.get("screen") as
    | "menu"
    | "difficulty"
    | "game"
    | "result"
    | "miniGameSelect") || "menu";

// -------------------------------------------------------------
// 7. bonusHearts — IMPORTANT
//    This URL param is used for MINIGAME RETURN FLOW.
//
//    EXAMPLE:
//       You lose in the main game → you get 0 hearts → mini game starts
//       You win the mini game → you may earn +1 heart
//
//    That heart needs to be passed BACK to the main game.
//
//    How it works:
//       params.get("bonusHearts") returns a STRING or NULL
//       Example: "2", or null if not provided
//
//    parseInt("2", 10)   → 2
//    parseInt(null, 10)  → NaN, so we fall back to "0"
//
//    WHY base-10?
//    parseInt(…, 10) ensures numbers like "08" aren't treated as octal.
// -------------------------------------------------------------
const bonusHearts = parseInt(params.get("bonusHearts") || "0", 10);

/*
   What happens if you change "0" in `|| "0"`?

     parseInt(params.get("bonusHearts") || "0", 10)

     - "0" is the fallback when the URL *does not* include bonusHearts.

     Example:
       URL: index.html?screen=game
       → params.get("bonusHearts") = null
       → null || "0" → "0"
       → bonusHearts = 0

     If you change it to "5":
       → default bonus hearts would always be 5
         whenever the URL does not provide a value.
        This would break the game logic.

   What happens if you remove `10`?

     parseInt("10") defaults to base-10 BUT
     parseInt("08") might be interpreted weirdly in older JS engines.

     That's why we ALWAYS use radix 10.
*/

// -------------------------------------------------------------
// 8. Feature flags for developers
//    These allow the URL to force-open the MadLib or WordLink modes.
//    Useful for debugging without going through the game.
// -------------------------------------------------------------
const openMadLib = params.get("openMadLib") === "true";
const openWordLink = params.get("openWordLink") === "true";

// Debug print so team members can verify the parsed values
console.log(
  'main.ts: parsed screen=', screenParam,
  'bonusHearts=', bonusHearts,
  'openMadLib=', openMadLib,
  'openWordLink=', openWordLink
);

// -------------------------------------------------------------
// 9. Switch to the initial screen.
//    The second argument `false` means:
//       "Do NOT push this screen into history"
//    
//    This prevents weird back-navigation states during startup.
// -------------------------------------------------------------
app.switchToScreen(
  { type: screenParam, bonusHearts, openMadLib, openWordLink } as any,
  false
);

// -------------------------------------------------------------
// 10. Keep the Konva stage resized when the window changes size.
//     This ensures the canvas always matches the playable window.
// -------------------------------------------------------------
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  stage.width(width);
  stage.height(height);
  stage.batchDraw();   // redraw everything cleanly
});