
import Konva from "konva";
import App from "./App";

// Create the Konva stage
const stage = new Konva.Stage({
  container: "container", // this matches the div id in index.html
  width: window.innerWidth,
  height: window.innerHeight,
});

// Create a single layer (all screens will share this)
const layer = new Konva.Layer();
stage.add(layer);

// Initialize the main app controller
const app = new App(stage, layer);

// Start the app on the menu/home screen
app.switchToScreen({ type: "menu" });

// Optional: keep the canvas responsive
window.addEventListener("resize", () => {
  stage.width(window.innerWidth);
  stage.height(window.innerHeight);
  stage.draw();
});