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

// Start on menu
app.switchToScreen({ type: "menu" });

// Keep stage sized correctly on window resize
window.addEventListener("resize", () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  stage.width(width);
  stage.height(height);
  stage.batchDraw();
});
