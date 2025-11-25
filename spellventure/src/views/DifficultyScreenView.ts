import Konva from "konva";

/**
 * @class DifficultyScreenView
 * @brief Pure view class responsible ONLY for rendering difficulty selection UI.
 *
 * DOES NOT:
 * - Change screen
 * - Modify GameState
 * - Contain game logic
 *
 * ONLY DOES:
 * - Build visually styled buttons
 * - Capture pointer clicks on those buttons
 * - Invoke a callback to notify the controller which difficulty was selected
 */
export default class DifficultyScreenView {
  /** Root Konva group containing title + buttons. */
  private group: Konva.Group;

  /**
   * Dictionary of button rectangles, keyed by lowercase difficulty name
   * e.g. buttons["easy"] → Konva.Rect
   */
  private buttons: Record<string, Konva.Rect> = {};

  /**
   * Dictionary of button labels ("Easy", "Medium", "Hard").
   */
  private labels: Record<string, Konva.Text> = {};

  /**
   * @brief Constructor: builds all Konva elements of the difficulty screen.
   *
   * Layout:
   * - Title centered at ~25% of screen height.
   * - 3 large colored buttons spaced vertically (“Easy”, “Medium”, “Hard”).
   */
  constructor() {
    this.group = new Konva.Group();

    // -------- Title Text --------
    const title = new Konva.Text({
      text: "Choose Difficulty",
      fontSize: 48,
      fontFamily: "Arial",
      fill: "#1e1e1e",
      x: window.innerWidth / 2 - 200, // approximate centering
      y: window.innerHeight / 4,
      width: 400,
      align: "center",
    });

    this.group.add(title);

    // -------- Difficulty Buttons --------
    const levels = ["Easy", "Medium", "Hard"];
    const colors = ["#22c55e", "#eab308", "#ef4444"]; // green, yellow, red

    /**
     * Build each difficulty button:
     * - a rounded rectangle (Konva.Rect)
     * - a text label (Konva.Text)
     * - store both into dictionaries keyed by “easy”, “medium”, “hard”
     */
    levels.forEach((lvl, i) => {
      const x = window.innerWidth / 2 - 150;
      const y = window.innerHeight / 2 - 100 + i * 120;

      // Button rectangle
      const rect = new Konva.Rect({
        x,
        y,
        width: 300,
        height: 80,
        cornerRadius: 20,
        fill: colors[i],
        shadowColor: "rgba(0,0,0,0.3)",
        shadowBlur: 8,
      });

      // Label on top of the button
      const label = new Konva.Text({
        text: lvl,
        fontSize: 32,
        fill: "#ffffff",
        width: 300,
        align: "center",
        x,
        y: y + 22, // vertical padding inside button
      });

      // Convert to lowercase key (easy/medium/hard)
      this.buttons[lvl.toLowerCase()] = rect;
      this.labels[lvl.toLowerCase()] = label;

      this.group.add(rect);
      this.group.add(label);
    });
  }

  /**
   * @brief Returns the Konva.Group containing all UI nodes.
   *
   * App.ts uses this to attach the view to the layer.
   */
  getGroup(): Konva.Group {
    return this.group;
  }

  /**
   * @brief Registers a callback handler for when the user selects a difficulty.
   *
   * This is how the controller finds out which difficulty was clicked.
   *
   * @param handler Callback receiving the difficulty name (“easy", "medium", "hard")
   */
  onDifficultySelected(handler: (level: string) => void): void {
    Object.keys(this.buttons).forEach((key) => {
      const rect = this.buttons[key];
      const label = this.labels[key];

      // Both the rectangle AND label respond to click/tap,
      // so the user can click either part of the button.
      rect.on("click tap", () => handler(key));
      label.on("click tap", () => handler(key));
    });
  }

  /**
   * @brief Makes the entire screen visible.
   */
  show(): void {
    this.group.visible(true);
  }

  /**
   * @brief Hides the entire screen (called when navigating away).
   */
  hide(): void {
    this.group.visible(false);
  }
}