import Konva from "konva";
import App from "./App";

// Create the Konva stage
const stage = new Konva.Stage({
  container: "container",
  width: window.innerWidth,
  height: window.innerHeight,
  opacity: 1
});

// Create a single layer (all screens will share this)
const layer = new Konva.Layer();
stage.add(layer);

// Initialize the main app controller
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

// select screen by URL 
app.switchToScreen({ type: screenParam, bonusHearts }, false);

// Optional: keep the canvas responsive
window.addEventListener("resize", () => {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight);
  stage.draw();
});