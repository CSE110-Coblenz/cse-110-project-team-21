import Konva from "konva";
import App from "./App";

// Get the container element (must exist in index.html)
const container = document.getElementById("container");
if (!container) {
  throw new Error("❌ Missing <div id='container'> element in index.html");
}

// Create the Konva stage
const stage = new Konva.Stage({
  container: "container", // matches your <div id="container"></div>
  width: container.clientWidth,
  height: container.clientHeight,
});

// Create the shared layer
const layer = new Konva.Layer();
stage.add(layer);

// Initialize the main app
const app = new App(stage, layer);

// ------------------------
// Screen selection by URL
// ------------------------

// Read the query string from the current URL, e.g. "?screen=game&bonusHearts=2"
const params = new URLSearchParams(window.location.search);

const screenParam =
  (params.get("screen") as
    | "menu"
    | "difficulty"
    | "game"
    | "result"
    | "miniGameSelect") || "menu";

const bonusHearts = parseInt(params.get("bonusHearts") || "0", 10);
const openMadLib = params.get("openMadLib") === "true";
const openWordLink = params.get("openWordLink") === "true";

// Debug: log parsed URL flags so resume flow can be traced
console.log('main.ts: parsed screen=', screenParam, 'bonusHearts=', bonusHearts, 'openMadLib=', openMadLib, 'openWordLink=', openWordLink);

// select screen by URL
app.switchToScreen({ type: screenParam, bonusHearts, openMadLib, openWordLink } as any, false);

// Keep stage sized correctly on window resize
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  stage.width(width);
  stage.height(height);
  stage.batchDraw();
});
